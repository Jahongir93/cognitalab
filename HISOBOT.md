# Hisobot: Cognita Virtual Kimyo Laboratoriyasi

Bu hisobot topshiriqda ([TOPSHIRIQ.md](TOPSHIRIQ.md)) so'ralgan ishlarning holatini, raqamlarini va bilib qilingan soddalashtirishlarni yozadi. Hamma raqamlar yakuniy ishga tushirishdan olingan. Ularni qayta hosil qilish buyruqlari har bo'limda yozilgan.

## 1. Natija qisqacha

| Ko'rsatkich | Talab | Bajarildi |
|---|---|---|
| Tajribalar katalogi | 1000 | **1021** (24 toifaning hammasi o'z maqsad sonidan kam emas) |
| Validator xatolari | 0 | **0** (21 ta ogohlantirish bor, ular xato emas: 3-bo'lim) |
| Dvigatel bilan muvofiqlik testi | hammasi | **1021 / 1021 o'tdi** |
| `o'rta` ishonchli yozuvlar | belgilanishi kerak | **213 ta** (yuqori: 808) — `review/reactions_review.csv` boshida |
| Moddalar | ≥ 350 | **672 ta** (reaktivlar javonida 360 ta) + **99 ta ion** |
| Jihozlar | 5.2-bo'limdagi ro'yxat | **115 ta** (8 toifa), har biri protsedura 3D modeli va tiplangan portlari bilan |
| Asbob andozalari | 5.3-bo'limdagi ro'yxat | **16 ta**, avtomatik va qo'lda yig'ish |
| Organik mexanizm andozalari | 5.7-bo'limdagi ro'yxat | **16 ta** animatsiyali SVG andoza (ayrimlarida variantlar bor) |
| Sifat darajalari | 3 ta | past / o'rta / yuqori, qurilmaga qarab avtomatik tanlanadi |

Hammasi bitta commit tarixida. Yetkazib berish zip fayli: `cognita-virtual-lab.zip` (GitHub release'da).

## 2. Toifalar bo'yicha tajribalar

`npm run validate -- --consistency` natijasi:

| № | Toifa | Bor / maqsad | Validator xatosi | Muvofiqlik | `o'rta` |
|---|---|---|---|---|---|
| 1 | Neytrallanish | 60 / 60 | 0 | 60 o'tdi | 2 |
| 2 | Ion almashinish: cho'kma | 120 / 120 | 0 | 120 o'tdi | 19 |
| 3 | Ion almashinish: gaz | 50 / 50 | 0 | 50 o'tdi | 7 |
| 4 | Metall + kislota | 43 / 40 | 0 | 43 o'tdi | 11 |
| 5 | Metall + tuz eritmasi | 50 / 50 | 0 | 50 o'tdi | 5 |
| 6 | Metall + suv, metall + ishqor | 25 / 25 | 0 | 25 o'tdi | 5 |
| 7 | Oksidlar | 56 / 55 | 0 | 56 o'tdi | 14 |
| 8 | Amfoter gidroksidlar va komplekslar | 44 / 40 | 0 | 44 o'tdi | 4 |
| 9 | Termik parchalanish | 45 / 45 | 0 | 45 o'tdi | 10 |
| 10 | Yonish va birikish | 45 / 45 | 0 | 45 o'tdi | 25 |
| 11 | Eritmadagi oksidlanish-qaytarilish | 92 / 90 | 0 | 92 o'tdi | 33 |
| 12 | Gazlarni olish va xossalari | 44 / 40 | 0 | 44 o'tdi | 1 |
| 13 | Tuzlar gidrolizi va indikatorlar | 30 / 30 | 0 | 30 o'tdi | 4 |
| 14 | Elektroliz va galvanik elementlar | 30 / 30 | 0 | 30 o'tdi | 8 |
| 15 | Sifat reaksiyalari (alanga rangi bilan) | 60 / 60 | 0 | 60 o'tdi | 3 |
| 16 | Uglevodorodlar | 50 / 50 | 0 | 50 o'tdi | 15 |
| 17 | Spirtlar, fenollar, efirlar | 30 / 30 | 0 | 30 o'tdi | 9 |
| 18 | Aldegidlar va ketonlar | 25 / 25 | 0 | 25 o'tdi | 14 |
| 19 | Karbon kislotalar, efirlar, yog'lar | 39 / 35 | 0 | 39 o'tdi | 2 |
| 20 | Aminlar, aminokislotalar, oqsillar | 20 / 20 | 0 | 20 o'tdi | 4 |
| 21 | Uglevodlar | 16 / 15 | 0 | 16 o'tdi | 6 |
| 22 | Polimerlar | 17 / 15 | 0 | 17 o'tdi | 6 |
| 23 | Titrlash | 20 / 20 | 0 | 20 o'tdi | 4 |
| 24 | Kinetika, muvozanat, termokimyo | 10 / 10 | 0 | 10 o'tdi | 2 |
| | **Jami** | **1021 / 1000** | **0** | **1021 o'tdi** | **213** |

Boshqa raqamlar:
- **Dvigatel turi:** 442 ta yozuvni dvigatel o'z tenglamasi bo'yicha bajaradi (`engine: record`). Qolgan 579 tasining natijasini umumiy qoidalar chiqaradi (`engine: rules`). Bu yozuvlar test va o'quv matni uchun turadi.
- **Maxsus yozuvlar:** 54 tasi "reaksiya ketmaydi" turidagi yozuv (masalan, Cu + suyult. H₂SO₄). 49 tasi fizik jarayon yoki ko'rgazma tajribasi. Ularda tenglama yo'q (`equation_free`), shuning uchun muvofiqlik testi ularning kimyoviy natijasini tekshirmaydi.
- **Organik mexanizm:** 114 ta organik yozuv animatsiyali mexanizm andozasiga bog'langan.
- **Sinflar bo'yicha:** 8-sinf 241 ta, 9-sinf 390 ta, 10-sinf 190 ta, 11-sinf 34 ta, litsey 126 ta, universitet 25 ta, umumiy 15 ta.

Muvofiqlik testi har bir tajribani Node'da, brauzersiz bajaradi. Yozuvdagi reaktivlar, konsentratsiyalar va sharoit (qizdirish, katalizator, yorug'lik, tok) bilan idish tayyorlanadi. Dvigatel bergan mahsulotlar, cho'kma, gaz, rang va pH yozuvdagi bilan solishtiriladi. "Reaksiya ketmaydi" yozuvlarida dvigatel haqiqatan ham reaksiya bermasligi tekshiriladi.

## 3. Kimyogar tekshiruvi kerak bo'lgan joylar

- **`o'rta` deb belgilangan 213 ta yozuv.** Mahsulot, sharoit yoki kuzatiladigan hodisaga to'liq ishonch bo'lmagan joylarda shunday belgilandi. Ularning ro'yxati `review/reactions_review.csv` boshida turadi. Jadvalni Excel to'g'ri ochadi (UTF-8 BOM bilan), oxirgi ikki ustun tekshiruvchi uchun bo'sh qoldirilgan. Jadvalni yangilash: `npm run review`.
- **21 ta validator ogohlantirishi.** Asosan cho'kma rangi bazadagi rangdan biroz farq qiladi. Yana bir qismi bir xil tenglamali, lekin har xil sharoitli yozuvlar. Ro'yxat: `node tools/validate_data.mjs --warnings`.
- **Bazadagi ayrim ma'lumotlar.** Ular `docs/notes/*.md` da batafsil yozilgan:
  - suvsiz CoCl₂ va FeSO₄ rangi;
  - benzoy kislotaning eruvchanligi;
  - glitsin ionlari yo'q;
  - kraxmal sovuq suvda erigan deb hisoblanadi.
- **Sonli qiymatlar.** Kerakli joylarda sonli qiymatlar (pKa, E°, eruvchanlik) darslik va ma'lumotnomalardagi standart qiymatlardan olindi. Aniq bilinmagan qiymatlar to'qib chiqarilmadi: ΔH o'rniga sifat sinfi yozildi ("kuchli ekzotermik"), eruvchanlik o'rniga eruvchanlik jadvali kodi (R/M/N).

## 4. Testlar

| To'plam | Buyruq | Natija |
|---|---|---|
| Dvigatel, asbob grafi, andozalar, mexanizmlar, api (Node) | `node --test tests/engine/*.test.mjs` | 112 / 112 o'tdi |
| Katalog testi: soni, validator, 1021 ta muvofiqlik | `node --test tests/data/*.test.mjs` | 4 / 4 o'tdi |
| Ikkalasi birga | `npm test` | 116 / 116 o'tdi |
| Backend (FastAPI, JSON va SQLite omborlari) | `cd backend && python -m pytest -q` | 65 / 65 o'tdi |
| Brauzer e2e (Playwright, Chromium + SwiftShader) | `npm run test:e2e` | 9 / 9 o'tdi |

E2E ssenariylari quyidagilarni tekshiradi:
- yuklanish va katalog;
- reaktivlar javonidan olib aralashtirish (BaSO₄ cho'kmasi);
- og'ish burchagi bilan quyish;
- tiqinni sichqoncha bilan sudrab, kolbaga "yopishtirish";
- yo'riqnomali tajriba (tayyorlash, uchala bosqichning avtomatik tekshiruvi, natija, mexanizm, jurnal);
- reaksiya bormaganda sababini tushuntirish (Cu + suyult. H₂SO₄);
- saqlash va tiklash;
- andozani avtomatik yig'ish;
- telefon o'lchami (gorizontal siljish yo'qligi).

E2E testlar sahifadagi JavaScript xatolarini ham ushlaydi: birorta xato chiqsa, test yiqiladi.

## 5. Nima qilindi (tizimlar bo'yicha)

**Kimyoviy dvigatel** (`frontend/lab/js/engine`) sof JavaScript'da yozilgan va Node'da test qilinadi. Idish holati fazalar bo'yicha mol miqdorlari bilan saqlanadi: eritma, organik qatlam, qattiq modda, gaz. Dvigatel ikki qatlamli: avval umumiy qoidalar, keyin aniq yozuvlar.

Umumiy qoidalar:
- dissotsilanish;
- kislota-asos (proton ko'chishi, ko'p bosqichli kislota tizimlari);
- eruvchanlik jadvali bo'yicha cho'kma;
- kuchsiz asoslarning gidroksidlari (pH bo'yicha);
- komplekslar va ularning parchalanishi;
- oksidlarning suv va kislota bilan ta'siri;
- metallar: faollik qatori, suv, kislota, ishqor, passivlanish;
- uchuvchanlik, qaynash va qaynash haroratining ko'tarilishi, kristallanish;
- elektroliz, galvanik element EYuK (Nernst), alanga rangi, elektr o'tkazuvchanlik;
- zaryad balansi orqali pH (gidrolizni hisobga olgan holda) va indikator ranglari.

Aniq yozuvlar sharoitni tekshiradi: harorat, katalizator, muhit, yorug'lik, yondirish, tok va konsentratsiya chegaralari. Tezlik soddalashtirilgan modelda hisoblanadi: kinetika sinfi, Vant-Goff omili, qattiq moddaning maydaligi va aralashtirish. Issiqlik effekti sinf bo'yicha olinadi. Reaksiya bormasa, `explain.js` sababini o'zbekcha tushuntiradi.

**Ma'lumotlar.** Reaksiya JSON fayllari toifalar bo'yicha generatorlardan yasaladi (`tools/seed`). Brauzer boshida faqat katalog indeksi (`index.json`) va dvigatel yozuvlari (`engine.json`) yuklanadi. To'liq tajriba matni kerak bo'lganda toifa fayli alohida yuklanadi.

**3D sahna.** Xonada ish stoli, reaktivlar javoni, jihozlar shkafi, rakovina va jo'mrak, mo'rili shkaf, chiqindi idishi bor. Shisha idishlar profil egri chizig'idan devor qalinligi bilan yasalgan (LatheGeometry). Boshqa jihozlar primitivlardan yig'ilgan. Atrof-muhit xaritasi protsedura bilan yasaladi (RoomEnvironment), tashqi fayl yo'q.

Suyuqlik istalgan aylanish jismida ishlaydi:
- idish og'ganda ham sath gorizontal qoladi;
- idish tik turganda menisk bor;
- og'iz chetidan oshsa to'kiladi, quyish shu orqali ishlaydi;
- aralashmaydigan suyuqliklar ikki qatlam bo'ladi.

**Ulanish tizimi.** Tiplangan portlar va moslik jadvali bor: diametr, shlif o'lchami, germetiklik. Sudrashda mos portlar yashil nuqta bilan belgilanadi va yarim shaffof oldindan ko'rinish chiqadi. Shlang va simlar osilib turadigan egri chiziq bo'lib, jihozlar surilganda ortidan ergashadi.

Asbob — graf. Gaz shu graf bo'ylab yuradi:
- yuvish sklyankasi, suv ostida yig'ish yoki havoni siqib chiqarish usuli (idish og'zi gaz zichligiga mos bo'lishi tekshiriladi);
- sovutgichda kondensatlanish (sovutish suvi bo'lmasa ogohlantiriladi).

Germetik yopiq idish qizdirilsa bosim oshadi: avval ogohlantirish chiqadi, keyin tiqin otilib chiqadi. Zaharli gaz mo'rili shkafdan tashqarida ajralsa ogohlantiriladi.

**Effektlar.** Quyidagilar bor:
- suyuqlik va gaz: pufakchalar (soni reaksiya tezligiga bog'liq), muallaq cho'kmaning asta cho'kishi va rangli loyqaligi, ko'pik, rangli gazlar idish bo'shlig'ida va og'izdan chiqishda (NO₂, Cl₂, Br₂, I₂ bug'i), oq tutun, suv bug'i;
- devorda: kondensat tomchilari, ho'l devor, kumush ko'zgu, qurum;
- qattiq faza: metall bo'laklari va qoplanishi, kristallar, cho'g'lanish;
- olov: gorelka va spirt lampasi alangasi, alanga sinovida alanganing bo'yalishi, uchqunlar, magniyning ko'zni qamashtiruvchi yorug'ligi;
- boshqalar: issiqlik to'lqini, "paq" chaqnashi, tiqinning otilishi, darz, to'kilgan ko'lmak, elektrodlarda pufakcha va metall qoplami, o'tkazuvchanlik lampochkasi;
- ixtiyoriy WebAudio tovushlari: vishillash, qaynash, paq, darz.

**Interfeys.** Asosiy qismlar:
- yo'riqnomali va erkin rejim;
- katalog (toifa, sinf va matn bo'yicha filtr);
- reaktivlar javoni (konsentratsiya va shakl tanlanadi);
- jihozlar shkafi (o'lchamlar bilan);
- andozalar paneli;
- inspektor (tarkib, hajm, harorat, pH, asbob ko'rsatkichlari, amallar);
- jurnal, sozlamalar, saqlash/tiklash;
- himoya vositalari tekshiruvi.

Barcha matnlar `js/i18n/uz.js` faylida. Interfeys klaviatura bilan boshqariladi, ARIA belgilari bor va `prefers-reduced-motion` hisobga olinadi. Interaktiv doska uchun yirik interfeys rejimi bor.

**Mexanizm paneli.** Panelda molekulyar, to'liq ionli va qisqartirilgan ionli tenglamalar ko'rsatiladi. Elektron balans yozuvdan olinadi, yozuvda bo'lmasa oksidlanish darajalaridan chiqariladi. Oksidlovchi va qaytaruvchi ko'rsatiladi.

Anorganik turlar uchun animatsiyali sxemalar bor: neytrallanish, ion almashinish, elektron ko'chishi, elektroliz va boshqalar. Organik reaksiyalar uchun 16 ta andoza bor; ularda egri strelkalar, oraliq zarrachalar va o'tish holatlari ko'rsatiladi, reaksiyaning o'z moddalari andozaga qo'yiladi.

**Backend.** `backend/lab_router.py` — FastAPI APIRouter. U quyidagilarni bajaradi:
- katalog va ma'lumot fayllarini beradi;
- stol holatlari, jurnal va taraqqiyotni saqlaydi (standart holda JSON fayllarga, atomar yozuv va qulf bilan; SQLite ham tanlanadi);
- tajriba boshlanganda tanga yechadi.

Platformaga bog'liq faqat ikki qoralama funksiya bor: `get_current_user` va `charge_coins`. Ularni almashtirish va `/lab` ga ulash `backend/README.md` da yozilgan.

## 6. Soddalashtirishlar va ma'lum cheklovlar

**Kimyo modeli:**
1. **Haqiqiy kimyoviy muvozanat yo'q.** Aniq yozuvlar chapdan o'ngga oxirigacha boradi. Qaytar jarayonlar ikki alohida yozuv bilan ifodalangan, masalan xromat ⇄ dixromat. Le Shatelye siljishining ba'zi holatlari ko'rsatilmaydi, masalan FeCl₃ + KSCN ga KCl qo'shish. Faqat kislota-asos muvozanatlari va pH to'liq hisoblanadi.
2. **Kinetika sifat darajasida.** Tezlik besh sinfdan biri bilan beriladi va harorat, maydalik va aralashtirish bilan o'zgaradi. Absolyut tezlik konstantalari yo'q.
3. **Issiqlik effekti sinf bo'yicha** (masalan, "ekzotermik" ≈ −100 kJ/mol). Harorat o'zgarishi taxminiy.
4. **Gaz eruvchanligi soddalashtirilgan.** Gaz yo to'liq eriydi (HCl, NH₃), yo kam eriydi va ajralib chiqadi. Bosimga bog'liqligi hisoblanmaydi.
5. **Yozuvlar raqobati.** Bir xil reaktivlarga bir nechta aniq yozuv mos kelsa, sharti aniqrog'i tanlanadi. Teng bo'lsa, id tartibi bo'yicha birinchisi tanlanadi.
6. **Muhitga bog'liq yozuvlar.** Ba'zi oksidlanish-qaytarilish yozuvlarida muhit shartlari yumshatilgan. Masalan, neytral muhitda OH⁻ hosil qiladigan reaksiyalarda yozuv pH > 10 bo'lganda to'xtab qolardi, shuning uchun ular `medium` shartisiz yozilgan.
7. **I₂ va Br₂.** Mahsulot sifatida I₂ qattiq fazaga, Br₂ organik qatlamga o'tadi, organik erituvchi bo'lmasa ham. Shuning uchun suvli eritmaning sariq yoki qo'ng'ir rangi ba'zan ko'rinmaydi.
8. **Tenglamasiz yozuvlar.** 49 ta fizik va ko'rgazma yozuvi (`equation_free`) va 21 ta yozuvning izomerlari dvigatelda farqlanmaydi. Masalan, saxaroza gidrolizi dvigatel uchun 2 glyukoza beradi.
9. **Organik reaksiyalar faqat aniq yozuvlar orqali ishlaydi.** Erkin rejimda katalogda yo'q organik aralashma uchun dvigatel natijani "o'ylab topmaydi". Reaksiya bormaydi va bu tushuntiriladi.

**Grafika va boshqaruv:**
10. **Ulanish fizikasi yo'q.** Jihozlar portlarga yopishadi, to'qnashuvlar faqat stol ustidagi joylashuv bo'yicha hisoblanadi.
11. **Probirkani alangada qizdirish.** Probirka alanga ustida qisqichsiz "havoda" turadi. Andozalarda NH₃ yig'ish silindri ham shunday turadi.
12. **Quyish.** Manba idish nishon ustida avtomatik joylashadi, og'ish burchagini foydalanuvchi boshqaradi.
13. **U-naycha.** U-simon elektrolizyorda suyuqlik ko'rsatilmaydi. Elektroliz andozasi stakanda yig'ilgan.
14. **Vizual tekshiruv.** Barcha vizual tekshiruvlar va skrinshotlar GPU'siz muhitda, SwiftShader dasturiy renderi bilan qilindi. Haqiqiy shisha sinishi ("yuqori" sifat), soyalar va kadr tezligi integratsiyalashgan grafikali noutbukda va telefonda alohida ko'rib chiqilishi kerak. Dasturiy renderda kadr tezligi past. Simulyatsiya vaqti haqiqiy vaqtga bog'langan, shuning uchun kimyo kadrlar sekinlashganda ham to'g'ri tezlikda boradi.
15. **Mobil qurilmalar.** Interfeys telefon o'lchamiga moslangan va e2e testda tekshirilgan. Sensorli sudrash Pointer Events orqali ishlaydi, lekin haqiqiy qurilmada sinalmagan.

## 7. Qabul qilingan qarorlar

- **Agentlar.** Katalog toifalari va bir qator modullar (mexanizm paneli, backend, asbob andozalari) parallel agentlar bilan yozildi. Har bir natija umumiy validator va muvofiqlik testidan o'tkazildi. Agentlarning ish eslatmalari `docs/notes/` da.
- **Generatorlar.** Reaksiya fayllari qo'lda emas, generatorlardan yasaladi (`tools/seed/reactions/*.mjs`). Bu takrorlanuvchi tuzilmani yagona saqlaydi va kimyogar tuzatishini bitta joyda kiritish imkonini beradi.
- **Konsentratsiyaga bog'liq mahsulotlar.** Masalan, HNO₃ va metallar uchun yozuvlar `conc_min_M` / `conc_max_M` bilan ajratilgan.
- **Chiqarib tashlangan mavzular.** Topshiriq talabiga ko'ra portlovchi moddalar (masalan, NH₄NO₃ ning parchalanishi, nitrotsellyuloza), zaharlovchi moddalar va giyohvand moddalar tajribalari kiritilmadi.
- **Tanga.** Tanga yechish faqat yo'riqnomali tajriba boshlanganda chaqiriladi. Narxi standart holda 0 (`COGNITA_LAB_COST` bilan o'zgaradi).
- **Saqlash.** Backend standart holda JSON fayllarga saqlaydi (topshiriqqa ko'ra). SQLite muqobil sifatida qoldirildi.
- **Ko'p tillilik.** Interfeys matnlari bitta faylda (`uz.js`), `t(kalit)` orqali olinadi. Kimyoviy nomlar va tajriba matnlari ma'lumot fayllarida turadi.

## 8. Tavsiyalar (keyingi qadamlar)

1. **Kimyogar tekshiruvi:** `review/reactions_review.csv` dagi 213 ta `o'rta` yozuvni tekshirish. Tuzatishlar generatorlarga kiritiladi, keyin `npm run validate -- --consistency` qayta ishga tushiriladi.
2. **Real qurilmalarda sinov:** integratsiyalashgan GPU'li noutbuk, o'rtacha Android telefon va interaktiv doskada sinash. "Yuqori" sifatda shisha va suyuqlik ko'rinishini sozlash.
3. **Dvigatel:** muvozanat konstantasi bilan qaytar reaksiyalarni qo'shish. Yozuv shartlariga "idishda bo'lmasligi kerak" turini qo'shish. Br₂ va I₂ ning suvdagi eruvchanligini modellash. Glitsin va boshqa amfolitlarning ion shakllarini qo'shish.
4. **Interfeys:**
   - noma'lum moddani aniqlash topshiriqlari (dvigatel buni ko'taradi, faqat interfeys kerak);
   - o'qituvchining ko'rgazma rejimi uchun ssenariylar;
   - rus va ingliz lokalizatsiyasi (`uz.js` tuzilishida).
5. **Asboblar:** probirka qisqichi va ikkinchi shtativni andozalarda to'liq joylashtirish; U-naychada suyuqlik ko'rsatish.
