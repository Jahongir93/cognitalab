# oksidlanish-qaytarilish (redoks-NNNN): mualliflik izohlari

- Yozuvlar soni: **92** (maqsad 90). Validator: 0 xato, 0 ogohlantirish; muvofiqlik testi: 92/92.
- `o'rta` ishonch: 33 ta (kimyogar ko'rib chiqishi kerak).
- Generator: `node tools/seed/reactions/oksidlanish-qaytarilish.mjs` faylni qayta yozadi. `redoks-0001` o'zgarishsiz qoladi.
  `ionic_full` molekulyar tenglamadan bazadagi dissotsilanish bo'yicha avtomatik yasaladi. Kons. H₂SO₄, cho'kma, gaz va kuchsiz elektrolitlar molekula holida qoladi.
  Kerak bo'lsa, `full:` maydoni bilan qo'lda beriladi. Ro'yxatdagi `skip: true` yozuvlar chiqarilmaydi.
- Yangi modda: `NaClO3` (`tools/seed/extra/oksidlanish-qaytarilish.json`), gipoxlorit disproporsiyalanishi uchun.

## Tarkib

| Guruh | Yozuvlar |
|-------|----------|
| KMnO₄ | Muhitning ta'siri (sulfit: kislotali/neytral/ishqoriy); Fe²⁺, H₂O₂ (kislotali va neytral), KI, KNO₂, H₂C₂O₄ (qizdirib), H₂S, S₂O₃²⁻ bilan reaksiyalar. Shuningdek: Mn²⁺ bilan komproporsiyalanish, kons. KOH → manganat, manganatning disproporsiyalanishi. |
| K₂Cr₂O₇ (kislotali) | Fe²⁺, KI, SO₃²⁻, H₂S, H₂O₂, kons. HCl (qizdirib), KNO₂, H₂C₂O₄, SO₂ bilan reaksiyalar. |
| Cr(III) → CrO₄²⁻ (ishqoriy) | H₂O₂ bilan; Br₂ + NaOH bilan. |
| H₂O₂ oksidlovchi | KI, Fe²⁺, PbS → PbSO₄, Mn(OH)₂, Fe(OH)₂, H₂S, [Fe(CN)₆]⁴⁻ bilan. |
| H₂O₂ qaytaruvchi | KMnO₄, K₂Cr₂O₇, Ag₂O, NaClO, Cl₂, PbO₂, [Fe(CN)₆]³⁻ (ishqoriy), MnO₂ (kislotali) bilan. |
| Galogenlar | Cl₂/KBr, Cl₂/KI, Br₂/KI, Cl₂/Fe²⁺, Br₂/Fe²⁺. I₂ ning S₂O₃²⁻, H₂S, SO₃²⁻ bilan; Br₂ ning SO₃²⁻, H₂S, S₂O₃²⁻ bilan; Cl₂ ning H₂S, S₂O₃²⁻, SO₃²⁻ bilan reaksiyalari. Cl₂ + NaOH (sovuq); NaClO → NaClO₃ (qizdirib). |
| Reaksiya ketmaydi | Br₂ + Cl⁻, I₂ + Br⁻, Fe³⁺ + Br⁻, Fe²⁺ + I₂, Cu²⁺ + Br⁻. |
| Kons. H₂SO₄ | KBr → Br₂ + SO₂; KI → I₂ + H₂S. Mahsulot: KHSO₄, chunki kislota ortiqcha. |
| Maxsus juftlar (`engine: rules`) | Fe³⁺ + I⁻, Fe³⁺ + SO₃²⁻, Cu²⁺ + I⁻, Fe³⁺ + S²⁻. |
| Boshqalar | Fe³⁺ + H₂S, Fe³⁺ + S₂O₃²⁻, CuCl₂ + SO₃²⁻ → CuCl, S₂O₃²⁻ + H⁺, S²⁻ + SO₃²⁻ + H⁺. HNO₃ ning H₂S, KI (suyult./kons.), Fe²⁺ bilan; NO₂⁻ ning KI, Fe²⁺ bilan reaksiyalari. Xlor manbalari: PbO₂, NaClO, KClO₃ + HCl. ClO⁻ va ClO₃⁻ ning KI bilan, ClO₃⁻ ning Fe²⁺ bilan reaksiyalari. Mn²⁺ + PbO₂ → MnO₄⁻. MnO₂ ning H₂O₂, Fe²⁺, KI, H₂C₂O₄, SO₃²⁻ bilan reaksiyalari. Ag⁺ + Fe²⁺. Fe(OH)₂ + O₂, Mn(OH)₂ + O₂, [Fe(CN)₆]⁴⁻ + Cl₂, Mn(OH)₂ + ClO⁻. |

## Boshqa toifa bilan takrorlangani uchun olib tashlanganlar

Quyidagilar `gazlar` toifasida allaqachon bor, shuning uchun generatorda `skip: true` qilingan:

- KMnO₄ + kons. HCl (gazolish-0021)
- MnO₂ + kons. HCl (gazolish-0022)
- SO₂ + KMnO₄ (gazolish-0026)
- SO₂ + bromli suv (gazolish-0027)
- H₂S + SO₂ (gazolish-0029)

Qolgan o'xshashliklar:

- `redoks-0039` (xlorli suv + KI) va gazolish-0023 (Cl₂ gazi + KI): galogenlar qatori to'liq bo'lishi uchun qoldirildi.
- `redoks-0068` (Na₂S + Na₂SO₃ + H₂SO₄) dvigatelda gazolish-0029 bilan bir xil `ionic_net` ga ega: eritmada `2H2S + H2SO3`.
  Yozuvlar guruhi bitta bo'lgani uchun `gazolish-0029` (id bo'yicha oldin) bajariladi. Muvofiqlik testi buni "teng kuchli" deb qabul qiladi.

## Kiritilmaganlar (bazada ion yo'q)

| Reaksiya | Yetishmaydigan ion/modda |
|----------|--------------------------|
| Fe³⁺ + Sn²⁺, Hg²⁺ + Sn²⁺ | Sn⁴⁺ ioni yo'q |
| I₂ + NaOH, Br₂ + NaOH, ortiqcha Cl₂ + I₂ | IO₃⁻, BrO⁻, BrO₃⁻ ionlari yo'q |
| KMnO₄ + KI (neytral) → KIO₃ | IO₃⁻ ioni yo'q |
| Mn²⁺ + S₂O₈²⁻ / NaBiO₃ | S₂O₈²⁻, BiO₃⁻ ionlari yo'q |
| Co(OH)₂ + H₂O₂ | Co(OH)₃ moddasi yo'q |

## Dvigatel cheklovlari (yozuvlarda hisobga olingan)

1. **`medium: "neytral"` OH⁻ hosil qiladigan reaksiyalarda ishlamaydi.**
   - Muammo: neytral muhitda KMnO₄ + Na₂SO₃ yoki H₂O₂ → MnO₂ + KOH. Reaksiya boshlanishi bilan pH > 10 bo'ladi va yozuv to'xtab qoladi (taxminan 12% da).
   - Yechim: `redoks-0002` va `redoks-0011` da `medium` yo'q. Shuning uchun ular kislotali tajribada (0001, 0005) ham qisman ishlaydi va oz miqdorda MnO₂ hosil qiladi.
   - MnO₂ ni keyin `redoks-0086` (MnO₂ + SO₃²⁻ + H⁺) va `redoks-0082` (MnO₂ + H₂O₂ + H⁺) eritib yuboradi. Kinetika ham shunga moslangan: 0005 `bir-zumda`, 0011 `tez`.
   - Ishqoriy holat (`redoks-0003`, manganat) KOH bo'yicha `conc_min_M: 0.05` bilan ajratilgan.
   - Taklif: shartlarga "idishda bo'lmasligi kerak" (`absent: ["H⁺"]`) turini qo'shish yoki muhitni aralashtirish paytida baholash.
2. **I₂ va Br₂ mahsulot sifatida suvli eritmada qolmaydi.**
   - `#phaseOfTerm` I₂ ni `s` fazaga (qattiq) yuboradi, chunki `state: s` va `solubility` yo'q. Br₂ esa `miscible_water: false` bo'lgani uchun `org` (alohida suyuq qatlam) fazaga o'tadi, organik erituvchi bo'lmasa ham.
   - Natija: eritmaning qo'ng'ir/sariq rangi ko'rinmaydi.
   - Qayta hosil qilish: `redoks-0039` (Cl₂ + KI) → idishda `I2@s`; `redoks-0038` → `Br2@org`.
   - Taklif: `aq_color` maydoni bor moddalarni eruvchanlik chegarasigacha `aq` fazada qoldirish; I⁻ ortiqcha bo'lsa, I₃⁻ hosil qilish.
3. **Na₃[Cr(OH)₆] eritmasining pH qiymati 7,00 deb hisoblanadi.** Gidroksokompleks asos sifatida hisobga olinmaydi, shuning uchun xromit yozuvlarida `medium: ishqoriy` ishlatib bo'lmaydi va u olib tashlangan.
4. **Aralashma reaktivlarning nomi idishda qoladi.** Masalan, `xlorli-suv@aq` va `bromli-suv@aq` komponentlari sarflangandan keyin ham ko'rinadi.
5. **Bir xil chap tomonli yozuvlar.** Turli toifalarda bunday yozuvlar bo'lsa, guruhda id bo'yicha birinchisi (`gazolish-` < `redoks-`) bajariladi.
6. **Muvofiqlik testi reaktivlarni stexiometrik miqdorda qo'shadi.**
   - Shuning uchun suyultirilgan sherik bilan `conc_min_M` sharti bajarilmaydi. Konsentrlangan reaktiv bilan ishlaydigan tajribalarda ikkinchi modda qattiq holda olingan: KMnO₄ + kons. KOH, KBr/KI + kons. H₂SO₄, KI + kons. HNO₃.
   - `redoks-0003` da `excess: true` faqat test uchun ishlatilgan.

## Baza xatosi (bu toifaga tegishli emas)

`formula to'qnashuvi: Cu(C3H7O3)2 -> (C3H5(OH)2O)2Cu / Cu(C3H7O3)2`. Bu boshqa toifaning `extra` faylidan kelgan.
