# aldegid-ketonlar — muallif izohlari

Generator: `tools/seed/reactions/aldegid-ketonlar.mjs`. 25 ta yozuv, 14 tasi `o'rta`.

- Qo'shilgan modda: C6H5COONH4 (ammoniy benzoat).
- Kumush ko'zgu: Ag `↓`siz yozilgan — dvigatel metall mahsulotni `deposit` (ko'zgu) hodisasi sifatida beradi.
- Formaldegid Tollens va Feling bilan karbonatgacha oksidlanadi (karbon-0014 formiat + Cu(OH)2 yozuvi bilan mos).
- Urotropin (6HCHO + 4NH3): Tollens reaktividagi NH3 bilan raqobat qilmasligi uchun NH3 `conc_min_M: 1`. Urotropin bazada `solubility` siz — dvigatel uni eritmada emas, qattiq faza sifatida ko'rsatadi (aslida suvda yaxshi eriydi).
- Aldol: `medium: ishqoriy`, `temp_max_C: 30` (qizdiriladigan Tollens/Feling sinovlarini o'g'irlamasligi uchun).
