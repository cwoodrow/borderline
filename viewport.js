export function zoomAt(view, factor, point, minScale, maxScale) {
  const scale=Math.max(minScale,Math.min(maxScale,view.scale*factor));
  const ratio=scale/view.scale;
  return {scale,x:point[0]-(point[0]-view.x)*ratio,y:point[1]-(point[1]-view.y)*ratio};
}
export function toWorld(view,point){return [(point[0]-view.x)/view.scale,(point[1]-view.y)/view.scale];}
