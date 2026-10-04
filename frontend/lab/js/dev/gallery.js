// Ishlab chiquvchi uchun: barcha jihozlarni stolda panjara ko'rinishida chiqaradi (?gallery=1)
import * as THREE from 'three';
import { buildEquipment } from '../scene/models/equipment.js';
import { BENCH } from '../scene/room.js';

export async function gallery(lab, filter) {
  const eq = await (await fetch('data/equipment.json')).json();
  let items = eq.items;
  if (filter) items = items.filter((i) => i.category === filter);
  const cols = Math.ceil(Math.sqrt(items.length * 2.2));
  items.forEach((def, i) => {
    const r = buildEquipment(def, def.sizes[def.sizes.length > 1 ? 1 : 0]);
    const x = (i % cols) - cols / 2, z = Math.floor(i / cols);
    r.group.position.set(x * 0.2, BENCH.y, BENCH.zc - 0.35 + z * 0.2);
    lab.world.add(r.group);
  });
  lab.camera.position.set(0, BENCH.y + 1.0, BENCH.zc + 1.2);
  lab.controls.target.set(0, BENCH.y, BENCH.zc + 0.1);
}
