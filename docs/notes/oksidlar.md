# Toifa: oksidlar — muallif izohlari

Generator: `node tools/seed/reactions/oksidlar.mjs` → `frontend/lab/data/reactions/oksidlar.json`.
JSON fayl qo'lda tahrirlanmaydi: o'zgarishlarni skriptga kiriting va uni qayta ishga tushiring.

**Holat:** 56 ta yozuv (maqsad 55). Validator xatosi 0, muvofiqlik testi 56/56. `o'rta` — 14 ta.
Dvigatel: 35 tasi `rules`, 21 tasi `record` (shundan 3 tasi `no_reaction`).

## Qo'shilgan moddalar (`tools/seed/extra/oksidlar.json`)

| Formula | Nomi | Nima uchun |
|---|---|---|
| Na2ZnO2 | natriy sinkat | ZnO + NaOH suyuqlanmasi mahsuloti |
| NaCrO2 | natriy xromit | Cr2O3 + NaOH suyuqlanmasi |
| NaFeO2 | natriy ferrit | Fe2O3 + NaOH suyuqlanmasi |

Uchalasi ham ionsiz qattiq modda (eruvchanligi `null`): ular faqat suyuqlanma mahsuloti sifatida ishlatiladi.

## Kimyogar birinchi navbatda tekshirishi kerak bo'lgan `o'rta` yozuvlar

- **Suyuqlantirish harorati chegaralari (taxminiy):** NaOH bilan 350 °C (NaOH 318 °C da suyuqlanadi), Na2CO3 bilan 900 °C (Na2CO3 851 °C da suyuqlanadi), CaO + SiO2 uchun 1000 °C. Yozuvlar: oksid-0029, 0032, 0033, 0036, 0037, 0048, 0049, 0053.
- **CaO + CO2 (oksid-0052):** oyna 400–800 °C (`temp_max_C: 800`). Bu termik-0009 (CaCO3 parchalanishi, 900 °C) bilan to'qnashmaslik uchun kerak. Ikkala chegara ham taxminiy.
- **Al2O3 + kislota / ishqor (oksid-0030, 0031):** kuydirilgan korund amalda erimaydi; matnda "yangi olingan (kuydirilmagan) Al2O3" deb yozilgan.
- **PbO + konsentrlangan NaOH (oksid-0035):** mahsulot gidroksokompleks Na2[Pb(OH)4] deb olingan.
- **Fe2O3 + NaOH suyuqlanmasi (oksid-0037):** Fe2O3 ning kuchsiz amfoterligini ko'rsatadi.
- **CaO + P2O5 (0055), CaO + SO3 (0056):** kimyosi aniq, lekin maktab laboratoriyasida bajarilishi qiyin.

## Dvigatel cheklovlari va gumon qilingan xatolar

1. **`#solidIons` — Fe3O4 maxsus holati hech qachon ishlamaydi.**
   - `/^([A-Z][a-z]?)(\d*)O(\d*)$/` Fe3O4 ga mos keladi va `Fe^2.666…+` ionini qaytaradi. Bunday ion yo'q, shuning uchun funksiya `null` qaytaradi.
   - `Fe3O4` uchun yozilgan maxsus tarmoq faqat regex mos kelmaganda ishlaydi, ya'ni hech qachon.
   - Takrorlash: Fe3O4 (s) + HCl 2 M, qizdirish → hech narsa erimaydi.
   - Vaqtincha yechim: oksid-0021 `record` (`Fe3O4 + 8H⁺ = Fe²⁺ + 2Fe³⁺ + 4H2O`).
2. **HSO4⁻ protonlar manbai sifatida ishlatilmaydi.** Bu `acid_soluble: "kuchli"` bo'lgan oksidlarning erishiga ham, ammiakatlarning parchalanishiga ham tegishli.
   - `#acidDissolution` faqat erkin H⁺ bor-yo'qligini tekshiradi.
   - Takrorlash: CuO 5e-4 mol + H2SO4 5e-4 mol → 2,4e-4 mol CuO erimay qoladi (H2SO4 ning ikkinchi protoni ishlatilmaydi).
   - Shu sababli H2SO4 li tajribalarda kislotaga `excess: true` qo'yilgan.
3. **Cr2O3 bazada `acid_soluble: "kuchli"`.** Dvigatel Cr2O3 ni kislotada eritadi, ammo kuydirilgan Cr2O3 kislotalarga amalda chidamli. Tavsiya: `acid_soluble: null`. Cr2O3 + kislota tajribasi qo'shilmadi.
4. **CrO3 + H2O pH 7 beradi.** H2CrO4 da `dissociation` yo'q, `xromat` tizimi esa `skip_species`. CrO3 tajribalari qo'shilmadi (kanserogen ham).
5. **NO2 + H2O yozuvlari olib tashlandi.** `record` yozuvi idishdagi gaz NO2 ni (masalan, Cu + kons. HNO3 ustidagi) suvda erigan NO2 dan ajrata olmaydi.
   - Muammo: yozuv metkis-0023/0025/0027/0032, gazolish-0036/0037 va redoks-0075 dagi qo'ng'ir gazni to'liq "yutib" yuborgan. Bu kons. HNO3 da kimyoviy jihatdan ham noto'g'ri.
   - Tavsiya: `#gasToAq` ga NO2 uchun qoida qo'shish (`2NO2 + H2O → H⁺ + NO3⁻ + HNO2`, faqat gaz suyuqlik orqali o'tkazilganda).
   - NO2 + NaOH (oksid-0047) saqlandi, chunki u OH⁻ talab qiladi.
6. **Cu2O + H⁺ yozuvi (oksid-0026) HCl da ham ishlaydi.** Aslida HCl da CuCl / [CuCl2]⁻ hosil bo'ladi. "Cl⁻ bo'lmasa" degan shartni ifodalash imkoni yo'q.
7. **Faqat CO2 + H2O tajribasini test tekshira olmaydi.** Harness ≥3 ml suv qo'shadi, eruvchanlik chegarasi 0,033 M — CO2 ning ko'p qismi gazga chiqib ketadi. Shu sababli faqat SO2 + H2O olingan.
8. **Na2SiO3 + CO2 (1:1) H2SiO3 bermaydi.** Natija HSiO3⁻ + HCO3⁻ (pKa bo'yicha to'g'ri). Yozuvda 1:2 nisbat va NaHCO3 olingan.
9. **CaO + H3PO4 Ca3(PO4)2 bermaydi.** Mahsulot CaHPO4 + Ca(OH)2 aralashmasi. Tajriba qo'shilmadi.

## Boshqa

- Muvofiqlik harness'i ish davomida yangilandi (300 °C dan yuqorida 250 Vt; harorat o'zgarayotganda kutadi). Yuqori haroratli shartlar shundan keyin qo'yildi.
- Barcha toifalar ishga tushirilganda mening yozuvlarim boshqa toifalardagi tajribalarda ishga tushmaydi (tekshirildi).
- Baza xatosi `formula to'qnashuvi: Cu(C3H7O3)2` boshqa muallifning qo'shimchasidan kelib chiqqan.
