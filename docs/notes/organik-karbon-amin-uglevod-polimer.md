# Izohlar: karbon-kislotalar, aminlar-oqsillar, uglevodlar, polimerlar

Generatorlar: `tools/seed/reactions/{karbon-kislotalar,aminlar-oqsillar,uglevodlar,polimerlar}.mjs`
(JSON fayllarni qayta yozadi). Qo'shilgan moddalar: `tools/seed/extra/{karbon-kislotalar,uglevodlar,polimerlar}.json`.

## Sonlar
| toifa | yozuv | o'rta | equation_free |
|---|---|---|---|
| karbon-kislotalar | 39 / 35 | 2 | 5 |
| aminlar-oqsillar | 20 / 20 | 4 | 9 |
| uglevodlar | 16 / 15 | 6 | 3 |
| polimerlar | 17 / 15 | 6 | 4 |

Hammasi validator va muvofiqlik testidan o'tadi. `equation_free` yozuvlar `engine: "rules"` bilan;
muvofiqlik testi ularni amalda tekshirmaydi (tenglama yo'q, cho'kma/gaz kuzatuvi null) — kimyogar qo'lda ko'rishi kerak.

## Qo'shilgan moddalar
- `C17H33Br2COOH` (9,10-dibromstearin kislota), `(C17H33Br2COO)3C3H5` — olein kislota / moy + Br2.
- `(C12H21O11)2Cu` — mis(II) saxarati (soddalashtirilgan formula, aq, ko'k).
- `achitqi` (formula_null) — bijg'ish katalizatori.
- `[C6H7O2(OH)3]n` — sellyuloza (tenglamada ishlatish uchun; quyidagi xatoga qarang). Bazada `(C6H10O5)n|sellyuloza` bilan dublikat.
- `(–CH2–CBr(CH3)–CHBr–CH2–)n` — bromlangan poliizopren.
- `(C6H5COO)2` — benzoil peroksid, radikal polimerlanish initsiatori (polimer-0001/2/3/10 `catalyst`).

## Dvigatel/ma'lumot muammolari
1. **Izomer izohi `C6H12O6(fruktoza)` / `(C6H10O5)n(sellyuloza)` tenglamada ishlamaydi**: `checkBalance` → `parseFormula` "Formulada tushunarsiz belgi". DATA_SCHEMA buni ruxsat etadi, `formula.js` ANNOT_RE esa faqat kons./suyult. kabi so'zlarni olib tashlaydi. Shu sababli saxaroza gidrolizi `C12H22O11 + H2O → C6H12O6 + C6H12O6` deb yozildi (dvigatel ikkala mahsulotni glyukoza deb oladi).
2. **Ko'p asosli kislota bitta pKa bilan (`sitrat`)**: limon kislota + 3 HCO3⁻ da bitta proton ko'chishida H3Cit → Cit³⁻ bo'ladi; zaryad saqlanmaydi, eritmada OH⁻ "paydo bo'ladi" (karbon-0037 muvofiqlikdan o'tadi, lekin hisob noto'g'ri).
3. **`candidateRecords` faqat idishdagi aniq zarracha kalitlari bo'yicha qidiradi**: yozuvdagi `C6H5COO⁻ + H⁺` kabi had boshqa shaklda (C6H5COOH) bo'lsa va H⁺ tugagan bo'lsa yozuv nomzod bo'lmaydi (karbon-0031 da HCl `excess` qilib chetlab o'tildi).
4. **Kislota-asos juftli yozuvlar "bo'sh aylanish"**: chap tomonda tizim shakli + uning qo'shma zarrachasi (`C6H5COOH + OH⁻`, `C17H35COOH + OH⁻`, `C6H5NH2 + H⁺`) bo'lsa, faqat qo'shma shakl bor eritmada ham yozuv har qadamda ishga tushadi (sof o'zgarishsiz, lekin `record` hodisasi chiqadi). Masalan benzoat + NaOH eritmasida karbon-0030 "ishlaydi" (aldegid-0003/0018, uglevod-0046 sinovlarida ko'rinadi). Bu yozuvlar kerak, chunki suvda erimaydigan qattiq kislota/suyuq anilin bilan umumiy qoida ishlamaydi.
5. **Bazadagi eruvchanlik**: `C6H5COOH` solubility=null (aslida kam eriydi, s_gL qiymatini kimyogar kiritsin) — shuning uchun qattiq benzoy kislota NaOH bilan qoidalar orqali reaksiyaga kirmaydi; `(H2NCH2COO)2Cu` solubility=null — mis glitsinat qattiq faza sifatida chiqadi (aslida ko'k eritma); `[H3NCH2COOH]Cl`, `H2NCH2COONa` dissotsilanmaydi (glitsinat/glitsiniy ionlari yo'q) — amin-0007/0008 da ionli tenglama qarshi-ionlar bilan yozilgan; eritma pH i noto'g'ri (~7).
6. **Kraxmal** solubility=R: dvigatel sovuq suvda ham eritadi (sakarid-0013 kleyster tajribasi faqat matnda).
7. Qaynash: hosil bo'lgan suyuq mahsulot (masalan monomer) qaynash nuqtasida idish haroratini "qisib qo'yadi" va harorat shartli yozuv to'xtaydi — depolimerlanishda monomer `↑` bilan yozildi.
8. Glyukoza + Cu(OH)2 sovuqda (sakarid-0002) equation_free: kompleks yozuvini record qilish qizdirilgandagi Cu2O yozuvini (sakarid-0003) bloklaydi (Cu(OH)2 va glyukozani oldin sarflaydi).

## Ataylab kiritilmagan
Sellyuloza nitratlari (piroksilin), oksalat kislota + KMnO4 (redoks toifasi), chumoli kislotaning H2SO4 bilan degidratlanishi (CO olish — gazlar toifasiga yaqin).
