const valid=score=>Number.isInteger(score)&&score>=0&&score<=100;
export function scoreKey(config){
  // Scope and scoring changes start a fresh leaderboard for this browser.
  return `borderline-best-v1:${config.id}:${config.scoreVersion||1}:${config.scoreTolerance}:${[...config.selected].sort().join(',')}`;
}
export function createScores(storage){
  let persistent=Boolean(storage);
  const memory=new Map();
  function get(config){
    const key=scoreKey(config);let saved=null;
    try{const raw=storage?.getItem(key);if(raw!==null&&raw!==undefined){const value=JSON.parse(raw);if(valid(value))saved=value;}}
    catch{ /* Corrupt or unavailable storage must not interrupt play. */ }
    const best=memory.get(key)??null;
    if(saved!==null&&(best===null||saved>best))memory.set(key,saved);
    return memory.get(key)??null;
  }
  function record(config,score){
    if(!valid(score))throw new RangeError('Score must be an integer percentage between 0 and 100.');
    const best=get(config),next=best===null?score:Math.max(best,score);
    memory.set(scoreKey(config),next);
    try{if(storage)storage.setItem(scoreKey(config),JSON.stringify(next));else persistent=false;}catch{persistent=false;}
    return next;
  }
  return {get,record,get persistent(){return persistent;}};
}
