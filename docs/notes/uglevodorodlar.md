# uglevodorodlar — muallif izohlari

Generator: `tools/seed/reactions/uglevodorodlar.mjs` (spirtlar-fenollar va aldegid-ketonlar generatorlari uchun umumiy `mk()` yordamchisi ham shu yerda). Yozuvlarni JSON'da emas, generatorda tahrirlang va qayta ishga tushiring; id'lar tartib bo'yicha avtomatik beriladi (uglevod-0001 namunasi o'zgarmaydi).

- 50 ta yozuv, 15 tasi `o'rta`.
- Qo'shilgan moddalar (`tools/seed/extra/uglevodorodlar.json`): C6H10Br2, CH3CH(OH)CH2OH (propilenglikol), HgSO4 (Kucherov katalizatori).
- `gazlar` toifasida bor tajribalar takrorlanmadi: CH4/C2H4/C2H2 yonishi, CH3COONa + NaOH, CaC2 + H2O.
- Mexanizm: organik yozuvlarda `mechanism.type = "organik"` + andoza. Istisnolar (andozaga mos kelmaydi): Al4C3 gidrolizi (`gidroliz`), CH4 pirolizi (`termik-parchalanish`), Zelinskiy trimerlanishi (`birikish`), kumush atsetilenid + HCl (`ion-almashinish`), ekstraksiya (`fizik`, equation_free). `no_reaction` yozuvlarida `organic: null`.
- Yuqori haroratdagi gaz fazali jarayonlarda uchuvchan mahsulot `↑` bilan yozilgan (C6H12 → C6H6↑ + 3H2↑): dvigatel qizigan idishdagi suyuqlik mahsulot uchun haroratni uning qaynash nuqtasiga tushirib yuboradi (pastga qarang).
- Benzol nitrolash: dvigatel HNO3 ni ionlarga ajratgani uchun `ionic_net` = `C6H6 + H⁺ + NO3⁻ → ...`; H2SO4 katalizatori istalgan sulfat ioni bilan "bor" hisoblanadi (dvigatel cheklovi).

## Dvigatel cheklovlari
1. `#thermal`: yozuv qizigan idishda bp < T bo'lgan suyuq mahsulot hosil qilsa, harorat shu bp ga "sakraydi" (masalan 300 °C → 80 °C benzol uchun) va reaksiya to'xtaydi. Takrorlash: `C6H12 → C6H6 + 3H2` (Pt, 300 °C) yozuvini `↑`siz yozib consistency bilan tekshiring.
2. `catalystPresent('H2SO4')` istalgan sulfat (Na2SO4, CuSO4 ...) bilan ham true; `catalystPresent('NaOH')` faqat Na⁺ ni tekshiradi.
3. `no_reaction` + metall (`match` da Na) yozuvi metallni umumiy qoidalardan bloklaydi — natriyli yozuvlarda `blocks_rules: false` qo'yildi.
