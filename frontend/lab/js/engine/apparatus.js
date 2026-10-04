// Asbob grafi: jihozlar (tugunlar) va port ulanishlari (qirralar). DOM va Three.js'siz — Node'da test qilinadi.
//
// Graf: { nodes: Map<id, {id, def, size}>, edges: [{a:{node,port}, b:{node,port}, sealed}] }
// def — equipment.json elementi, size — tanlangan o'lcham (ports bilan).

export class ApparatusGraph {
  /** @param {{compat: {a:string,b:string,rule:string|null,sealed:boolean}[], shlif_d_mm:Object}} portsData */
  constructor(portsData) {
    this.compat = portsData.compat;
    this.shlifD = portsData.shlif_d_mm || {};
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(id, def, size) { this.nodes.set(id, { id, def, size }); }
  removeNode(id) {
    this.nodes.delete(id);
    this.edges = this.edges.filter((e) => e.a.node !== id && e.b.node !== id);
  }

  portDef(nodeId, portId) {
    const n = this.nodes.get(nodeId);
    return n?.size?.ports?.find((p) => p.id === portId) || null;
  }

  /** Ikki port ulanadimi; ulansa {ok, sealed, reason} */
  canConnect(na, pa, nb, pb) {
    if (na === nb) return { ok: false, reason: "Jihozni o'ziga ulab bo'lmaydi" };
    const A = this.portDef(na, pa), Bp = this.portDef(nb, pb);
    if (!A || !Bp) return { ok: false, reason: "Port topilmadi" };
    if (!A.multi && this.connectionsOf(na, pa).length) return { ok: false, reason: 'Port band' };
    if (!Bp.multi && this.connectionsOf(nb, pb).length) return { ok: false, reason: 'Port band' };
    const rule = this.compat.find((c) => (c.a === A.type && c.b === Bp.type) || (c.b === A.type && c.a === Bp.type));
    if (!rule) return { ok: false, reason: 'Bu qismlar bir-biriga ulanmaydi' };
    if (rule.rule === 'diameter') {
      const mouth = A.type === 'ogiz' ? A : Bp;
      const plug = A.type === 'ogiz' ? Bp : A;
      const d = mouth.d_mm;
      if (plug.type === 'tiqin' && d !== undefined && (d < plug.d_min || d > plug.d_max)) {
        return { ok: false, reason: `Tiqin o'lchami mos emas (og'iz ${Math.round(d)} mm, tiqin ${plug.d_min}–${plug.d_max} mm)` };
      }
    }
    if (rule.rule === 'size' && A.size !== Bp.size) return { ok: false, reason: `Shlif o'lchamlari mos emas (${A.size} va ${Bp.size})` };
    if (rule.rule === 'diameter-shlif') {
      const mouth = A.type === 'ogiz' ? A : Bp, cone = A.type === 'ogiz' ? Bp : A;
      const d = this.shlifD[cone.size];
      if (mouth.d_mm !== undefined && d !== undefined && Math.abs(mouth.d_mm - d) > 3) return { ok: false, reason: 'Shlif og\'izga mos emas' };
    }
    return { ok: true, sealed: !!rule.sealed && !!(A.seal || Bp.seal || rule.sealed) };
  }

  connect(na, pa, nb, pb) {
    const r = this.canConnect(na, pa, nb, pb);
    if (!r.ok) return r;
    this.edges.push({ a: { node: na, port: pa }, b: { node: nb, port: pb }, sealed: r.sealed });
    return r;
  }

  disconnect(nodeId, portId = null) {
    this.edges = this.edges.filter((e) => !((e.a.node === nodeId && (!portId || e.a.port === portId)) || (e.b.node === nodeId && (!portId || e.b.port === portId))));
  }

  connectionsOf(nodeId, portId = null) {
    const out = [];
    for (const e of this.edges) {
      if (e.a.node === nodeId && (!portId || e.a.port === portId)) out.push({ self: e.a, other: e.b, edge: e });
      if (e.b.node === nodeId && (!portId || e.b.port === portId)) out.push({ self: e.b, other: e.a, edge: e });
    }
    return out;
  }

  /** Idishning ochiq og'izlari (gaz chiqadigan joylar) */
  openings(nodeId) {
    const n = this.nodes.get(nodeId);
    if (!n) return [];
    return (n.size?.ports || []).filter((p) => ['ogiz', 'shlif-urgochi', 'naycha-uchi', 'shtutser'].includes(p.type));
  }

  /**
   * Idishdan chiqayotgan gazning yo'li.
   * @returns {{sealed:boolean, exits:{type:string, node?:string, port?:string, path:string[]}[]}}
   *   exit turlari: 'havo' (ochiq), 'idish' (boshqa idish og'ziga tushirilgan naycha), 'suv-osti' (pnevmatik vanna),
   *   'yiggich' (ag'darilgan yig'gich idish), 'yopiq' (tiqin bilan berk)
   */
  gasRoute(nodeId) {
    const exits = [];
    let sealed = true;
    for (const op of this.openings(nodeId)) {
      const cons = this.connectionsOf(nodeId, op.id);
      if (!cons.length) { exits.push({ type: 'havo', port: op.id, path: [nodeId] }); sealed = false; continue; }
      for (const c of cons) {
        const sub = this.#follow(c.other.node, c.other.port, [nodeId], new Set([nodeId]));
        for (const s of sub) { exits.push(s); if (s.type !== 'yopiq') sealed = false; }
      }
    }
    return { sealed, exits };
  }

  /** Port orqali kirgan gazni keyingi jihozlar bo'ylab kuzatish */
  #follow(nodeId, inPort, path, seen) {
    const n = this.nodes.get(nodeId);
    if (!n || seen.has(nodeId)) return [{ type: 'yopiq', path }];
    seen = new Set(seen); seen.add(nodeId);
    path = [...path, nodeId];
    const inDef = this.portDef(nodeId, inPort);
    const def = n.def;
    // gaz o'tkazadigan jihozlar: tiqin (teshiklar), naycha, shlang, sovutgich, alonj, xlorkalsiyli naycha, Dreksel
    if (inDef && ['ogiz', 'yiggich-joyi'].includes(inDef.type) && def.vessel) {
      // naycha boshqa idish og'ziga tushirilgan
      return [{ type: def.vessel.trough ? 'suv-osti' : 'idish', node: nodeId, port: inPort, path }];
    }
    if (inDef && inDef.type === 'suv-osti') {
      const collector = this.connectionsOf(nodeId).find((c) => this.portDef(nodeId, c.self.port)?.type === 'yiggich-joyi');
      return [{ type: collector ? 'yiggich' : 'suv-osti', node: collector ? collector.other.node : nodeId, trough: nodeId, path }];
    }
    if (def.vessel?.gasWash && inPort === 'kirish') {
      const outCons = this.connectionsOf(nodeId, 'chiqish');
      const wash = { type: 'yuvish', node: nodeId, path };
      if (!outCons.length) return [wash, { type: 'havo', path: [...path] }];
      return [wash, ...outCons.flatMap((c) => this.#follow(c.other.node, c.other.port, path, seen))];
    }
    const others = (n.size?.ports || []).filter((p) => p.id !== inPort && !['qisqich-joyi', 'tub', 'halqa-joyi', 'probirka-tanasi', 'suv-kirish', 'suv-chiqish', 'klemma'].includes(p.type) && !['suv-kirish', 'suv-chiqish', 'qisqich'].includes(p.id));
    if (def.id.startsWith('rezina-tiqin') || def.id.startsWith('shlif-tiqin')) {
      const holes = others.filter((p) => p.type === 'tiqin-teshik');
      if (!holes.length) return [{ type: 'yopiq', path }];
      const res = [];
      for (const h of holes) {
        const cons = this.connectionsOf(nodeId, h.id);
        if (!cons.length) { res.push({ type: 'havo', path, port: h.id }); continue; }
        for (const c of cons) res.push(...this.#follow(c.other.node, c.other.port, path, seen));
      }
      return res;
    }
    const res = [];
    for (const p of others) {
      const cons = this.connectionsOf(nodeId, p.id);
      if (!cons.length) { res.push({ type: 'havo', path, node: nodeId, port: p.id, condenser: def.builder === 'sovutgich' }); continue; }
      for (const c of cons) res.push(...this.#follow(c.other.node, c.other.port, path, seen));
    }
    return res.length ? res : [{ type: 'yopiq', path }];
  }

  /** Yo'lda sovutgich bormi (haydash uchun) */
  hasCondenser(path) {
    return path.some((id) => this.nodes.get(id)?.def.builder === 'sovutgich');
  }

  serialize() {
    return { nodes: [...this.nodes.values()].map((n) => ({ id: n.id, def: n.def.id, size: n.size?.id })), edges: this.edges };
  }
}

/**
 * Gaz yig'ish usulining to'g'riligi.
 * @param {{rel_density_air:number, water_solubility:string}} gas
 * @param {'suv-osti'|'havo-yuqoriga'|'havo-pastga'} method
 * @returns {{ok:boolean, efficiency:number, reason_uz:string}}
 */
export function collectionCheck(gas, method) {
  if (!gas) return { ok: true, efficiency: 1, reason_uz: '' };
  const d = gas.rel_density_air ?? 1;
  const ws = gas.water_solubility;
  if (method === 'suv-osti') {
    if (ws === 'juda-yaxshi' || ws === 'yaxshi' || ws === 'reaksiya') return { ok: false, efficiency: 0, reason_uz: "Bu gaz suvda juda yaxshi eriydi (yoki suv bilan reaksiyaga kirishadi) — uni suv ostida yig'ib bo'lmaydi: gaz eriydi va suv naychaga so'riladi." };
    if (ws === "o'rtacha") return { ok: true, efficiency: 0.6, reason_uz: "Gaz suvda qisman eriydi — yig'ish mumkin, lekin bir qismi yo'qoladi." };
    return { ok: true, efficiency: 0.97, reason_uz: '' };
  }
  if (method === 'havo-yuqoriga') {
    if (d > 1.05) return { ok: true, efficiency: 0.9, reason_uz: '' };
    if (d < 0.95) return { ok: false, efficiency: 0.05, reason_uz: "Gaz havodan yengil — og'zi yuqoriga qaratilgan idishdan chiqib ketadi. Idishni ag'darib (og'zini pastga qaratib) yig'ing." };
    return { ok: true, efficiency: 0.5, reason_uz: "Gaz zichligi havonikiga yaqin — havo siqib chiqarish usuli samarasiz, suv ostida yig'ish yaxshiroq." };
  }
  if (method === 'havo-pastga') {
    if (d < 0.95) return { ok: true, efficiency: 0.9, reason_uz: '' };
    if (d > 1.05) return { ok: false, efficiency: 0.05, reason_uz: "Gaz havodan og'ir — og'zi pastga qaratilgan idishdan to'kilib ketadi. Idish og'zini yuqoriga qarating." };
    return { ok: true, efficiency: 0.5, reason_uz: "Gaz zichligi havonikiga yaqin — havo siqib chiqarish usuli samarasiz." };
  }
  return { ok: true, efficiency: 1, reason_uz: '' };
}

/** Bosim chegaralari (atm): ogohlantirish va tiqin otilishi */
export const PRESSURE_WARN = 1.4;
export const PRESSURE_POP = 1.9;
