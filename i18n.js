export const messages = {
  en: {
    draw:'FREEHAND MODE',pan:'PAN MODE',revealed:'BORDERS REVEALED',
    leftOne:'land border left',leftMany:'land borders left',missingOne:'border not recognised',missingMany:'borders not recognised',
    resultHint:'Every attempt makes the map a little more familiar.',
    verdicts:['A new perspective on the map.','A promising sense of direction.','You know your way around.','A cartographer at heart.'],
    resultNote:'The dashed green lines reveal the real borders. Missing borders reduce coverage; stray lines reduce accuracy.',
    help:'Drag to draw borders. Scroll or use +/− to zoom. Switch to Pan to move the map, or drag with the middle mouse button. On touchscreens, pinch with two fingers to zoom and move. Fit restores the full map.',
    loading:'Unfolding your map…',error:'The map could not load. Refresh to try again.',
    seas:['NORTH ATLANTIC OCEAN','NORTH SEA','MEDITERRANEAN SEA'],
  },
  fr: {
    draw:'MODE DESSIN',pan:'MODE DÉPLACEMENT',revealed:'FRONTIÈRES RÉVÉLÉES',
    leftOne:'frontière restante',leftMany:'frontières restantes',missingOne:'frontière non reconnue',missingMany:'frontières non reconnues',
    resultHint:'À chaque essai, la carte devient un peu plus familière.',
    verdicts:['La carte sous un nouveau jour.','Un sens de l’orientation prometteur.','Vous avez de bons repères.','L’âme d’un cartographe.'],
    resultNote:'Les pointillés verts révèlent les vraies frontières. Les frontières manquantes réduisent la couverture ; les traits éloignés réduisent la précision.',
    help:'Faites glisser pour tracer les frontières. Zoomez avec la molette ou +/−. Activez Déplacer pour déplacer la carte, ou utilisez le bouton central de la souris. Sur écran tactile, pincez et déplacez avec deux doigts. Vue entière rétablit la carte complète.',
    loading:'Dépliage de la carte…',error:'Impossible de charger la carte. Actualisez la page pour réessayer.',
    seas:['OCÉAN ATLANTIQUE NORD','MER DU NORD','MER MÉDITERRANÉE'],
  },
};
// Only static, authored markup is translated as HTML; game state stays on its existing elements.
const french = [
  ['title','Borderline — Dessinez le monde de mémoire'],
  ['.header-note','Un peu de géographie. Beaucoup d’intuition.'],
  ['.eyebrow','<span></span> LE DÉFI DES FRONTIÈRES'],
  ['h1','Vous avez le sens de l’orientation ?<br>À vous de jouer.'],
  ['.intro','La carte est là. Ses frontières ont disparu.<br>Redessinez-les, un trait à la fois.'],
  ['.region .small-label','VOTRE TERRAIN DE JEU'],
  ['#map-menu-title','Choisissez votre carte'],
  ['#play-info h3','À vous de tracer'],
  ['#play-info li:nth-child(1) p','<strong>Trouvez vos repères.</strong><br>Aidez-vous des côtes pour vous orienter.'],
  ['#play-info li:nth-child(2) p','<strong>Tracez les frontières manquantes.</strong><br>Relâchez pour actualiser le compteur.'],
  ['#play-info li:nth-child(3) p','<strong>Comparez votre tracé.</strong><br>Couvrez chaque frontière avec précision.'],
  ['.score-heading .small-label','VOTRE SCORE D’EXPLORATION'],
  ['.metric:nth-of-type(2) > span','Frontières couvertes'],
  ['.metric:nth-of-type(4) > span','Précision du tracé'],
  ['#check','Vérifier mes frontières <span>↗</span>'],
  ['#retry','Réessayer <span>↻</span>'],
  ['details summary','Comment le score est-il calculé ?'],
  ['.map-panel','Carte interactive pour tracer les frontières','aria-label'],
  ['#help','Afficher les instructions','aria-label'],['#help','Afficher les instructions','title'],
  ['#map','Tracez les frontières avec une souris, un stylet ou le doigt. La carte nécessite un dispositif de pointage.','aria-label'],
  ['.navigation','Navigation sur la carte','aria-label'],
  ['#pan','✥ <span>Déplacer</span>'],['#pan','Alterner entre le dessin et le déplacement de la carte','title'],
  ['#zoom-in','Zoom avant','aria-label'],['#zoom-out','Zoom arrière','aria-label'],['#zoom-level','Niveau de zoom','aria-label'],
  ['#reset-view','Vue entière'],['#reset-view','Afficher la carte entière','title'],
  ['.legend > span:first-child','<i class="your-line"></i> Votre tracé'],
  ['#truth-legend','<i class="true-line"></i> Vraies frontières'],
  ['#undo','↶ <span>Annuler</span>'],['#undo','Annuler le dernier trait (Ctrl/Cmd + Z)','title'],
  ['#clear','⌫ <span>Effacer</span>'],
  ['#language','Langue','aria-label'],
];
export function resolveLanguage(search, stored, browser='en'){
  const requested=new URLSearchParams(search).get('lang');
  if(requested==='en'||requested==='fr')return requested;
  if(stored==='en'||stored==='fr')return stored;
  const preferences=Array.isArray(browser)?browser:[browser];
  for(const preference of preferences){
    const code=String(preference).toLowerCase().split('-')[0];
    if(code==='fr'||code==='en')return code;
  }
  return 'en';
}
export function createLocale(onChange){
  let stored;try{stored=localStorage.getItem('borderline-language');}catch{}
  let language=resolveLanguage(location.search,stored,navigator.languages?.length?navigator.languages:navigator.language);
  const entries=french.map(([selector,value,attribute])=>{
    const node=document.querySelector(selector);
    if(!node)throw new Error(`Missing translation target: ${selector}`);
    return {node,value,attribute,english:attribute?node.getAttribute(attribute):node.innerHTML};
  });
  function apply(){
    document.documentElement.lang=language;
    for(const {node,value,attribute,english} of entries){const text=language==='fr'?value:english;attribute?node.setAttribute(attribute,text):node.innerHTML=text;}
    document.getElementById('language').value=language;
  }
  apply();
  document.getElementById('language').addEventListener('change',event=>{
    language=event.target.value;apply();
    try{localStorage.setItem('borderline-language',language);}catch{}
    const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
    onChange();
  });
  return key=>messages[language][key];
}
