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
const africa=entries(`012 DZ 2 28
024 AO 18 -12
204 BJ 2.3 9.5
072 BW 24 -22
854 BF -1.5 12.5
108 BI 29.9 -3.4
120 CM 12 5.5
132 CV -24 16
140 CF 20.5 6.5
148 TD 19 15
174 KM 44 -12
178 CG 15 -1
180 CD 23 -3
262 DJ 42.6 11.7
818 EG 29 27
226 GQ 10.3 1.5
232 ER 39 15.5
748 SZ 31.5 -26.5
231 ET 39 8
266 GA 11.8 -1
270 GM -15.5 13.5
288 GH -1.2 7.8
324 GN -10.8 10.5
624 GW -15 12
384 CI -5.5 7.5
404 KE 38 0
426 LS 28.3 -29.5
430 LR -9.5 6.4
434 LY 18 27
450 MG 47 -19
454 MW 34 -13
466 ML -4 18
478 MR -11 21
480 MU 57.5 -20.2
504 MA -6 32
508 MZ 35 -18
516 NA 17 -22
562 NE 9 17
566 NG 8 9
646 RW 29.9 -1.8
678 ST 6.6 0.3
686 SN -14.5 15
690 SC 55.5 -4.7
694 SL -11.8 8.5
706 SO 47 6
710 ZA 24 -30
728 SS 30 7
729 SD 30 16
834 TZ 35 -6
768 TG 1 8.5
788 TN 9.5 34
800 UG 32.3 1.5
894 ZM 28 -14
716 ZW 30 -19
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
const states=entries(`01 AL -86.8 32.8
04 AZ -111.8 34
05 AR -92.4 34.8
06 CA -120 37
08 CO -105.5 39
09 CT -72.7 41.6
10 DE -75.4 39
12 FL -82 28
13 GA -83.5 32.6
16 ID -114.5 44.3
17 IL -89 40
18 IN -86.1 40
19 IA -93.5 42
20 KS -98 38.5
21 KY -85.3 37.5
22 LA -92 31
23 ME -69 45.3
24 MD -76.8 39.4
25 MA -71.8 42.3
26 MI -85 44
27 MN -94.5 46
28 MS -89.5 32.8
29 MO -92.5 38.5
30 MT -110 47
31 NE -99.5 41.5
32 NV -117 39
33 NH -71.4 43.8
34 NJ -74.5 40.2
35 NM -106 34.5
36 NY -75.5 43
37 NC -79.5 35.5
38 ND -100.5 47.5
39 OH -82.8 40.3
40 OK -97.5 35.5
41 OR -120.5 44
42 PA -77.7 40.9
44 RI -71.4 41.5
45 SC -80.8 33.8
46 SD -100 44.5
47 TN -86 35.8
48 TX -99 31
49 UT -111.5 39.3
50 VT -72.7 44.3
51 VA -79 37.5
53 WA -120.5 47.4
54 WV -80.7 38.7
55 WI -89.8 44.5
56 WY -107.5 43`);
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
const middleEarth=[
  {id:'001',name:'Lindon',at:[3.3,17.1]},
  {id:'002',name:'Eriador',at:[7,18]},
  {id:'003',name:'Shire',nameFr:'Comté',at:[6.8,14.8]},
  {id:'004',name:'Rhovanion',at:[11.5,16.5]},
  {id:'005',name:'Rhûn',at:[16.5,16]},
  {id:'006',name:'Enedwaith',at:[6.3,11]},
  {id:'007',name:'Rohan',at:[12,8.7]},
  {id:'008',name:'Gondor',at:[9.1,7.1]},
  {id:'009',name:'Mordor',at:[16.2,8.1]},
  {id:'010',name:'Khand',at:[18.2,4.5]},
  {id:'011',name:'Harad',at:[15,2.8]},
];
function config(id,names,labels,bounds,latitude,options={}){
  return {id,names,labels,bounds,latitude,selected:new Set(labels.map(l=>l.id)),file:'countries-50m.json',object:'countries',scoreTolerance:25,recognitionTolerance:75,units:['countries','pays'],...options};
}
export const MAPS={
  'middle-earth':config('middle-earth',['Middle-earth · Tolkien','Terre du Milieu · Tolkien'],middleEarth,[0,0,20,22],0,{
    file:'middle-earth.json',object:'regions',fantasy:true,scoreTolerance:45,recognitionTolerance:135,units:['realms & regions','royaumes et régions'],
    scope:['An original schematic fan map inspired by Tolkien. 11 realms and regions; invented game boundaries, not canonical borders or a historical snapshot.','Carte schématique originale inspirée de Tolkien. 11 royaumes et régions ; limites inventées pour le jeu, sans frontières canoniques ni époque précise.'],
    mountains:[[4.8,17.3],[4.9,16.7],[9,17.5],[9.15,16.8],[9.35,16],[9.5,15.2],[9.45,14.4],[9.3,13.6],[9.15,12.8],[9.1,12.1],[11,19.4],[12,19.1],[13,18.9],[9.5,7.4],[10.2,7.7],[10.9,7.8],[11.6,7.7],[14.9,9.6],[15.5,10],[16.3,10.2],[17.1,10.3],[14.7,8.7],[14.5,8]],
    rivers:[[[11.2,18.9],[10.8,17.5],[10.7,16],[11.1,14.5],[11.4,13],[11.2,11.6],[12.3,10],[12.6,9],[13.1,7.7],[12.7,6.3],[12.5,5.3]]],
  }),
  europe:config('europe',['Western Europe','Europe de l’Ouest'],europe,[-12,35,18,59.5],48,{scope:['13 countries in Western Europe. Only borders between the highlighted countries count.','13 pays d’Europe de l’Ouest. Seules les frontières entre les pays en vert comptent.']}),
  africa:config('africa',['Africa','Afrique'],africa,[-26,-36,61,38],0,{scoreTolerance:60,recognitionTolerance:180,units:['countries & territories','pays et territoires'],remap:{Somaliland:'706'},scope:['54 countries and Western Sahara (EH). Disputed boundaries follow the dataset; Somaliland is grouped with Somalia.','54 pays et le Sahara occidental (EH). Les limites contestées suivent les données ; le Somaliland est regroupé avec la Somalie.']}),
  'south-america':config('south-america',['South America','Amérique du Sud'],southAmerica,[-83,-57,-33,14],-20,{scoreTolerance:50,recognitionTolerance:150,units:['countries & territories','pays et territoires'],scope:['12 countries and French Guiana (GF). Only shared borders within this map count.','12 pays et la Guyane française (GF). Seules les frontières communes à cette carte comptent.']}),
  usa:config('usa',['USA · states','USA · États'],states,[-126,24,-66,50],38,{file:'us-states.json',object:'states',scope:['48 contiguous states. Alaska, Hawaii, Washington, DC and overseas territories are excluded. Point-only contacts do not count.','48 États contigus. L’Alaska, Hawaï, Washington, DC et les territoires d’outre-mer sont exclus. Les contacts en un seul point ne comptent pas.'],units:['states','États']}),
  france:config('france',['France · regions','France · régions'],regions,[-5.5,41,10,51.5],46.5,{file:'france-regions.json',object:'regions',scoreTolerance:10,recognitionTolerance:30,units:['regions','régions'],scope:['13 metropolitan regions, including Corsica. Overseas regions are excluded. Only shared regional boundaries count.','13 régions métropolitaines, Corse comprise. Les régions d’outre-mer sont exclues. Seules les limites communes entre régions comptent.']}),
};
export function projection(latitude){const cos=Math.cos(latitude*Math.PI/180);return ([lon,lat])=>[lon*111.32*cos,-lat*111.32];}
