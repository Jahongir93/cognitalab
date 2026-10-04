# Toifa: amfoter-kompleks — muallif izohlari

Generator: `node tools/seed/reactions/amfoter-kompleks.mjs` → `frontend/lab/data/reactions/amfoter-kompleks.json`.
JSON fayl qo'lda tahrirlanmaydi: o'zgarishlarni skriptga kiriting va uni qayta ishga tushiring.

**Holat:** 44 ta yozuv (maqsad 40). Validator xatosi 0, muvofiqlik testi 44/44. `o'rta` — 4 ta.
Dvigatel: 37 tasi `rules` (gidroksokomplekslar va ammiakatlar umumiy qoidalardan chiqadi), 7 tasi `record` (shundan 3 tasi `no_reaction`).

## Qo'shilgan moddalar (`tools/seed/extra/amfoter-kompleks.json`)

| Formula | Nomi | Izoh |
|---|---|---|
| Na2[Cu(OH)4] | natriy tetragidroksokuprat(II) | ion [Cu(OH)4]²⁻ bazada bor edi |
| [Ag(NH3)2]NO3 | diamminkumush(I) nitrat | AgNO3 + ortiqcha NH3 mahsuloti |

## `o'rta` yozuvlar

- **amfot-0027 — Fe(OH)3 suyultirilgan ishqorda erimaydi.**
  - `no_reaction` yozuvi, NaOH ≤ 6 M bo'lganda ishlaydi.
  - Konsentrlangan ishqorda gidroksoferrat hosil bo'lishi bazada yo'q (ion ham yo'q).
- **amfot-0029 — Cu(OH)2 + kons. NaOH → Na2[Cu(OH)4].**
  - Shart: kamida 6 M, qizdirish.
  - Ko'rinish (ko'k-binafsha eritma) va chegara taxminiy.
- **amfot-0030 va amfot-0035 — oz miqdordagi NH3 cho'ktiradi.**
  - Haqiqatda dastlab asosli tuzlar ((CuOH)2SO4 va boshqalar) hosil bo'ladi.
  - Yozuvlarda maktab soddalashtirishi — M(OH)2 olingan, bu matnda aytilgan.

## Ataylab qo'shilmagan tajribalar

- **Prussiya ko'ki, Turnbul ko'ki, Fe(SCN)²⁺, Nessler reaksiyasi:** `sifat-reaksiyalari` toifasiga tegishli.
- **Cu(OH)2 + glitserin:** organik toifaga tegishli.
- **Zn(OH)2 / Al(OH)3 + NaOH suyuqlanmasi:** boshqa toifadagi termik-0003/0004 (gidroksidning suvsizlanishi) avval ishlaydi, keyin mening oksidli suyuqlanmalarim (oksid-0029, 0032) ishlaydi. Bu haqiqiy jarayonga ham mos. Alohida yozuvlar muvofiqlik testida "ishga tushmadi" deb yiqilardi, shuning uchun olib tashlandi.
- **[Ag(NH3)2]⁺ + I⁻ → AgI↓:** dvigatelda kompleksni cho'ktiruvchi ion ta'sirida parchalash qoidasi yo'q.
  - Takrorlash: [Ag(NH3)2]NO3 0,1 M + KI 0,1 M → cho'kma hosil bo'lmaydi.
  - Kutilgan natija: sariq AgI cho'kmasi.
- **Na2[Zn(OH)4] + NH4Cl:** dvigatel pH 7 da [Zn(NH3)4]²⁺ va [Zn(OH)4]²⁻ birga turgan holatni beradi — kimyoviy jihatdan shubhali.
- **CoCl2 + NH3:** [Co(NH3)6]²⁺ ioni bor, lekin `rules.complexes` da Co(OH)2 + NH3 qoidasi yo'q.

## Dvigatel bo'yicha kuzatuvlar

1. **Ammiakat kislota bilan parchalanganda faqat erkin H⁺ ishlatiladi, HSO4⁻ ishlatilmaydi.**
   - Takrorlash: [Cu(NH3)4]SO4 + ortiqcha H2SO4 → kompleksning yarmi parchalanmay qoladi.
   - Shu sababli bu tajribalarda HCl va HNO3 ishlatilgan.
2. **Hg²⁺ / I⁻ juftligi eruvchanlik jadvalida yo'q.** HgI2 cho'kmasi va [HgI4]²⁻ kompleksi `record` yozuvlari bilan berilgan: amfot-0043, amfot-0044.
3. **Gidroksokompleksning teskari parchalanishi pKa < 12 bo'lgan istalgan kislota bilan boradi** (NH4⁺, H2CO3, HCO3⁻). Shu qoida asosida CO2 va NH4Cl tajribalari `rules` bilan to'g'ri o'tdi.
