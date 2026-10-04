# Yangi tajriba (reaksiya) qo'shish yo'riqnomasi

Reaksiyalar kod emas, ma'lumot. Yangi tajriba qo'shish uchun:

1. Tegishli toifa faylini oching: `frontend/lab/data/reactions/<toifa>.json` (toifalar ro'yxati — `tools/lib/validate.mjs`dagi `CATEGORIES`).
2. `reactions` massiviga yangi yozuv qo'shing (sxema — [DATA_SCHEMA.md](DATA_SCHEMA.md)). `id` — toifa prefiksi va keyingi tartib raqami (`redoks-0091`).
3. Tenglamadagi barcha moddalar bazada borligini tekshiring: `node tools/find_substance.mjs CH3CHO KMnO4`.
   Yo'q modda kerak bo'lsa, `tools/seed/extra/<toifa>.json` fayliga qisqa formatda qo'shing va `node tools/seed/build_base_data.mjs` ni ishga tushiring.
4. Tekshiring: `node tools/validate_data.mjs --consistency --category <toifa>`.
   Validator xatosi yoki muvofiqlik xatosi bo'lsa — tuzating. Xatoli yozuv katalogga kirmaydi.
5. Ko'rib chiqish jadvalini yangilang: `npm run review`.

## Qaysi `engine` qiymatini tanlash kerak

- Avval `"engine": "rules"` bilan sinab ko'ring. Agar muvofiqlik testi o'tsa — dvigatel bu reaksiyani umumiy qoidalardan (eruvchanlik jadvali, kislota-asos, faollik qatori, komplekslar, oksid + suv, elektroliz) o'zi chiqaradi va yozuv qoidalarni tekshirish vazifasini ham bajaradi.
- Agar umumiy qoida bu reaksiyani bermasa (termik parchalanish, organik reaksiya, eritmadagi oksidlanish-qaytarilish, konsentratsiyaga bog'liq mahsulot) — `"engine": "record"`. Dvigatel `ionic_net` (bo'lmasa `molecular`) tenglamasini bajaradi.

## Dvigatel moddalarni qanday ko'radi

- Eritmadagi kuchli elektrolitlar — ionlar (`Na⁺`, `SO4²⁻`, `MnO4⁻` ...). Shuning uchun eritmadagi reaksiyalar uchun `ionic_net` majburiy va unda ionlar yozilishi kerak.
- Kuchsiz kislota va asoslar (`CH3COOH`, `NH3`, `H2S`, `H2C2O4`, `H2CO3` ...) — kislota-asos tizimi shakllari. Yozuvda istalgan shakl yozilishi mumkin (`SO3²⁻` yoki `H2SO3`): dvigatel shu tizimning mavjud shaklidan foydalanib, protonlarni o'zi tenglashtiradi.
- `H⁺` talabini eritmadagi kuchli va o'rtacha kislotalar (pKa < 7,5) qondiradi.
- Gazlar: tenglamada `↑` bilan belgilang. Qattiq cho'kma — `↓`. Quruq probirkada qizdirishda ajraladigan suv bug'ini `H2O↑` deb yozing (aks holda u eritma sifatida qoladi).
- Suvda aralashmaydigan organik suyuqliklar (`miscible_water: false`) alohida organik qatlam hosil qiladi; brom va yod shu qatlamga o'tadi.
- Reaktivlar `state` maydoni: `aq` (eritma, `conc_M` bilan), `s` (qattiq), `l` (toza suyuqlik), `g` (gaz — suyuqlik orqali o'tkaziladi yoki idishga to'ldiriladi).

## Shartlar

| Maydon | Ma'nosi |
|--------|---------|
| `temp_min_C` | reaksiya shu haroratdan boshlanadi (masalan, quruq tuzlarni parchalash 200–600 °C). `heating: true` va son berilmasa — 60 °C |
| `temp_max_C` | shu haroratdan yuqorida ketmaydi (sovuqda passivlanish va h.k.) |
| `catalyst` | idishda bo'lishi kerak bo'lgan modda (sarflanmaydi) |
| `medium` | `kislotali` (pH < 4,5), `neytral`, `ishqoriy` (pH > 10) |
| `light` | yorug'lik kerak (UB lampa) |
| `ignition`, `ignition_C` | modda yondirilishi kerak |
| `reactants[].conc_min_M` / `conc_max_M` | konsentratsiya oralig'i (kons./suyult. kislotalar) |

Bir xil boshlang'ich moddalar uchun bir nechta yozuv bo'lishi mumkin (masalan, Cu + HNO₃: konsentrlangan va suyultirilgan) — shartlar kesishmasligi kerak.

## Reaksiya ketmaydigan holat

```json
"engine": "record", "no_reaction": true, "match": ["Cu", "H⁺"],
"equation": {"molecular": null, "ionic_full": null, "ionic_net": null}
```

`match` — idishda bo'lganda shu tushuntirish ko'rsatiladigan zarrachalar. Sabab `explanation_uz` da yoziladi.

## Sifat talablari

- Matnlar o'zbek tilida (lotin), maktab darsliklaridagi atamalar bilan.
- Aniq bilmagan son qiymatini (ΔH, Ksp, potensial) to'qimang — sifat darajasini yozing (`kuchli ekzotermik`, `kam eriydi`).
- Mahsulot, sharoit yoki kuzatiladigan hodisaga to'liq ishonchingiz bo'lmasa — `"confidence": "o'rta"`.
- Portlovchi moddalar, zaharlovchi jangovar moddalar va giyohvand moddalarni tayyorlash tajribalari kiritilmaydi.
