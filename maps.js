const entries=text=>text.trim().split('\n').map(row=>{const [id,name,lon,lat]=row.split(' ');return {id:id.padStart(3,'0'),name,at:[+lon,+lat]};});
const europe=entries(`620 PT -8.1 39.6
724 ES -3.2 40.1
250 FR 2.2 46.6
056 BE 4.6 50.8
528 NL 5.4 52.8
442 LU 6.1 49.8
276 DE 10.3 51.1
756 CH 8.1 46.7
040 AT 13.4 47.5
380 IT 12.5 43.1
208 DK 9.4 56.3
826 UK -2.7 54.1
372 IE -8 53.4`);
const maghreb=entries(`012 DZ 2 28
434 LY 18 27
818 EG 29 27
466 ML -4 18
478 MR -11 21
504 MA -6 32
562 NE 9 17
788 TN 9.5 34
732 EH -13 24.5`);
const southAmerica=entries(`032 AR -64 -36
068 BO -64 -17
076 BR -52 -12
152 CL -71 -32
170 CO -73 4
218 EC -78.5 -1.5
328 GY -59 5
600 PY -58 -23
604 PE -75 -10
740 SR -55.8 4
858 UY -56 -33
862 VE -66 8
250 GF -53.2 4`);
const northeast=entries(`09 CT -72.7 41.6
23 ME -69 45.3
25 MA -71.8 42.3
33 NH -71.4 43.8
34 NJ -74.5 40.2
36 NY -75.5 43
42 PA -77.7 40.9
44 RI -71.4 41.5
50 VT -72.7 44.3`);
const regions=entries(`11 IDF 2.4 48.7
24 CVL 1.7 47.5
27 BFC 4.9 47.2
28 NOR 0.1 49.1
32 HDF 2.8 50
44 GES 5.7 48.7
52 PDL -0.8 47.5
53 BRE -2.8 48.2
75 NAQ 0.3 45.4
76 OCC 2.3 43.7
84 ARA 4.8 45.5
93 PACA 6.2 44
94 COR 9 42.2`);
function config(id,names,labels,bounds,latitude,options={}){
  return {id,names,labels,bounds,latitude,selected:new Set(labels.map(l=>l.id)),file:'countries-50m.json',object:'countries',scoreTolerance:25,recognitionTolerance:75,units:['countries','pays'],...options};
}
export const MAPS={
  europe:config('europe',['Western Europe','Europe de l’Ouest'],europe,[-12,35,18,59.5],48,{scope:['13 countries in Western Europe. Only borders between the highlighted countries count.','13 pays d’Europe de l’Ouest. Seules les frontières entre les pays en vert comptent.']}),
  africa:config('africa',['Maghreb & neighbours','Maghreb et voisins'],maghreb,[-18,9.5,37,38],25,{scoreTolerance:40,recognitionTolerance:120,units:['countries & territories','pays et territoires'],scope:['Morocco, Algeria, Tunisia, Libya, Mauritania, Mali, Niger, Egypt and Western Sahara (EH). Only shared borders between highlighted areas count. Disputed boundaries follow the dataset.','Maroc, Algérie, Tunisie, Libye, Mauritanie, Mali, Niger, Égypte et Sahara occidental (EH). Seules les frontières communes aux zones en vert comptent. Les limites contestées suivent les données.']}),
  'south-america':config('south-america',['South America','Amérique du Sud'],southAmerica,[-83,-57,-33,14],-20,{scoreTolerance:50,recognitionTolerance:150,units:['countries & territories','pays et territoires'],scope:['12 countries and French Guiana (GF). Only shared borders within this map count.','12 pays et la Guyane française (GF). Seules les frontières communes à cette carte comptent.']}),
  usa:config('usa',['Northeastern USA','Nord-Est des États-Unis'],northeast,[-81,38.5,-66,48],43,{file:'us-states.json',object:'states',scoreTolerance:12,recognitionTolerance:36,scope:['9 states: the six New England states, plus New York, New Jersey and Pennsylvania. Only borders between these states count.','9 États : les six États de Nouvelle-Angleterre, ainsi que New York, le New Jersey et la Pennsylvanie. Seules leurs frontières communes comptent.'],units:['states','États']}),
  france:config('france',['France · regions','France · régions'],regions,[-5.5,41,10,51.5],46.5,{file:'france-regions.json',object:'regions',scoreTolerance:10,recognitionTolerance:30,units:['regions','régions'],scope:['13 metropolitan regions, including Corsica. Overseas regions are excluded. Only shared regional boundaries count.','13 régions métropolitaines, Corse comprise. Les régions d’outre-mer sont exclues. Seules les limites communes entre régions comptent.']}),
};
export function projection(latitude){const cos=Math.cos(latitude*Math.PI/180);return ([lon,lat])=>[lon*111.32*cos,-lat*111.32];}
