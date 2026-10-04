// equipment_data.mjs -> frontend/lab/data/equipment.json va ports.json
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EQUIPMENT, PORT_TYPES, PORT_COMPAT, SHLIF_D } from './equipment_data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CAT_UZ = { shisha: 'Shisha idishlar', chinni: 'Chinni va boshqa idishlar', qizdirish: 'Qizdirish asboblari', mahkamlash: 'Mahkamlash', olchash: "O'lchash asboblari", elektrokimyo: 'Elektrokimyo', yordamchi: 'Yordamchi buyumlar', himoya: 'Himoya vositalari' };
const items = EQUIPMENT.map((e) => {
  const variants = e.sizes || [{ id: 'standart', label: null, capacity_mL: e.vessel?.capacity_mL, p: e.p || {} }];
  const out = {
    id: e.id, name_uz: e.name_uz, category: e.cat, builder: e.builder, desc_uz: e.desc_uz || null,
    sizes: variants.map((s) => ({ id: s.id, label: s.label, params: s.p, capacity_mL: s.capacity_mL ?? e.vessel?.capacity_mL ?? null, ports: e.ports(s.p) })),
  };
  for (const k of ['vessel', 'heater', 'instrument', 'electrode', 'tool', 'flexible', 'clampHose', 'filter', 'pump', 'light', 'safety']) if (e[k] !== undefined) out[k] = e[k];
  return out;
});
const ids = new Set();
for (const i of items) { if (ids.has(i.id)) throw new Error('takroriy jihoz: ' + i.id); ids.add(i.id); }
writeFileSync(join(root, 'frontend/lab/data/equipment.json'), JSON.stringify({ categories: CAT_UZ, items }, null, 1));
writeFileSync(join(root, 'frontend/lab/data/ports.json'), JSON.stringify({ types: PORT_TYPES, compat: PORT_COMPAT.map(([a, b, rule, sealed]) => ({ a, b, rule, sealed })), shlif_d_mm: SHLIF_D }, null, 1));
console.log('jihozlar:', items.length);
