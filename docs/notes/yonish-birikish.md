# yonish-birikish — muallif izohlari

Generator: `tools/seed/reactions/yonish-birikish.mjs`. Qo'shimcha modda: `tools/seed/extra/yonish-birikish.json` (Cu₂S).
Holat: 33 yozuv (maqsad 45), validator 0 xato, muvofiqlik 33/33; `o'rta` — 15 ta.

## Nega 45 emas
Dastlabki rejadagi 10 ta klassik tajriba boshqa toifalarda aynan bir xil yozuv sifatida allaqachon bor.
Dvigatel bir xil chap tomonli yozuvlardan faqat bittasini bajaradi, shuning uchun takrorlash ikkinchi yozuvni ishdan chiqaradi:
- C + O₂ — `gazolish-0007`; 3Fe + 2O₂ — `gazolish-0008`; 2Mg + CO₂ — `gazolish-0013`; 2H₂ + O₂ (qarsillash) — `gazolish-0002`;
  4NH₃ + 3O₂ — `gazolish-0018`; 2H₂S + 3O₂ — `gazolish-0033`; 2NO + O₂ — `gazolish-0035`; NH₃ + HCl — `gazolish-0015`; Cu + Cl₂ — `gazolish-0024`.
- Metan, etilen, atsetilen, benzol yonishi — `uglevodorodlar`/`gazlar` toifalarida.
Qolgan bo'sh joylar ataylab to'ldirilmadi: K + Cl₂ va Al + Cl₂ dan boshqa variantlar (Mg + I₂, Fe + Br₂ ...) faqat takror bo'lardi.
Al + S, Mg + S, Li + O₂ yozilmadi: Al₂S₃, MgS, Li₂O bazada yo'q; ularni `extra` formatida to'g'ri qo'shib bo'lmaydi
(gidrolizlanish/oksid + suv xossalarini qisqa format ifodalay olmaydi).

## Olib tashlangan
- 4NH₃ + 5O₂ = 4NO + 6H₂O (Pt katalizatori). Hosil bo'lgan NO darhol `gazolish-0035` (2NO + O₂ = 2NO₂, harorat chegarasisiz) bilan NO₂ ga aylanadi, shuning uchun NO mahsulot sifatida qolmaydi.
  Haqiqatda 2NO₂ ⇄ 2NO + O₂ muvozanati ~150 °C dan yuqorida chapga siljiydi. Tavsiya: `gazolish-0035` ga `temp_max_C` (~150) qo'shilsa, yozuvni qaytarish mumkin.

## Eslatmalar
- Na + O₂: yonish → Na₂O₂ (`yonish-0008`, ignition + `temp_min_C` 100); xona haroratida → Na₂O (`yonish-0009`, `temp_max_C` 60, `juda-sekin`). Yonish testida isish paytida ozroq Na₂O ham hosil bo'ladi (kutilgan).
- Al + I₂ va Zn + I₂: katalizator `H2O`. Dvigatelda mahsulot (AlI₃/ZnI₂) suvli fazaga ionlarga ajralmasdan molekula holida qo'shiladi (`#applyEq` eriydigan elektrolitni dissotsilamaydi) — test o'tadi, lekin eritma tarkibi ko'rinishi noaniq bo'lishi mumkin.
- Br₂ va Hg suyuqlik reagentlari (`state: "l"`) `miscible_water` bo'lmagani uchun (Hg) "aq" fazaga qo'shiladi — reaksiya ishlaydi, faza ko'rinishi esa noaniq.
- N₂ + 3H₂ (Fe) va 2SO₂ + O₂ (Pt) — sanoat jarayonlari modeli, `⇄` bilan yozilgan; dvigatel ularni faqat chapdan o'ngga bajaradi.
