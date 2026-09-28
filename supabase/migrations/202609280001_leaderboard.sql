-- Only the Edge Function's service role may read/write these tables or invoke RPCs.
create table public.leaderboard_entries (
  id uuid primary key,
  map_id text not null,
  revision text not null,
  nickname text not null check (char_length(nickname) between 1 and 20),
  score integer not null check (score between 0 and 100),
  created_at timestamptz not null default clock_timestamp()
);
create index leaderboard_ranking on public.leaderboard_entries(map_id,revision,score desc,created_at,id);
create table public.leaderboard_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null,
  map_id text not null,
  revision text not null,
  score integer not null check(score between 0 and 100),
  expires_at timestamptz not null default now()+interval '15 minutes',
  submitted boolean not null default false
);
create table public.leaderboard_limits (
  client_hash text not null,
  bucket timestamptz not null,
  hits integer not null default 1,
  primary key(client_hash,bucket)
);
alter table public.leaderboard_entries enable row level security;
alter table public.leaderboard_attempts enable row level security;
alter table public.leaderboard_limits enable row level security;
revoke all on public.leaderboard_entries,public.leaderboard_attempts,public.leaderboard_limits from anon,authenticated;
grant all on public.leaderboard_entries,public.leaderboard_attempts,public.leaderboard_limits to service_role;

create function public.leaderboard_allow(p_client text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
  delete from leaderboard_limits where bucket<now()-interval '1 day';
  delete from leaderboard_attempts where expires_at<now()-interval '1 day';
  insert into leaderboard_limits(client_hash,bucket) values(p_client,date_trunc('minute',now()))
    on conflict(client_hash,bucket) do update set hits=leaderboard_limits.hits+1 returning hits into n;
  return n<=12;
end $$;

create function public.leaderboard_evaluate(p_request uuid,p_map text,p_revision text,p_score integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare a leaderboard_attempts; n integer;
begin
  insert into leaderboard_attempts(request_id,map_id,revision,score) values(p_request,p_map,p_revision,p_score)
    on conflict(request_id) do nothing;
  select * into a from leaderboard_attempts where request_id=p_request;
  if a.map_id<>p_map or a.revision<>p_revision or a.score<>p_score then raise exception 'request_conflict'; end if;
  select count(*) into n from leaderboard_entries where map_id=p_map and revision=p_revision and score>=a.score;
  return jsonb_build_object('qualified',n<3 and not a.submitted and a.expires_at>now(),'score',a.score,'attemptId',a.id);
end $$;

create function public.leaderboard_claim(p_attempt uuid,p_name text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare a leaderboard_attempts; n integer;
begin
  if char_length(p_name) not between 1 and 20 or p_name<>btrim(p_name) or p_name ~ '[[:cntrl:]]' then raise exception 'invalid_nickname'; end if;
  select * into a from leaderboard_attempts where id=p_attempt;
  if not found then raise exception 'attempt_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.map_id||':'||a.revision,0));
  select * into a from leaderboard_attempts where id=p_attempt for update;
  if a.submitted then
    return jsonb_build_object('accepted',exists(select 1 from leaderboard_entries where id=a.id),'map',a.map_id);
  end if;
  if a.expires_at<=now() then raise exception 'attempt_expired'; end if;
  select count(*) into n from leaderboard_entries where map_id=a.map_id and revision=a.revision and score>=a.score;
  update leaderboard_attempts set submitted=true where id=a.id;
  if n>=3 then return jsonb_build_object('accepted',false,'map',a.map_id); end if;
  insert into leaderboard_entries(id,map_id,revision,nickname,score) values(a.id,a.map_id,a.revision,p_name,a.score);
  delete from leaderboard_entries where map_id=a.map_id and revision=a.revision and id not in (
    select id from leaderboard_entries where map_id=a.map_id and revision=a.revision order by score desc,created_at,id limit 3
  );
  return jsonb_build_object('accepted',true,'map',a.map_id);
end $$;
revoke all on function public.leaderboard_allow(text),public.leaderboard_evaluate(uuid,text,text,integer),public.leaderboard_claim(uuid,text) from public,anon,authenticated;
grant execute on function public.leaderboard_allow(text),public.leaderboard_evaluate(uuid,text,text,integer),public.leaderboard_claim(uuid,text) to service_role;
