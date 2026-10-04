# sifat-reaksiyalari — muallif izohlari

Generator: `tools/seed/reactions/sifat-reaksiyalari.mjs`. 60 yozuv (maqsad 60), shundan 7 tasi alanga sinovi
(`flame_test`, rang `ions.json` dan olinadi). Qo'shilgan modda: `HMnO4` (`tools/seed/extra/sifat-reaksiyalari.json`,
Mn²⁺ + PbO₂ reaksiyasining molekulyar tenglamasi uchun).

## Izohlar
- **Ni²⁺ + dimetilglioksim**: NH₃ reaktiv sifatida qo'shilmagan — dvigatelda NH₃ yozuvlardan oldin Ni(OH)₂ /
  [Ni(NH₃)₆]²⁺ hosil qiladi va yozuv ishga tushmaydi. Tenglama `Ni²⁺ + 2C4H8N2O2 = Ni(C4H7N2O2)2↓ + 2H⁺`,
  ammiakning roli `note_uz` va matnda.
- **Cr³⁺ → CrO₄²⁻**: reaktiv sifatida tayyor `Na3[Cr(OH)6]` eritmasi olingan (Cr³⁺ ishqorda avval
  gidroksokompleksga o'tadi; yozuv shu shakl bilan ishlaydi).
- **NO₃⁻ + Cu + H₂SO₄** (`o'rta`): `engine: rules` — Cu + NO₃⁻ + H⁺ jarayonini dvigatelda gazlar toifasidagi
  suyultirilgan HNO₃ yozuvi bajaradi (takroriy yozuv yaratmaslik uchun). Mahsulot NO (havoda NO₂ ga aylanadi).
  Konsentrlangan H₂SO₄ + qattiq KNO₃ varianti dvigatelda ishlamadi (KHSO₄/KNO₃ kristallanadi, konsentratsiya
  shartlari buziladi).
- **I₂ + kraxmal** — `equation_free` (stexiometrik tenglamasiz kiritma birikma).
- Tiosulfat (S₂O₃²⁻ + H⁺) va MgNH₄PO₄ (Mg²⁺) kiritilmadi: birinchisi kinetika toifasida bor bo'lishi ehtimoli
  yuqori (bir xil chap tomonli yozuvlar raqobatlashadi), ikkinchisida NH₃ Mg(OH)₂ ni yozuvdan oldin cho'ktiradi.
- `o'rta`: Co²⁺ + NaOH (oraliq ko'k asosli tuz), NO₃⁻ sinovi, CH₃COO⁻ sinovi.
