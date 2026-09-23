// Build do Guia de Psicofármacos
// Uso: node build.mjs   →  gera dist/guia-psicofarmacos.html (offline, arquivo único)
//                          e dist/artifact.html (versão publicável, sem o esqueleto <html>)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.dirname(fileURLToPath(import.meta.url));
const rd = p => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const erros = [], avisos = [];

const classes = rd('dados/classes.json');
const meta = rd('dados/meta.json');
const equivalencias = rd('dados/equivalencias.json');
const trocas = rd('dados/trocas.json');
const pares = rd('dados/interacoes-pares.json');
const clinicos = rd('dados/farmacos-clinicos.json');
let farmacos = [];
for (const f of fs.readdirSync(path.join(R, 'dados/farmacos')).filter(f => f.endsWith('.json')).sort()) {
  try {
    const d = rd('dados/farmacos/' + f);
    (Array.isArray(d) ? d : [d]).forEach(x => { x._arquivo = f; farmacos.push(x); });
  } catch (e) { erros.push(`JSON inválido em dados/farmacos/${f}: ${e.message}`); }
}

// validação
const ids = new Set(), cls = new Set(classes.map(c => c.id));
const GRAV = ['contraindicada', 'grave', 'moderada', 'leve'];
const NIV = ['preferencial', 'aceitavel', 'cautela', 'evitar', 'contraindicado'];
for (const f of farmacos) {
  const w = m => erros.push(`${f._arquivo} › ${f.id || '?'}: ${m}`);
  if (!f.id || !/^[a-z0-9-]+$/.test(f.id)) w('id ausente ou com caracteres inválidos (use a-z, 0-9 e hífen)');
  if (ids.has(f.id)) w('id duplicado'); ids.add(f.id);
  if (!f.nome) w('sem nome');
  if (!cls.has(f.classe)) w(`classe "${f.classe}" não existe em classes.json`);
  (f.classes_secundarias || []).forEach(c => { if (!cls.has(c)) w(`classe secundária "${c}" inexistente`); });
  (f.interacoes || []).forEach(i => { if (!GRAV.includes(i.gravidade)) w(`gravidade inválida "${i.gravidade}" em interação com ${i.com}`); });
  Object.entries(f.populacoes || {}).forEach(([k, v]) => { if (v && v.nivel && !NIV.includes(v.nivel)) w(`nível inválido "${v.nivel}" em populacoes.${k}`); });
  (f.indicacoes || []).forEach(i => { if (!['anvisa', 'off_label'].includes(i.status)) w(`status de indicação inválido "${i.status}"`); });
  ['farmacodinamica', 'farmacocinetica', 'prescricao', 'efeitos_adversos', 'populacoes', 'suspensao', 'superdosagem'].forEach(s => { if (!f[s]) avisos.push(`${f.id}: seção "${s}" vazia`); });
  delete f._arquivo;
}
// complementos clínicos (dados/complementos/*.json): mesclados às fichas pelo id
const byIdF = Object.fromEntries(farmacos.map(f => [f.id, f]));
const compDir = path.join(R, 'dados/complementos');
if (fs.existsSync(compDir)) for (const arq of fs.readdirSync(compDir).filter(a => a.endsWith('.json')).sort()) {
  let lista; try { lista = rd('dados/complementos/' + arq); } catch (e) { erros.push(`JSON inválido em dados/complementos/${arq}: ${e.message}`); continue; }
  for (const c of lista) {
    const f = byIdF[c.id]; if (!f) { erros.push(`complementos/${arq}: id "${c.id}" não existe`); continue; }
    if (c.marcadores) f.marcadores = [...new Set([...(f.marcadores || []), ...c.marcadores])];
    ['efeito_aumento', 'efeito_reducao'].forEach(k => { if (c[k]) f[k] = c[k]; });
    f.pratica = f.pratica || {};
    if (c.perolas) f.pratica.perolas = [...(f.pratica.perolas || []), ...c.perolas];
    if (c.erros) f.pratica.erros = [...(f.pratica.erros || []), ...c.erros];
    const cl = {}; ['resumo', 'quando_escolher', 'quando_evitar', 'comparacao', 'monitorar'].forEach(k => { if (c[k]) cl[k] = c[k]; });
    if (Object.keys(cl).length) f.clinica = cl;
    (c.comparacao || []).forEach(x => { if (x.id && !byIdF[x.id]) avisos.push(`complementos/${arq} › ${c.id}: comparação com "${x.id}" sem ficha`); });
  }
}
for (const f of farmacos) { if (!f.clinica) avisos.push(`${f.id}: sem complemento clínico`); }
// usos clínicos (dados/usos/*.json): substituem o campo indicacoes da ficha; arquivos posteriores somam usos
const usosDir = path.join(R, 'dados/usos');
const PAPEL = ['1', '2', 'P', 'A', 'S', 'U', 'X'], EVID = ['A', 'B', 'C', 'D'];
const usos = {};
for (const arq of fs.readdirSync(usosDir).filter(a => a.endsWith('.json') && !['condicoes.json', 'discussoes.json'].includes(a)).sort()) {
  let d; try { d = rd('dados/usos/' + arq); } catch (e) { erros.push(`JSON inválido em dados/usos/${arq}: ${e.message}`); continue; }
  for (const [id, lista] of Object.entries(d)) { if (id.startsWith('_')) continue;
    if (!byIdF[id]) { erros.push(`usos/${arq}: id "${id}" não existe`); continue; }
    lista.forEach((u, k) => { const w = m => erros.push(`usos/${arq} › ${id}[${k}]: ${m}`);
      if (!u.g || !u.c) w('sem grupo ou condição'); if (!['a', 'o'].includes(u.s)) w(`status "${u.s}" inválido`);
      if (!EVID.includes(u.e)) w(`evidência "${u.e}" inválida`); if (!PAPEL.includes(u.p)) w(`papel "${u.p}" inválido`);
      (usos[id] = usos[id] || []).push({ condicao: u.c, grupo: u.g, status: u.s === 'a' ? 'anvisa' : 'off_label', evidencia: u.e, papel: u.p, dose: u.d, discussao: u.t, tambem: u.tambem }); }); } }
const disc = rd('dados/usos/discussoes.json');
for (const [id, m] of Object.entries(disc)) { if (id.startsWith('_')) continue; if (!usos[id]) { erros.push(`usos/discussoes.json: id "${id}" sem usos`); continue; }
  for (const [c, t] of Object.entries(m)) { const u = usos[id].find(x => x.condicao === c); if (!u) avisos.push(`usos/discussoes.json › ${id}: condição "${c}" não encontrada`); else if (!u.discussao) u.discussao = t; } }
for (const [id, l] of Object.entries(usos)) byIdF[id].indicacoes = l;
for (const f of farmacos) if (!usos[f.id]) avisos.push(`${f.id}: sem usos clínicos em dados/usos`);
const condicoes = rd('dados/usos/condicoes.json');
for (const arq of fs.readdirSync(path.join(usosDir, 'condicoes')).filter(a => a.endsWith('.json')).sort()) {
  let d; try { d = rd('dados/usos/condicoes/' + arq); } catch (e) { erros.push(`JSON inválido em dados/usos/condicoes/${arq}: ${e.message}`); continue; }
  for (const [g, v] of Object.entries(d)) condicoes[g] = { ...(condicoes[g] || {}), ...v };
}
{ const gs = new Set(Object.values(usos).flat().map(u => u.grupo)); gs.forEach(g => { if (!condicoes[g]) avisos.push(`condição "${g}" sem panorama`); }); }
// camada do motor de interações (dados/motor): farmacocinética detalhada e ajustes farmacodinâmicos
const pkM = rd('dados/motor/farmacocinetica.json'), pdM = rd('dados/motor/farmacodinamica.json');
const VIAS = ['p', 'c', 'm'], FOR = ['f', 'm', 'w'];
for (const [id, v] of Object.entries(pkM)) { if (id.startsWith('_')) continue; const f = byIdF[id]; if (!f) { erros.push(`motor/farmacocinetica.json: id "${id}" não existe`); continue; }
  Object.values(v.s || {}).forEach(x => { if (!VIAS.includes(x)) erros.push(`motor/farmacocinetica.json › ${id}: fração inválida "${x}"`); });
  [...Object.values(v.i || {}), ...Object.values(v.n || {})].forEach(x => { if (!FOR.includes(x)) erros.push(`motor/farmacocinetica.json › ${id}: força inválida "${x}"`); });
  f.pk = v; }
for (const f of farmacos) if (!f.pk) avisos.push(`${f.id}: sem dados em motor/farmacocinetica.json`);
for (const [id, v] of Object.entries(pdM)) { if (id.startsWith('_')) continue; const f = byIdF[id]; if (!f) { erros.push(`motor/farmacodinamica.json: id "${id}" não existe`); continue; }
  if (v.perfil) f.perfil = { ...(f.perfil || {}), ...v.perfil };
  if (v.marcadores) f.marcadores = [...new Set([...(f.marcadores || []), ...v.marcadores])]; }
clinicos.forEach(c => { if (ids.has(c.id)) erros.push(`farmacos-clinicos.json: id duplicado ${c.id}`); ids.add(c.id); });
for (const f of farmacos) {
  (f.relacionados || []).forEach(r => { if (!ids.has(r)) avisos.push(`${f.id}: relacionado "${r}" não existe`); });
  if (f.ficha_ligada && !ids.has(f.ficha_ligada)) avisos.push(`${f.id}: ficha_ligada "${f.ficha_ligada}" não existe`);
}
pares.forEach((p, i) => {
  if (!GRAV.includes(p.gravidade)) erros.push(`interacoes-pares.json[${i}]: gravidade inválida`);
  [p.a, p.b].forEach(s => { const [t, v] = String(s).split(':'); if (t === 'id' && v.split(',').some(x => !ids.has(x))) avisos.push(`interacoes-pares.json[${i}]: id "${v}" sem ficha nem item clínico`); });
});
equivalencias.tabelas.forEach(t => t.itens.forEach(i => { if (!ids.has(i.id) && !(t.nomes || {})[i.id]) avisos.push(`equivalências/${t.id}: "${i.id}" sem ficha nem nome`); }));

if (erros.length) { console.error('ERROS:\n' + erros.join('\n')); process.exit(1); }
if (avisos.length && process.argv.includes('-v')) console.warn('Avisos:\n' + avisos.join('\n'));

const dados = { meta, classes, farmacos, equivalencias, trocas, pares, clinicos, condicoes };
const json = JSON.stringify(dados).replace(/</g, '\\u003c');
const css = fs.readFileSync(path.join(R, 'src/app.css'), 'utf8');
const js = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap">';
const b64 = f => fs.readFileSync(path.join(R, 'src/icones', f)).toString('base64');
const ico32 = 'data:image/png;base64,' + b64('icon32.png'), ico180 = 'data:image/png;base64,' + b64('icon180.png');
const icones = `<link rel="icon" type="image/png" sizes="32x32" href="${ico32}">\n<link rel="apple-touch-icon" sizes="180x180" href="${ico180}">`;
const icoScript = `<script>(function(){try{var h=document.head;h.querySelectorAll('link[rel~="icon"]').forEach(function(l){if(!l.dataset.guia)l.remove();});[['icon','32x32','${ico32}'],['apple-touch-icon','180x180','${ico180}']].forEach(function(a){var l=document.createElement('link');l.rel=a[0];l.type='image/png';l.sizes=a[1];l.href=a[2];l.dataset.guia='1';h.appendChild(l);});}catch(e){}})();</script>`;
const corpo = `<div id="app"></div>\n<script type="application/json" id="dados">${json}</script>\n<script>${js}</script>`;

fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
const full = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>Guia de Psicofármacos</title>\n${icones}\n${fonts}\n<style>${css}</style>\n</head>\n<body>\n${corpo}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(R, 'dist/guia-psicofarmacos.html'), full);
const art = `<title>Guia de Psicofármacos</title>\n${icones}\n${icoScript}\n${fonts}\n<style>${css}</style>\n${corpo}\n`;
fs.writeFileSync(path.join(R, 'dist/artifact.html'), art);
console.log(`OK: ${farmacos.length} fichas, ${classes.length} classes, ${pares.length} pares. ${avisos.length} avisos (use -v para listar). Tamanho: ${(full.length / 1024).toFixed(0)} KB`);
