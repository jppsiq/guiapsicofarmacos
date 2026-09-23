/* Guia de Psicofármacos: aplicação. Os dados vêm de dados/*.json (embutidos no build). */
(function(){
'use strict';
const D = JSON.parse(document.getElementById('dados').textContent);
const subBase = f => String(f.subclasse||'').replace(/\s*\(.*\)\s*$/,'');
const SUBORD = {}; D.farmacos.forEach((f,i)=>{ const k=f.classe+'|'+subBase(f); if(!(k in SUBORD)) SUBORD[k]=i; });
const F = D.farmacos.slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt'));
const byId = Object.fromEntries(F.map(f=>[f.id,f]));
const CL = Object.fromEntries(D.classes.map(c=>[c.id,c]));
const app = document.getElementById('app');

/* utilidades */
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const arr = x => x==null ? [] : Array.isArray(x) ? x : [x];
const txt = x => Array.isArray(x) ? x.join(' ') : (x==null?'':String(x));
/* texto com marcação mínima: **negrito** e quebras */
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const lista = xs => arr(xs).length ? '<ul>'+arr(xs).map(x=>'<li>'+md(x)+'</li>').join('')+'</ul>' : '';
const store = {
  get(k,d){ try{ const v = localStorage.getItem('gpf.'+k); return v==null?d:JSON.parse(v);}catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('gpf.'+k, JSON.stringify(v)); }catch(e){} }
};
function toast(m){ const t=document.createElement('div'); t.className='toast'; t.textContent=m; document.body.appendChild(t); setTimeout(()=>t.remove(),1800); }
const clsColor = id => 'var(--c-'+((CL[id]||{}).cor||'out')+')';
const clsName = id => (CL[id]||{}).nome || id;
function clsChip(f){ return `<span class="chip cls" style="--cc:${clsColor(f.classe)}"><span class="dot"></span>${esc(clsName(f.classe))}${f.subclasse?' · '+esc(f.subclasse):''}</span>`; }

/* estado */
const S = {
  fav: new Set(store.get('fav',[])),
  cmp: store.get('cmp',[]).filter(id=>byId[id]),
  itx: store.get('itx',[]),
  q: '', filtros: {classe:'', indicacao:'', pop:'', ae:[]}
};
const saveSets = () => { store.set('fav',[...S.fav]); store.set('cmp',S.cmp); store.set('itx',S.itx); };

/* tema */
function applyTheme(t){ if(t) document.documentElement.setAttribute('data-theme',t); else document.documentElement.removeAttribute('data-theme'); }
applyTheme(store.get('tema',null));
function curTheme(){ const t=document.documentElement.getAttribute('data-theme'); if(t) return t; return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; }

/* ícones */
const I = {
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  staro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  cols:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h8M5 8a4 4 0 0 0 0 8h2M19 8a4 4 0 0 1 0 8h-2"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
  swap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>'
};

/* ---------- ILUSTRAÇÕES ---------- */
const COR = {branco:'#FAFAF7',amarelo:'#F2D35B','amarelo-claro':'#F6E7A1',laranja:'#EE9A4D',rosa:'#F2A7BE','rosa-claro':'#F7CFDB',vermelho:'#D6534B',vinho:'#8E2F3C',azul:'#4C7FD0','azul-claro':'#A9C8EE','azul-escuro':'#274E8C',verde:'#5DAF6E','verde-claro':'#B6DDB4',lilas:'#B9A1DB',roxo:'#7C5AB8',marrom:'#9A6B45',bege:'#E8D9BC',cinza:'#B7BDBA',preto:'#2B2B2B',transparente:'#E9F1F4',incolor:'#E9F1F4',creme:'#F3EBD3',salmao:'#F4B09A',pessego:'#F6C3A0',caramelo:'#C98B4F','verde-agua':'#9FD9CF'};
const corHex = c => COR[norm(c).replace(/\s+/g,'-')] || COR.branco;
function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt; r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b)); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
let gid=0;
function pillSVG(ap,mini){
  const a = (ap && ap.aparencia) || {};
  const fmt = norm(a.formato||'');
  const gen = !a.cor;
  const c1 = gen?'#E3E6E4':corHex(a.cor), c2 = gen?'#E3E6E4':corHex(a.cor2||a.cor);
  const st = gen?'#8A948F':shade(c1,-60), st2 = gen?'#8A948F':shade(c2,-60);
  const id='g'+(++gid);
  const grad = (c,i)=>`<linearGradient id="${id}${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c,22)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-22)}"/></linearGradient>`;
  const defs = `<defs>${grad(c1,'a')}${grad(c2,'b')}</defs>`;
  const W=160,H=90,cx=80,cy=45;
  const grav = (a.gravacao && !mini) ? `<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" font-family="monospace" fill="${shade(c1,-80)}" opacity=".75">${esc(String(a.gravacao).slice(0,12))}</text>` : '';
  let body='';
  if(fmt.includes('capsula')){
    body = `<rect x="22" y="27" width="62" height="36" rx="18" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/>`+
           `<rect x="76" y="27" width="62" height="36" rx="18" fill="url(#${id}b)" stroke="${st2}" stroke-width="1.3"/>`+
           `<rect x="72" y="27" width="10" height="36" fill="url(#${id}b)"/><line x1="78" y1="28" x2="78" y2="62" stroke="${st2}" stroke-width="1"/>`;
  } else if(fmt.includes('oblong')){
    body = `<rect x="24" y="27" width="112" height="36" rx="18" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/>`+(a.sulco?`<line x1="${cx}" y1="29" x2="${cx}" y2="61" stroke="${st}" stroke-width="1.4"/>`:'');
  } else if(fmt.includes('oval')||fmt.includes('eliptic')){
    body = `<ellipse cx="${cx}" cy="${cy}" rx="50" ry="25" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/>`+(a.sulco?`<line x1="${cx}" y1="21" x2="${cx}" y2="69" stroke="${st}" stroke-width="1.4"/>`:'');
  } else if(fmt.includes('losango')){
    body = `<path d="M${cx} 12 L${cx+44} ${cy} L${cx} 78 L${cx-44} ${cy} Z" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"/>`;
  } else if(fmt.includes('triang')){
    body = `<path d="M${cx} 12 L${cx+38} 74 L${cx-38} 74 Z" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"/>`;
  } else if(fmt.includes('pentag')){
    const p=[...Array(5)].map((_,i)=>{const t=-Math.PI/2+i*2*Math.PI/5;return (cx+34*Math.cos(t)).toFixed(1)+' '+(cy+34*Math.sin(t)+3).toFixed(1)}).join(' L');
    body = `<path d="M${p} Z" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"/>`;
  } else if(fmt.includes('quadrad')||fmt.includes('retang')){
    body = `<rect x="${cx-30}" y="${cy-30}" width="60" height="60" rx="10" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/>`;
  } else if(fmt.includes('gota')||fmt.includes('solucao')||fmt.includes('frasco')&&!fmt.includes('ampola')||fmt.includes('xarope')){
    const drop = fmt.includes('gota');
    body = `<rect x="58" y="${drop?30:26}" width="44" height="${drop?54:58}" rx="7" fill="#C58E4C" opacity=".85" stroke="#7a5324"/>`+
      `<rect x="62" y="44" width="36" height="26" rx="2" fill="${c1}" stroke="${st}" stroke-width=".8"/>`+
      (drop?`<rect x="67" y="18" width="26" height="13" rx="2" fill="#E9E9E9" stroke="#888"/><path d="M76 18 L80 5 L84 18Z" fill="#E9E9E9" stroke="#888"/>`:`<rect x="64" y="14" width="32" height="13" rx="2" fill="#E9E9E9" stroke="#888"/>`);
  } else if(fmt.includes('ampola')){
    body = `<path d="M66 82 L66 38 Q66 30 74 28 L74 20 Q74 14 80 12 Q86 14 86 20 L86 28 Q94 30 94 38 L94 82 Q94 86 90 86 L70 86 Q66 86 66 82Z" fill="${c1==COR.branco?COR.transparente:c1}" fill-opacity=".8" stroke="#6a7d85" stroke-width="1.3"/><line x1="72" y1="30" x2="88" y2="30" stroke="#6a7d85"/>`;
  } else if(fmt.includes('seringa')){
    body = `<rect x="18" y="37" width="96" height="16" rx="3" fill="${c1}" fill-opacity=".85" stroke="#6a7d85" stroke-width="1.2"/>`+
           `<rect x="114" y="41" width="22" height="8" fill="#DDD" stroke="#888"/><rect x="136" y="33" width="6" height="24" fill="#CCC" stroke="#888"/>`+
           `<line x1="18" y1="45" x2="4" y2="45" stroke="#888" stroke-width="1.5"/>`+
           [30,44,58,72,86,100].map(x=>`<line x1="${x}" y1="37" x2="${x}" y2="42" stroke="#6a7d85"/>`).join('');
  } else if(fmt.includes('adesivo')){
    body = `<rect x="38" y="15" width="84" height="60" rx="12" fill="${c1}" fill-opacity=".9" stroke="${st}" stroke-width="1.3" stroke-dasharray="3 2"/><rect x="50" y="26" width="60" height="38" rx="7" fill="${shade(c1,-12)}" opacity=".6"/>`;
  } else if(fmt.includes('spray')||fmt.includes('nasal')){
    body = `<rect x="62" y="40" width="36" height="44" rx="8" fill="${c1}" stroke="${st}"/><path d="M72 40 L74 12 Q80 6 86 12 L88 40Z" fill="${shade(c1,-10)}" stroke="${st}"/><rect x="56" y="36" width="48" height="8" rx="3" fill="#DDD" stroke="#888"/>`;
  } else if(fmt.includes('goma')||fmt.includes('pastilha')&&!fmt.includes('redond')){
    body = `<rect x="44" y="27" width="72" height="36" rx="6" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/>`;
  } else {
    const sub = fmt.includes('sublingual')||fmt.includes('mini');
    const r = sub?20:29;
    body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}a)" stroke="${st}" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="${r-4}" fill="none" stroke="${shade(c1,-14)}" stroke-width=".8" opacity=".6"/>`+(a.sulco?`<line x1="${cx-r+2}" y1="${cy}" x2="${cx+r-2}" y2="${cy}" stroke="${st}" stroke-width="1.4"/>`:'');
  }
  if(gen) body=body.replace(/stroke-width="1.3"/g,'stroke-width="1.3" stroke-dasharray="4 3"');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc((a.formato||'')+' '+(a.cor||''))}">${defs}${body}${fmt.includes('seringa')||fmt.includes('ampola')||fmt.includes('gota')?'':grav}</svg>`;
}

/* sinapse esquemática, parametrizada pelo diagrama da classe ou do fármaco */
function sinapseSVG(dg){
  if(!dg) return '';
  const alvos = arr(dg.alvos);
  const W=640,H=362;
  const efCor = e => { e=norm(e); if(e.includes('parcial')) return 'var(--sev-mo)'; if(e.includes('agon')&&!e.includes('antag')&&!e.includes('inverso')) return 'var(--c-eh)'; if(e.includes('modul')||e.includes('abert')||e.includes('liber')) return 'var(--c-ad)'; return 'var(--sev-ci)'; };
  const pre = alvos.filter(a=>a.local==='pre'), pint = alvos.filter(a=>a.local==='pre-interno'), pos = alvos.filter(a=>a.local==='pos'||!a.local);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama de sinapse">`;
  // terminal pré
  s += `<path d="M150 20 Q150 0 190 0 L450 0 Q490 0 490 20 L490 110 Q490 140 460 140 L180 140 Q150 140 150 110Z" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.5"/>`;
  s += `<text x="170" y="24" font-size="12" fill="var(--ink-3)">Neurônio pré-sináptico</text>`;
  // vesículas
  [[230,60],[270,50],[310,64],[350,52],[390,62]].forEach(([x,y])=>{ s+=`<circle cx="${x}" cy="${y}" r="13" fill="var(--surface)" stroke="var(--line-2)"/>`; for(let k=0;k<3;k++) s+=`<circle cx="${x-4+k*4}" cy="${y+(k%2?3:-2)}" r="2" fill="var(--accent)"/>`; });
  s += `<text x="310" y="95" font-size="12" text-anchor="middle" fill="var(--ink-2)">${esc(dg.nt||'')}</text>`;
  // fenda
  for(let i=0;i<14;i++){ const x=200+i*18, y=196+(i%3)*7; s+=`<circle cx="${x}" cy="${y}" r="2.4" fill="var(--accent)" opacity=".75"/>`; }
  s += `<text x="560" y="206" font-size="11" fill="var(--ink-3)" text-anchor="middle">fenda</text>`;
  // pós
  s += `<path d="M110 238 L530 238 Q560 238 560 262 L560 ${H} L80 ${H} L80 262 Q80 238 110 238Z" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.5"/>`;
  s += `<text x="100" y="${H-10}" font-size="12" fill="var(--ink-3)">Neurônio pós-sináptico</text>`;
  const drug = (x,y,c)=>`<path d="M${x} ${y-9} L${x+8} ${y-4.5} L${x+8} ${y+4.5} L${x} ${y+9} L${x-8} ${y+4.5} L${x-8} ${y-4.5}Z" fill="${c}" stroke="var(--surface)" stroke-width="1.5"/>`;
  // pré-membrana (transportadores e autorreceptores), na borda inferior do terminal
  pre.forEach((a,i)=>{ const n=pre.length, x=190+(i+.5)*(260/n), y=140; const c=efCor(a.efeito);
    s+=`<rect x="${x-16}" y="${y-14}" width="32" height="26" rx="6" fill="var(--surface)" stroke="${c}" stroke-width="2"/>`;
    s+=drug(x+18,y+12,c);
    s+=`<text x="${x}" y="${y+34}" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)">${esc(a.alvo)}</text>`;
    s+=`<text x="${x}" y="${y+47}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${esc(a.efeito||'')}</text>`; });
  pint.forEach((a,i)=>{ const x=440-i*60, y=100; const c=efCor(a.efeito);
    s+=`<ellipse cx="${x}" cy="${y}" rx="24" ry="14" fill="var(--surface)" stroke="${c}" stroke-width="2"/>`+drug(x+22,y-10,c)+
       `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--ink)">${esc(a.alvo)}</text>`; });
  // receptores pós
  pos.forEach((a,i)=>{ const n=pos.length, x=130+(i+.5)*(390/n), y=238; const c=efCor(a.efeito);
    s+=`<path d="M${x-14} ${y+26} L${x-14} ${y-6} Q${x-14} ${y-14} ${x-6} ${y-14} L${x-6} ${y+2} L${x+6} ${y+2} L${x+6} ${y-14} Q${x+14} ${y-14} ${x+14} ${y-6} L${x+14} ${y+26}Z" fill="var(--surface)" stroke="${c}" stroke-width="2"/>`;
    s+=drug(x,y-18,c);
    s+=`<text x="${x}" y="${y+44}" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)">${esc(a.alvo)}</text>`;
    s+=`<text x="${x}" y="${y+57}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${esc(a.efeito||'')}</text>`; });
  // legenda
  const lg=[['var(--sev-ci)','bloqueio / antagonismo'],['var(--sev-mo)','agonismo parcial'],['var(--c-eh)','agonismo'],['var(--c-ad)','modulação / liberação']];
  lg.forEach(([c,t],i)=>{ const y=18+i*18; s+=drug(512,y,c)+`<text x="526" y="${y+4}" font-size="10.5" fill="var(--ink-2)">${t}</text>`; });
  s += '</svg>';
  return `<figure class="fig" style="margin:0 0 10px">${s}<figcaption>${esc(dg.legenda||'Representação esquemática. Hexágonos indicam o fármaco no alvo; a cor indica o tipo de ação.')}</figcaption></figure>`;
}

/* afinidade: barras de 0 a 4 */
function afinidadeSVG(af){
  af = arr(af); if(!af.length) return '';
  const rowH=26, W=620, lw=190, H=af.length*rowH+34;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perfil de afinidade">`;
  const x0=lw, x1=W-110, sc=(x1-x0)/4;
  ['','fraca','moderada','alta','muito alta'].forEach((l,i)=>{ const x=x0+i*sc; s+=`<line x1="${x}" y1="6" x2="${x}" y2="${H-24}" stroke="var(--line)" stroke-dasharray="${i?'2 3':''}"/>`; if(i) s+=`<text x="${x-sc/2}" y="${H-8}" font-size="10" text-anchor="middle" fill="var(--ink-3)">${l}</text>`; });
  af.forEach((a,i)=>{ const y=10+i*rowH; const e=norm(a.acao);
    const c = e.includes('parcial')?'var(--sev-mo)':(e.includes('agon')&&!e.includes('antag')&&!e.includes('invers'))?'var(--c-eh)':(e.includes('modul')||e.includes('liber')||e.includes('abert'))?'var(--c-ad)':(e.includes('inib')||e.includes('bloq'))?'var(--accent)':'var(--sev-ci)';
    s+=`<text x="${lw-10}" y="${y+14}" font-size="12" text-anchor="end" fill="var(--ink)" font-weight="600">${esc(a.alvo)}</text>`;
    s+=`<rect x="${x0}" y="${y+3}" width="${Math.max(2,(+a.intensidade||0)*sc)}" height="15" rx="3" fill="${c}" opacity=".9"/>`;
    s+=`<text x="${x1+8}" y="${y+14}" font-size="10.5" fill="var(--ink-2)">${esc(a.acao||'')}</text>`; });
  s+='</svg>';
  return `<figure class="fig">${s}<figcaption>Afinidade relativa (escala ordinal de 0 a 4, adaptada de Stahl e de dados de Ki do PDSP). Não compara potência entre fármacos diferentes com precisão.</figcaption></figure>`;
}

/* mapa metabólico CYP */
const ENZ = ['1A2','2B6','2C8','2C9','2C19','2D6','3A4','UGT','P-gp'];
function cypHTML(fk){
  const c=(fk&&fk.cyp)||{}; const sub=arr(c.substrato), subm=arr(c.substrato_menor), inb=c.inibe||{}, ind=c.induz||{};
  const enz = ENZ.filter(e=>sub.includes(e)||subm.includes(e)||inb[e]||ind[e]);
  if(!enz.length) return c.nota?`<p class="muted small">${md(c.nota)}</p>`:'<p class="muted small">Sem participação relevante do citocromo P450.</p>';
  let h='<div class="cyp"><div class="h">Enzima</div><div class="h">Substrato</div><div class="h">Inibe</div><div class="h">Induz</div>';
  enz.forEach(e=>{
    const i=inb[e], d=ind[e];
    const icls = i==='forte'?'inF':i==='moderado'?'inm':'inf';
    h+=`<div class="enz">${e}</div><div>${sub.includes(e)?'<span class="m sub">principal</span>':subm.includes(e)?'<span class="m subm">menor</span>':''}</div><div>${i?`<span class="m ${icls}">${esc(i)}</span>`:''}</div><div>${d?`<span class="m ind">${esc(d)}</span>`:''}</div>`;
  });
  h+='</div>'; if(c.nota) h+=`<p class="muted small" style="margin-top:6px">${md(c.nota)}</p>`;
  return h;
}

/* esquema de titulação */
function titulacaoSVG(e){
  if(!e||!arr(e.pontos).length) return '';
  const pts=e.pontos, W=620,H=230, l=52,r=20,t=34,b=40;
  const xmax=Math.max(...pts.map(p=>p[0]))*1.12||1;
  const rawMax=Math.max(...pts.map(p=>p[1]), ...(arr(e.faixa).length?[e.faixa[1]]:[]));
  const nice=v=>{ const m=Math.pow(10,Math.floor(Math.log10(v))); for(const k of [1,2,2.5,5,10]) if(k*m>=v) return k*m; return 10*m; };
  const step=nice(rawMax/4), ymax=Math.ceil(rawMax*1.08/step)*step;
  const X=x=>l+x/xmax*(W-l-r), Y=y=>H-b-y/ymax*(H-t-b);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Esquema de titulação">`;
  if(arr(e.faixa).length===2) s+=`<rect x="${l}" y="${Y(e.faixa[1])}" width="${W-l-r}" height="${Y(e.faixa[0])-Y(e.faixa[1])}" fill="var(--c-eh)" opacity=".12"/>`;
  for(let v=0;v<=ymax+1e-9;v+=step){ s+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${l-6}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="var(--ink-3)">${+v.toFixed(2)}</text>`; }
  if(arr(e.faixa).length===2) s+=`<rect x="${W-r-150}" y="10" width="10" height="10" fill="var(--c-eh)" opacity=".3"/><text x="${W-r-136}" y="19" font-size="10.5" fill="var(--ink-2)">faixa terapêutica habitual</text>`;
  let d=''; pts.forEach((p,i)=>{ d += i? ` L${X(p[0])} ${Y(pts[i-1][1])} L${X(p[0])} ${Y(p[1])}` : `M${X(p[0])} ${Y(p[1])}`; }); d+=` L${X(xmax)} ${Y(pts[pts.length-1][1])}`;
  s+=`<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
  pts.forEach(p=>{ s+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/><text x="${X(p[0])+5}" y="${Y(p[1])-8}" font-size="10.5" fill="var(--ink)">${p[1]}</text>`; });
  pts.forEach(p=>{ s+=`<text x="${X(p[0])}" y="${H-b+16}" font-size="10" text-anchor="middle" fill="var(--ink-3)">${p[0]}</text>`; });
  s+=`<text x="${(W+l)/2}" y="${H-6}" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">${esc(e.unidade_tempo||'semana')}</text>`;
  s+=`<text x="${l-6}" y="18" font-size="10.5" text-anchor="end" fill="var(--ink-2)">${esc(e.unidade_dose||'mg/dia')}</text>`;
  s+='</svg>';
  return `<figure class="fig">${s}<figcaption>${md(e.legenda||'Esquema de titulação típico. Ajustar à resposta e à tolerabilidade.')}</figcaption></figure>`;
}

/* troca: curvas de retirada e introdução */
function trocaSVG(p){
  const W=620,H=236,l=40,r=16,t=44,b=38;
  const tot=p.total, X=x=>l+x/tot*(W-l-r), Y=y=>H-b-y*(H-t-b);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Esquema de troca">`;
  for(let i=0;i<=tot;i++){ s+=`<line x1="${X(i)}" x2="${X(i)}" y1="${t}" y2="${H-b}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${X(i)}" y="${H-b+15}" font-size="10" text-anchor="middle" fill="var(--ink-3)">${i}</text>`; }
  s+=`<line x1="${l}" x2="${W-r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line-2)"/>`;
  if(p.gap) s+=`<rect x="${X(p.gap[0])}" y="${t}" width="${X(p.gap[1])-X(p.gap[0])}" height="${H-b-t}" fill="var(--sev-mo)" opacity=".12"/><text x="${(X(p.gap[0])+X(p.gap[1]))/2}" y="${t+12}" font-size="10.5" text-anchor="middle" fill="var(--sev-mo)">intervalo livre</text>`;
  const path = ps => ps.map((q,i)=>(i?'L':'M')+X(q[0])+' '+Y(q[1])).join(' ');
  s+=`<path d="${path(p.origem)}" fill="none" stroke="var(--sev-ci)" stroke-width="2.6"/>`;
  s+=`<path d="${path(p.destino)}" fill="none" stroke="var(--accent)" stroke-width="2.6"/>`;
  s+=`<rect x="${l+6}" y="8" width="12" height="4" fill="var(--sev-ci)"/><text x="${l+22}" y="14" font-size="10.5" fill="var(--ink-2)">${esc(p.nomeO)} (origem)</text>`;
  s+=`<rect x="${l+246}" y="8" width="12" height="4" fill="var(--accent)"/><text x="${l+262}" y="14" font-size="10.5" fill="var(--ink-2)">${esc(p.nomeD)} (destino)</text>`;
  s+=`<text x="${(W+l)/2}" y="${H-6}" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">${esc(p.unidade||'semanas')}</text>`;
  s+=`<text x="${l-6}" y="${Y(1)+4}" font-size="10" text-anchor="end" fill="var(--ink-3)">100%</text><text x="${l-6}" y="${Y(.5)+4}" font-size="10" text-anchor="end" fill="var(--ink-3)">50%</text>`;
  s+='</svg>';
  return `<figure class="fig">${s}<figcaption>Proporção da dose-alvo ao longo do tempo. Esquema ilustrativo; ajustar à dose de partida, à resposta e aos sintomas de retirada.</figcaption></figure>`;
}

/* radar de efeitos adversos */
const PERFIL = [['sedacao','Sedação'],['peso','Ganho de peso'],['metabolico','Metabólico'],['sexual','Disfunção sexual'],['anticolinergico','Anticolinérgico'],['hipotensao','Hipotensão ortostática'],['qt','Prolongamento de QT'],['eps','Sintomas extrapiramidais'],['prolactina','Hiperprolactinemia'],['serotoninergico','Carga serotoninérgica'],['convulsao','Redução do limiar convulsivo'],['sangramento','Risco de sangramento'],['depressao_respiratoria','Depressão respiratória'],['dependencia','Dependência / abuso'],['insonia','Insônia / ativação']];
const PERFIL_L = Object.fromEntries(PERFIL);
const PAL = ['var(--accent)','var(--sev-ci)','var(--c-ad)','var(--c-ah)'];
function radarSVG(fs){
  const keys = PERFIL.map(p=>p[0]).filter(k=>fs.some(f=>((f.perfil||{})[k]||0)>0));
  if(keys.length<3) return '';
  const W=640,H=450,cx=320,cy=215,R=140,n=keys.length;
  const pt=(i,v)=>{ const a=-Math.PI/2+i*2*Math.PI/n; return [cx+R*v/3*Math.cos(a), cy+R*v/3*Math.sin(a)]; };
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar de efeitos adversos">`;
  [1,2,3].forEach(v=>{ s+=`<polygon points="${keys.map((_,i)=>pt(i,v).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`; });
  keys.forEach((k,i)=>{ const [x,y]=pt(i,3); const [lx,ly]=pt(i,3.45); s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly+4}" font-size="10.5" text-anchor="${lx<cx-10?'end':lx>cx+10?'start':'middle'}" fill="var(--ink-2)">${esc(PERFIL_L[k])}</text>`; });
  fs.forEach((f,j)=>{ const c=PAL[j%4]; s+=`<polygon points="${keys.map((k,i)=>pt(i,(f.perfil||{})[k]||0).join(',')).join(' ')}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="2"/>`; });
  fs.forEach((f,j)=>{ s+=`<rect x="${16}" y="${H-18-(fs.length-1-j)*16}" width="12" height="4" fill="${PAL[j%4]}"/><text x="34" y="${H-13-(fs.length-1-j)*16}" font-size="11" fill="var(--ink)">${esc(f.nome)}</text>`; });
  s+='</svg>';
  return `<figure class="fig" style="max-width:640px">${s}<figcaption>Intensidade relativa de 0 (ausente) a 3 (alta), segundo o perfil registrado em cada ficha.</figcaption></figure>`;
}
function perfilBars(p){
  p=p||{}; const ks=PERFIL.filter(([k])=>p[k]!=null&&p[k]>0);
  if(!ks.length) return '';
  return '<div class="perfil">'+ks.map(([k,l])=>{ const v=p[k]; const c=v>=3?'var(--sev-ci)':v==2?'var(--sev-gr)':'var(--sev-mo)'; return `<div class="pbar" style="--pc:${c}"><span>${l}</span><span class="seg">${[1,2,3].map(i=>`<i class="${i<=v?'f':''}"></i>`).join('')}</span></div>`; }).join('')+'</div>';
}

/* ---------- MOTOR DE INTERAÇÕES ---------- */
const GRAV = ['contraindicada','grave','moderada','leve'];
const gRank = g => GRAV.indexOf(g);
/* fármacos não psiquiátricos e substâncias (só para o verificador) */
const CLIN = arr(D.clinicos).map(c=>({...c, clinico:true, classe:'_clinico', farmacocinetica:{cyp:c.cyp||{}}}));
const TODOS = F.concat(CLIN);
const byAny = Object.fromEntries(TODOS.map(f=>[f.id,f]));
function casa(f, sel){
  // seletor: "id:x", "classe:x", "subclasse:x", "marcador:x", "grupo:x"
  const i=sel.indexOf(':'); const t=sel.slice(0,i), v=sel.slice(i+1);
  if(t==='id') return v.split(',').includes(f.id);
  if(t==='classe') return f.classe===v || arr(f.classes_secundarias).includes(v);
  if(t==='subclasse') return norm(f.subclasse)===norm(v) || norm(String(f.subclasse||'').replace(/\s*\(.*\)\s*$/,''))===norm(v);
  if(t==='marcador') return v.split(',').some(m=>arr(f.marcadores).includes(m));
  if(t==='grupo') return norm(f.grupo)===norm(v);
  return false;
}
/* nível 0 a 3 em palavras */
const NIVEL = v => ({1:'baixa',2:'moderada',3:'alta'})[v]||'ausente';
const nv = (f,k) => ((f.perfil||{})[k]||0);
/* farmacocinética normalizada: s (via: p principal, c parcial, m menor), i (inibe), n (induz): f forte, m moderado, w fraco */
const FORCA = {forte:'f',moderado:'m',fraco:'w',f:'f',m:'m',w:'w'};
function pkOf(f){
  if(f._pk) return f._pk;
  let r;
  if(f.pk) r={s:f.pk.s||{}, i:f.pk.i||{}, n:f.pk.n||{}, renal:!!f.pk.renal, ativo:arr(f.pk.ativo), nota:f.pk.nota||''};
  else {
    const c=(f.farmacocinetica||{}).cyp||{}; const s={}; const sub=arr(c.substrato);
    sub.forEach(e=>{ s[e]=sub.length===1?'p':'c'; }); arr(c.substrato_menor).forEach(e=>{ if(!s[e]) s[e]='m'; });
    const conv=o=>Object.fromEntries(Object.entries(o||{}).map(([e,v])=>[e,FORCA[v]||'w']));
    r={s, i:conv(c.inibe), n:conv(c.induz), renal:false, ativo:[], nota:''};
  }
  Object.defineProperty(f,'_pk',{value:r,enumerable:false}); return r;
}
const ENZN = e => (e==='P-gp'||e==='UGT')?e:'CYP'+e;
const FTXT = {f:'forte',m:'moderada',w:'fraca'};
const VTXT = {p:'via principal',c:'via relevante',m:'via menor'};
const juntar = l => l.length<2?l.join(''):l.slice(0,-1).join(', ')+' e '+l[l.length-1];
const lc=n=>(n&&n.length>1&&n[1]===n[1].toLowerCase())?n.charAt(0).toLowerCase()+n.slice(1):n;
const fem=f=>({forte:'forte',moderado:'moderada',fraco:'fraca'}[f]||f);
/* mesma molécula (oral e depósito) */
const baseMol = f => f.ficha_ligada||f.id;

function interacoesPar(a,b){
  const out=[];
  const pa=a.perfil||{}, pb=b.perfil||{};
  const add=(g,t,m,c,orig,canal)=>out.push({g,t,m,c,orig,canal:canal||'Outros'});
  const has=(x,m)=>arr(x.marcadores).includes(m);
  const both=m=>has(a,m)&&has(b,m);
  const one=(m1,m2)=>(has(a,m1)&&has(b,m2))||(has(b,m1)&&has(a,m2));
  const pick=m=>has(a,m)?[a,b]:has(b,m)?[b,a]:null;
  const pickF=fn=>fn(a,b)?[a,b]:fn(b,a)?[b,a]:null;
  const A=a.nome, B=lc(b.nome);
  const PD='Regra farmacodinâmica';
  const par = k => `${a.nome} (${NIVEL(nv(a,k))}) e ${lc(b.nome)} (${NIVEL(nv(b,k))})`;

  if(!a.clinico&&!b.clinico&&baseMol(a)===baseMol(b)){
    add('leve','Mesma molécula em duas formulações',`${a.nome} e ${lc(b.nome)} são o mesmo princípio ativo (oral e depósito): os efeitos e os riscos se somam como aumento de dose.`,'Associar apenas na fase de cobertura oral do início do depósito ou em reagudização, com prazo definido; somar as doses ao avaliar efeitos adversos.','Duplicidade','Duplicidade');
    return out;
  }

  /* pares específicos */
  arr(D.pares).forEach(p=>{
    if((casa(a,p.a)&&casa(b,p.b))||(casa(a,p.b)&&casa(b,p.a))) { add(p.gravidade,p.titulo,p.mecanismo,p.conduta,'Par específico',p.canal||'Específico'); if(p.pk) out[out.length-1].pk=true; }
  });

  /* ===== SEROTONINA E MAO ===== */
  const sa=nv(a,'serotoninergico'), sb=nv(b,'serotoninergico');
  const imao=pickF((x,y)=>has(x,'imao_irreversivel')&&!has(y,'imao_irreversivel'));
  const rima=pickF((x,y)=>has(x,'imao_reversivel')&&!has(y,'imao_reversivel')&&!has(y,'imao_irreversivel'));
  const outraMao=pickF((x,y)=>has(x,'inibidor_mao_outro'));
  if(imao&&nv(imao[1],'serotoninergico')>=2){ const [m,o]=imao; add('contraindicada',`Síndrome serotoninérgica: ${lc(m.nome)} com ${lc(o.nome)}`,`${m.nome} bloqueia de forma irreversível a degradação da serotonina; ${lc(o.nome)} tem ação serotoninérgica ${NIVEL(nv(o,'serotoninergico'))}. A combinação produz síndrome serotoninérgica grave (hipertermia, rigidez, clônus, instabilidade autonômica), com óbitos descritos.`,`Não associar. Após suspender o IMAO, aguardar 14 dias para iniciar ${lc(o.nome)}; no sentido inverso, 14 dias (5 semanas após fluoxetina, 3 semanas após vortioxetina).`,PD,'MAO'); }
  else if(imao&&nv(imao[1],'serotoninergico')===1){ const [m,o]=imao; add('moderada',`IMAO com fármaco de ação serotoninérgica fraca: ${lc(o.nome)}`,`${o.nome} tem ação serotoninérgica pequena; com ${lc(m.nome)} há relatos isolados de toxicidade serotoninérgica e de hipotensão ou hipertensão.`,`Associação possível apenas com indicação clara (ex.: lítio ou trazodona em depressão resistente), dose baixa, titulação lenta e orientação de sinais de toxicidade.`,PD,'MAO'); }
  else if(outraMao&&nv(outraMao[1],'serotoninergico')>=2){ const [m,o]=outraMao; add('contraindicada',`Síndrome serotoninérgica: ${lc(m.nome)} inibe a MAO`,`${m.nome} tem ação inibidora da MAO; associado a ${lc(o.nome)} (ação serotoninérgica ${NIVEL(nv(o,'serotoninergico'))}) há relatos de síndrome serotoninérgica grave e fatal.`,`Evitar. Se ${lc(m.nome)} for indispensável (ex.: infecção grave), suspender ${lc(o.nome)} e monitorar por 2 semanas (5 após fluoxetina); em emergências, usar com vigilância intensiva.`,PD,'MAO'); }
  else if(rima&&nv(rima[1],'serotoninergico')>=2){ const [m,o]=rima; add('contraindicada',`Síndrome serotoninérgica: moclobemida com ${lc(o.nome)}`,`IMAO-A reversível associado a ${lc(o.nome)} (ação serotoninérgica ${NIVEL(nv(o,'serotoninergico'))}); superdosagens combinadas já foram fatais.`,'Não associar. Aguardar 24 a 48 horas após a moclobemida para iniciar serotoninérgico; 2 semanas no sentido inverso (5 após fluoxetina).',PD,'MAO'); }
  else if(sa>=2&&sb>=2){
    const g=(sa>=3&&sb>=3)?'grave':'moderada';
    add(g,'Somação serotoninérgica',`Ação serotoninérgica de ${par('serotoninergico')}. Risco de síndrome serotoninérgica: tremor, clônus induzível ou espontâneo, hiper-reflexia, midríase, diarreia, sudorese, agitação e hipertermia; o risco sobe nos primeiros dias e após aumentos de dose.`, g==='grave'?'Evitar fora de troca cruzada planejada. Se inevitável, doses baixas, aumento lento e vigilância de clônus e temperatura.':'Associação possível com cautela: orientar sinais de toxicidade e reavaliar após cada aumento de dose.',PD,'Serotonina');
  } else if((has(a,'triptano')&&sb>=2)||(has(b,'triptano')&&sa>=2)) add('leve','Triptano com serotoninérgico','Alerta regulatório de síndrome serotoninérgica; o risco real é baixo porque o triptano age em 5-HT1B/1D.','Associação permitida; orientar sintomas.',PD,'Serotonina');
  else if((sa>=2&&sb===1)||(sb>=2&&sa===1)){ if(!has(a,'triptano')&&!has(b,'triptano')) add('leve','Associação serotoninérgica de baixo risco',`Ação serotoninérgica de ${par('serotoninergico')}. Toxicidade serotoninérgica é rara com essa combinação, mas já foi descrita.`,'Associação habitual; orientar sinais de toxicidade serotoninérgica.',PD,'Serotonina'); }
  const cip=pickF((x,y)=>has(x,'antagonista_5ht2')&&nv(y,'serotoninergico')>=3);
  if(cip) add('leve',`${cip[0].nome} pode reduzir o efeito de ${lc(cip[1].nome)}`,`${cip[0].nome} bloqueia receptores 5-HT2; em uso contínuo pode atenuar o efeito antidepressivo ou ansiolítico de ${lc(cip[1].nome)}.`,'Preferir uso pontual (antes da atividade sexual ou como antídoto); vigiar recaída.',PD,'Serotonina');

  /* ===== SIMPATICOMIMÉTICOS E PRESSÃO ===== */
  if(both('simpaticomimetico')) add('moderada','Somação simpaticomimética',`${a.nome} e ${lc(b.nome)} elevam noradrenalina e dopamina: aumento de PA e FC, ansiedade, insônia, perda de apetite e maior risco de arritmias.`,'Aferir PA e FC antes e após cada ajuste; evitar em hipertensos, cardiopatas e em uso de substâncias.',PD,'Pressão');
  else if((has(a,'pressor')||has(a,'simpaticomimetico'))&&(has(b,'pressor')||has(b,'simpaticomimetico'))) add('leve','Efeito pressor aditivo',`${a.nome} e ${lc(b.nome)} elevam a PA e a FC por ação noradrenérgica.`,'Aferir PA e FC na introdução e em doses altas; cuidado em hipertensos.',PD,'Pressão');

  /* ===== QT ===== */
  const qa=nv(a,'qt'), qb=nv(b,'qt');
  if((qa>=2&&qb>=2)||(qa>=3&&qb>=1)||(qb>=3&&qa>=1)){
    const g=((qa>=3&&qb>=2)||(qb>=3&&qa>=2))?'grave':'moderada';
    add(g,'Prolongamento aditivo do QTc',`Risco de QT de ${par('qt')}. A soma aumenta o risco de torsades de pointes, maior com hipocalemia, hipomagnesemia, bradicardia, sexo feminino, idade avançada, cardiopatia e doses altas.`,'ECG antes e após atingir a dose; corrigir potássio e magnésio; evitar se QTc acima de 500 ms ou aumento acima de 60 ms; preferir alternativa de menor risco.',PD,'QT');
  }
  const hk=pickF((x,y)=>has(x,'hipocalemia')&&nv(y,'qt')>=2);
  if(hk) add('moderada',`Hipocalemia por ${lc(hk[0].nome)} com fármaco que prolonga QT`,`${hk[0].nome} pode reduzir potássio e magnésio, potencializando o risco de torsades com ${lc(hk[1].nome)}.`,'Dosar e repor potássio e magnésio; ECG.',PD,'QT');
  const bq=pickF((x,y)=>has(x,'bradicardia')&&x.id!=='litio'&&nv(y,'qt')>=2&&!has(y,'bradicardia'));
  if(bq) add('leve',`Bradicardia por ${lc(bq[0].nome)} com fármaco que prolonga QT`,`A bradicardia prolonga o QT e facilita torsades de pointes com ${lc(bq[1].nome)}.`,'ECG com atenção à FC e ao QTc.',PD,'QT');

  /* ===== DEPRESSÃO DO SNC ===== */
  const ra=nv(a,'depressao_respiratoria'), rb=nv(b,'depressao_respiratoria');
  const opA=has(a,'agonista_opioide'), opB=has(b,'agonista_opioide');
  const gabaDup=both('agonista_gaba_a');
  const forteSNC=ra>=3||rb>=3||opA||opB||has(a,'alcool')||has(b,'alcool');
  if(gabaDup) add('moderada','Dois agonistas do receptor GABA-A',`${a.nome} e ${lc(b.nome)} agem no mesmo sítio (benzodiazepínicos e drogas Z): somam sedação, amnésia, quedas e depressão respiratória, sem ganho terapêutico, e aumentam tolerância e dependência.`,'Evitar a duplicidade. Manter um único agente, de preferência de meia-vida mais longa, com plano de redução.',PD,'SNC');
  else if(ra>=2&&rb>=2) add(forteSNC?'grave':'moderada',forteSNC?'Depressão respiratória aditiva':'Depressão do SNC aditiva',`Depressão do SNC com efeito respiratório: ${par('depressao_respiratoria')}. ${forteSNC?'Combinação responsável pela maioria das mortes por sobredose com mais de uma substância.':'Somação de sedação, prejuízo psicomotor e risco de hipoventilação.'}`,`${forteSNC?'Evitar; se indispensável, menores doses, monitorização e naloxona disponível quando houver opioide.':'Menores doses e orientação.'} Cuidado máximo em DPOC, apneia do sono, idosos e hepatopatas.`,PD,'SNC');
  else if((opA&&nv(b,'sedacao')>=2)||(opB&&nv(a,'sedacao')>=2)){ const o=opA?b:a, op=opA?a:b; const gv=(nv(o,'depressao_respiratoria')>=1||nv(o,'sedacao')>=3)?'grave':'moderada'; add(gv,'Opioide com depressor do SNC',`${op.nome} com ${lc(o.nome)} (sedação ${NIVEL(nv(o,'sedacao'))}): somação de sedação e depressão respiratória (alerta da FDA para opioides com benzodiazepínicos, gabapentinoides e outros sedativos).`,'Evitar ou reduzir doses; orientar paciente e família; naloxona disponível.',PD,'SNC'); }
  else if(nv(a,'sedacao')>=2&&nv(b,'sedacao')>=2){ const g=(nv(a,'sedacao')>=3&&nv(b,'sedacao')>=3)?'moderada':'leve'; add(g,'Sedação aditiva',`Sedação de ${par('sedacao')}: somação de sonolência, lentificação psicomotora e prejuízo na direção.`,'Concentrar as doses sedativas à noite; orientar sobre direção e quedas; ajustar em idosos.',PD,'SNC'); }

  /* ===== OPIOIDES ===== */
  if(one('agonista_opioide','antagonista_opioide')){ const [x,y]=pick('antagonista_opioide');
    if(x.id==='naloxona') add('moderada',`Naloxona reverte ${lc(y.nome)}`,'Uso intencional na intoxicação por opioide. Em dependentes, doses altas precipitam abstinência abrupta (vômitos, agitação, taquicardia). A ação da naloxona dura 30 a 90 minutos, menos que a de metadona, buprenorfina e opioides de liberação prolongada.',`Titular em doses pequenas (0,04 a 0,4 mg IV) buscando respiração adequada, não o despertar completo. Observar por horas pela recorrência (metadona: 24 horas ou mais; considerar infusão).${y.id==='buprenorfina'?' Com buprenorfina, podem ser necessárias doses maiores.':''}`,PD,'Opioides');
    else add('contraindicada',`${x.nome} bloqueia ${lc(y.nome)}`,`${x.nome} ocupa o receptor mu: precipita abstinência em usuários de ${lc(y.nome)} e anula a analgesia.`,'Não associar. Iniciar o antagonista apenas após 7 a 10 dias sem opioides de ação curta (10 a 14 para metadona); em dor aguda, usar analgesia não opioide ou regional.',PD,'Opioides'); }
  const bup=pickF((x,y)=>has(x,'agonista_parcial_opioide')&&has(y,'agonista_opioide')&&!has(y,'agonista_parcial_opioide'));
  if(bup) add('grave',`${bup[0].nome} desloca ${lc(bup[1].nome)}`,`${bup[0].nome} é agonista parcial de alta afinidade: em quem usa ${lc(bup[1].nome)} (agonista pleno), precipita abstinência; em sentido inverso, bloqueia parcialmente a analgesia do agonista pleno.`,'Transição apenas com protocolo (abstinência leve a moderada antes da primeira dose, ou microindução). Em dor aguda, preferir analgesia multimodal e ajustar com especialista.',PD,'Opioides');

  /* ===== ANTICOLINÉRGICO ===== */
  const aa=nv(a,'anticolinergico'), ab=nv(b,'anticolinergico');
  if(aa>=2&&ab>=2) add(aa>=3&&ab>=3?'grave':'moderada','Carga anticolinérgica aditiva',`Bloqueio muscarínico de ${par('anticolinergico')} (soma aproximada na escala ACB: ${aa+ab}). Constipação, íleo, retenção urinária, visão borrada, taquicardia, hipertermia, delirium e prejuízo cognitivo.`,'Evitar em idosos, demência, glaucoma de ângulo fechado e prostatismo; buscar alternativa sem ação muscarínica; vigiar hábito intestinal.',PD,'Anticolinérgico');
  else if((aa>=3&&ab===1)||(ab>=3&&aa===1)) add('leve','Carga anticolinérgica somada',`Bloqueio muscarínico de ${par('anticolinergico')} (soma aproximada na escala ACB: ${aa+ab}); cargas acima de 3 associam-se a declínio cognitivo e quedas em idosos.`,'Revisar a necessidade de cada fármaco em idosos.',PD,'Anticolinérgico');
  const il=pickF((x,y)=>has(x,'ileo')&&(nv(y,'anticolinergico')>=2||has(y,'agonista_opioide')));
  if(il) add('grave','Íleo paralítico: clozapina com fármaco constipante',`A clozapina reduz a motilidade intestinal (efeito anticolinérgico e 5-HT3); ${lc(il[1].nome)} soma constipação. Íleo e perfuração intestinal por clozapina têm mortalidade de 15 a 30%.`,'Evitar o fármaco constipante. Se necessário, laxativo osmótico ou estimulante profilático, perguntar sobre evacuações a cada consulta e investigar dor ou distensão abdominal.',PD,'Anticolinérgico');
  const col=pickF((x,y)=>has(x,'colinergico')&&nv(y,'anticolinergico')>=2);
  if(col) add('moderada',`${col[1].nome} antagoniza ${lc(col[0].nome)}`,`Efeitos opostos sobre a transmissão colinérgica: ${lc(col[1].nome)} (anticolinérgico ${NIVEL(nv(col[1],'anticolinergico'))}) anula o benefício cognitivo e pode piorar confusão.`,'Rever a necessidade do anticolinérgico; preferir alternativas sem ação muscarínica.',PD,'Anticolinérgico');

  /* ===== HIPOTENSÃO, CONVULSÕES, SANGRAMENTO ===== */
  const ha=nv(a,'hipotensao'), hb=nv(b,'hipotensao');
  if(ha>=2&&hb>=2){ const g=(ha>=3&&hb>=3)?'grave':(ha>=3||hb>=3)?'moderada':'leve'; add(g,'Hipotensão ortostática aditiva',`Hipotensão de ${par('hipotensao')} (bloqueio alfa-1 e outros mecanismos): tontura, síncope e quedas.`,'Titulação lenta, PA deitado e em pé, orientar levantar devagar e hidratação; cuidado em idosos.',PD,'Hipotensão'); }
  const ca=nv(a,'convulsao'), cb=nv(b,'convulsao');
  if(ca>=2&&cb>=2){ const g=(ca>=3&&cb>=3)?'grave':(ca>=3||cb>=3)?'moderada':'leve'; add(g,'Redução aditiva do limiar convulsivo',`Redução do limiar convulsivo de ${par('convulsao')}; o risco é dose-dependente.`,'Doses mínimas eficazes; evitar em epilepsia não controlada, TCE, abstinência de álcool ou benzodiazepínico e distúrbios eletrolíticos.',PD,'Convulsão'); }
  const sga=nv(a,'sangramento'), sgb=nv(b,'sangramento');
  if(sga>=2&&sgb>=2) add((sga>=3||sgb>=3)?'grave':'moderada','Risco aditivo de sangramento',(sga>=3||sgb>=3)?`Anticoagulante associado a fármaco que prejudica a agregação plaquetária (${a.nome} e ${lc(b.nome)}): a serotonina plaquetária depende do SERT; sangramentos digestivos e intracranianos.`:`Somação de efeitos sobre a hemostasia (${a.nome} e ${lc(b.nome)}); ISRS com AINE aumenta o sangramento digestivo várias vezes.`,'Preferir antidepressivo sem ação no SERT quando possível (mirtazapina, bupropiona); se mantido, inibidor de bomba de prótons em risco digestivo, vigiar sangramentos e INR.',PD,'Sangramento');
  const aml=pickF((x,y)=>has(x,'anti_amiloide')&&(has(y,'anticoagulante')||nv(y,'sangramento')>=2));
  if(aml) add(has(aml[1],'anticoagulante')?'grave':'moderada',`${aml[0].nome} com ${lc(aml[1].nome)}: hemorragia cerebral`,`Anticorpos anti-amiloide causam ARIA com micro-hemorragias; ${has(aml[1],'anticoagulante')?'com anticoagulante houve hemorragias intracerebrais fatais':'antiagregantes e fármacos que prejudicam a hemostasia podem somar risco'}.`,has(aml[1],'anticoagulante')?'Não iniciar anti-amiloide em quem precisa de anticoagulação; se surgir indicação, discutir suspensão do anticorpo.':'Avaliar a necessidade; RM de vigilância conforme a bula.',PD,'Sangramento');

  /* ===== LÍTIO ===== */
  const lit=a.id==='litio'?a:b.id==='litio'?b:null, o2=lit===a?b:a;
  if(lit&&has(o2,'eleva_litio')) add('grave',`${o2.nome} eleva a litemia`,'Redução da excreção renal de lítio (menor filtração ou maior reabsorção proximal de sódio); intoxicação em dias a semanas: tremor grosseiro, ataxia, disartria, confusão, vômitos e diarreia.',`Evitar. Se necessário, reduzir a dose de lítio em 25 a 50% e dosar litemia em 5 a 7 dias e após cada ajuste.${has(o2,'aine')?' Para analgesia, preferir paracetamol ou dipirona.':''}`,PD,'Lítio');
  if(lit&&has(o2,'reduz_litio')) add('moderada',`${o2.nome} reduz a litemia`,'Aumento da excreção renal de lítio; ao suspender o fármaco, a litemia sobe.','Monitorar litemia ao iniciar e ao suspender.',PD,'Lítio');

  /* ===== SÓDIO, CORAÇÃO, MEDULA, FÍGADO, METABOLISMO ===== */
  if(both('hiponatremia')) add('moderada','Risco aditivo de hiponatremia',`${a.nome} e ${lc(b.nome)} podem causar SIADH ou perda de sódio; risco maior em idosos, mulheres, baixo peso e uso de diurético.`,'Sódio basal e em 2 a 4 semanas; orientar sobre confusão, náuseas, cefaleia e quedas.',PD,'Sódio');
  if(both('bradicardia')) add('moderada','Bradicardia aditiva',`${a.nome} e ${lc(b.nome)} têm efeito cronotrópico negativo ou sobre a condução: bradicardia, bloqueio AV, síncope.`,'FC e ECG; cautela em idosos e em doença do nó sinusal.',PD,'Bradicardia');
  if(both('mielotoxico')) add('grave','Mielotoxicidade aditiva',`${a.nome} e ${lc(b.nome)} associam-se a neutropenia ou agranulocitose.`,'Evitar; se inevitável, hemograma frequente e orientação de febre e dor de garganta.',PD,'Medula');
  if(both('hepatotoxico')) add('moderada','Hepatotoxicidade aditiva',`${a.nome} e ${lc(b.nome)} podem causar lesão hepática; a combinação soma o risco.`,'Transaminases antes e periodicamente; suspender se TGP acima de 3 vezes com sintomas ou acima de 5 vezes.',PD,'Fígado');
  const amo=pickF((x,y)=>has(x,'hiperamonemia')&&has(y,'potencializa_amonia'));
  if(amo) add('moderada',`Hiperamonemia: ${lc(amo[0].nome)} com ${lc(amo[1].nome)}`,`${amo[1].nome} potencializa a hiperamonemia do valproato: encefalopatia (sonolência, confusão, vômitos, asterixe) mesmo com nível sérico e transaminases normais.`,'Dosar amônia se houver sonolência ou confusão; considerar L-carnitina; reavaliar a associação.',PD,'Fígado');
  if(both('acidose')) add('leve','Acidose metabólica aditiva',`${a.nome} e ${lc(b.nome)} podem causar acidose (inibição da anidrase carbônica ou acidose lática).`,'Bicarbonato sérico periódico; cuidado na insuficiência renal.',PD,'Metabólico');
  if(nv(a,'metabolico')>=2&&nv(b,'metabolico')>=2) add('moderada','Risco metabólico aditivo',`Efeito metabólico de ${par('metabolico')}: ganho de peso, resistência à insulina, dislipidemia e diabetes.`,'Peso, cintura, glicemia e lipídios no início, em 12 semanas e depois anualmente; considerar metformina.',PD,'Metabólico');
  else if(nv(a,'peso')>=2&&nv(b,'peso')>=2) add('leve','Ganho de peso aditivo',`Ganho de peso de ${par('peso')}.`,'Peso mensal nos primeiros meses; orientação nutricional.',PD,'Metabólico');

  /* ===== DOPAMINA ===== */
  if(one('antagonista_d2','agonista_dopaminergico')) add('moderada','Antagonismo dopaminérgico',`Efeitos opostos sobre o receptor D2 (${a.nome} e ${lc(b.nome)}): perda de eficácia de um ou de outro; agonistas podem piorar a psicose.`,'Na doença de Parkinson, preferir quetiapina ou clozapina; evitar metoclopramida e antipsicóticos de alta potência.',PD,'Dopamina');
  if(both('antagonista_d2')) add('moderada','Associação de dois bloqueadores D2',`${a.nome} e ${lc(b.nome)} somam bloqueio D2: mais EPS, acatisia, hiperprolactinemia, risco de síndrome neuroléptica maligna e de discinesia tardia, além dos efeitos metabólicos e de QT de cada um.`,'Justificar a polifarmácia antipsicótica (evidência: clozapina com amissulprida ou aripiprazol). Na náusea, preferir antiemético sem ação D2.',PD,'Dopamina');
  else if(nv(a,'prolactina')>=2&&nv(b,'prolactina')>=2) add('leve','Hiperprolactinemia aditiva',`Elevação de prolactina de ${par('prolactina')}.`,'Perguntar sobre galactorreia, amenorreia e disfunção sexual; dosar prolactina se sintomas.',PD,'Dopamina');
  const dep=pickF((x,y)=>has(x,'depletor_dopamina')&&has(y,'antagonista_d2'));
  if(dep) add('moderada',`${dep[0].nome} com antipsicótico`,'Depleção e bloqueio dopaminérgico somados: parkinsonismo, sedação, depressão e risco de síndrome neuroléptica maligna.','Doses baixas e vigilância motora.',PD,'Dopamina');
  const est=pickF((x,y)=>has(x,'simpaticomimetico')&&has(y,'antagonista_d2'));
  if(est) add('leve',`Estimulante com antipsicótico`,`${est[0].nome} aumenta dopamina e ${lc(est[1].nome)} a bloqueia: efeitos opostos; em psicose, estimulantes podem precipitar recaída.`,'Associação aceitável com indicação clara (ex.: TDAH com irritabilidade grave); vigiar psicose e movimentos anormais.',PD,'Dopamina');
  if(both('acatisia')) add('leve','Acatisia aditiva',`${a.nome} e ${lc(b.nome)} causam acatisia.`,'Perguntar ativamente sobre inquietação; reduzir dose ou usar propranolol.',PD,'Dopamina');

  /* ===== OUTROS ANTAGONISMOS ===== */
  const alf=pickF((x,y)=>has(x,'agonista_alfa2')&&has(y,'antagoniza_alfa2'));
  if(alf) add('moderada',`${alf[1].nome} antagoniza ${lc(alf[0].nome)}`,`${alf[1].nome} bloqueia receptores alfa-2 ou aumenta noradrenalina e reduz o efeito anti-hipertensivo e sedativo de ${lc(alf[0].nome)}; a retirada de ${lc(alf[0].nome)} nessa situação favorece rebote hipertensivo.`,'Monitorar PA; retirar a clonidina ou guanfacina gradualmente.',PD,'Pressão');
  const flu=pickF((x,y)=>has(x,'antagonista_bzd')&&has(y,'agonista_gaba_a'));
  if(flu) add('moderada',`Flumazenil reverte ${lc(flu[1].nome)}`,`Reversão competitiva do efeito de ${lc(flu[1].nome)}; em usuários crônicos precipita abstinência e convulsões; a ressedação ocorre porque o flumazenil dura menos.`,'Usar só em sedação iatrogênica em pessoa sem uso crônico; nunca em intoxicação mista desconhecida.',PD,'SNC');
  const opos=pickF((x,y)=>has(x,'simpaticomimetico')&&nv(y,'sedacao')>=3&&!has(y,'antagonista_d2'));
  if(opos) add('leve','Efeitos opostos sobre a vigília',`${opos[0].nome} estimula e ${lc(opos[1].nome)} seda: um pode mascarar o outro (ex.: estimulante mascarando intoxicação por sedativo).`,'Revisar horários; atenção a uso para contrabalançar efeitos.',PD,'SNC');

  /* ===== FARMACOCINÉTICA ===== */
  const RKF={f:3,m:2,w:1}, RKV={p:3,c:2,m:1};
  const baixa=g=>({grave:'moderada',moderada:'leve',leve:null})[g];
  const sobe=g=>({leve:'moderada',moderada:'grave',grave:'grave'})[g];
  const pk=(x,y)=>{
    const X=pkOf(x), Y=pkOf(y);
    const narrow=has(y,'janela_estreita'), sens=has(y,'substrato_sensivel');
    const prof=arr(y.profarmaco);
    // pró-fármacos
    const pInib=Object.entries(X.i).filter(([e,f])=>f!=='w'&&prof.includes(e));
    if(pInib.length){ const es=juntar(pInib.map(([e])=>ENZN(e))); const f=pInib.some(([,f])=>f==='f')?'f':'m';
      add(y.gravidade_profarmaco||'moderada',`${x.nome} inibe ${es} e reduz a ativação de ${lc(y.nome)}`,`${y.nome} é pró-fármaco ativado pelo ${es}; inibição ${FTXT[f]} por ${lc(x.nome)}. ${y.efeito_reducao||''}`,`Evitar; preferir alternativa sem inibição do ${es}.`,'Farmacocinética','Pró-fármaco'); }
    // inibição
    let gi=null; const vi=[];
    Object.entries(X.i).forEach(([e,f])=>{ const v=Y.s[e]; if(!v||prof.includes(e)) return;
      let g=null; const sc=RKF[f]+RKV[v];
      if(f==='f'&&v==='p') g=(narrow||sens)?'grave':'moderada';
      else if(f==='m'&&v==='p') g=narrow?'grave':'moderada';
      else if(sc>=5) g='moderada';
      else if(sc===4) g=(narrow||sens)?'moderada':'leve';
      if(v==='m') g=(g&&narrow&&f==='f')?'leve':null;
      if(f==='w') g=(v==='p'&&(narrow||sens))?'leve':null;
      if(g&&Y.ativo.includes(e)) g=baixa(g);
      if(!g) return; vi.push([e,f,v,g]); if(!gi||gRank(g)<gRank(gi)) gi=g; });
    if(gi){ if(vi.filter(v=>v[3]!=='leve').length>=2) gi=sobe(gi);
      const es=juntar(vi.map(([e])=>ENZN(e))); const fmax=vi.reduce((m,[,f])=>RKF[f]>RKF[m]?f:m,'w'); const vmax=vi.reduce((m,[,,v])=>RKV[v]>RKV[m]?v:m,'m');
      const mag=gi==='grave'?'aumento esperado da exposição de 2 a 5 vezes ou mais':gi==='moderada'?'aumento esperado de cerca de 1,5 a 2,5 vezes':'aumento pequeno, em geral menor que 1,5 vez';
      add(gi,`${x.nome} inibe ${es} e aumenta ${lc(y.nome)}`,`${x.nome} é inibidor ${juntar(vi.map(([e,f])=>FTXT[f]+' do '+ENZN(e)))}; para ${lc(y.nome)} essa é ${juntar([...new Set(vi.map(([,,v])=>VTXT[v]))])} de eliminação: ${mag}.${vi.length>=2?' Mais de uma via bloqueada ao mesmo tempo.':''}${Y.ativo.some(e=>vi.some(([k])=>k===e))?' Parte do efeito é compensada porque o metabólito formado por essa via também é ativo.':''}${y.efeito_aumento?' Risco: '+y.efeito_aumento:''}${X.nota?' '+X.nota:''}`,
        narrow?`Reduzir a dose de ${lc(y.nome)}, dosar nível sérico ou vigiar toxicidade após 1 a 2 semanas e ao suspender ${lc(x.nome)}.`:gi==='grave'?`Evitar ou usar a menor dose de ${lc(y.nome)} (bula costuma recomendar redução de 50% ou mais).`:gi==='moderada'?`Iniciar ${lc(y.nome)} em dose menor, titular pela tolerabilidade e reavaliar ao suspender ${lc(x.nome)}.`:`Em geral sem ajuste; atenção a efeitos adversos dose-dependentes.`,'Farmacocinética',vi.some(([e])=>e==='UGT')?'UGT':vi.some(([e])=>e==='P-gp')?'P-gp':'CYP'); }
    // indução
    let gn=null; const vn=[]; const contra=has(y,'contraceptivo');
    Object.entries(X.n).forEach(([e,f])=>{ const v=Y.s[e]; if(!v||prof.includes(e)) return;
      let g=null; const sc=RKF[f]+RKV[v];
      if(f==='f'&&v==='p') g=(narrow||sens||contra||y.efeito_reducao)?'grave':'moderada';
      else if(sc>=5) g=(narrow||contra)?'grave':'moderada';
      else if(sc===4) g=(narrow||contra)?'moderada':'leve';
      if(v==='m') g=null;
      if(f==='w') g=(v==='p'&&(narrow||contra))?'leve':null;
      if(g&&Y.ativo.includes(e)&&!contra) g=baixa(g);
      if(!g) return; vn.push([e,f,v,g]); if(!gn||gRank(g)<gRank(gn)) gn=g; });
    if(gn){ if(vn.filter(v=>v[3]!=='leve').length>=2) gn=sobe(gn);
      const es=juntar(vn.map(([e])=>ENZN(e)));
      const mag=gn==='grave'?'redução esperada de 50 a 90% dos níveis':gn==='moderada'?'redução esperada de cerca de 30 a 50%':'redução pequena, em geral menor que 30%';
      add(gn,`${x.nome} induz ${es} e reduz ${lc(y.nome)}`,`${x.nome} é indutor ${juntar(vn.map(([e,f])=>FTXT[f]+' do '+ENZN(e)))}; para ${lc(y.nome)} essa é ${juntar([...new Set(vn.map(([,,v])=>VTXT[v]))])} de eliminação: ${mag}. A indução se instala em 1 a 3 semanas e desaparece em 2 a 4 semanas após suspender o indutor, quando os níveis voltam a subir.${y.efeito_reducao?' Risco: '+y.efeito_reducao:''}`,
        contra?'Usar DIU (cobre ou levonorgestrel) ou medroxiprogesterona injetável; manter por 4 semanas após suspender o indutor.':`Monitorar resposta${narrow?' e nível sérico':''}; pode ser preciso aumentar a dose de ${lc(y.nome)} e reduzi-la de novo 2 a 4 semanas após suspender ${lc(x.nome)}.`,'Farmacocinética',vn.some(([e])=>e==='UGT')?'UGT':vn.some(([e])=>e==='P-gp')?'P-gp':'CYP'); }
  };
  pk(a,b); pk(b,a);

  /* pares específicos prevalecem sobre regras genéricas do mesmo mecanismo */
  out.filter(x=>x.orig==='Par específico'&&!x.pk).forEach(p=>{ for(let i=out.length-1;i>=0;i--){ const x=out[i]; if(x.orig===PD&&x.canal===p.canal&&gRank(x.g)>=gRank(p.g)) out.splice(i,1); } });
  if(out.some(x=>x.orig==='Par específico'&&x.pk)) { for(let i=out.length-1;i>=0;i--) if(out[i].orig==='Farmacocinética') out.splice(i,1); }
  if(out.some(x=>x.orig==='Par específico'&&x.g==='contraindicada')) { for(let i=out.length-1;i>=0;i--) if(out[i].orig===PD&&out[i].canal==='MAO') out.splice(i,1); }
  const seen=new Set(); return out.filter(x=>{ const k=x.t; if(seen.has(k)) return false; seen.add(k); return true; }).sort((x,y)=>gRank(x.g)-gRank(y.g));
}

/* carga combinada de vários fármacos (verificador) */
const CANAIS_CARGA = [
  {k:'serotoninergico', t:'Carga serotoninérgica', lim:4, msg:'Três ou mais serotoninérgicos, ou soma alta, elevam o risco de síndrome serotoninérgica mesmo quando cada par parece aceitável.'},
  {k:'qt', t:'Prolongamento do QT', lim:4, conta:2, msg:'Dois ou mais fármacos com risco de QT moderado ou alto: ECG obrigatório e correção de potássio e magnésio.'},
  {k:'anticolinergico', t:'Carga anticolinérgica (escala ACB aproximada)', lim:3, msg:'Soma de 3 ou mais associa-se a declínio cognitivo, delirium, quedas e mortalidade em idosos.'},
  {k:'sedacao', t:'Sedação', lim:5, msg:'Sedação combinada alta: risco de quedas, acidentes e prejuízo cognitivo.'},
  {k:'depressao_respiratoria', t:'Depressão respiratória', lim:4, msg:'Vários depressores respiratórios: principal mecanismo das mortes por sobredose combinada.'},
  {k:'hipotensao', t:'Hipotensão ortostática', lim:4, msg:'Hipotensão combinada: síncope e quedas; titular um de cada vez.'},
  {k:'convulsao', t:'Redução do limiar convulsivo', lim:4, msg:'Soma de fármacos pró-convulsivantes: usar doses mínimas e evitar em fatores de risco.'},
  {k:'sangramento', t:'Risco de sangramento', lim:4, msg:'Vários fármacos que afetam a hemostasia: proteção gástrica e vigilância.'},
  {k:'metabolico', t:'Risco metabólico', lim:4, msg:'Somação de efeitos metabólicos: monitorização intensiva de peso, glicemia e lipídios.'},
  {k:'prolactina', t:'Prolactina', lim:4, msg:'Hiperprolactinemia provável; perguntar sobre efeitos sexuais e menstruais.'},
  {k:'eps', t:'Sintomas extrapiramidais', lim:4, msg:'Somação de EPS e risco de discinesia tardia.'}
];
const MARC_CARGA = [
  ['antagonista_d2','Bloqueadores D2 (antipsicóticos e antieméticos)',2,'Polifarmácia antipsicótica ou antiemético D2 associado: mais EPS, prolactina e síndrome neuroléptica maligna.'],
  ['hiponatremia','Risco de hiponatremia',2,'Dosar sódio em 2 a 4 semanas, sobretudo em idosos.'],
  ['bradicardia','Bradicardia',2,'FC e ECG; risco de síncope.'],
  ['hepatotoxico','Hepatotoxicidade',2,'Transaminases periódicas.'],
  ['mielotoxico','Mielotoxicidade',2,'Hemograma frequente.'],
  ['agonista_gaba_a','Benzodiazepínicos e drogas Z',2,'Duplicidade de agonistas GABA-A.'],
  ['pressor','Efeito pressor',2,'Aferir PA e FC.']
];
function cargaCombinada(fs){
  const linhas=[];
  CANAIS_CARGA.forEach(c=>{ const ct=fs.map(f=>[f,nv(f,c.k)]).filter(([,v])=>v>0); if(ct.length<2) return;
    const tot=ct.reduce((s,[,v])=>s+v,0); const n2=ct.filter(([,v])=>v>=2).length;
    const alerta=tot>=c.lim||(c.conta&&n2>=c.conta);
    linhas.push({t:c.t,ct,tot,alerta,msg:c.msg}); });
  MARC_CARGA.forEach(([m,t,lim,msg])=>{ const ct=fs.filter(f=>arr(f.marcadores).includes(m)).map(f=>[f,1]); if(ct.length<2) return; linhas.push({t,ct,tot:ct.length,alerta:ct.length>=lim,msg,conta:true}); });
  linhas.sort((x,y)=>(y.alerta-x.alerta)||(y.tot-x.tot));
  return linhas;
}
/* mapa metabólico da combinação: quem aumenta e quem reduz cada fármaco */
function mapaMetabolico(fs){
  const linhas=[];
  fs.forEach(y=>{ const Y=pkOf(y); const up=[], down=[];
    fs.forEach(x=>{ if(x===y) return; const X=pkOf(x);
      Object.entries(X.i).forEach(([e,f])=>{ if(f!=='w'&&Y.s[e]&&Y.s[e]!=='m') up.push(`${x.nome} (${ENZN(e)}, ${FTXT[f]})`); });
      Object.entries(X.n).forEach(([e,f])=>{ if(f!=='w'&&Y.s[e]&&Y.s[e]!=='m') down.push(`${x.nome} (${ENZN(e)}, ${FTXT[f]})`); }); });
    if(up.length||down.length) linhas.push({f:y,up,down,vias:Object.entries(Y.s).filter(([,v])=>v!=='m').map(([e,v])=>ENZN(e)+(v==='p'?' principal':''))});
  });
  return linhas;
}

/* ---------- BUSCA ---------- */
const IDX = F.map(f=>{
  const campos = [
    ['Nome', f.nome], ['Nome comercial', arr(f.nomes_comerciais).join(' · ')], ['Classe', clsName(f.classe)+' '+(f.subclasse||'')],
    ['Indicação', arr(f.indicacoes).map(i=>i.condicao+(i.grupo&&norm(i.grupo)!==norm(i.condicao)?' ('+i.grupo+')':'')).join(' · ')],
    ['Efeito adverso', [].concat(...['muito_comuns','comuns','raros_graves'].map(k=>arr((f.efeitos_adversos||{})[k]))).join(' · ')],
    ['Sinônimo', arr(f.sinonimos).join(' ')]
  ];
  return {f, campos: campos.map(([l,v])=>[l,String(v||''),norm(v)])};
});
function buscar(q){
  const nq=norm(q).trim(); if(!nq) return F.map(f=>({f,score:0}));
  const terms=nq.split(/\s+/);
  const res=[];
  IDX.forEach(({f,campos})=>{
    let score=0, why=null;
    const ok = terms.every(t=>campos.some(c=>c[2].includes(t)));
    if(!ok) return;
    campos.forEach(([l,v,n],i)=>{ if(n.includes(nq)){ const w=[100,80,40,30,20,60][i]+(n.startsWith(nq)?20:0); if(w>score){score=w; if(i>=2&&i!==5){ const parts=v.split(' · '); const hit=parts.find(p=>norm(p).includes(nq)); why=l+': '+(hit||v).slice(0,90);} else why=null; } } });
    if(!score) score=10;
    res.push({f,score,why});
  });
  return res.sort((a,b)=>b.score-a.score||a.f.nome.localeCompare(b.f.nome,'pt'));
}

/* ---------- LAYOUT ---------- */
const NAV=[['inicio','Início'],['lista','Fármacos'],['condicoes','Condições'],['comparar','Comparar'],['interacoes','Interações'],['equivalencias','Equivalências'],['trocas','Trocas'],['favoritos','Favoritos'],['sobre','Sobre']];
function shell(){
  app.innerHTML = `
  <header class="top noprint">
    <div class="top-in">
      <a class="brand" href="#inicio" aria-label="Guia de Psicofármacos, início">
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#fff" stroke="var(--line)"/><path d="M8.6 11.6h7.6v8.8H8.6a4.4 4.4 0 0 1 0-8.8z" fill="#035D51"/><rect x="16.2" y="11.6" width="10.1" height="8.8" fill="#1967CD"/></svg>
        <span><b>Guia de Psicofármacos</b><small>consulta clínica rápida</small></span>
      </a>
      <div class="search">${I.search}<input id="q" type="search" placeholder="Buscar por fármaco, nome comercial, classe, indicação ou efeito adverso" autocomplete="off" aria-label="Buscar"></div>
      <button class="iconbtn" id="tema" aria-label="Alternar modo escuro"></button>
    </div>
    <nav class="nav" id="nav">${NAV.map(([k,l])=>`<a href="#${k}" data-k="${k}">${l}${k==='comparar'?' <span class="mono" id="ncmp"></span>':''}${k==='interacoes'?' <span class="mono" id="nitx"></span>':''}</a>`).join('')}</nav>
  </header>
  <main id="main"></main>
  <div class="aviso noprint" role="note">Ferramenta de apoio à decisão clínica. Não substitui a bula, o julgamento clínico nem as diretrizes vigentes.</div>`;
  const q=document.getElementById('q');
  q.addEventListener('input',()=>{ S.q=q.value; if(route().v!=='lista') location.hash='lista'; else renderLista(); });
  q.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const r=buscar(q.value); if(r.length===1) location.hash='ficha-'+r[0].f.id; }});
  const tb=document.getElementById('tema');
  const setIcon=()=>{ tb.innerHTML = curTheme()==='dark'?I.sun:I.moon; };
  setIcon();
  tb.addEventListener('click',()=>{ const n=curTheme()==='dark'?'light':'dark'; applyTheme(n); store.set('tema',n); setIcon(); });
  document.addEventListener('keydown',e=>{ if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){ e.preventDefault(); q.focus(); } });
}
function counters(){ const a=document.getElementById('ncmp'), b=document.getElementById('nitx'); if(a) a.textContent=S.cmp.length?`(${S.cmp.length})`:''; if(b) b.textContent=S.itx.length?`(${S.itx.length})`:''; }
function route(){ const h=decodeURIComponent(location.hash.slice(1)); if(!h) return {v:'inicio'}; const i=h.indexOf('-'); return i<0?{v:h}:{v:h.slice(0,i),arg:h.slice(i+1)}; }
function render(){
  const r=route(); const M=document.getElementById('main');
  document.querySelectorAll('#nav a').forEach(a=>{ const on = a.dataset.k===r.v || (r.v==='condicao'&&a.dataset.k==='condicoes') || (r.v==='ficha'&&a.dataset.k==='lista') || (r.v==='classe'&&a.dataset.k==='lista'); if(on) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  counters();
  if(r.v==='ficha'&&byId[r.arg]) renderFicha(byId[r.arg]);
  else if(r.v==='lista') renderLista();
  else if(r.v==='classe'){ S.filtros.classe=r.arg||''; S.q=''; document.getElementById('q').value=''; location.replace('#lista'); return; }
  else if(r.v==='condicoes') renderCondicoes();
  else if(r.v==='condicao') renderCondicao(r.arg);
  else if(r.v==='comparar') renderComparar();
  else if(r.v==='interacoes') renderInteracoes();
  else if(r.v==='equivalencias') renderEquiv();
  else if(r.v==='trocas') renderTrocas();
  else if(r.v==='favoritos') renderFavoritos();
  else if(r.v==='sobre') renderSobre();
  else renderInicio();
  if(r.v!=='lista') window.scrollTo(0,0);
  document.title = r.v==='ficha'&&byId[r.arg] ? byId[r.arg].nome+' · Guia de Psicofármacos' : 'Guia de Psicofármacos';
}

/* ---------- INÍCIO ---------- */
function renderInicio(){
  const M=document.getElementById('main');
  const n = F.length, nc=D.classes.length;
  const cont = id => F.filter(f=>f.classe===id||arr(f.classes_secundarias).includes(id)).length;
  M.innerHTML = `
  <section class="hero">
    <div><div class="eyebrow">Psicofarmacologia clínica · Brasil</div>
      <h1>Doses, interações, efeitos adversos e trocas, na mesa do consultório e da enfermaria.</h1>
      <p>Fichas padronizadas dos psicofármacos disponíveis no Brasil, com mecanismo, farmacocinética, prescrição, populações especiais, suspensão e superdosagem. Pressione <span class="mono">/</span> para buscar.</p></div>
    <div class="stats"><div><b>${n}</b>fichas</div><div><b>${nc}</b>classes</div><div><b>${arr(D.pares).length}</b>pares de interação</div></div>
  </section>
  <div class="classes">${D.classes.map(c=>`<a class="ccard" href="#classe-${c.id}" style="--cc:var(--c-${c.cor})"><span class="n">${cont(c.id)} fármacos</span><h3>${esc(c.nome)}</h3><p>${esc(c.resumo||'')}</p></a>`).join('')}</div>
  <div class="tools">
    <a class="tool" href="#condicoes">${I.search}<div><b>Condições e usos clínicos</b><span>${Object.keys(COND).length} condições, com usos fora de bula e grau de evidência</span></div></a>
    <a class="tool" href="#interacoes">${I.alert}<div><b>Verificar interações</b><span>Dois ou mais fármacos, por gravidade</span></div></a>
    <a class="tool" href="#comparar">${I.cols}<div><b>Comparar lado a lado</b><span>Até quatro fármacos, com radar de efeitos</span></div></a>
    <a class="tool" href="#equivalencias">${I.scale}<div><b>Equivalência de doses</b><span>Antipsicóticos, benzodiazepínicos, antidepressivos</span></div></a>
    <a class="tool" href="#trocas">${I.swap}<div><b>Guia de trocas</b><span>Antidepressivos e antipsicóticos</span></div></a>
  </div>
  ${S.fav.size?`<h2 class="sec">Favoritos</h2>${listaHTML([...S.fav].filter(id=>byId[id]).map(id=>({f:byId[id]})))}`:''}`;
}

/* ---------- LISTA ---------- */
function indicacoesTodas(){ const m=new Map(); F.forEach(f=>arr(f.indicacoes).forEach(i=>{ const k=norm(i.grupo||i.condicao); if(!m.has(k)) m.set(k,i.grupo||i.condicao); })); return [...m.values()].sort((a,b)=>a.localeCompare(b,'pt')); }
const AE_FILT=[['sedacao','Pouca sedação'],['peso','Pouco ganho de peso'],['sexual','Pouca disfunção sexual'],['anticolinergico','Baixa carga anticolinérgica'],['qt','Baixo risco de QT'],['eps','Poucos sintomas extrapiramidais'],['prolactina','Pouca hiperprolactinemia'],['metabolico','Baixo risco metabólico'],['hipotensao','Pouca hipotensão']];
const POPS=[['gestacao','Gestação'],['lactacao','Lactação'],['idosos','Idosos'],['pediatria','Crianças e adolescentes'],['renal','Insuficiência renal'],['hepatica','Insuficiência hepática'],['cardiopatas','Cardiopatas']];
function listaHTML(rs, agrupar){
  if(!rs.length) return '<div class="drug-list"><div class="empty">Nenhum fármaco encontrado. Tente o nome genérico, um nome comercial ou uma indicação.</div></div>';
  let h='<div class="drug-list">'; let g=null;
  rs.forEach(({f,why})=>{
    if(agrupar){ const k=clsName(f.classe)+(subBase(f)?' · '+subBase(f):''); if(k!==g){ g=k; h+=`<div class="grp-h">${esc(k)}</div>`; } }
    const ap=arr(f.apresentacoes)[0];
    h+=`<a class="drow" href="#ficha-${f.id}"><span class="pill-mini">${pillSVG(ap,true)}</span><div><h3>${esc(f.nome)} ${S.fav.has(f.id)?`<span class="star" aria-label="favorito" style="width:14px;height:14px;display:inline-block">${I.star}</span>`:''} ${f.comercializacao&&f.comercializacao!=='disponivel'?'<span class="badge warn">'+esc(f.comercializacao==='nao_comercializado'?'não comercializado no Brasil':'disponibilidade restrita')+'</span>':''}</h3>
      <div class="meta">${agrupar?(f.subclasse!==subBase(f)?`<span>${esc(f.subclasse.replace(subBase(f),'').trim().replace(/^\(|\)$/g,''))}</span>`:''):clsChip(f)}<span>${esc(arr(f.nomes_comerciais).slice(0,3).join(', '))}</span></div>${why?`<div class="why">${esc(why)}</div>`:''}</div>
      <div class="side">${f.receita?`<span class="badge rec">${esc(f.receita)}</span>`:''}${f.rename?'<span class="badge ok">RENAME</span>':''}</div></a>`;
  });
  return h+'</div>';
}
function renderLista(){
  const M=document.getElementById('main');
  const fl=S.filtros;
  let rs = buscar(S.q);
  if(fl.classe) rs=rs.filter(({f})=>f.classe===fl.classe||arr(f.classes_secundarias).includes(fl.classe));
  if(fl.indicacao) rs=rs.filter(({f})=>arr(f.indicacoes).some(i=>norm(i.grupo||i.condicao)===norm(fl.indicacao)));
  if(fl.pop) rs=rs.filter(({f})=>{ const p=((f.populacoes||{})[fl.pop]||{}).nivel; return p==='preferencial'||p==='aceitavel'; });
  fl.ae.forEach(k=>{ rs=rs.filter(({f})=>((f.perfil||{})[k]||0)<=1); });
  const agrupar = !S.q;
  if(agrupar){ const ord=Object.fromEntries(D.classes.map((c,i)=>[c.id,i])); rs.sort((a,b)=>(ord[a.f.classe]-ord[b.f.classe])||(SUBORD[a.f.classe+'|'+subBase(a.f)]-SUBORD[b.f.classe+'|'+subBase(b.f)])||a.f.nome.localeCompare(b.f.nome,'pt')); }
  const focused = document.activeElement && document.activeElement.id;
  const titulo = fl.classe? clsName(fl.classe) : S.q? `Resultados para “${esc(S.q)}”` : 'Todos os fármacos';
  const ativos = (fl.classe?1:0)+(fl.indicacao?1:0)+(fl.pop?1:0)+fl.ae.length;
  const cdesc = fl.classe && CL[fl.classe] ? CL[fl.classe] : null;
  M.innerHTML = `<div class="lista-wrap">
    <aside class="filtros" id="filtros" aria-label="Filtros">
      <fieldset><legend class="eyebrow">Classe</legend><select id="f-classe"><option value="">Todas</option>${D.classes.map(c=>`<option value="${c.id}" ${fl.classe===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></fieldset>
      <fieldset><legend class="eyebrow">Indicação</legend><select id="f-ind"><option value="">Todas</option>${indicacoesTodas().map(i=>`<option ${norm(fl.indicacao)===norm(i)?'selected':''}>${esc(i)}</option>`).join('')}</select></fieldset>
      <fieldset><legend class="eyebrow">População especial</legend><select id="f-pop"><option value="">Nenhuma</option>${POPS.map(([k,l])=>`<option value="${k}" ${fl.pop===k?'selected':''}>${l}: preferencial ou aceitável</option>`).join('')}</select></fieldset>
      <fieldset><legend class="eyebrow">Perfil de efeitos adversos</legend>${AE_FILT.map(([k,l])=>`<label><input type="checkbox" id="ae-${k}" value="${k}" ${fl.ae.includes(k)?'checked':''}> ${l}</label>`).join('')}</fieldset>
      ${ativos?'<button class="btn" id="f-limpar">Limpar filtros</button>':''}
    </aside>
    <section>
      <div class="res-head"><h1>${titulo}</h1><div style="display:flex;gap:8px;align-items:center"><span class="muted small">${rs.length} ${rs.length===1?'fármaco':'fármacos'}</span><button class="btn filtros-toggle" id="ftog">Filtros${ativos?` (${ativos})`:''}</button></div></div>
      ${S.q?condSugestao(S.q):''}
      ${cdesc?`<div class="panel" style="margin-bottom:14px"><p style="margin:0 0 10px;max-width:80ch">${md(cdesc.descricao||cdesc.resumo||'')}</p>${sinapseSVG(cdesc.diagrama)}</div>`:''}
      ${listaHTML(rs, agrupar)}
    </section></div>`;
  const re=()=>renderLista();
  document.getElementById('f-classe').onchange=e=>{fl.classe=e.target.value;re();};
  document.getElementById('f-ind').onchange=e=>{fl.indicacao=e.target.value;re();};
  document.getElementById('f-pop').onchange=e=>{fl.pop=e.target.value;re();};
  AE_FILT.forEach(([k])=>{ document.getElementById('ae-'+k).onchange=e=>{ fl.ae = e.target.checked ? [...fl.ae,k] : fl.ae.filter(x=>x!==k); re(); }; });
  const lp=document.getElementById('f-limpar'); if(lp) lp.onclick=()=>{ S.filtros={classe:'',indicacao:'',pop:'',ae:[]}; re(); };
  document.getElementById('ftog').onclick=()=>document.getElementById('filtros').classList.toggle('open');
  if(ativos && window.innerWidth<900 && S._fopen) document.getElementById('filtros').classList.add('open');
  document.getElementById('filtros').addEventListener('change',()=>{S._fopen=true;});
  if(focused==='q') document.getElementById('q').focus();
}

/* ---------- USOS CLÍNICOS E CONDIÇÕES ---------- */
const PAPEL_T={'1':'Primeira linha','2':'Segunda linha','P':'Potencialização ou associação','A':'Alternativa','S':'Adjuvante ou sintomático','U':'Casos refratários','X':'Não recomendado'};
const PAPEL_ORD=['1','2','P','A','S','U','X'];
const EVID_T={A:'Evidência alta',B:'Evidência moderada',C:'Evidência baixa',D:'Relatos e opinião'};
const EVID_D={A:'metanálises ou vários ensaios controlados consistentes',B:'ensaios controlados limitados ou resultados mistos',C:'estudos pequenos, abertos ou séries de casos',D:'relatos de casos ou opinião de especialistas'};
const slugCond=g=>norm(g).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const COND={}; F.forEach(f=>arr(f.indicacoes).forEach(u=>{ [u.grupo].concat(arr(u.tambem)).filter(Boolean).forEach(g=>{ (COND[g]=COND[g]||[]).push({f,u}); }); }));
const COND_SLUG=Object.fromEntries(Object.keys(COND).map(g=>[slugCond(g),g]));
const uOrd=(a,b)=>(PAPEL_ORD.indexOf(a.papel||'A')-PAPEL_ORD.indexOf(b.papel||'A'))||((a.evidencia||'D').localeCompare(b.evidencia||'D'));
function usoBadges(u,comGrupo){
  return `<span class="ub st ${u.status==='anvisa'?'anv':'off'}">${u.status==='anvisa'?'Anvisa':'Fora de bula'}</span>${u.papel?`<span class="ub pp p${u.papel}">${esc(PAPEL_T[u.papel])}</span>`:''}${u.evidencia?`<span class="ub ev e${u.evidencia}" title="${esc(EVID_D[u.evidencia])}">${esc(EVID_T[u.evidencia])}</span>`:''}${comGrupo&&u.grupo&&COND[u.grupo]&&COND[u.grupo].length>1?`<a class="ub cg" href="#condicao-${slugCond(u.grupo)}">${esc(u.grupo)} · ${COND[u.grupo].length} fármacos</a>`:''}`;
}
function usosFicha(f){
  const us=arr(f.indicacoes); if(!us.length) return '';
  const bloco=(t,l)=>l.length?`<h3>${t} <span class="muted small">${l.length}</span></h3><div class="usos">${l.slice().sort(uOrd).map(u=>`<div class="uso ${u.papel==='X'?'neg':''}"><div class="uso-h"><b>${esc(u.condicao)}</b>${u.dose?`<span class="uso-d">${esc(u.dose)}</span>`:''}</div><div class="uso-b">${usoBadges(u,true)}</div>${u.discussao||u.nota?`<p>${md(u.discussao||u.nota)}</p>`:''}</div>`).join('')}</div>`:'';
  const pos=us.filter(u=>u.papel!=='X');
  return `<p class="small muted" style="margin:0 0 6px">Papel na conduta e grau de evidência de cada uso. Toque na condição para comparar todos os fármacos usados nela.</p>`+bloco('Aprovados pela Anvisa',pos.filter(u=>u.status==='anvisa'))+bloco('Fora de bula',pos.filter(u=>u.status!=='anvisa'))+bloco('Usos não recomendados ou com evidência negativa',us.filter(u=>u.papel==='X'));
}
function condSugestao(q){ const nq=norm(q).trim(); if(nq.length<3) return ''; const gs=Object.keys(COND).filter(g=>norm(g).includes(nq)||norm(g+' '+((D.condicoes||{})[g]||{}).resumo).split(/\s+/).some(w=>w===nq)); const gs2=Object.keys(COND).filter(g=>norm(g).includes(nq)); if(!gs2.length) return ''; return `<div class="panel cond-sug"><span class="small muted">Condições:</span> ${gs2.map(g=>`<a class="fchip" href="#condicao-${slugCond(g)}">${esc(g)} · ${COND[g].length}</a>`).join(' ')}</div>`; }
function renderCondicoes(){
  const M=document.getElementById('main'); const DC=D.condicoes||{};
  const area=g=>(DC[g]||{}).area||(g==='Outros'?'Outros usos':'Outras condições');
  const AO=['Humor','Ansiedade','Sono','Psicose','Emergência','Personalidade','Comportamento','Neurodesenvolvimento','Neurocognitivo','Substâncias','Alimentar','Dor','Efeitos adversos','Outras condições','Outros usos'];
  const grupos={}; Object.keys(COND).forEach(g=>{ (grupos[area(g)]=grupos[area(g)]||[]).push(g); });
  const tot=Object.values(COND).reduce((s,l)=>s+l.length,0);
  M.innerHTML=`<div class="page-h"><h1>Condições e usos clínicos</h1><p>${tot} usos clínicos de ${F.length} fármacos, organizados em ${Object.keys(COND).length} condições. Cada condição reúne os fármacos usados nela, com o papel na conduta (primeira linha, segunda linha, potencialização, alternativa, casos refratários) e o grau de evidência, incluindo usos fora de bula e usos que as evidências desaconselham.</p></div>
   <div class="cfiltro"><input id="cq" type="search" placeholder="Filtrar condições (ex.: TOC, borderline, agressividade)" aria-label="Filtrar condições"></div>
   <div class="carea-wrap">${AO.filter(a=>grupos[a]).map(a=>`<section class="carea"><h2 class="eyebrow">${esc(a)}</h2><div class="clist">${grupos[a].sort((x,y)=>x.localeCompare(y,'pt')).map(g=>{ const l=COND[g]; const off=l.filter(x=>x.u.status!=='anvisa').length; return `<a class="citem" href="#condicao-${slugCond(g)}" data-n="${esc(norm(g))}"><b>${esc(g)}</b><span class="small muted">${l.length} fármacos${off?` · ${off} fora de bula`:''}</span></a>`; }).join('')}</div></section>`).join('')}</div>`;
  const cq=document.getElementById('cq'); cq.addEventListener('input',()=>{ const v=norm(cq.value); M.querySelectorAll('.citem').forEach(a=>{ a.hidden=!!v&&!a.dataset.n.includes(v); }); M.querySelectorAll('.carea').forEach(sec=>{ sec.hidden=![...sec.querySelectorAll('.citem')].some(a=>!a.hidden); }); });
}
function renderCondicao(slug){
  const M=document.getElementById('main'); const g=COND_SLUG[slug]; if(!g){ renderCondicoes(); return; }
  const l=COND[g].slice().sort((a,b)=>uOrd(a.u,b.u)||a.f.nome.localeCompare(b.f.nome,'pt'));
  const info=(D.condicoes||{})[g]||{};
  const porPapel=PAPEL_ORD.map(p=>[p,l.filter(x=>(x.u.papel||'A')===p)]).filter(([,x])=>x.length);
  const L=x=>arr(x).length?`<ul class="cl">${arr(x).map(t=>`<li>${md(t)}</li>`).join('')}</ul>`:'';
  const blocos=[];
  if(arr(info.avaliacao).length) blocos.push(['avaliacao','Antes de prescrever',L(info.avaliacao)]);
  if(arr(info.nao_farmacologico).length) blocos.push(['naofarm','Abordagem não farmacológica',L(info.nao_farmacologico)]);
  if(arr(info.etapas).length) blocos.push(['etapas','Sequência de tratamento',`<ol class="etapas">${info.etapas.map(e=>`<li><b>${esc(e.titulo)}</b><p>${md(e.texto)}</p></li>`).join('')}</ol>`]);
  if(arr(info.escolha).length) blocos.push(['escolha','Como escolher entre os fármacos',`<div class="scroll-x"><table class="itable esc"><thead><tr><th>Situação</th><th>Preferir</th><th>Evitar</th></tr></thead><tbody>${info.escolha.map(e=>`<tr><td><b>${esc(e.se)}</b></td><td class="pref">${esc(e.preferir||'')}</td><td class="evit">${esc(e.evitar||'·')}</td></tr>`).join('')}</tbody></table></div>`]);
  if(arr(info.populacoes).length) blocos.push(['populacoes','Populações especiais',`<div class="pop">${info.populacoes.map(p=>`<div class="popc"><h4>${esc(p.grupo)}</h4><p>${md(p.texto)}</p></div>`).join('')}</div>`]);
  if(info.duracao) blocos.push(['duracao','Duração e retirada',`<p class="cond-p">${md(info.duracao)}</p>`]);
  if(arr(info.armadilhas).length) blocos.push(['armadilhas','Armadilhas comuns',`<div class="callout">${L(info.armadilhas)}</div>`]);
  if(arr(info.monitorar).length) blocos.push(['monitorar','Monitorização',`<p class="cond-p">${arr(info.monitorar).map(esc).join(' · ')}</p>`]);
  const toc=blocos.map(([id,t])=>[id,t]).concat([['farmacos','Fármacos ('+l.length+')']]).concat(info.diretrizes?[['diretrizes','Diretrizes']]:[]);
  M.innerHTML=`<p class="small" style="margin:0 0 6px"><a href="#condicoes">Condições</a>${info.area?' · '+esc(info.area):''}</p>
   <div class="page-h"><h1>${esc(g)}</h1>${info.resumo?`<p class="cond-res">${md(info.resumo)}</p>`:''}</div>
   <nav class="sel ctoc" aria-label="Seções">${toc.map(([id,t])=>`<a class="fchip" href="#condicao-${slug}" data-ir="c-${id}">${esc(t)}</a>`).join('')}</nav>
   ${blocos.map(([id,t,h])=>`<section class="cbloco" id="c-${id}"><h2 class="itx-h">${esc(t)}</h2>${h}</section>`).join('')}
   <section class="cbloco" id="c-farmacos"><h2 class="itx-h">Fármacos usados nesta condição</h2>
   <div class="sel">${porPapel.map(([p,x])=>`<a class="fchip" href="#condicao-${slug}" data-ir="p-${p}">${esc(PAPEL_T[p])} · ${x.length}</a>`).join('')}</div>
   ${porPapel.map(([p,x])=>`<section class="cpapel" id="p-${p}"><h3 class="cp-h">${esc(PAPEL_T[p])}</h3><div class="usos">${x.map(({f,u})=>`<div class="uso ${p==='X'?'neg':''}"><div class="uso-h"><a href="#ficha-${f.id}"><b>${esc(f.nome)}</b></a><span class="small muted">${esc(u.condicao)}</span>${u.dose?`<span class="uso-d">${esc(u.dose)}</span>`:''}</div><div class="uso-b">${clsChip(f)}${usoBadges(u,false)}</div>${u.discussao||u.nota?`<p>${md(u.discussao||u.nota)}</p>`:''}</div>`).join('')}</div></section>`).join('')}</section>
   ${info.diretrizes?`<section class="cbloco" id="c-diretrizes"><h2 class="itx-h">Diretrizes e referências</h2><p class="cond-p">${md(info.diretrizes)}</p></section>`:''}
   <p class="small muted" style="margin-top:14px">Graus de evidência: ${Object.entries(EVID_T).map(([k,v])=>`<b>${v.replace('Evidência ','')}</b> (${EVID_D[k]})`).join('; ')}.</p>`;
  M.querySelectorAll('[data-ir]').forEach(a=>a.onclick=e=>{ e.preventDefault(); document.getElementById(a.dataset.ir).scrollIntoView({behavior:'smooth',block:'start'}); });
  document.title=g+' · Guia de Psicofármacos';
}

/* ---------- FICHA ---------- */
const SECOES=[['identificacao','Identificação'],['mecanismo','Mecanismo de ação'],['farmacocinetica','Farmacocinética'],['interacoes','Interações'],['indicacoes','Indicações'],['prescricao','Como prescrever'],['adversos','Efeitos adversos'],['populacoes','Contraindicações e populações'],['suspensao','Suspensão e troca'],['superdosagem','Superdosagem'],['pratica','Aspectos práticos']];
function notaClasse(f,sec){ const c=CL[f.classe]; const n=c&&c.notas&&c.notas[sec]; return n?`<div class="nota-classe"><b>Da classe (${esc(c.nome)}):</b> ${md(n)}</div>`:''; }
function kv(pares){ const p=pares.filter(([,v])=>v!=null&&v!==''&&!(Array.isArray(v)&&!v.length)); return p.length?'<div class="kv">'+p.map(([k,v])=>`<div>${k}</div><div>${Array.isArray(v)?v.map(md).join('<br>'):md(v)}</div>`).join('')+'</div>':''; }
function autoInter(f){
  const res=[];
  TODOS.forEach(o=>{ if(o.id===f.id||o.ficha_ligada===f.id||f.ficha_ligada===o.id) return;
    const r=interacoesPar(f,o); if(r.length) res.push({o,r,g:gRank(r[0].g)}); });
  if(!res.length) return '';
  res.sort((a,b)=>a.g-b.g||a.o.nome.localeCompare(b.o.nome,'pt'));
  const nm=o=>o.clinico?`<b>${esc(o.nome)}</b><div class="small muted">${esc(o.grupo||'')}</div>`:`<b><a href="#ficha-${o.id}">${esc(o.nome)}</a></b><div class="small muted">${esc(clsName(o.classe))}</div>`;
  const top=[], grp={}; res.forEach(x=>x.r.forEach(i=>{ if(gRank(i.g)>1) return; const k=i.g+'|'+i.t+'|'+i.c; if(grp[k]) grp[k].os.push(x.o); else { grp[k]={os:[x.o],i}; top.push(grp[k]); } }));
  const nms=os=>os.length===1?nm(os[0]):os.map(o=>o.clinico?esc(o.nome):`<a href="#ficha-${o.id}">${esc(o.nome)}</a>`).join(', ');
  const menores=g=>res.filter(x=>x.g===g);
  const li=x=>`<li><b>${x.o.clinico?esc(x.o.nome):`<a href="#ficha-${x.o.id}">${esc(x.o.nome)}</a>`}</b>: ${x.r.filter(i=>gRank(i.g)===x.g).map(i=>esc(i.t)).join('; ')}</li>`;
  const mod=menores(2), lev=menores(3);
  return `<h3>Cruzamento automático com o catálogo</h3><p class="small muted" style="margin:0 0 8px">Resultado das regras do verificador aplicadas a ${TODOS.length-1} psicofármacos, fármacos clínicos e substâncias. ${res.filter(x=>x.g<=1).length} fármaco${res.filter(x=>x.g<=1).length===1?'':'s'} com alerta contraindicado ou grave, ${mod.length} com gravidade moderada e ${lev.length} leve${lev.length===1?'':'s'}.</p>`+
    (top.length?`<div class="scroll-x"><table class="itable auto"><thead><tr><th>Gravidade</th><th>Com</th><th>O que acontece</th><th>Conduta</th></tr></thead><tbody>${top.map(({os,i})=>`<tr><td><span class="sev ${esc(i.g)}">${esc(i.g)}</span></td><td>${nms(os)}</td><td><b>${esc(i.t)}</b><div class="small muted">${md(i.m)}</div></td><td>${md(i.c)}</td></tr>`).join('')}</tbody></table></div>`:'')+
    (mod.length?`<details class="auto-d"><summary>Moderadas (${mod.length})</summary><ul class="auto-l">${mod.map(li).join('')}</ul></details>`:'')+
    (lev.length?`<details class="auto-d"><summary>Leves (${lev.length})</summary><ul class="auto-l">${lev.map(li).join('')}</ul></details>`:'');
}
function resumoClinico(f){
  const c=f.clinica; if(!c) return '';
  const bloco=(t,l,cls)=>arr(l).length?`<div class="rc-b ${cls}"><h3>${t}</h3>${lista(l)}</div>`:'';
  return `<section class="fsec resumo-cl" id="s-resumo"><h2><span class="num">··</span>Em resumo</h2>${arr(c.resumo).length?`<ul class="rc-top">${arr(c.resumo).map(x=>`<li>${md(x)}</li>`).join('')}</ul>`:''}<div class="rc-grid">${bloco('Quando escolher',c.quando_escolher,'sim')}${bloco('Quando evitar',c.quando_evitar,'nao')}</div>${arr(c.monitorar).length?`<p class="small" style="margin:10px 0 0"><b>Monitorar:</b> ${arr(c.monitorar).map(md).join(' · ')}</p>`:''}</section>`;
}
function comparacoes(f){
  const c=arr((f.clinica||{}).comparacao); if(!c.length) return '';
  return '<h3>Comparado com</h3><div class="kv cmpv">'+c.map(x=>`<div>${x.id&&byId[x.id]?`<a href="#ficha-${x.id}">${esc(byId[x.id].nome)}</a>`:esc(x.com||x.id)}</div><div>${md(x.texto)}</div>`).join('')+'</div>';
}
function renderFicha(f){
  const M=document.getElementById('main');
  const fd=f.farmacodinamica||{}, fk=f.farmacocinetica||{}, pr=f.prescricao||{}, ea=f.efeitos_adversos||{}, po=f.populacoes||{}, su=f.suspensao||{}, od=f.superdosagem||{}, pt=f.pratica||{};
  const com = f.comercializacao && f.comercializacao!=='disponivel';
  const rel = arr(f.relacionados).filter(id=>byId[id]);
  const inCmp=S.cmp.includes(f.id), inItx=S.itx.includes(f.id), fav=S.fav.has(f.id);
  const sec=(id,n,t,body)=>`<section class="fsec" id="s-${id}"><h2><span class="num">${String(n).padStart(2,'0')}</span>${t}</h2>${body}</section>`;
  const inter = arr(f.interacoes).slice().sort((a,b)=>gRank(a.gravidade)-gRank(b.gravidade));
  M.innerHTML = `<div class="ficha">
   <nav class="toc" id="toc" aria-label="Seções da ficha">${(f.clinica?[['resumo','Em resumo']]:[]).concat(SECOES).map(([id,t])=>`<a href="#ficha-${f.id}" data-s="${id}">${t}</a>`).join('')}</nav>
   <article>
    <header class="fhead">
      <div><div class="tags" style="margin:0 0 8px">${clsChip(f)}${arr(f.classes_secundarias).map(c=>`<span class="chip cls" style="--cc:${clsColor(c)}"><span class="dot"></span>${esc(clsName(c))}</span>`).join('')}</div>
        <h1>${esc(f.nome)}</h1>
        <div class="brands">${esc(arr(f.nomes_comerciais).join(', '))}</div>
        <div class="tags">${f.receita?`<span class="badge rec" title="Tipo de receita">${esc(f.receita)}</span>`:''}${f.rename?`<span class="badge ok">RENAME${typeof f.rename==='string'?' · '+esc(f.rename):''}</span>`:'<span class="badge">fora da RENAME</span>'}${f.custo?`<span class="badge">custo ${esc(f.custo)}</span>`:''}</div>
        ${com?`<div class="alerta"><b>${f.comercializacao==='nao_comercializado'?'Não comercializado no Brasil.':'Disponibilidade restrita no Brasil.'}</b> ${md(f.nota_comercializacao||'')}</div>`:''}
        ${f.ficha_ligada&&byId[f.ficha_ligada]?`<p class="small" style="margin:10px 0 0">Formulação oral: <a href="#ficha-${f.ficha_ligada}">${esc(byId[f.ficha_ligada].nome)}</a></p>`:''}
        ${rel.length?`<p class="small" style="margin:6px 0 0">Fichas relacionadas: ${rel.map(id=>`<a href="#ficha-${id}">${esc(byId[id].nome)}</a>`).join(', ')}</p>`:''}
      </div>
      <div class="factions">
        <button class="btn ${fav?'on':''}" id="b-fav">${fav?I.star:I.staro}${fav?'Favorito':'Favoritar'}</button>
        <button class="btn ${inCmp?'on':''}" id="b-cmp">${I.cols}${inCmp?'Na comparação':'Comparar'}</button>
        <button class="btn ${inItx?'on':''}" id="b-itx">${I.alert}${inItx?'No verificador':'Interações'}</button>
        <button class="btn" id="b-pdf">${I.pdf}Exportar PDF</button>
      </div>
    </header>
    ${resumoClinico(f)}
    ${sec('identificacao',1,'Identificação e apresentações',
      kv([['Nome genérico',f.nome],['Nomes comerciais',arr(f.nomes_comerciais).join(', ')],['Classe',clsName(f.classe)+(f.subclasse?' · '+f.subclasse:'')],['Receita',f.receita_nota||f.receita],['SUS',f.sus]])+
      `<h3>Apresentações no Brasil</h3><div class="pres">${arr(f.apresentacoes).map(ap=>`<div class="pcard">${pillSVG(ap)}<div class="pf">${esc(ap.forma)}</div><div class="pd">${esc(arr(ap.doses).join(' · '))}</div>${ap.aparencia&&ap.aparencia.descricao?`<div class="pn">${md(ap.aparencia.descricao)}</div>`:''}</div>`).join('')}</div>
      <p class="small muted" style="margin-top:8px">Ilustração vetorial baseada na descrição da bula do medicamento de referência. Genéricos e similares podem ter forma e cor diferentes.</p>`)}
    ${sec('mecanismo',2,'Mecanismo de ação',
      notaClasse(f,'mecanismo')+`<p>${md(fd.resumo)}</p>`+(f.diagrama?sinapseSVG(f.diagrama):'')+afinidadeSVG(fd.afinidade)+(arr(fd.significado_clinico).length?'<h3>Significado clínico</h3>'+lista(fd.significado_clinico):''))}
    ${sec('farmacocinetica',3,'Farmacocinética',
      kv([['Absorção',fk.absorcao],['Biodisponibilidade',fk.biodisponibilidade],['Efeito da alimentação',fk.alimentos],['Pico plasmático',fk.pico],['Ligação a proteínas',fk.ligacao_proteica],['Metabolismo',fk.metabolismo],['Meia-vida',fk.meia_vida],['Metabólitos ativos',fk.metabolitos_ativos],['Excreção',fk.excrecao],['Estado de equilíbrio',fk.equilibrio],['Nível sérico',fk.nivel_serico]])+
      '<h3>Mapa metabólico</h3>'+cypHTML(fk))}
    ${sec('interacoes',4,'Interações medicamentosas',
      notaClasse(f,'interacoes')+(inter.length?`<h3>Principais interações</h3><div class="scroll-x"><table class="itable"><thead><tr><th>Gravidade</th><th>Com</th><th>Efeito</th><th>Conduta</th></tr></thead><tbody>${inter.map(i=>`<tr><td><span class="sev ${esc(i.gravidade)}">${esc(i.gravidade)}</span></td><td><b>${md(i.com)}</b></td><td>${md(i.efeito)}</td><td>${md(i.conduta)}</td></tr>`).join('')}</tbody></table></div>`:'')+
      autoInter(f)+`<p class="small muted" style="margin-top:10px">Para combinar três ou mais fármacos, use o <a href="#interacoes">verificador de interações</a>.</p>`)}
    ${sec('indicacoes',5,'Indicações e usos clínicos',usosFicha(f))}
    ${sec('prescricao',6,'Como prescrever',
      notaClasse(f,'prescricao')+kv([['Dose inicial',pr.dose_inicial],['Faixa habitual',pr.faixa],['Dose máxima',pr.dose_maxima],['Titulação',pr.titulacao],['Horário',pr.horario],['Tempo até o efeito',pr.latencia],['Duração',pr.duracao]])+titulacaoSVG(pr.esquema)+(arr(pr.monitoramento).length?'<h3>Monitoramento</h3>'+lista(pr.monitoramento):''))}
    ${sec('adversos',7,'Efeitos adversos',
      notaClasse(f,'adversos')+perfilBars(f.perfil)+
      `<div class="cols2"><div>${arr(ea.muito_comuns).length?'<h3>Muito comuns (≥ 10%)</h3>'+lista(ea.muito_comuns):''}${arr(ea.comuns).length?'<h3>Comuns (1 a 10%)</h3>'+lista(ea.comuns):''}</div><div>${arr(ea.raros_graves).length?'<h3>Raros ou graves</h3>'+lista(ea.raros_graves):''}</div></div>`+
      (arr(ea.conduta_imediata).length?`<div class="callout"><h3>Exigem conduta imediata</h3>${lista(ea.conduta_imediata)}</div>`:'')+
      (arr(ea.manejo).length?`<h3>Manejo dos mais comuns</h3><div class="kv">${arr(ea.manejo).map(m=>`<div>${esc(m.efeito)}</div><div>${md(m.conduta)}</div>`).join('')}</div>`:''))}
    ${sec('populacoes',8,'Contraindicações, precauções e populações especiais',
      (arr(f.contraindicacoes).length?`<div class="callout"><h3>Contraindicações</h3>${lista(f.contraindicacoes)}</div>`:'')+
      (arr(f.precaucoes).length?'<h3>Precauções</h3>'+lista(f.precaucoes):'')+
      `<div class="pop" style="margin-top:12px">${POPS.map(([k,l])=>{ const p=po[k]; if(!p) return ''; const o=typeof p==='string'?{texto:p}:p; return `<div class="popc"><h4>${l}${o.nivel?`<span class="nv ${esc(o.nivel)}">${esc(o.nivel==='aceitavel'?'aceitável':o.nivel)}</span>`:''}</h4><p>${md(o.texto)}</p></div>`; }).join('')}</div>`)}
    ${sec('suspensao',9,'Suspensão e troca',
      notaClasse(f,'suspensao')+kv([['Risco de descontinuação',su.risco],['Sintomas',su.sintomas],['Esquema de redução',su.reducao],['Trocas',su.troca]])+
      `<p class="small" style="margin-top:8px"><a href="#trocas">Abrir o guia de trocas</a></p>`)}
    ${sec('superdosagem',10,'Superdosagem',notaClasse(f,'superdosagem')+kv([['Toxicidade',od.toxicidade],['Quadro clínico',od.quadro],['Conduta',od.conduta]]))}
    ${sec('pratica',11,'Aspectos práticos e peculiaridades',
      (arr(pt.perolas).length?'<h3>Pérolas clínicas</h3>'+arr(pt.perolas).map(p=>`<div class="perola">${md(p)}</div>`).join(''):'')+
      (arr(pt.erros).length?'<h3>Erros comuns de prescrição</h3>'+lista(pt.erros):'')+comparacoes(f)+
      kv([['Tipo de receita',f.receita_nota||f.receita],['Disponibilidade no SUS',f.sus],['Custo relativo',f.custo]])+
      (arr(f.fontes).length?`<h3>Fontes principais</h3><p class="fontes">${arr(f.fontes).map(esc).join(' · ')}</p>`:''))}
    <div class="print-aviso">Guia de Psicofármacos · ${esc(f.nome)} · Ferramenta de apoio à decisão clínica; não substitui a bula, o julgamento clínico nem as diretrizes vigentes. Revisão dos dados: ${esc(f.revisao||D.meta.revisao)}.</div>
   </article></div>`;
  // ações
  document.getElementById('b-fav').onclick=()=>{ S.fav.has(f.id)?S.fav.delete(f.id):S.fav.add(f.id); saveSets(); renderFicha(f); toast(S.fav.has(f.id)?'Adicionado aos favoritos':'Removido dos favoritos'); };
  document.getElementById('b-cmp').onclick=()=>{ if(S.cmp.includes(f.id)) S.cmp=S.cmp.filter(x=>x!==f.id); else { if(S.cmp.length>=4) S.cmp.shift(); S.cmp.push(f.id);} saveSets(); renderFicha(f); counters(); toast(S.cmp.includes(f.id)?'Adicionado à comparação':'Removido da comparação'); };
  document.getElementById('b-itx').onclick=()=>{ if(S.itx.includes(f.id)) S.itx=S.itx.filter(x=>x!==f.id); else S.itx.push(f.id); saveSets(); renderFicha(f); counters(); toast(S.itx.includes(f.id)?'Adicionado ao verificador':'Removido do verificador'); };
  document.getElementById('b-pdf').onclick=()=>exportarPDF(f);
  // navegação por seção
  const toc=document.getElementById('toc');
  toc.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); document.getElementById('s-'+a.dataset.s).scrollIntoView({behavior:'smooth',block:'start'}); }));
  const secs=[...document.querySelectorAll('.fsec')];
  const onScroll=()=>{ let cur=secs[0].id; secs.forEach(s=>{ if(s.getBoundingClientRect().top<160) cur=s.id; }); toc.querySelectorAll('a').forEach(a=>{ const on='s-'+a.dataset.s===cur; a.classList.toggle('on',on); if(on&&window.innerWidth<900) a.scrollIntoView({block:'nearest',inline:'nearest'}); }); };
  window.onscroll=onScroll; onScroll();
}
function exportarPDF(f){
  const emFrame = (()=>{ try{ return window.self!==window.top; }catch(e){ return true; } })();
  if(emFrame){ toast('Na versão publicada, a impressão é bloqueada. Abra o arquivo offline para exportar em PDF.'); return; }
  toast('Na janela de impressão, escolha “Salvar como PDF”.');
  setTimeout(()=>window.print(),300);
}

/* ---------- SELETOR DE FÁRMACOS ---------- */
function buscarClin(q){ const nq=norm(q).trim(); if(!nq) return []; return CLIN.filter(c=>norm([c.nome,c.grupo].concat(arr(c.sinonimos)).join(' ')).includes(nq)); }
function picker(host, onPick, filtro, comClin){
  host.innerHTML = `<div class="picker"><input type="search" placeholder="Digite o nome do fármaco" autocomplete="off" aria-label="Adicionar fármaco" id="pk-${host.id}"><ul hidden></ul></div>`;
  const inp=host.querySelector('input'), ul=host.querySelector('ul'); let hl=0, items=[];
  const draw=()=>{ const q=inp.value; items = buscar(q).map(r=>r.f).filter(f=>!filtro||filtro(f)).slice(0,10); if(comClin) items=items.concat(buscarClin(q).slice(0,8)); if(!q||!items.length){ ul.hidden=true; return; } hl=Math.min(hl,items.length-1); ul.innerHTML=items.map((f,i)=>`<li data-i="${i}" class="${i===hl?'hl':''}">${esc(f.nome)} <small>${f.clinico?esc(f.grupo)+' · não psiquiátrico':esc(clsName(f.classe))+(f.subclasse?' · '+esc(f.subclasse):'')}</small></li>`).join(''); ul.hidden=false; };
  inp.addEventListener('input',()=>{hl=0;draw();});
  inp.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){hl=Math.min(hl+1,items.length-1);draw();e.preventDefault();} else if(e.key==='ArrowUp'){hl=Math.max(hl-1,0);draw();e.preventDefault();} else if(e.key==='Enter'&&items[hl]){ onPick(items[hl]); inp.value=''; ul.hidden=true; } else if(e.key==='Escape'){ul.hidden=true;} });
  ul.addEventListener('mousedown',e=>{ const li=e.target.closest('li'); if(li){ e.preventDefault(); onPick(items[+li.dataset.i]); inp.value=''; ul.hidden=true; inp.focus(); } });
  inp.addEventListener('blur',()=>setTimeout(()=>ul.hidden=true,120));
}
function chips(ids, onRemove){ const B=typeof byAny!=='undefined'?byAny:byId; return `<div class="sel">${ids.filter(id=>B[id]).map(id=>{ const f=B[id]; return `<span class="chip" style="--cc:${f.clinico?'var(--ink-3)':clsColor(f.classe)}"><span class="dot"></span>${f.clinico?`<span>${esc(f.nome)}</span>`:`<a href="#ficha-${id}" style="color:inherit;text-decoration:none">${esc(f.nome)}</a>`}<button data-rm="${id}" aria-label="Remover ${esc(f.nome)}">×</button></span>`; }).join('')}</div>`; }

/* ---------- COMPARAR ---------- */
function renderComparar(){
  const M=document.getElementById('main');
  const fs=S.cmp.map(id=>byId[id]);
  const linhas=[
    ['Classe',f=>esc(clsName(f.classe))+(f.subclasse?' · '+esc(f.subclasse):'')],
    ['Nomes comerciais',f=>esc(arr(f.nomes_comerciais).slice(0,4).join(', '))],
    ['Apresentações',f=>arr(f.apresentacoes).map(a=>esc(a.forma)+': <span class="mono">'+esc(arr(a.doses).join(', '))+'</span>').join('<br>')],
    ['Mecanismo',f=>md((f.farmacodinamica||{}).resumo_curto||(f.farmacodinamica||{}).resumo||'')],
    ['Dose inicial',f=>md((f.prescricao||{}).dose_inicial)],
    ['Faixa habitual',f=>md((f.prescricao||{}).faixa)],
    ['Dose máxima',f=>md((f.prescricao||{}).dose_maxima)],
    ['Meia-vida',f=>md((f.farmacocinetica||{}).meia_vida)],
    ['Metabolismo',f=>md((f.farmacocinetica||{}).metabolismo)],
    ['Inibe',f=>{ const i=((f.farmacocinetica||{}).cyp||{}).inibe||{}; return Object.keys(i).length?Object.entries(i).map(([e,v])=>`<span class="mono">${e}</span> ${esc(v)}`).join('<br>'):'<span class="muted">sem inibição relevante</span>'; }],
    ['Perfil adverso',f=>perfilBars(f.perfil)],
    ['Risco de descontinuação',f=>md((f.suspensao||{}).risco)],
    ['Gestação',f=>{const p=(f.populacoes||{}).gestacao; return p&&p.nivel?`<span class="nv ${p.nivel}">${p.nivel==='aceitavel'?'aceitável':p.nivel}</span>`:''; }],
    ['Idosos',f=>{const p=(f.populacoes||{}).idosos; return p&&p.nivel?`<span class="nv ${p.nivel}">${p.nivel==='aceitavel'?'aceitável':p.nivel}</span>`:''; }],
    ['Receita',f=>`<span class="badge rec">${esc(f.receita||'')}</span>`],
    ['RENAME',f=>f.rename?'<span class="badge ok">sim</span>':'não'],
    ['Superdosagem',f=>md((f.superdosagem||{}).toxicidade||'')]
  ];
  M.innerHTML = `<div class="page-h"><h1>Comparar fármacos</h1><p>Adicione até quatro fármacos, de preferência da mesma classe. A comparação fica salva neste navegador.</p></div>
    <div id="pk-cmp"></div>${chips(S.cmp)}
    ${fs.length<2?`<div class="panel empty">Adicione pelo menos dois fármacos. Sugestões: ${[['sertralina','escitalopram'],['olanzapina','aripiprazol','quetiapina'],['clonazepam','alprazolam','lorazepam']].map(g=>`<a href="#comparar" data-set="${g.join(',')}">${g.map(id=>byId[id]?byId[id].nome:id).join(' × ')}</a>`).join(' · ')}</div>`:
    `${radarSVG(fs)}<div class="scroll-x"><table class="cmp"><thead><tr><th></th>${fs.map(f=>`<th><a href="#ficha-${f.id}" style="color:inherit">${esc(f.nome)}</a></th>`).join('')}</tr></thead><tbody>${linhas.map(([l,fn])=>`<tr><th>${l}</th>${fs.map(f=>`<td>${fn(f)||''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}`;
  picker(document.getElementById('pk-cmp'), f=>{ if(!S.cmp.includes(f.id)){ if(S.cmp.length>=4) S.cmp.shift(); S.cmp.push(f.id); saveSets(); renderComparar(); counters(); } });
  M.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ S.cmp=S.cmp.filter(x=>x!==b.dataset.rm); saveSets(); renderComparar(); counters(); });
  M.querySelectorAll('[data-set]').forEach(a=>a.onclick=e=>{ e.preventDefault(); S.cmp=a.dataset.set.split(',').filter(id=>byId[id]); saveSets(); renderComparar(); counters(); });
}

/* ---------- INTERAÇÕES ---------- */
const ITX_EX=[
  ['Clozapina, fluvoxamina e tabagismo',['clozapina','fluvoxamina','x-tabaco']],
  ['Lítio, ibuprofeno e losartana',['litio','x-ibuprofeno','x-losartana']],
  ['Metadona, citalopram e quetiapina',['metadona','citalopram','quetiapina']],
  ['Sertralina, tramadol e ondansetrona',['sertralina','x-tramadol','x-ondansetrona']],
  ['Idoso: amitriptilina, prometazina e donepezila',['amitriptilina','prometazina','donepezila']],
  ['Carbamazepina, quetiapina e contraceptivo',['carbamazepina','quetiapina','x-contraceptivo']]
];
let itxF={g:new Set(), canal:new Set(), par:null};
const nomeCurto=f=>{ const n=f.nome.replace(/\s*\(.*?\)\s*/g,' ').trim(); return n.length>18?n.slice(0,17)+'…':n; };
function renderInteracoes(){
  const M=document.getElementById('main');
  S.itx=S.itx.filter(id=>byAny[id]); const fs=S.itx.map(id=>byAny[id]);
  let res=[]; const porPar={};
  for(let i=0;i<fs.length;i++) for(let j=i+1;j<fs.length;j++){ const r=interacoesPar(fs[i],fs[j]); porPar[fs[i].id+'|'+fs[j].id]=r; r.forEach(x=>res.push({...x,a:fs[i],b:fs[j],k:fs[i].id+'|'+fs[j].id})); }
  res.sort((x,y)=>gRank(x.g)-gRank(y.g));
  if(itxF.par&&!porPar[itxF.par]) itxF.par=null;
  const canais=[...new Set(res.map(r=>r.canal))].sort((a,b)=>a.localeCompare(b,'pt'));
  const filt=res.filter(r=>(!itxF.g.size||itxF.g.has(r.g))&&(!itxF.canal.size||itxF.canal.has(r.canal))&&(!itxF.par||r.k===itxF.par));
  const cont=GRAV.map(g=>[g,res.filter(r=>r.g===g).length]).filter(x=>x[1]);
  const carga=fs.length>=2?cargaCombinada(fs):[];
  const mapa=fs.length>=2?mapaMetabolico(fs):[];
  const matriz=()=>{ if(fs.length<3) return '';
    return `<h2 class="itx-h">Matriz da combinação</h2><p class="small muted" style="margin:0 0 8px">Cor pela interação mais grave do par; o número indica quantos alertas. Toque numa célula para filtrar a lista.</p><div class="scroll-x"><table class="mtx"><thead><tr><th></th>${fs.map(f=>`<th scope="col"><span>${esc(nomeCurto(f))}</span></th>`).join('')}</tr></thead><tbody>${fs.map((a,i)=>`<tr><th scope="row">${esc(nomeCurto(a))}</th>${fs.map((b,j)=>{ if(i===j) return '<td class="mc eu"></td>'; const k=i<j?a.id+'|'+b.id:b.id+'|'+a.id; const r=porPar[k]||[]; const g=r.length?r[0].g:'nada'; return `<td class="mc ${g}${itxF.par===k?' on':''}" data-par="${k}" title="${esc(a.nome)} + ${esc(b.nome)}: ${r.length?r.map(x=>x.g+': '+x.t).join('; '):'sem alerta'}">${r.length||'·'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`; };
  const cargaHTML=()=>{ if(!carga.length) return '';
    return `<h2 class="itx-h">Carga combinada</h2><p class="small muted" style="margin:0 0 8px">Soma dos efeitos de todos os itens selecionados (perfil de 0 a 3 de cada fármaco). Detecta riscos que só aparecem com três ou mais fármacos, mesmo quando cada par isolado parece aceitável.</p><div class="carga">${carga.map(l=>`<div class="cg ${l.alerta?'al':''}"><div class="cg-t">${l.alerta?I.alert:''}<b>${esc(l.t)}</b><span class="small muted">${l.conta?l.tot+' fármacos':'soma '+l.tot}</span></div><div class="cg-bar">${l.ct.map(([f,v],n)=>`<span style="flex:${v};--pc:${PAL[n%4]}" title="${esc(f.nome)}: ${v}">${esc(nomeCurto(f))}${l.conta?'':' '+v}</span>`).join('')}</div>${l.alerta?`<div class="small">${esc(l.msg)}</div>`:''}</div>`).join('')}</div>`; };
  const mapaHTML=()=>{ if(!mapa.length) return '';
    return `<h2 class="itx-h">Mapa metabólico da combinação</h2><p class="small muted" style="margin:0 0 8px">Para cada fármaco, quem na combinação eleva (inibição) ou reduz (indução) seus níveis, pelas vias de eliminação cadastradas.</p><div class="scroll-x"><table class="itable"><thead><tr><th>Fármaco</th><th>Vias relevantes</th><th>Níveis sobem com</th><th>Níveis caem com</th></tr></thead><tbody>${mapa.map(m=>`<tr><td><b>${esc(m.f.nome)}</b></td><td class="small">${esc(m.vias.join(', ')||'sem via CYP relevante')}</td><td class="small">${m.up.map(esc).join('<br>')||'·'}</td><td class="small">${m.down.map(esc).join('<br>')||'·'}</td></tr>`).join('')}</tbody></table></div>`; };
  const filtros=()=>`<div class="fbar"><span class="small muted">Gravidade</span>${cont.map(([g,n])=>`<button class="fchip sevf ${g} ${itxF.g.has(g)?'on':''}" data-fg="${g}">${n} ${g}</button>`).join('')}</div>
    <div class="fbar"><span class="small muted">Mecanismo</span>${canais.map(c=>`<button class="fchip ${itxF.canal.has(c)?'on':''}" data-fc="${esc(c)}">${esc(c)} <span class="muted">${res.filter(r=>r.canal===c).length}</span></button>`).join('')}${(itxF.g.size||itxF.canal.size||itxF.par)?`<button class="fchip limpa" id="f-limpa">Limpar filtros</button>`:''}</div>
    ${itxF.par?`<p class="small">Mostrando apenas: <b>${esc(byAny[itxF.par.split('|')[0]].nome)} + ${esc(byAny[itxF.par.split('|')[1]].nome)}</b></p>`:''}`;
  const semPar=Object.entries(porPar).filter(([,r])=>!r.length).map(([k])=>k.split('|').map(id=>byAny[id].nome).join(' + '));
  M.innerHTML = `<div class="page-h"><h1>Verificador de interações</h1><p>Selecione dois ou mais itens entre os ${F.length} psicofármacos do guia e ${CLIN.length} fármacos clínicos e substâncias. Cada par é cruzado por pares específicos cadastrados (${arr(D.pares).length}), por regras farmacodinâmicas (serotonina e MAO, QT, depressão do SNC e respiratória, carga anticolinérgica e íleo, hipotensão, limiar convulsivo, sangramento, lítio, sódio, bradicardia, medula, fígado e amônia, metabolismo, prolactina, dopamina, pressão, antagonismos) e por regras farmacocinéticas que consideram a força do inibidor ou indutor e o peso de cada via na eliminação do outro fármaco (CYP1A2, 2B6, 2C8, 2C9, 2C19, 2D6, 3A4, UGT, P-gp e pró-fármacos). Com três ou mais itens, o verificador também soma as cargas de toda a combinação.</p></div>
    <div id="pk-itx"></div>${chips(S.itx)}
    ${fs.length?`<button class="btn" id="itx-clear" style="margin-bottom:12px">Limpar seleção</button>`:''}
    ${fs.length<2?`<div class="panel empty">Adicione pelo menos dois fármacos para verificar interações.<div class="exs">${ITX_EX.map((e,n)=>`<button class="fchip" data-ex="${n}">${esc(e[0])}</button>`).join('')}</div></div>`:
      `<div class="sel">${cont.map(([g,n])=>`<span class="sev ${g}">${n} ${g}</span>`).join(' ')}${!res.length?'<span class="small muted">Nenhum alerta pelas regras do guia.</span>':''}</div>
      ${matriz()}
      ${fs.length>=3?cargaHTML():''}
      ${res.length?`<h2 class="itx-h">Alertas por par</h2>${filtros()}<div>${filt.map(r=>`<div class="irow"><div><span class="sev ${r.g}">${r.g}</span></div><div><div class="par">${esc(r.a.nome)} + ${esc(r.b.nome)} · ${esc(r.canal)} · ${esc(r.orig)}</div><h4>${esc(r.t)}</h4><p>${md(r.m)}</p><p><b>Conduta:</b> ${md(r.c)}</p></div></div>`).join('')||'<p class="muted">Nenhum alerta com esses filtros.</p>'}</div>`:''}
      ${semPar.length&&res.length?`<p class="small muted" style="margin-top:10px">Pares sem alerta pelas regras: ${esc(semPar.join('; '))}.</p>`:''}
      ${fs.length<3?cargaHTML():''}
      ${mapaHTML()}`}
    <div class="warnbox" style="margin-top:18px">O motor usa dados de bula e de referências de interação agrupados por mecanismo; as magnitudes são estimativas por classe e a gravidade real depende de dose, idade, função renal e hepática, genótipo e tempo de associação. O catálogo não psiquiátrico não é exaustivo: a ausência de alerta não garante segurança. Confira a bula e uma base de interações em polifarmácia extensa.</div>`;
  picker(document.getElementById('pk-itx'), f=>{ if(!S.itx.includes(f.id)){ S.itx.push(f.id); saveSets(); renderInteracoes(); counters(); } }, null, true);
  M.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ S.itx=S.itx.filter(x=>x!==b.dataset.rm); saveSets(); renderInteracoes(); counters(); });
  const c=document.getElementById('itx-clear'); if(c) c.onclick=()=>{ S.itx=[]; itxF={g:new Set(),canal:new Set(),par:null}; saveSets(); renderInteracoes(); counters(); };
  M.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{ S.itx=ITX_EX[+b.dataset.ex][1].filter(id=>byAny[id]); saveSets(); renderInteracoes(); counters(); });
  M.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{ const g=b.dataset.fg; itxF.g.has(g)?itxF.g.delete(g):itxF.g.add(g); renderInteracoes(); });
  M.querySelectorAll('[data-fc]').forEach(b=>b.onclick=()=>{ const g=b.dataset.fc; itxF.canal.has(g)?itxF.canal.delete(g):itxF.canal.add(g); renderInteracoes(); });
  M.querySelectorAll('[data-par]').forEach(b=>b.onclick=()=>{ itxF.par=itxF.par===b.dataset.par?null:b.dataset.par; renderInteracoes(); const l=M.querySelector('.fbar'); if(l) l.scrollIntoView({behavior:'smooth',block:'start'}); });
  const fl=document.getElementById('f-limpa'); if(fl) fl.onclick=()=>{ itxF={g:new Set(),canal:new Set(),par:null}; renderInteracoes(); };
}

/* ---------- EQUIVALÊNCIAS ---------- */
let eqTab = store.get('eqtab', null);
function renderEquiv(){
  const M=document.getElementById('main');
  const E=D.equivalencias; const tabs=E.tabelas;
  if(!tabs.find(t=>t.id===eqTab)) eqTab=tabs[0].id;
  const T=tabs.find(t=>t.id===eqTab);
  const nome = id => byId[id]?byId[id].nome:(T.nomes||{})[id]||id;
  M.innerHTML = `<div class="page-h"><h1>Equivalência de doses</h1><p>${md(E.intro||'')}</p></div>
   <div class="tabs" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${t.id===eqTab}" data-t="${t.id}">${esc(t.titulo)}</button>`).join('')}</div>
   <div class="warnbox"><b>Aproximações.</b> ${md(T.aviso||E.aviso)}</div>
   <div class="calc">
     <label>De<select id="eq-de">${T.itens.map(i=>`<option value="${i.id}">${esc(nome(i.id))}</option>`).join('')}</select></label>
     <label>Dose (${esc(T.unidade)})<input id="eq-dose" type="number" min="0" step="any" value="${T.exemplo_dose||''}"></label>
     <span class="muted" style="padding-bottom:10px">equivale a</span>
     <label>Para<select id="eq-para">${T.itens.map((i,k)=>`<option value="${i.id}" ${k===1?'selected':''}>${esc(nome(i.id))}</option>`).join('')}</select></label>
   </div>
   <div class="res" id="eq-res" style="font-family:var(--f-mono);font-size:1.5rem;font-weight:600;color:var(--accent);margin:10px 0 18px"></div>
   <div class="scroll-x"><table class="eqt"><thead><tr><th>Fármaco</th><th style="text-align:right">${esc(T.coluna)}</th><th>Observação</th></tr></thead><tbody>${T.itens.map(i=>`<tr><td>${byId[i.id]?`<a href="#ficha-${i.id}">${esc(nome(i.id))}</a>`:esc(nome(i.id))}</td><td class="n">${i.dose}</td><td class="small muted">${md(i.nota||'')}</td></tr>`).join('')}</tbody></table></div>
   <p class="fontes" style="margin-top:12px">${md(T.fonte||'')}</p>`;
  if(T.exemplo_de) document.getElementById('eq-de').value=T.exemplo_de;
  const calc=()=>{ const a=T.itens.find(i=>i.id===document.getElementById('eq-de').value), b=T.itens.find(i=>i.id===document.getElementById('eq-para').value); const d=parseFloat(document.getElementById('eq-dose').value); const out=document.getElementById('eq-res');
    if(!a||!b||!(d>0)){ out.textContent=''; return; } const v=d*b.dose/a.dose; const r = v>=100?Math.round(v/5)*5 : v>=10?Math.round(v*2)/2 : Math.round(v*100)/100; out.textContent=`≈ ${r.toLocaleString('pt-BR')} ${T.unidade} de ${nome(b.id)}`; };
  ['eq-de','eq-para','eq-dose'].forEach(id=>document.getElementById(id).addEventListener('input',calc)); calc();
  M.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ eqTab=b.dataset.t; store.set('eqtab',eqTab); renderEquiv(); });
}

/* ---------- TROCAS ---------- */
let trTab = store.get('trtab','antidepressivos');
function planoTroca(o,d,grupo){
  const R=D.trocas; const po=o.troca||{}, pd=d.troca||{};
  const esp = arr(R.especificos).find(x=>(casa(o,x.de)&&casa(d,x.para)));
  let tipo, passos=[], alertas=[], plano;
  const nO=o.nome, nD=d.nome;
  if(grupo==='antidepressivos'){
    const oI=po.tipo==='imao_irreversivel', dI=pd.tipo==='imao_irreversivel', dR=pd.tipo==='imao_reversivel', oR=po.tipo==='imao_reversivel';
    if(dI||(dR&&(o.perfil||{}).serotoninergico>=2)){
      const w = po.washout_semanas!=null?po.washout_semanas:1;
      tipo='Retirada, intervalo livre e início';
      passos=[`Reduzir e suspender ${nO} ${po.tipo==='fluoxetina'?'(na dose de 20 mg pode ser suspensa sem redução)':'gradualmente em 1 a 4 semanas'}.`,`Aguardar intervalo livre de ${w>=1?w+' semana'+(w>1?'s':''):Math.round(w*7)+' dias'} (cerca de 5 meias-vidas${po.tipo==='fluoxetina'?' da norfluoxetina':''}).`,`Iniciar ${nD} em dose baixa e titular.`];
      alertas.push('Nunca sobrepor IMAO a fármacos serotoninérgicos: risco de síndrome serotoninérgica grave.');
      if(dI) alertas.push('Orientar dieta pobre em tiramina a partir do início do IMAO e até 2 semanas após sua suspensão.');
      plano={origem:[[0,1],[2,.5],[3,0]], gap:[3,3+Math.max(.3,w)], destino:[[0,0],[3+Math.max(.3,w),0],[4+Math.max(.3,w),.5],[6+Math.max(.3,w),1]]};
    } else if(oI||oR){
      const w = oI?2:1/7*2;
      tipo='Retirada, intervalo livre e início';
      passos=[`Reduzir e suspender ${nO} gradualmente.`,`Aguardar ${oI?'2 semanas (tempo de ressíntese da MAO)':'24 a 48 horas (moclobemida é reversível)'}.`,`Iniciar ${nD} em dose baixa e titular.`];
      alertas.push('Manter as restrições dietéticas e medicamentosas do IMAO durante o intervalo livre.');
      plano={origem:[[0,1],[1,.5],[2,0]], gap:[2,2+w], destino:[[0,0],[2+w,0],[3+w,.5],[5+w,1]]};
    } else if(po.tipo==='fluoxetina'){
      tipo='Suspensão e início com cautela';
      passos=[`Suspender a fluoxetina (em 20 mg/dia sem redução; doses maiores: reduzir para 20 mg por 1 a 2 semanas).`,`Aguardar 4 a 7 dias e iniciar ${nD} em dose baixa; a fluoxetina e a norfluoxetina permanecem por semanas.`,`Titular lentamente, atento a efeitos serotoninérgicos e à inibição persistente do CYP2D6.`];
      if(pd.tipo==='atc') alertas.push('Tricíclico após fluoxetina: níveis podem subir muito pela inibição residual do CYP2D6; iniciar com 25 mg ou menos e dosar nível sérico se possível.');
      plano={origem:[[0,1],[1,0]], destino:[[0,0],[1,0],[2,.35],[4,.7],[6,1]]};
    } else if(po.tipo===pd.tipo && ['isrs','irsn'].includes(po.tipo) || (po.tipo==='isrs'&&pd.tipo==='irsn') || (po.tipo==='irsn'&&pd.tipo==='isrs')){
      tipo='Troca direta ou cruzada rápida';
      passos=[`Em doses baixas a moderadas, a troca pode ser direta: suspender ${nO} e iniciar ${nD} no dia seguinte em dose equivalente baixa.`,`Em doses altas ou com ${nO} de meia-vida curta (paroxetina, venlafaxina), reduzir ${nO} em 1 a 2 semanas enquanto se introduz ${nD}.`,`Vigiar sintomas de descontinuação e de excesso serotoninérgico.`];
      plano={origem:[[0,1],[1,.5],[2,0]], destino:[[0,0],[.5,.5],[2,1]]};
    } else {
      tipo='Troca cruzada (cross-titration)';
      passos=[`Reduzir ${nO} gradualmente ao longo de 2 a 4 semanas.`,`Iniciar ${nD} em dose baixa já na primeira semana e titular conforme tolerância.`,`Atenção à somação de efeitos durante a sobreposição (sedação, serotonina, anticolinérgico).`];
      if(pd.tipo==='atc'||po.tipo==='atc') alertas.push('Tricíclicos: iniciar em dose baixa quando associados a inibidores do CYP2D6 (fluoxetina, paroxetina, bupropiona, duloxetina).');
      plano={origem:[[0,1],[1,.75],[2,.5],[3,.25],[4,0]], destino:[[0,0],[1,.35],[2,.6],[3,.8],[4,1]]};
    }
  } else {
    // antipsicóticos
    const origemPesada = po.rebote_colinergico||po.rebote_histaminico;
    if(o.id==='clozapina'){
      tipo='Retirada muito lenta';
      passos=[`Introduzir ${nD} até a dose terapêutica.`,`Reduzir a clozapina lentamente, em geral 25 a 50 mg a cada 1 a 2 semanas (meses no total).`,`Monitorar rebote colinérgico (sudorese, náuseas, diarreia, agitação) e psicose de rebote; considerar anticolinérgico transitório.`];
      alertas.push('Suspensão abrupta da clozapina associa-se a psicose de rebote grave e a síndrome colinérgica. Evitar sempre que possível.');
      plano={origem:[[0,1],[2,1],[4,.8],[6,.6],[8,.4],[10,.2],[12,0]], destino:[[0,0],[1,.5],[2,1],[12,1]], unidade:'semanas'};
    } else if(pd.agonista_parcial && !po.agonista_parcial){
      tipo='Troca em platô (plateau cross-titration)';
      passos=[`Manter ${nO} na dose atual.`,`Introduzir ${nD} e titular até a dose terapêutica${d.id==='cariprazina'?' (a cariprazina demora semanas para atingir equilíbrio)':''}.`,`Só então reduzir ${nO} ao longo de 2 a 4 semanas${origemPesada?', mais lentamente pelo risco de rebote colinérgico ou histaminérgico':''}.`];
      alertas.push('Retirar o antagonista pleno antes de o agonista parcial estar em dose plena favorece piora psicótica, acatisia e insônia (rebote de supersensibilidade D2).');
      plano={origem:[[0,1],[2,1],[3,.66],[4,.33],[5,0]], destino:[[0,0],[1,.5],[2,1],[5,1]]};
    } else if(origemPesada){
      tipo='Troca cruzada com retirada lenta';
      passos=[`Introduzir ${nD} e titular em 1 a 2 semanas.`,`Reduzir ${nO} de forma lenta, em 3 a 4 semanas ou mais.`,`Vigiar insônia, ansiedade, náuseas e sudorese por rebote colinérgico ou histaminérgico; hipnótico transitório pode ajudar.`];
      plano={origem:[[0,1],[1,1],[2,.75],[3,.5],[4,.25],[5,0]], destino:[[0,0],[1,.5],[2,1],[5,1]]};
    } else {
      tipo='Troca cruzada (cross-titration)';
      passos=[`Iniciar ${nD} em dose baixa e titular em 1 a 2 semanas.`,`Reduzir ${nO} proporcionalmente ao longo de 2 a 4 semanas.`,`Evitar a troca abrupta em pacientes estáveis de alto risco; considerar platô breve.`];
      plano={origem:[[0,1],[1,.66],[2,.33],[3,0]], destino:[[0,0],[1,.5],[2,.8],[3,1]]};
    }
    if(pd.agonista_parcial && d.id!=='cariprazina') alertas.push('Com o agonista parcial podem surgir acatisia e insônia nas primeiras semanas.');
    if(d.id==='clozapina') alertas.push('Clozapina exige hemograma basal e monitorização de neutrófilos, titulação lenta e vigilância de miocardite nas primeiras semanas.');
    if(arr(d.marcadores).includes('lai')) alertas.push('Para formulações de depósito, ver na ficha do LAI o esquema de início e a necessidade de sobreposição oral.');
  }
  const total=Math.ceil(Math.max(...plano.origem.map(p=>p[0]),...plano.destino.map(p=>p[0]))+.5);
  return {tipo,passos,alertas,esp,plano:{...plano,total,nomeO:nO,nomeD:nD,unidade:plano.unidade||'semanas'}};
}
function renderTrocas(){
  const M=document.getElementById('main');
  const grupos={antidepressivos:F.filter(f=>f.classe==='antidepressivos'&&f.troca), antipsicoticos:F.filter(f=>f.classe==='antipsicoticos'&&f.troca&&!arr(f.marcadores).includes('lai'))};
  if(!grupos[trTab]||!grupos[trTab].length) trTab = grupos.antidepressivos.length?'antidepressivos':'antipsicoticos';
  const L=grupos[trTab]; const k1=store.get('tr_'+trTab+'_o',L[0]&&L[0].id), k2=store.get('tr_'+trTab+'_d',L[1]&&L[1].id);
  M.innerHTML = `<div class="page-h"><h1>Guia de trocas</h1><p>Escolha o fármaco de origem e o de destino. O esquema considera washout de IMAO, meia-vida longa da fluoxetina, rebote colinérgico e histaminérgico, e agonistas parciais.</p></div>
    <div class="tabs" role="tablist">${[['antidepressivos','Antidepressivos'],['antipsicoticos','Antipsicóticos']].map(([k,l])=>`<button role="tab" aria-selected="${k===trTab}" data-t="${k}" ${grupos[k].length?'':'disabled'}>${l}</button>`).join('')}</div>
    ${L.length<2?'<div class="panel empty">Fichas desta classe ainda não cadastradas.</div>':`<div class="swap"><label>Origem<select id="tr-o">${L.map(f=>`<option value="${f.id}" ${f.id===k1?'selected':''}>${esc(f.nome)}</option>`).join('')}</select></label><label>Destino<select id="tr-d">${L.map(f=>`<option value="${f.id}" ${f.id===k2?'selected':''}>${esc(f.nome)}</option>`).join('')}</select></label></div><div id="tr-out"></div>`}
    <p class="fontes" style="margin-top:14px">${md(D.trocas.fonte||'')}</p>`;
  M.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ trTab=b.dataset.t; store.set('trtab',trTab); renderTrocas(); });
  if(L.length<2) return;
  const draw=()=>{ const o=byId[document.getElementById('tr-o').value], d=byId[document.getElementById('tr-d').value]; store.set('tr_'+trTab+'_o',o.id); store.set('tr_'+trTab+'_d',d.id);
    const out=document.getElementById('tr-out');
    if(o.id===d.id){ out.innerHTML='<div class="panel empty">Escolha fármacos diferentes.</div>'; return; }
    const p=planoTroca(o,d,trTab);
    out.innerHTML = `<div class="panel"><div class="eyebrow">Estratégia</div><h2 style="font-family:var(--f-display);font-size:1.35rem;margin:4px 0 10px">${esc(p.tipo)}: ${esc(o.nome)} → ${esc(d.nome)}</h2>
      <ol class="steps">${p.passos.map(s=>`<li>${md(s)}</li>`).join('')}</ol>
      ${p.esp?`<div class="perola"><b>Particularidade deste par:</b> ${md(p.esp.texto)}</div>`:''}
      ${p.alertas.map(a=>`<div class="callout" style="border-left-color:var(--warn);background:color-mix(in srgb,var(--warn) 8%,var(--surface))">${md(a)}</div>`).join('')}
      ${trocaSVG(p.plano)}
      <div class="cols2 small"><div><b>${esc(o.nome)}:</b> ${md((o.suspensao||{}).reducao||'')}</div><div><b>${esc(d.nome)}:</b> ${md((d.prescricao||{}).dose_inicial||'')}</div></div></div>`; };
  document.getElementById('tr-o').onchange=draw; document.getElementById('tr-d').onchange=draw; draw();
}

/* ---------- FAVORITOS / SOBRE ---------- */
function renderFavoritos(){
  const M=document.getElementById('main'); const ids=[...S.fav].filter(id=>byId[id]);
  M.innerHTML=`<div class="page-h"><h1>Favoritos</h1><p>Marque fichas com a estrela para acessá-las daqui. Os favoritos ficam salvos neste navegador.</p></div>${ids.length?listaHTML(ids.map(id=>({f:byId[id]}))):'<div class="panel empty">Nenhum favorito ainda.</div>'}`;
}
function renderSobre(){
  const M=document.getElementById('main');
  M.innerHTML=`<div class="page-h"><h1>Sobre o guia</h1></div><div class="panel" style="max-width:860px">${md(D.meta.sobre||'')}
  <h3 style="margin-top:16px" class="eyebrow">Legenda</h3>
  <p><span class="sev contraindicada">contraindicada</span> <span class="sev grave">grave</span> <span class="sev moderada">moderada</span> <span class="sev leve">leve</span></p>
  <p><span class="nv preferencial">preferencial</span> <span class="nv aceitavel">aceitável</span> <span class="nv cautela">cautela</span> <span class="nv evitar">evitar</span> <span class="nv contraindicado">contraindicado</span></p>
  <p class="small muted">Versão dos dados: ${esc(D.meta.revisao)} · ${F.length} fichas.</p></div>`;
}

/* ---------- INÍCIO ---------- */
shell();
window.addEventListener('hashchange',()=>{ window.onscroll=null; render(); });
window.guiaMotor={interacoesPar,byAny,pkOf,cargaCombinada,mapaMetabolico};
render();
})();
