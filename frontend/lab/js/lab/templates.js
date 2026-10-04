// Tayyor asbob andozalari (data/templates.json): avtomatik yig'ish va qo'lda yig'ishni tekshirish.
// Sof mantiq — DOM va Three.js'siz, Node'da soxta stol (faqat ApparatusGraph) bilan test qilinadi.
//
// `bench` duck-typed:
//   items: Map<id, {id, def:{id, vessel?}, size?:{id}, reagent?:{id}, flags?, parentLink?}>
//   graph: ApparatusGraph (edges: [{a:{node,port}, b:{node,port}}])
//   add(defId, {sizeId, x, z, reagent}) -> item
//   connect(a, pa, b, pb, {moveB, depth, slide, offset}) -> {ok, reason?}
//   placeBelow?(a, pa, b, pb)          (ixtiyoriy: 3D stolda b ni a porti ostiga suradi)
//   fillReagent?(item, reagent)        (ixtiyoriy: idishga qo'shimcha reaktiv)
//   def?(defId) -> equipment.json elementi (nomlar uchun)

/**
 * Bir jihozning o'zaro almashinadigan portlari (qo'lda yig'ishda qaysi uchi ulangani farq qilmaydi).
 * Dreksel sklyankasining kirish/chiqishi va sovutgich suvining kirish/chiqishi ataylab bu ro'yxatda yo'q —
 * ularni almashtirib ulash klassik xato.
 */
export const SYMMETRIC_PORTS = {
  'rezina-shlang': [['a', 'b']],
  simlar: [['a', 'b']],
  'tuz-koprigi': [['a', 'b']],
  'gaz-naycha-togri': [['a', 'b']],
  'gaz-naycha-egilgan': [['a', 'b']],
  'u-simon-naycha': [['chap', 'ong']],
  'elektrolizyor-u': [['anod-joyi', 'katod-joyi']],
  'gofman-apparati': [['anod-joyi', 'katod-joyi']],
  'probirka-shtativi': [['uya1', 'uya2', 'uya3', 'uya4', 'uya5', 'uya6']],
  'uch-bogizli-kolba': [['yon-bogiz', 'yon-bogiz-2']],
  ...Object.fromEntries(['kichik', 'orta', 'katta'].map((s) => [`rezina-tiqin-2-teshikli-${s}`, [['teshik1', 'teshik2']]])),
};

/** defId ning port bilan almashinadigan portlari to'plami */
function portAlternatives(defId, port) {
  for (const group of SYMMETRIC_PORTS[defId] || []) if (group.includes(port)) return group;
  return [port];
}

const reagentsOf = (it) => (Array.isArray(it.reagent) ? it.reagent : it.reagent ? [it.reagent] : []);

/**
 * Andozani stolga avtomatik yig'ish.
 * Jihozlar `items` tartibida qo'yiladi, keyin `connections` tartibida ulanadi (b jihozi a ning portiga ko'chadi).
 * `move: false` ulanishda b joyida qoladi va (bench.placeBelow bo'lsa) a porti ostiga suriladi.
 * @param {object} bench
 * @param {object} template templates.json elementi
 * @param {{anchor?:{x:number, z:number}}} [o]
 * @returns {{items: Map<string, object>, errors: {kind:string, key?:string, index?:number, reason:string}[]}}
 */
export function assembleTemplate(bench, template, { anchor = { x: 0, z: 0 } } = {}) {
  const items = new Map();
  const errors = [];
  for (const it of template.items) {
    try {
      const [first, ...rest] = reagentsOf(it);
      const o = { sizeId: it.size, x: anchor.x + (it.pos?.[0] ?? 0), z: anchor.z + (it.pos?.[1] ?? 0) };
      if (first) o.reagent = first;
      const item = bench.add(it.def, o);
      for (const r of rest) bench.fillReagent?.(item, r);
      if (it.flags) item.flags = { ...(item.flags || {}), ...it.flags };
      items.set(it.key, item);
    } catch (e) {
      errors.push({ kind: 'item', key: it.key, reason: e?.message || String(e) });
    }
  }
  template.connections.forEach((c, index) => {
    const A = items.get(c.a), B = items.get(c.b);
    if (!A || !B) { errors.push({ kind: 'connection', index, reason: `Jihoz yo'q: ${!A ? c.a : c.b}` }); return; }
    const opts = { moveB: c.move !== false };
    if (c.depth !== undefined) opts.depth = c.depth;
    if (c.slide !== undefined) opts.slide = c.slide;
    if (c.offset !== undefined) opts.offset = c.offset;
    let r;
    try { r = bench.connect(A, c.pa, B, c.pb, opts); } catch (e) { r = { ok: false, reason: e?.message || String(e) }; }
    if (!r?.ok) { errors.push({ kind: 'connection', index, reason: r?.reason || 'ulanmadi' }); return; }
    if (c.move === false && typeof bench.placeBelow === 'function') bench.placeBelow(A, c.pa, B, c.pb);
  });
  return { items, errors };
}

/** Stol jihozi andoza elementiga mos keladimi (jihoz turi; reaktiv sklyankasi bo'lsa — reaktiv ham) */
function compatible(tItem, bItem) {
  if (bItem.def?.id !== tItem.def) return false;
  const r = reagentsOf(tItem)[0];
  if (r && bItem.def.vessel?.bottle) return bItem.reagent?.id === r.id;
  return true;
}

/**
 * Andoza kalitlarini stoldagi jihozlarga moslash: ulanishlar bo'yicha eng ko'p mos kelishini topadi
 * (kichik graflar uchun chegaralangan to'liq qidiruv), keyin qolgan kalitlarni jihoz turi bo'yicha to'ldiradi.
 * @returns {{assign: Map<string,string>, satisfied: boolean[]}}
 */
export function matchAssembly(bench, template) {
  const tItems = new Map(template.items.map((i) => [i.key, i]));
  const benchItems = [...bench.items.values()];
  const byId = new Map(benchItems.map((i) => [i.id, i]));
  const edges = bench.graph?.edges || [];
  const conns = template.connections;

  // har bir andoza ulanishi uchun mos keladigan stol qirralari: [aNode, bNode]
  const cand = conns.map((c) => {
    const ta = tItems.get(c.a), tb = tItems.get(c.b);
    if (!ta || !tb) return [];
    const altA = portAlternatives(ta.def, c.pa), altB = portAlternatives(tb.def, c.pb);
    const out = [];
    for (const e of edges) {
      for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) {
        const X = byId.get(x.node), Y = byId.get(y.node);
        if (!X || !Y || X === Y) continue;
        if (!compatible(ta, X) || !compatible(tb, Y)) continue;
        if (!altA.includes(x.port) || !altB.includes(y.port)) continue;
        out.push([x.node, y.node]);
      }
    }
    return out;
  });

  const assign = new Map(); // kalit -> stol id
  const used = new Map(); // stol id -> kalit
  let best = { score: -1, assign: new Map(), sat: conns.map(() => false) };
  const sat = conns.map(() => false);
  let budget = 200000;

  const tryBind = (key, node, bound) => {
    const cur = assign.get(key);
    if (cur !== undefined) return cur === node;
    const owner = used.get(node);
    if (owner !== undefined && owner !== key) return false;
    assign.set(key, node); used.set(node, key); bound.push(key);
    return true;
  };
  const unbind = (bound) => { for (const k of bound) { used.delete(assign.get(k)); assign.delete(k); } };

  const search = (i, score) => {
    if (--budget < 0) return;
    if (score + (conns.length - i) <= best.score) return;
    if (i === conns.length) { best = { score, assign: new Map(assign), sat: [...sat] }; return; }
    const c = conns[i];
    for (const [x, y] of cand[i]) {
      const bound = [];
      if (tryBind(c.a, x, bound) && tryBind(c.b, y, bound)) {
        sat[i] = true;
        search(i + 1, score + 1);
        sat[i] = false;
      }
      unbind(bound);
      if (budget < 0) return;
    }
    search(i + 1, score);
  };
  search(0, 0);

  // ulanishsiz kalitlar: bo'sh qolgan mos jihozlar bilan (avval o'lchami ham mos keladigani)
  const finalAssign = best.assign;
  const taken = new Set(finalAssign.values());
  for (const t of template.items) {
    if (finalAssign.has(t.key)) continue;
    const pool = benchItems.filter((b) => !taken.has(b.id) && compatible(t, b));
    const pick = pool.find((b) => !t.size || b.size?.id === String(t.size)) || pool[0];
    if (pick) { finalAssign.set(t.key, pick.id); taken.add(pick.id); }
  }
  return { assign: finalAssign, satisfied: best.sat };
}

/**
 * Stolda yetishmayotgan andoza jihozlari.
 * @returns {{key:string, def:string, size?:string, name_uz:string, reagent?:object}[]}
 */
export function missingItems(bench, template, match = null) {
  const { assign } = match || matchAssembly(bench, template);
  return template.items.filter((t) => !assign.has(t.key)).map((t) => ({
    key: t.key, def: t.def, size: t.size, name_uz: itemName(bench, t), reagent: reagentsOf(t)[0] || null,
  }));
}

function itemName(bench, t) {
  const d = typeof bench.def === 'function' ? bench.def(t.def) : bench.defs?.get?.(t.def);
  return t.role_uz || d?.name_uz || t.def;
}

/** Qadam tekshiruvidagi ulanish indekslari va kalitlar */
function stepRefs(check = {}) {
  const conns = [...(check.connections || []), ...(check.connection !== undefined ? [check.connection] : [])];
  const keys = [...(check.items || []), ...(check.item !== undefined ? [check.item] : [])];
  return { conns, keys };
}

/**
 * Qo'lda yig'ish ro'yxati: har bir qadam bajarilganmi (stoldagi jihozlar va ulanishlar bo'yicha, kalitlardan qat'i nazar).
 * @returns {{index:number, step:object, text_uz:string, done:boolean, hint_uz:string}[]}
 */
export function checkAssembly(bench, template) {
  const match = matchAssembly(bench, template);
  const { assign, satisfied } = match;
  const tItems = new Map(template.items.map((i) => [i.key, i]));
  const name = (key) => { const t = tItems.get(key); return t ? itemName(bench, t) : key; };
  return (template.steps_uz || []).map((step, index) => {
    const { conns, keys } = stepRefs(step.check);
    const missKeys = keys.filter((k) => !assign.has(k));
    const missConns = conns.filter((i) => !satisfied[i]);
    const done = (conns.length + keys.length) > 0 && !missKeys.length && !missConns.length;
    let hint = '';
    if (!done) {
      const absent = [...missKeys, ...missConns.flatMap((i) => [template.connections[i]?.a, template.connections[i]?.b])]
        .filter((k, j, arr) => k && !assign.has(k) && arr.indexOf(k) === j);
      if (absent.length) hint = `Stolga qo'ying: ${absent.map(name).join(', ')}`;
      else if (step.hint_uz) hint = step.hint_uz;
      else if (missConns.length) {
        const c = template.connections[missConns[0]];
        hint = `«${name(c.a)}» ga «${name(c.b)}» ni ulang`;
      }
    }
    return { index, step, text_uz: step.text_uz, done, hint_uz: hint };
  });
}
