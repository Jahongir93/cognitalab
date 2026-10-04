// "Nega reaksiya bormadi?" — idish tarkibi bo'yicha tushuntirish (DOM'siz).

const COND_TEXT = {
  qizdirish: (u) => `Reaksiya uchun qizdirish kerak (taxminan ${u.need} °C dan yuqori).`,
  sovuq: (u) => `Bu reaksiya faqat ${u.need} °C dan past haroratda boradi.`,
  katalizator: (u, db) => `Katalizator kerak: ${db.nameOf(u.need)}.`,
  "yorug'lik": () => "Reaksiya yorug'likda (UB nurlanishda) boradi — yoritgichni yoqing.",
  yondirish: (u) => `Moddani yondirish kerak (taxminan ${u.need} °C).`,
  muhit: (u) => `Kerakli muhit: ${u.need}.`,
  tok: () => "Elektr toki kerak (elektroliz).",
  'konsentratsiya-past': (u, db) => `${db.nameOf(u.species)} konsentratsiyasi yetarli emas (kamida ${u.need} M kerak, hozir ${u.have.toFixed(1)} M).`,
  'konsentratsiya-yuqori': (u, db) => `${db.nameOf(u.species)} juda konsentrlangan (${u.need} M dan suyultirilgan bo'lishi kerak).`,
};

/**
 * @param {import('./chemistry.js').Chemistry} chem
 * @param {any} v idish
 * @returns {string[]} sabablar (o'zbekcha)
 */
export function explainNoReaction(chem, v) {
  const db = chem.db;
  const out = [];
  // 1) aniq "reaksiya ketmaydi" yozuvlari
  for (const r of chem.candidateRecords(v)) {
    if (!r.no_reaction) continue;
    const m = chem.matchRecord(v, r);
    if (m.ok) out.push(r.explanation_uz);
  }
  // 2) shartlari bajarilmagan yozuvlar
  for (const p of chem.pendingReasons(v)) {
    const r = db.reactionById.get(p.id);
    if (!r || r.no_reaction) continue;
    const parts = (p.unmet || []).map((u) => COND_TEXT[u.code]?.(u, db)).filter(Boolean);
    if (parts.length) out.push(`${r.title_uz}: ${parts.join(' ')}`);
  }
  if (out.length) return [...new Set(out)];
  // 3) umumiy qoidalar bo'yicha
  const aq = chem.inPhase(v, 'aq').filter(([id, n]) => n > 1e-9);
  const solids = chem.inPhase(v, 's').filter(([, n]) => n > 1e-9);
  const metals = solids.filter(([id]) => db.sub(id)?.metal);
  const cations = aq.filter(([id]) => db.isIon(id) && db.ions[id].charge > 0 && id !== 'H^+');
  const hasAcid = chem.protonSupply(v) > 1e-9;
  for (const [m] of metals) {
    const md = db.sub(m).metal;
    if (hasAcid && md.E0 > 0) out.push(`${cap(db.nameOf(m))} faollik qatorida vodoroddan keyin turadi — u kislotadan vodorodni siqib chiqara olmaydi.`);
    for (const [c] of cations) {
      const red = db.reducible.find((x) => x.ion === c);
      if (red && red.E <= md.E0 + 0.1 && red.to !== m) out.push(`${cap(db.nameOf(m))} ${db.nameOf(red.to)}dan faolroq emas — uni ${db.ions[c].display} tuzidan siqib chiqara olmaydi.`);
    }
    if (md.film && !hasAcid) out.push(`${cap(db.nameOf(m))} sirtidagi himoya oksid pardasi reaksiyaga to'sqinlik qiladi.`);
  }
  for (const [s] of solids) {
    const sb = db.sub(s);
    if (sb?.acid_soluble === null && hasAcid && sb.solubility === 'N' && !sb.metal) out.push(`${cap(db.nameOf(s))} kislotalarda ham erimaydi.`);
  }
  if (!out.length && aq.length) {
    const ions = aq.filter(([id]) => db.isIon(id) && id !== 'H^+' && id !== 'OH^-');
    if (ions.length >= 3) out.push("Barcha mumkin bo'lgan mahsulotlar suvda eriydigan kuchli elektrolitlar: cho'kma, gaz yoki kuchsiz elektrolit (suv) hosil bo'lmaydi — ionlar eritmada o'zgarishsiz qoladi, reaksiya bormaydi.");
  }
  if (!out.length) out.push("Bu moddalar bunday sharoitda o'zaro ta'sirlashmaydi (yoki model bu aralashmani hisoblamaydi).");
  return [...new Set(out)];
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
