# Arxitektura

Bu hujjat modulning tuzilishini va asosiy qarorlarni tushuntiradi. Ma'lumot formatlari — [DATA_SCHEMA.md](DATA_SCHEMA.md).

## 1. Umumiy ko'rinish

```
frontend/lab/
  index.html              kirish nuqtasi (importmap: three -> vendor/three)
  css/tokens.css          dizayn tokenlari (Cognita shu faylni almashtiradi)
  css/lab.css             interfeys uslublari (faqat tokenlardan foydalanadi)
  js/
    engine/               KIMYOVIY DVIGATEL — sof JS, DOM va Three.js'siz (Node'da test qilinadi)
      formula.js          formula va tenglama tahlili, atom/zaryad balansi
      db.js               ma'lumotlar bazasi indeksi (moddalar, ionlar, qoidalar)
      vessel.js           idish holati (moddalar, fazalar, hajm, harorat)
      rules.js            umumiy qoidalar (dissotsilanish, cho'kma, neytrallanish, faollik qatori ...)
      matcher.js          katalogdagi aniq yozuvlarni idish holatiga moslash
      chemistry.js        asosiy API: qo'shish, aralashtirish, qadam (step), tavsif
      ph.js               pH (zaryad balansi, kuchli/kuchsiz elektrolitlar)
      color.js            eritma rangi (Ber–Lambert yaqinlashuvi), indikatorlar
      thermo.js           issiqlik, qizdirish, qaynash, bug'lanish
      apparatus.js        asbob grafi: portlar, ulanishlar, germetiklik, gaz oqimi, bosim
      explain.js          "nega reaksiya ketmadi" tushuntirishlari
    scene/                3D sahna (Three.js)
      app.js, room.js, quality.js, camera.js
      models/             protsedura modellar (aylanish jismlari, jihozlar)
      liquid.js           suyuqlik (og'ish, menisk, oqim)
      effects/            effekt primitivlari (pufakcha, cho'kma, alanga, tutun ...)
      interaction.js      sudrash, yopishish, quyish (sichqoncha + sensor)
    ui/                   interfeys panellari (katalog, inspektor, jurnal, mexanizm)
    i18n/uz.js            barcha interfeys matnlari (lokalizatsiya)
    platform/             Cognita bilan aloqa (API mijoz, localStorage zaxira)
  data/                   JSON ma'lumotlar (moddalar, ionlar, jihozlar, reaksiyalar/<toifa>.json ...)
  vendor/three/           Three.js 0.186.1 va addon'lar (CDN yo'q)
backend/lab_router.py     FastAPI APIRouter
tools/                    validator, ko'rib chiqish jadvali, boshlang'ich generatorlar
tests/                    Node (dvigatel, ma'lumot muvofiqligi) va Playwright testlari
```

## 2. Tamoyil: reaksiyalar — ma'lumot

Dvigatel uch qatlamdan iborat:

1. **Umumiy qoidalar** (`rules.js`) ma'lumot jadvallariga tayanadi: eruvchanlik jadvali, kislota-asos tizimlari (pKa), metallarning faollik qatori va standart potensiallar, kompleks hosil bo'lish jadvali, oksidlar turi. Ular katalogda yo'q aralashmalar uchun ham natija beradi (erkin rejim).
2. **Aniq yozuvlar** (`data/reactions/*.json`) umumiy qoidaga sig'maydigan reaksiyalar uchun: termik parchalanish, organik reaksiyalar, konsentratsiyaga bog'liq mahsulotlar, eritmadagi oksidlanish-qaytarilish. Har bir yozuv `engine: "record"` bilan belgilanadi; dvigatel uning qisqartirilgan ionli (yoki molekulyar) tenglamasini tahlil qilib, chap tomondagi zarrachalar idishda bo'lsa va shartlar bajarilsa, shu tenglama bo'yicha reaksiyani bajaradi.
3. **Effekt primitivlari** (`scene/effects/`) dvigatel chiqaradigan hodisalarni (`precipitate`, `gas`, `color`, `heat`, `flame`, `deposit`, `splash` ...) ko'rinishga aylantiradi. Hech bir reaksiya uchun alohida animatsiya yozilmaydi.

`engine: "rules"` bilan belgilangan yozuvlar (neytrallanish, cho'kma, gaz ajralishi, metall + kislota, metall + tuz va boshqalar) dvigatel tomonidan **ishlatilmaydi** — dvigatel natijani umumiy qoidalardan o'zi chiqaradi, muvofiqlik testi esa yozuvdagi mahsulotlar bilan solishtiradi. Bu ikki mustaqil manbaning (qo'lda yozilgan yozuv va qoidalar) bir-birini tekshirishini ta'minlaydi.

## 3. Idish holati

Idish: `{ T, V_mL, closed, contents }`. `contents` — zarracha identifikatori (`"Na+"`, `"SO4-2"`, `"BaSO4"`, `"H2O"`, `"CH3COOH"`) bo'yicha `{ mol, phase }`, faza: `aq` (eritmada), `s` (qattiq/cho'kma), `l` (alohida suyuq qatlam), `g` (idishdagi gaz).

Eritmaga tushgan tuz, kuchli kislota va ishqor darhol ionlarga ajraladi. Kuchsiz elektrolitlar molekula holida saqlanadi. Har qadamda (`step(dt)`):

1. Kislota-asos: protonlar eng kuchli kislotadan eng kuchli asosga o'tkaziladi (pKa farqi bo'yicha), suv hosil bo'lishi hisoblanadi.
2. Cho'kma: eruvchanlik jadvali bo'yicha erimaydigan juftlar cho'kmaga o'tadi; "kam eriydi" juftlari konsentratsiya chegarasidan oshganda.
3. Kompleks hosil bo'lishi va amfoterlik (ortiqcha ishqor yoki ammiak).
4. Aniq yozuvlar (tezlik modeli bilan).
5. Metallar: kislota bilan (vodoroddan oldingilar, oksidlovchi bo'lmagan kislota), tuz eritmasi bilan (faollik qatori), suv bilan (faol metallar).
6. Uchuvchan moddalar gazga o'tadi; gaz asbob grafi bo'ylab harakatlanadi.
7. Issiqlik balansi, qaynash, bug'lanish, kristallanish.

pH zaryad balansi tenglamasini bisektsiya bilan yechib hisoblanadi (kuchli ionlar + kuchsiz tizimlarning umumiy konsentratsiyasi), shuning uchun tuzlar gidrolizi va bufer eritmalar alohida koddan emas, ma'lumotdan kelib chiqadi.

## 4. Tezlik va issiqlik modeli (soddalashtirilgan)

Har bir jarayonning tezlik sinfi (`bir-zumda`, `tez`, `o'rtacha`, `sekin`, `juda-sekin`) xarakterli vaqtga (τ) aylanadi. Haqiqiy τ harorat (Vant-Goff qoidasi: har 10 °C da 2 marta), katalizator, qattiq moddaning maydaligi (bo'lak / qirindi / kukun) va konsentratsiyaga qarab o'zgaradi. Reaksiya darajasi `1 − e^(−dt/τ)` ulush bilan oshadi.

Issiqlik effekti sifat darajasi bilan beriladi (`kuchli-ekzotermik` ... `kuchli-endotermik`) va harorat o'zgarishini ko'rsatish uchun model qiymatiga aylantiriladi. Faqat neytrallanish (−57 kJ/mol) va suvning bug'lanish issiqligi kabi umumiy ma'lum qiymatlar aniq son sifatida ishlatiladi. Bu modelning harorat ko'rsatkichi sifat jihatdan to'g'ri, son jihatdan taxminiy.

## 5. Asbob grafi va ulanishlar

Har bir jihoz tiplangan portlarga ega (`data/equipment.json`); mos portlar jadvali `data/ports.json` da. Yig'ilgan asbob — graf (tugun: jihoz nusxasi, qirra: port ulanishi). `apparatus.js` (DOM'siz) quyidagilarni hisoblaydi:

- idish germetikmi (barcha og'izlar yopiqmi, tiqin teshiklarida naycha bormi);
- gaz yo'li: manba idishdan naychalar/shlanglar orqali qayerga boradi (havo, suyuqlik ichiga, yig'gich idish, pnevmatik vanna);
- bosim: yopiq hajmda gaz miqdori va harorat bo'yicha; ogohlantirish va tiqin otilishi;
- yig'ish usulining to'g'riligi (gaz zichligi va suvda eruvchanligi bo'yicha).

3D qatlam faqat geometriyani (yopishish, oldindan ko'rinish, shlang egri chizig'i) boshqaradi; mantiq grafda.

## 6. Render va sifat darajalari

- **Yuqori:** `MeshPhysicalMaterial` transmission (haqiqiy sinish), soyalar, to'liq piksel zichligi.
- **O'rta:** fizik material, transmission'siz shaffoflik, soddalashtirilgan soyalar.
- **Past:** standart material, soyasiz, piksel zichligi ≤ 1, effekt zarrachalari kamaytirilgan.

Daraja birinchi ishga tushishda qurilma ma'lumotlari (WebGL renderer nomi, ekran o'lchami, protsessor yadrolari) va qisqa kadr tezligi o'lchovi bo'yicha tanlanadi; foydalanuvchi sozlamalarda o'zgartira oladi. Atrof-muhit xaritasi `RoomEnvironment` dan PMREM bilan yasaladi.

Suyuqlik idishning ichki profilidan yasalgan aylanish jismi; uning sathi dunyo koordinatalarida gorizontal kesuvchi tekislik bilan beriladi (og'ganda ham sath gorizontal qoladi), sath balandligi esa idish ichidagi oldindan hisoblangan nuqtalar to'plami bo'yicha hajmdan topiladi. Shu sababli istalgan shakldagi idishda og'ish va quyilish bir xil kod bilan ishlaydi.

## 7. Platformaga ulanish

`js/platform/api.js` backend mavjudligini tekshiradi (`/api/health`); bo'lmasa taraqqiyot, stol holati va jurnal `localStorage`ga saqlanadi. Backend — `backend/lab_router.py` (README'da ulash bosqichlari).
