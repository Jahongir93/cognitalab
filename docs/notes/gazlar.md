# gazlar — muallif izohlari

Generator: `tools/seed/reactions/gazlar.mjs` (JSON shu skriptdan yasaladi; qo'lda tahrir qilmang).
44 yozuv (maqsad 40). Tayyorlash yozuvlarida `collection` maydoni bor.

## Dvigatel cheklovlari va aylanib o'tishlar
- **CO₂ + suv + lakmus** yozuvi olib tashlandi: muvofiqlik testida suv 3 ml, CO₂ eruvchanligi (sol_M 0,033) kichik —
  H₂CO₃ uchib ketadi va mahsulot tekshiruvi yiqiladi. O'rniga `Mg + CO₂` (yonish) qo'shildi.
- **NaCl + H₂SO₄(kons.) → HCl**: kuchli kislotalarning uchuvchanligi modellanmagan, shuning uchun ionli yozuv
  `Cl⁻ + H2SO4 = HSO4⁻ + HCl↑` (H₂SO₄ ≥ 16 M). NaHSO₄ kristallanganda `concOf(H2SO4)` keskin tushadi,
  shuning uchun kinetika `tez` va qizdirish sharti qo'yilmagan (reaksiya xona haroratida ham boradi).
- **SO₂ + KMnO₄**: mahsulot H₂SO₄ tekshiruvi erkin H⁺ talab qiladi; H⁺ to'liq HSO₄⁻ ga bog'lanib ketgani uchun
  KMnO₄ eritmasi sulfat kislota bilan kislotalangan (`excess: true`) — maktab amaliyotiga mos.
- **NH₃ favvorasi** `equation_free`: NH₃ + H₂O ⇄ NH₄⁺ + OH⁻ muvozanati idish tarkibida aks etmaydi (OH⁻ yo'q),
  shuning uchun mahsulot tekshiruvi o'tmaydi. HCl favvorasi esa `HCl = H⁺ + Cl⁻` bilan (ogohlantirish: molekulyar
  tenglamada zaryad).
- **gazolish-0041 (etanoldan etilen, 170 °C)** o'z toifasida o'tadi, lekin to'liq katalogda yiqiladi:
  `spirt-0007` (2C₂H₅OH → efir, 140 °C) da `temp_max_C` yo'q va u bir xil chap tomonli guruhda qizish paytida
  etanolni oldinroq sarflab qo'yadi; `polimer-0001` (etilen polimerlanishi, ≥200 °C, initsiatorsiz) esa hosil
  bo'lgan etilenni polietilenga aylantiradi. Taklif: spirt-0007 ga `temp_max_C: 160`, polimer-0001 ga katalizator/
  initsiator sharti.

## Boshqa toifalarga ta'sir (global yozuvlar)
Yozuvlar chap tomoni umumiy bo'lmasligi uchun shartlar qo'yilgan (yondirish, harorat, katalizator, konsentratsiya,
`medium`). E'tibor: metall ishtirokidagi yozuvlar (Fe + O₂, Cu + Cl₂, Mg + CO₂) idishda shu gaz bo'lsa, hatto
yondirish/harorat sharti bajarilmasa ham shu metall uchun umumiy metall qoidalarini bloklaydi
(`chemistry.js` `#records`: `_recordMetals`).
