// Original, furniture-free architectural diagrams. The first plan shares the
// existing demo's geometry; the other two are illustrative references only.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),data={};
new Function('exports',ts.transpile(fs.readFileSync(path.join(root,'lib/floor-plan-blueprints.ts'),'utf8'),{module:ts.ModuleKind.CommonJS}))(data);
const escape=v=>v.replaceAll('&','&amp;').replaceAll('<','&lt;');
for(const plan of data.floorPlanExamples){
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="${Math.round(1440*(plan.depth+1.7)/(plan.width+1.3))}" viewBox="-.65 -.85 ${plan.width+1.3} ${plan.depth+1.7}" role="img" aria-label="${escape(plan.title[0])} — furniture-free illustrative floor plan"><rect x="-.65" y="-.85" width="${plan.width+1.3}" height="${plan.depth+1.7}" fill="#f8f7f2"/><polygon points="${plan.outline.map(p=>p.join(',')).join(' ')}" fill="#fffefa" stroke="#314d44" stroke-width=".025"/>`;
 for(const w of plan.walls){const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],len=Math.hypot(dx,dz),angle=Math.atan2(dz,dx)*180/Math.PI;svg+=`<g transform="translate(${w.a.join(' ')}) rotate(${angle})" fill="none">`;
  if(w.door){const [at,width]=w.door,left=at-width/2,right=at+width/2;svg+=`<path d="M0 0H${left} M${right} 0H${len}" stroke="#314d44" stroke-width=".115"/><path d="M${left} 0v${width} M${right} 0a${width} ${width} 0 0 1 ${-width} ${width}" stroke="#ad956c" stroke-width=".018"${w.a[1]===plan.depth&&w.b[1]===plan.depth?' transform="scale(1 -1)"':''}/>`;
  }else if(w.window&&len>1.2){svg+=`<path d="M0 0H.19 M${len-.19} 0H${len}" stroke="#314d44" stroke-width=".115"/><path d="M.19 -.035H${len-.19} M.19 .035H${len-.19}" stroke="#739790" stroke-width=".023"/>`;
  }else svg+=`<path d="M0 0H${len}" stroke="#314d44" stroke-width=".115"/>`;
  svg+='</g>';
 }
 svg+=`<g font-family="Microsoft YaHei,Microsoft JhengHei,sans-serif" fill="#516b61" text-anchor="middle">${plan.rooms.map(r=>`<text x="${r.at[0]}" y="${r.at[1]}" font-size=".22">${r.name[1]}</text><text x="${r.at[0]}" y="${r.at[1]+.26}" font-size=".115" letter-spacing=".015">${r.name[0]}</text>`).join('')}</g>`;
 svg+=`<g stroke="#9aa69b" stroke-width=".014" fill="none"><path d="M0 -.25V-.52 M${plan.width} -.25V-.52 M0 -.4H${plan.width} M-.25 0H-.52 M-.25 ${plan.depth}H-.52 M-.4 0V${plan.depth}"/></g><g fill="#708477" font-family="sans-serif" font-size=".16" text-anchor="middle"><text x="${plan.width/2}" y="-.5">${plan.width.toFixed(2)} m</text><text x="-.52" y="${plan.depth/2}" transform="rotate(-90 -.52 ${plan.depth/2})">${plan.depth.toFixed(2)} m</text><text x="${plan.width/2}" y="${plan.depth+.55}">RENEST · ${plan.area} m² / ${Math.round(plan.area*10.7639)} ft² · ILLUSTRATIVE PLAN</text></g></svg>`;
 fs.writeFileSync(path.join(root,`public/plans/${plan.id}-2d.svg`),svg);
}
console.log('Generated three original furniture-free SVG floor plans.');
