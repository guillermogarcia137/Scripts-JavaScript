/* Funciones puras compartidas por la interfaz y las pruebas de Node. */
(function(root){
'use strict';
const hex = value => {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Usa un color #RRGGBB.');
  return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
};
function contrast(a,b){
  const luminance = value => hex(value).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const [low,high]=[luminance(a),luminance(b)].sort((a,b)=>a-b);
  const ratio=(high+.05)/(low+.05);
  return {ratio,AA_normal:ratio>=4.5,AA_grande:ratio>=3,AAA_normal:ratio>=7};
}
function parseCSV(text,delimiter=','){
  if(![',',';','\t'].includes(delimiter)) throw new Error('Separador no admitido.');
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],field='',quoted=false,closed=false,start=true;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"'&&text[i+1]==='"'){field+='"';i++;}
      else if(c==='"'){quoted=false;closed=true;}
      else field+=c;
    }else if(c===delimiter){row.push(field);field='';closed=false;start=true;}
    else if(c==='\r'||c==='\n'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(field);rows.push(row);row=[];field='';closed=false;start=true;
    }else if(c==='"'){
      if(!start||closed)throw new Error('Comillas fuera de posición.');
      quoted=true;start=false;
    }else{
      if(closed)throw new Error('Texto después de una comilla de cierre.');
      field+=c;start=false;
    }
  }
  if(quoted)throw new Error('Hay comillas sin cerrar.');
  if(row.length||field!==''||closed){row.push(field);rows.push(row);}
  if(!rows.length)throw new Error('CSV vacío.');
  const header=rows.shift();
  if(header.some(h=>!h.trim())||new Set(header).size!==header.length)throw new Error('Cabeceras vacías o repetidas.');
  if(rows.some(r=>r.length!==header.length))throw new Error('Filas con distinto número de columnas.');
  return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]])));
}
function encode64(text){const bytes=new TextEncoder().encode(text);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
function decode64(text){const value=text.replace(/\s/g,'');if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('Base64 inválido.');return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0)));}
function clean(text,mode){
  if(mode==='duplicados')return [...new Set(text.split(/\r?\n/))].join('\n');
  if(mode==='ordenar')return text.split(/\r?\n/).sort((a,b)=>a.localeCompare(b,'es')).join('\n');
  if(mode==='slug')return text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return text.split(/\r?\n/).map(l=>l.replace(/[ \t]+/g,' ').trimEnd()).join('\n');
}
const escapeXML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function gradientSVG(a,b,angle){hex(a);hex(b);if(!Number.isFinite(angle)||angle<0||angle>360)throw new Error('Ángulo entre 0 y 360.');const rad=(angle-90)*Math.PI/180,x=Math.cos(rad)/2,y=Math.sin(rad)/2;return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="g" x1="${.5-x}" y1="${.5-y}" x2="${.5+x}" y2="${.5+y}"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1920v1080H0z"/></svg>`;}
function monogram(text,bg,fg){hex(bg);hex(fg);const label=escapeXML([...text].slice(0,3).join(''));return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="112" fill="${bg}"/><text x="256" y="320" text-anchor="middle" font-family="system-ui,sans-serif" font-size="180" font-weight="600" fill="${fg}">${label}</text></svg>`;}
function palette(color){const rgb=hex(color).map(v=>v/255);const max=Math.max(...rgb),min=Math.min(...rgb),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=(max===rgb[0]?(rgb[1]-rgb[2])/d%6:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4)*60;}h=(h+360)%360;const toHex=(h,s,l)=>{const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2;const values=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+values.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();};return [-40,-20,0,20,40].map((step,i)=>toHex((h+step+360)%360,Math.max(s,.45),[.22,.38,.5,.68,.86][i]));}
function password(length){if(!Number.isInteger(length)||length<12||length>128)throw new Error('Longitud entre 12 y 128.');const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%_-+';const limit=256-256%chars.length;let result='';while(result.length<length){const bytes=new Uint8Array(128);crypto.getRandomValues(bytes);for(const b of bytes){if(b<limit)result+=chars[b%chars.length];if(result.length===length)break;}}return result;}
const api={hex,contrast,parseCSV,encode64,decode64,clean,gradientSVG,monogram,palette,password};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Tools=api;
})(typeof window==='undefined'?globalThis:window);
