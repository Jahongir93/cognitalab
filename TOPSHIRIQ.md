# Cognita Virtual Kimyo Laboratoriyasi — qurish topshirig'i

## 1. Vaziyat va maqsad

Men Cognita.uz — o'zbek tilidagi AI ta'lim platformasini ishlab chiqaman. Unga yangi modul kerak: brauzerda ishlaydigan 3D virtual kimyo laboratoriyasi. Shu modulni boshidan oxirigacha qurib, ishlaydigan holatda zip qilib shu chatga yuborishingizni so'rayman.

Foydalanuvchilar — maktab (7–11-sinf) va akademik litsey o'quvchilari, universitetning 1–2-kurs talabalari hamda ularning o'qituvchilari. Ko'p maktablarda reaktiv ham, jihoz ham yetishmaydi, shuning uchun modul haqiqiy laboratoriya mashg'ulotining o'rnini bosa olishi kerak: o'quvchi idishni o'zi tanlaydi, moddani o'zi o'lchab quyadi, asbobni o'zi yig'adi va haqiqiy laboratoriyada ko'radigan hodisani ko'radi. Xato qilsa, oqibatini ham ko'radi.

Modul maktab kompyuterlarida (integratsiyalashgan grafika), interaktiv doskalarda (sensorli ekran) va telefonlarda ishlaydi. Shu sababli sichqoncha ham, barmoq bilan boshqarish ham birinchi darajali kiritish usuli hisoblanadi.

Ko'lam: 1000 ta laboratoriya tajribasi (reaksiya), to'liq jihozlar to'plami, idishlarni bir-biriga ulab asbob yig'ish, tabiiy ko'rinishga imkon qadar yaqin vizual effektlar.

Cognita kodi sizga berilmagan. Modul mustaqil ishlaydigan qilib quriladi, platformaga ulanish nuqtalari esa alohida, aniq hujjatlashtirilgan fayllarda bo'ladi (7-bo'lim).

Men jarayonni kuzatib o'tirmayman. Savol berib to'xtab qolmang: noaniq joyda oqilona qaror qabul qiling va uni yakuniy hisobotga yozib qo'ying.

## 2. Ikki asosiy tamoyil

Butun loyiha shu ikki tamoyilga tayanadi, qolgan qarorlarni shulardan keltirib chiqaring.

**Reaksiyalar kod emas, ma'lumot.** 1000 ta reaksiyaning har biri uchun alohida animatsiya yoki alohida kod yozilmaydi. Buning o'rniga umumiy kimyoviy dvigatel (idishdagi moddalar holatini hisoblaydi), cheklangan sondagi effekt primitivlari (gaz pufakchasi, cho'kma, rang o'zgarishi, alanga va hokazo) va ma'lumotlar bazasi (moddalar, reaksiyalar) bo'ladi. Har bir reaksiya yozuvi qaysi effektlar qanday parametr bilan ishga tushishini aytadi. Shunda 1000 ta reaksiya bir xil sifatda ishlaydi va keyin yangi reaksiya qo'shish faqat JSON yozuvini qo'shishni talab qiladi.

**Realizm uch qatlamdan iborat.** Vizual qatlam: shisha shishaga, suyuqlik suyuqlikka o'xshaydi (sinish, menisk, quyilish oqimi, pufakcha, cho'kmaning cho'kishi). Kimyoviy qatlam: stexiometriya, ortiqcha va yetishmovchi reagent, konsentratsiya va harorat sharti, issiqlik effekti to'g'ri hisoblanadi; reaksiya ketmaydigan aralashmada hech narsa sodir bo'lmaydi va nima uchunligi tushuntiriladi. Amaliy qatlam: asbob to'g'ri yig'ilmasa ishlamaydi (masalan, ammiakni suv ostida yig'ib bo'lmaydi, germetik yopiq tizimni qizdirsa tiqin otilib chiqadi, konsentrlangan kislotaga suv quyilsa sachraydi). To'liq gidrodinamik simulyatsiya shart emas — ishonarli ko'rinadigan va real vaqtda ishlaydigan yaqinlashuvlar yetarli.

## 3. Topshiriladigan natija

Bitta `cognita-virtual-lab.zip` fayl, ichida taxminan shunday tuzilma (zarur bo'lsa o'zgartiring):

```
cognita-virtual-lab/
  README.md            ishga tushirish, Cognita'ga ulash, yangi reaksiya/jihoz qo'shish yo'riqnomasi (o'zbekcha)
  HISOBOT.md           nima qilindi, nima qilinmadi, tekshiruv natijalari (10-bo'lim)
  frontend/lab/        index.html, css/, js/ (ES modullar), vendor/three/, data/
  backend/             lab_router.py (FastAPI APIRouter) va uning testlari
  tools/               ma'lumot validatori, ko'rib chiqish jadvalini yasovchi skript
  tests/               dvigatel testlari (Node), Playwright e2e testlari
  docs/                ARCHITECTURE.md, DATA_SCHEMA.md, screenshots/
  review/              reactions_review.csv — barcha reaksiyalar ekspert ko'rib chiqishi uchun
```

Zipni ochib, `frontend/lab/` papkasini istalgan statik server bilan (masalan `python -m http.server`) ishga tushirganda laboratoriya internet ulanishisiz to'liq ishlashi kerak.

## 4. Texnologiya va cheklovlar

Cognita steki: backend Python FastAPI + uvicorn; frontend freymvorksiz vanilla JavaScript, build bosqichi yo'q; ma'lumotlar JSON fayllar va SQLite'da; yagona server. Platformada Three.js allaqachon ishlatiladi. Modul shu stekka begona bo'lmasligi kerak, chunki uni keyin o'zim (AI yordamida) davom ettiraman.

- **Render:** Three.js (npm'dan eng so'nggi barqaror versiya), WebGL2. Kutubxonani va kerakli addon'larni `vendor/` ichiga nusxalang — ish vaqtida CDN yoki boshqa tashqi manbaga murojaat bo'lmasin.
- **Kod:** vanilla JavaScript, ES modullar (`<script type="module">`), build bosqichisiz. React, Vue, TypeScript kompilyatsiyasi, bundler ishlatilmaydi. Tiplarni JSDoc bilan yozish mumkin.
- **3D modellar:** tashqi model fayllari yuklab olinmaydi. Laboratoriya idishlarining deyarli hammasi aylanish jismi, shuning uchun ularni profil egri chizig'idan protsedura bilan yasang (LatheGeometry va shunga o'xshash), devor qalinligi bilan. Shtativ, gorelka, tarozi kabi jihozlar ham primitivlardan protsedura bilan yig'iladi. Bu litsenziya muammosini ham, fayl hajmini ham hal qiladi.
- **Yoritish:** atrof-muhit xaritasi protsedura bilan (masalan RoomEnvironment), tashqi HDRI faylsiz.
- **Fizika:** og'ir fizika dvigateli shart emas. Jihozlar sudrab qo'yiladi, stol va ulanish nuqtalariga "yopishadi". Agar haqiqatan foyda bersa, yengil kutubxonani `vendor/`ga qo'shishingiz mumkin.
- **Kimyoviy dvigatel:** DOM va Three.js'dan mustaqil sof JavaScript modul bo'lsin — shunda u Node'da brauzersiz test qilinadi.
- **Interfeys tili:** o'zbek tili, lotin yozuvi. Barcha matnlar bitta lokalizatsiya faylida tursin (keyin rus va ingliz tillari qo'shiladi). Kimyoviy atamalar O'zbekiston maktab darsliklaridagi shaklda: cho'kma, eritma, oksidlanish-qaytarilish, natriy xlorid, sulfat kislota.
- **Dizayn:** ranglar, masofalar, radiuslar CSS o'zgaruvchilari orqali, bitta `tokens.css` faylida; yorug' va qorong'i mavzu. Shrift steki `Inter, system-ui, sans-serif` (Inter platformada o'zi joylashtirilgan). Cognita o'z tokenlarini shu faylni almashtirib ulaydi.
- **Unumdorlik:** integratsiyalashgan grafikali noutbukda ravon ishlashi kerak. Uch sifat darajasi (past / o'rta / yuqori) bo'lsin va qurilmaga qarab avtomatik tanlansin: yuqorida shisha uchun haqiqiy sinish (transmission), pastda arzonroq shaffoflik. Reaksiya ma'lumotlari toifalar bo'yicha bo'lingan fayllarda turib, kerak bo'lganda yuklansin.
- **Holat:** laboratoriya stolining to'liq holati (jihozlar, ulanishlar, idishlardagi moddalar) JSON'ga saqlanib, qayta tiklanadigan bo'lsin.

## 5. Laboratoriya tizimlari

### 5.1. Sahna va boshqaruv

Laboratoriya xonasi: ish stoli, reaktivlar javoni, jihozlar shkafi, rakovina va suv jo'mragi, mo'rili shkaf, chiqindi idishi. Kamera stol atrofida aylanadi, yaqinlashadi; idishga ikki marta bosilganda unga fokuslanadi. Asosiy amallar: jihozni shkafdan olish, stolga qo'yish, sudrash, og'dirib quyish (og'ish burchagi quyilish tezligini belgilaydi), tomizgich va pipetka bilan aniq hajm olish, shpatel bilan qattiq modda solish, tarozida tortish, aralashtirish, qizdirish, yuvish. Har bir idish ustiga bosilganda uning tarkibi, hajmi, harorati va (bo'lsa) pH ko'rsatiladi.

### 5.2. Jihozlar katalogi

Quyidagilarning barchasi kerak. Hajmli idishlar bir necha o'lchamda bo'lsin.

**Shisha idishlar:** probirka (oddiy va yon naychali), kimyoviy stakan (50, 100, 250, 600 ml), konussimon kolba (Erlenmeyer), yassi tubli kolba, dumaloq tubli kolba (bir, ikki va uch bo'g'izli), Vyurs kolbasi, Bunzen kolbasi, o'lchov kolbasi, retorta, o'lchov silindri, menzurka, byuretka (jo'mrakli), Mor pipetkasi, darajalangan pipetka, tomizgich, oddiy voronka, ajratgich voronka, tomchi voronka, soat oynasi, Petri kosachasi, kristallizator, eksikator, shisha tayoqcha, gaz chiqarish naychalari (to'g'ri, egilgan, uchi toraytirilgan), U-simon naycha, xlorkalsiyli naycha, Libix sovutgichi, sharikli qaytar sovutgich, deflegmator, alonj, gaz yuvish (Dreksel) sklyankasi, Kipp apparati, gazometr, reaktiv sklyankalari (tiqinli, tomizgichli, qoramtir shishali), yuvgich.

**Chinni va boshqa idishlar:** chinni kosacha, tigel va qopqog'i, hovoncha va dastasi, chinni uchburchak, chinni qayiqcha, tomchi tahlili plastinkasi, Byuxner voronkasi.

**Qizdirish:** spirt lampasi, Bunzen gorelkasi, elektr plitka, suv hammomi, qum hammomi, kolba isitgich, mufel pechi.

**Mahkamlash:** laboratoriya shtativi (mufta, qisqich-lapka, halqa bilan), uchoyoq, asbest to'r, probirkalar shtativi, probirka qisqichi, tigel qisqichi, pinset.

**O'lchash:** elektron tarozi, termometr, pH-metr, universal indikator qog'ozi, areometr, sekundomer, konduktometr.

**Elektrokimyo:** o'zgarmas tok manbai, elektrodlar (grafit, mis, rux, temir, platina), elektrolizyor (U-simon va Gofman apparati), tuz ko'prigi, voltmetr, simlar, o'tkazuvchanlikni sinash lampochkasi.

**Yordamchi buyumlar:** rezina tiqinlar (yaxlit, bir va ikki teshikli), shlif tiqinlar, rezina shlanglar, Mor va Gofman qisqichlari, shpatel, moddalarni yondirish qoshiqchasi, filtr qog'oz, nixrom sim (alanga sinovi uchun), cho'p (yonib turgan va cho'g'langan), gugurt, pnevmatik vanna (gazni suv ostida yig'ish uchun), suv oqimli vakuum nasos.

**Himoya vositalari:** ko'zoynak, qo'lqop, xalat — tajriba oldidan tekshiruv ro'yxati sifatida.

### 5.3. Idishlarni ulash tizimi

Bu modulning eng muhim va eng qiyin qismlaridan biri, unga alohida e'tibor bering.

Har bir jihozda tiplangan ulanish nuqtalari (portlar) bo'ladi: og'iz yoki bo'g'iz (diametri bilan), standart shlif (14/23, 19/26, 24/29, 29/32), naycha uchi, shlang shtutseri, shtativ qisqichi ushlaydigan joy. Mos portlar jadvali qaysi narsa qaysi narsaga ulanishini belgilaydi: tiqin bo'g'izga, naycha tiqin teshigiga, shlang naychaga, sovutgich shlifi kolba shlifiga. Jihoz mos portga yaqinlashtirilganda yarim shaffof oldindan ko'rinish chiqadi va qo'yib yuborilganda joyiga o'tiradi. Shlanglar egiluvchan (tabiiy osilib turadigan egri chiziq), ikki uchi ulangan jihozlar surilganda ortidan cho'ziladi. Shtativ qisqichi idishni kerakli balandlik va burchakda ushlab turadi.

Yig'ilgan asbob — graf: tugunlar jihozlar, qirralar ulanishlar. Gaz, bug' va suyuqlik shu graf bo'ylab harakatlanadi: reaksiya kolbasida ajralgan gaz naycha orqali yuvish sklyankasiga, undan yig'gich silindrga o'tadi; haydashda bug' sovutgichda kondensatlanib qabul kolbasiga tomadi. Ulanish germetik bo'lmasa gaz chiqib ketadi. Germetik yopiq tizim qizdirilsa bosim oshadi: avval ogohlantirish, keyin tiqin otilib chiqadi.

Tayyor asbob andozalari bo'lsin — "avtomatik yig'ish" tugmasi bilan ham, qo'lda yig'ish bilan ham: gaz olish asbobi (probirka va gaz chiqarish naychasi), Kipp apparati bilan gaz olish, gazni suv ostida va havoni siqib chiqarish usulida yig'ish (idish og'zi yuqoriga yoki pastga — gaz zichligiga qarab), gazni yuvish va quritish, oddiy haydash, qaytar sovutgich bilan qizdirish, titrlash, oddiy va vakuum filtrlash, ajratgich voronkada ekstraksiya, bug'latish va kristallash, sublimatsiya, elektroliz, galvanik element.

### 5.4. Moddalar bazasi

Kamida 350 ta modda. Har biri uchun: formula, o'zbekcha nomi, molyar massa, agregat holati va tashqi ko'rinishi (rang, kristall/kukun/bo'lak/suyuqlik), zichlik, suvda eruvchanlik, eritmadagi ionlari va ularning rangi, kislota-asos kuchi, oksidlovchi-qaytaruvchi xossasi, xavf belgisi, saqlanadigan idish turi. Eritmalar bir necha konsentratsiyada (suyultirilgan va konsentrlangan kislotalar har xil reaksiyaga kirishadi).

**Metallar:** Li, Na, K, Ca, Mg, Al, Zn, Fe, Cu, Ag, Pb, Sn, Ni, Cr, Mn — mos shakllarda (bo'lak, qirindi, kukun, sim, plastinka, mix).

**Metallmaslar:** H₂, O₂, N₂, Cl₂, Br₂, I₂, S, qizil fosfor, ko'mir, grafit, Si.

**Oksidlar:** Na₂O, K₂O, CaO, MgO, BaO, Al₂O₃, ZnO, FeO, Fe₂O₃, Fe₃O₄, CuO, Cu₂O, MnO₂, Cr₂O₃, CrO₃, PbO, PbO₂, HgO, Ag₂O, SiO₂, P₂O₅, CO, CO₂, SO₂, SO₃, NO, NO₂, H₂O, H₂O₂.

**Kislotalar:** HCl, H₂SO₄, HNO₃, H₃PO₄, H₂CO₃, H₂SO₃, H₂S, HF, HBr, HI, HClO, HClO₄, H₂SiO₃, CH₃COOH, HCOOH, H₂C₂O₄.

**Asoslar va amfoter gidroksidlar:** NaOH, KOH, LiOH, Ca(OH)₂, Ba(OH)₂, Mg(OH)₂, NH₃·H₂O, Al(OH)₃, Zn(OH)₂, Fe(OH)₂, Fe(OH)₃, Cu(OH)₂, Cr(OH)₃, Ni(OH)₂, Co(OH)₂, Mn(OH)₂, Pb(OH)₂.

**Tuzlar:** Na⁺, K⁺, Li⁺, NH₄⁺, Ca²⁺, Mg²⁺, Ba²⁺, Sr²⁺, Al³⁺, Zn²⁺, Fe²⁺, Fe³⁺, Cu²⁺, Ag⁺, Pb²⁺, Mn²⁺, Cr³⁺, Ni²⁺, Co²⁺, Sn²⁺ kationlarining Cl⁻, Br⁻, I⁻, F⁻, SO₄²⁻, SO₃²⁻, S²⁻, NO₃⁻, NO₂⁻, CO₃²⁻, HCO₃⁻, PO₄³⁻, HPO₄²⁻, SiO₃²⁻, CH₃COO⁻, C₂O₄²⁻ anionlari bilan laboratoriyada uchraydigan tuzlari; shuningdek KMnO₄, K₂Cr₂O₇, K₂CrO₄, KClO₃, (NH₄)₂Cr₂O₇, Na₂S₂O₃, KSCN, K₄[Fe(CN)₆], K₃[Fe(CN)₆], CaC₂, Al₄C₃, Cu₂(OH)₂CO₃, KAl(SO₄)₂·12H₂O va kristallogidratlar (CuSO₄·5H₂O, FeSO₄·7H₂O, CoCl₂·6H₂O, Na₂CO₃·10H₂O).

**Indikatorlar va maxsus reaktivlar:** lakmus, fenolftalein, metiloranj, universal indikator, bromtimol ko'ki, erioxrom qora T, kraxmal eritmasi, Lugol eritmasi, bromli suv, xlorli suv, ohakli suv, barit suvi, Tollens reaktivi, Feling suyuqligi, Nessler reaktivi, dimetilglioksim, Trilon B (EDTA).

**Organik moddalar:** metan, etan, propan, butan, geksan, etilen, propen, atsetilen, benzol, toluol, stirol; xloretan, brometan, 2-brompropan, tret-butilxlorid, xloroform; metanol, etanol, propanol-1, propanol-2, butanol-1, tret-butanol, etilenglikol, glitserin, fenol; dietil efir; formalin, atsetaldegid, aseton, benzaldegid; chumoli, sirka, propion, moy, stearin, olein, oksalat, benzoy, sut, limon, salitsil kislotalari; etilatsetat va boshqa murakkab efirlar; o'simlik moyi (triglitserid), sovun; metilamin, etilamin, anilin; glitsin, alanin; oqsil eritmasi; glyukoza, fruktoza, saxaroza, kraxmal, sellyuloza; mochevina; monomerlar va polimerlar (etilen/polietilen, stirol/polistirol, metilmetakrilat/PMMA, kaprolaktam/kapron, geksametilendiamin va adipin kislota hosilasi/neylon, fenol va formaldegid/fenol-formaldegid smola).

### 5.5. Kimyoviy dvigatel

Har bir idishning holati: moddalar va ularning miqdori (mol), fazalar (eritma, cho'kma, qattiq bo'lak, gaz, aralashmaydigan suyuq qatlam), hajm, harorat. Dvigatel har qadamda shu holatni yangilaydi.

Dvigatel gibrid bo'lsin. Birinchi qismi — umumiy qoidalar: tuzlar eritmada ionlarga ajraladi; eruvchanlik jadvali cho'kmani, metallarning faollik qatori o'rin olishni, kislota va asos kuchi neytrallanish va kuchsiz elektrolit hosil bo'lishini, standart potensiallar oksidlanish-qaytarilish yo'nalishini belgilaydi. Shu tufayli katalogda yo'q aralashmalar ham erkin rejimda to'g'ri natija beradi. Ikkinchi qismi — umumiy qoidaga sig'maydigan reaksiyalar uchun aniq yozuvlar (termik parchalanish, organik reaksiyalar, konsentratsiyaga bog'liq mahsulotlar va hokazo).

Hisoblanadigan narsalar: stexiometriya va cheklovchi reagent; reaksiya tezligi (konsentratsiya, harorat, katalizator, qattiq moddaning maydalanganligi ta'sirida — soddalashtirilgan model yetarli); issiqlik effekti va idish haroratining o'zgarishi; pH (kuchli va kuchsiz elektrolitlar uchun) va indikator rangi; eritma rangi (ionlar rangi va konsentratsiyasidan); gaz hajmi va uning asbob grafi bo'ylab oqishi; qizdirilganda qaynash va bug'lanish.

Shartlar bajarilmasa reaksiya ketmaydi yoki boshqacha ketadi: qizdirish kerak bo'lsa qizdirilmaguncha boshlanmaydi; mis suyultirilgan sulfat kislota bilan reaksiyaga kirishmaydi, konsentrlangani bilan qizdirilganda kirishadi; nitrat kislotaning mahsuloti konsentratsiyaga va metallga bog'liq. Reaksiya ketmagan holda interfeys sababini tushuntiradi.

### 5.6. Reaksiyalar katalogi — 1000 ta tajriba

Taqsimot quyidagicha. Har bir toifada ko'rsatilgan sondagi alohida, bir-birini takrorlamaydigan tajriba bo'lsin.

| № | Toifa | Soni |
|---|-------|------|
| 1 | Neytrallanish (kislota + asos, shu jumladan kuchsiz elektrolitlar va nordon tuzlar hosil bo'lishi) | 60 |
| 2 | Ion almashinish: cho'kma hosil bo'lishi | 120 |
| 3 | Ion almashinish: gaz ajralishi (karbonat, sulfit, sulfid, ammoniy tuzlari) | 50 |
| 4 | Metall + kislota | 40 |
| 5 | Metall + tuz eritmasi (faollik qatori) | 50 |
| 6 | Metall + suv, metall + ishqor | 25 |
| 7 | Oksidlarning reaksiyalari (suv, kislota, asos bilan; amfoter oksidlar) | 55 |
| 8 | Amfoter gidroksidlar va kompleks birikmalar hosil bo'lishi | 40 |
| 9 | Termik parchalanish | 45 |
| 10 | Yonish va birikish reaksiyalari (kislorod, xlor, oltingugurt bilan) | 45 |
| 11 | Eritmadagi oksidlanish-qaytarilish (KMnO₄, K₂Cr₂O₇, H₂O₂, galogenlar, HNO₃, kons. H₂SO₄, tiosulfat) | 90 |
| 12 | Gazlarni olish va xossalarini o'rganish (H₂, O₂, CO₂, NH₃, Cl₂, HCl, SO₂, H₂S, NO, NO₂, CH₄, C₂H₄, C₂H₂) | 40 |
| 13 | Tuzlar gidrolizi va indikatorlar | 30 |
| 14 | Elektroliz va galvanik elementlar | 30 |
| 15 | Kation va anionlarning sifat reaksiyalari (alanga rangi bilan birga) | 60 |
| 16 | Uglevodorodlar: alkanlar, alkenlar, alkinlar, arenlar | 50 |
| 17 | Spirtlar, fenollar, oddiy efirlar | 30 |
| 18 | Aldegidlar va ketonlar | 25 |
| 19 | Karbon kislotalar, murakkab efirlar, yog'lar | 35 |
| 20 | Aminlar, aminokislotalar, oqsillar | 20 |
| 21 | Uglevodlar | 15 |
| 22 | Polimerlar: polimerlanish, polikondensatlanish, polimerlarni tanib olish | 15 |
| 23 | Titrlash (kislota-asos, permanganatometriya, yodometriya, kompleksonometriya, argentometriya) | 20 |
| 24 | Kinetika, kimyoviy muvozanat, termokimyo va ko'rgazmali tajribalar | 10 |
| | **Jami** | **1000** |

Har bir tajriba yozuvida quyidagilar bo'ladi (sxema taxminiy, yaxshilashingiz mumkin):

```json
{
  "id": "anorg-chokma-0012",
  "category": "ion-almashinish-chokma",
  "title_uz": "Bariy xlorid va natriy sulfat eritmalarining o'zaro ta'siri",
  "level": "8-sinf",
  "reactants": [
    {"species": "BaCl2", "state": "aq", "conc_M": 0.1},
    {"species": "Na2SO4", "state": "aq", "conc_M": 0.1}
  ],
  "conditions": {"heating": false, "catalyst": null, "note_uz": null},
  "equation": {
    "molecular": "BaCl2 + Na2SO4 = BaSO4↓ + 2NaCl",
    "ionic_full": "Ba²⁺ + 2Cl⁻ + 2Na⁺ + SO4²⁻ = BaSO4↓ + 2Na⁺ + 2Cl⁻",
    "ionic_net": "Ba²⁺ + SO4²⁻ = BaSO4↓"
  },
  "mechanism": {"type": "ion-almashinish", "steps_uz": ["..."]},
  "observations": {
    "precipitate": {"species": "BaSO4", "color": "#f4f4ee", "texture": "mayda-kristall"},
    "gas": null, "solution_color_change": null, "heat": "sezilarsiz", "flame": null
  },
  "kinetics": "bir-zumda",
  "apparatus": ["probirka", "tomizgich"],
  "procedure_uz": ["..."],
  "safety_uz": "...",
  "explanation_uz": "...",
  "questions_uz": ["..."],
  "confidence": "yuqori"
}
```

`confidence` maydoni muhim: mahsulotlar, sharoit yoki kuzatiladigan hodisaga to'liq ishonchingiz komil bo'lmasa `o'rta` deb belgilang — bu yozuvlarni kimyogar alohida tekshiradi. Aniq bilmagan sonli qiymatni (ΔH, eruvchanlik ko'paytmasi, potensial) to'qib chiqarmang; o'rniga sifat darajasini yozing ("kuchli ekzotermik", "kam eriydi"). Sinf darajasini aniq bilmasangiz umumiy teg qo'ying.

Qamrov maktab, litsey va universitetning umumiy, anorganik, organik va analitik kimyo kurslaridagi laboratoriya tajribalari bilan chegaralanadi. Portlovchi moddalar, zaharlovchi jangovar moddalar va giyohvand moddalarni tayyorlash tajribalari kiritilmaydi.

### 5.7. Reaksiya mexanizmlari

Har bir tajriba uchun "Mexanizm" paneli bo'ladi. Anorganik reaksiyalarda: molekulyar, to'liq ionli va qisqartirilgan ionli tenglama; oksidlanish-qaytarilishda elektron balans yoki yarim reaksiyalar, oksidlovchi va qaytaruvchi ko'rsatilgan holda; kislota-asos reaksiyalarida proton ko'chishi; kompleks hosil bo'lishida ligandlar almashinuvi; elektrolizda katod va anod jarayonlari; gidrolizda bosqichlar.

Organik reaksiyalar uchun quyidagi mexanizm turlarining har biriga bosqichma-bosqich, elektron juftlar siljishi egri strelkalar bilan ko'rsatilgan animatsiyali andoza (SVG yoki Canvas) yasang; har bir reaksiya o'z turiga havola qiladi va o'z moddalari bilan ko'rsatiladi:

- radikal almashinish S_R (zanjir boshlanishi, o'sishi, uzilishi);
- elektrofil birikish Ad_E (Markovnikov qoidasi, karbokation barqarorligi);
- radikal birikish Ad_R (peroksid effekti);
- nukleofil almashinish S_N1 va S_N2;
- ajralish E1 va E2 (Zaysev qoidasi);
- aromatik elektrofil almashinish S_EAr (σ-kompleks, o'rinbosarlarning yo'naltiruvchi ta'siri);
- karbonil guruhga nukleofil birikish Ad_N;
- atsil nukleofil almashinish (eterifikatsiya, efir gidrolizi, sovunlanish);
- aldol kondensatsiya;
- spirtlar va aldegidlarning oksidlanishi, karbonil birikmalarning qaytarilishi;
- radikal va ion polimerlanish (initsirlanish, zanjir o'sishi, uzilishi), polikondensatlanish.

### 5.8. Vizual effektlar

Cheklangan sondagi, parametrlar bilan boshqariladigan effekt primitivlari yasang; reaksiya ma'lumoti ularni ishga tushiradi.

- **Suyuqlik:** idish shakliga mos sath va menisk, idish og'dirilganda sathning og'ishi, quyilish oqimi va tomchilar, chayqalish, ikki eritma qo'shilganda rangning girdob bo'lib aralashishi, aralashmaydigan suyuqliklarning qatlamlanishi, ko'pik.
- **Gaz:** pufakchalar (soni va tezligi reaksiya tezligiga bog'liq), rangli gazlar (NO₂ qo'ng'ir, Cl₂ sarg'ish-yashil, brom va yod bug'lari), oq tutun (NH₄Cl), suv bug'i, sovuq shishada kondensat.
- **Qattiq faza:** cho'kma — rangi va tuzilishi bilan (suzmasimon AgCl, iviqsimon Fe(OH)₃ va Al(OH)₃, kristall BaSO₄, "oltin yomg'ir" PbI₂), uning asta cho'kishi; qattiq bo'lakning erib kichrayishi; metall sirtida boshqa metall qoplanishi (temir mixda mis, mis simda kumush "daraxti"); eritmadan kristall o'sishi.
- **Olov va issiqlik:** gorelka va spirt lampasi alangasi, tuzlar bilan alanganing bo'yalishi (Li, Na, K, Ca, Sr, Ba, Cu), uchqunlar (kislorodda temir), ko'zni qamashtiruvchi oq alanga (magniy), cho'g'lanish, qaynash, issiq idish ustida havoning jimirlashi, vodorodni sinashdagi "paq" etgan tovush.
- **Elektr:** elektrodlarda pufakcha va metall qoplanishi, o'tkazuvchanlik lampochkasining yorug'ligi.
- **Shisha:** sinish va qaytarish (yuqori sifatda), ho'l devor, qurum, keskin harorat farqida darz ketish.
- **Tovush (ixtiyoriy):** Web Audio bilan protsedurali — vishillash, qaynash, paq.

### 5.9. Ish rejimlari va interfeys

- **Yo'riqnomali tajriba:** katalogdan tajriba tanlanadi (toifa, sinf, mavzu bo'yicha filtr va qidiruv); kerakli jihoz va reaktivlar ro'yxati, bosqichma-bosqich ko'rsatma, har bosqich to'g'ri bajarilganini tekshirish, yakunda kuzatish, tenglama, mexanizm, tushuntirish va nazorat savollari.
- **Erkin laboratoriya:** istalgan jihoz va modda; natijani dvigatel hal qiladi.
- **Laboratoriya jurnali:** bajarilgan amallar, kuzatuvlar va tenglamalar avtomatik yoziladi; chop etishga qulay ko'rinishi bor.
- **Xavfsizlik:** xavfli amalda ogohlantirish va oqibatning ko'rsatilishi (sachrash, zaharli gaz mo'rili shkafdan tashqarida ajralishi va hokazo), har bir tajribada xavfsizlik qoidasi.

Vaqt yetsa: o'qituvchining ko'rgazma rejimi (interaktiv doska uchun yirik interfeys) va noma'lum moddani aniqlash topshiriqlari. Bular asosiy qismlardan keyin turadi.

## 6. Ustuvorlik tartibi

Ish hajmi juda katta. Tanlov qilishga to'g'ri kelsa, shu tartibga amal qiling: avval to'g'ri ishlaydigan dvigatel va tekshirilgan ma'lumotlar, keyin ulanish tizimi, keyin vizual sifat, keyin 1000 talik to'liq son. Kam sonli, lekin to'g'ri va tekshirilgan reaksiyalari bor ishlaydigan laboratoriya — 1000 ta tekshirilmagan yozuvli buzuq laboratoriyadan qimmatliroq. Maqsad baribir 1000 ta; unga yetmagan bo'lsangiz, hisobotda aniq sonini yozing.

## 7. Cognita'ga ulanish nuqtalari

`backend/lab_router.py` — FastAPI `APIRouter`, mustaqil ishlaydi: katalog va ma'lumot fayllarini berish, foydalanuvchi taraqqiyotini va stol holatini saqlash/o'qish (JSON fayllarga), laboratoriya jurnalini saqlash. Autentifikatsiya va tanga (coin) hisob-kitobi Cognita tomonida bor; ular uchun aniq belgilangan ikki funksiya-qoralama qoldiring (joriy foydalanuvchini olish; pullik amal uchun tanga yechish) va README'da ularni qanday almashtirishni yozing. Frontend backend bo'lmasa ham ishlasin (taraqqiyot brauzerda saqlanadi). README'da modulni `/lab` yo'liga ulash bosqichlari bo'lsin.

## 8. Sifat nazorati

Kimyoviy ma'lumotning to'g'riligi bu loyihadagi eng katta xavf: o'quvchi noto'g'ri tenglamani yodlab qolsa, modul zarar keltiradi. Shuning uchun tekshiruvlar avtomatik bo'lsin.

- **Ma'lumot validatori** (`tools/`): har bir tenglamada atomlar va zaryadlar balansi; reaksiyada tilga olingan har bir modda bazada mavjudligi; sxemaga muvofiqlik; takrorlanuvchi yozuvlar yo'qligi; toifalar bo'yicha sonlar. Validator xatosiz o'tmagan yozuv katalogga kirmaydi.
- **Dvigatel bilan muvofiqlik testi:** katalogdagi har bir tajriba Node'da brauzersiz dvigatel orqali o'tkaziladi va dvigatel bergan mahsulotlar hamda kuzatuvlar yozuvdagi bilan mos kelishi tekshiriladi.
- **Dvigatel birlik testlari:** stexiometriya, cheklovchi reagent, pH, eruvchanlik, faollik qatori, issiqlik.
- **Brauzer testlari (Playwright):** sahna yuklanadi, jihoz qo'yiladi, quyiladi, asbob yig'iladi, bir nechta toifadan namunaviy tajribalar boshidan oxirigacha bajariladi.
- **Ko'z bilan tekshirish:** har bir bosqichda skrinshot olib, o'zingiz ko'rib chiqing. Shisha shishaga, suyuqlik suyuqlikka o'xshamasa, keyingi bosqichga o'tmang. Asosiy holatlar skrinshotlarini `docs/screenshots/`ga saqlang. Brauzersiz muhitdagi dasturiy render sekin bo'ladi — u yerdagi kadr tezligi haqiqiy qurilmani aks ettirmaydi, lekin konsol xatolari va tasvirning to'g'riligi tekshiriladi.
- **Ko'rib chiqish jadvali:** `review/reactions_review.csv` — id, toifa, tenglama, sharoit, kuzatuv, ishonch darajasi. Uni men kimyogar sifatida tekshiraman; `o'rta` ishonchli yozuvlar jadval boshida tursin.

## 9. Ish tartibi

1. Qisqa arxitektura rejasi (`docs/ARCHITECTURE.md`) va ma'lumot sxemasi.
2. Sahna skeleti: xona, stol, bitta stakan, suv quyish. Skrinshot bilan tekshirish.
3. Kimyoviy dvigatel va moddalar bazasi, Node testlari bilan.
4. Jihozlar katalogi va ulanish tizimi, tayyor asbob andozalari.
5. Effekt primitivlari va ularning dvigatelga bog'lanishi.
6. Reaksiyalar katalogi — toifama-toifa, har toifadan keyin validator va muvofiqlik testi. Parallel yordamchi agentlardan foydalanish imkoni bo'lsa, toifalarni ularga bo'lib bering, lekin barcha yozuvlar bir xil validatordan o'tsin.
7. Interfeys: katalog, yo'riqnomali va erkin rejim, jurnal, mexanizm paneli.
8. Backend router, README, yakuniy to'liq test, skrinshotlar.
9. Zip va hisobot.

Har bosqich oxirida loyiha ishlaydigan holatda qolsin — shunda ish qaysi nuqtada to'xtasa ham, topshirsa bo'ladigan natija bo'ladi.

## 10. Yakunlash

Tayyor bo'lgach `cognita-virtual-lab.zip` faylini shu chatga fayl sifatida yuboring. Yoniga (va `HISOBOT.md` ichiga) qisqa hisobot yozing:

- katalogdagi tajribalar soni toifalar bo'yicha: nechtasi validatordan va muvofiqlik testidan o'tgan, nechtasi `o'rta` ishonchli;
- jihozlar va moddalar soni;
- testlar natijasi (nechtasi o'tdi, nechtasi yiqildi va nima uchun);
- to'liq qilinmagan yoki soddalashtirilgan narsalar — ochiq va aniq;
- o'zingiz qabul qilgan muhim qarorlar;
- keyingi qadam uchun tavsiyalar.

Hisobotda bajarilmagan narsani bajarilgan deb ko'rsatmang: men uchun aniq holat chiroyli hisobotdan muhimroq.
