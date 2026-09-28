export function validateDrawing(strokes,game){
  if(!Array.isArray(strokes)||!strokes.length||strokes.length>1000)throw Error('invalid_drawing');
  const [a,b]=game.bounds,w=b[0]-a[0],h=b[1]-a[1],diagonal=Math.hypot(w,h);
  let count=0,length=0;
  for(const line of strokes){
    if(!Array.isArray(line)||line.length<2)throw Error('invalid_drawing');
    for(let i=0;i<line.length;i++){
      const p=line[i];if(++count>25000)throw Error('drawing_too_large');
      if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw Error('invalid_drawing');
      if(p[0]<a[0]-w/2||p[0]>b[0]+w/2||p[1]<a[1]-h/2||p[1]>b[1]+h/2)throw Error('drawing_outside_map');
      if(i)length+=Math.hypot(p[0]-line[i-1][0],p[1]-line[i-1][1]);
      if(length>diagonal*25)throw Error('drawing_too_large');
    }
  }
  if(length===0)throw Error('invalid_drawing');
  return strokes;
}
export function validateNickname(input){
  if(typeof input!=='string')throw Error('invalid_nickname');
  const name=input.normalize('NFC').trim();
  if(!/^[\p{L}\p{N} _.'’\-]{1,20}$/u.test(name))throw Error('invalid_nickname');
  return name;
}
export function validateUUID(value){if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw Error('invalid_request');return value;}
