# kinetika-muvozanat — muallif izohlari

Generator: `tools/seed/reactions/kinetika-muvozanat.mjs`.
Holat: 10 yozuv, validator 0 xato, muvofiqlik 10/10; `o'rta` — 2 ta.

| id | tajriba | engine |
|----|---------|--------|
| kinetik-0001 | Na₂S₂O₃ + H₂SO₄ — konsentratsiya va harorat ta'siri | record |
| kinetik-0002 | Marmar bo'lagi va kukuni + HCl (sirt yuzasi) | rules |
| kinetik-0003 | Zn + CH₃COOH va Zn + HCl (reagent tabiati) | rules |
| kinetik-0004 | H₂O₂ + KI katalizatori ("fil tish pastasi") | record |
| kinetik-0005 | FeCl₃ + KSCN muvozanati (Le Shatelye) | record, o'rta |
| kinetik-0006/0007 | CrO₄²⁻ ⇄ Cr₂O₇²⁻ (kislota / ishqor) | record |
| kinetik-0008/0009 | NaOH (ekzo) va NH₄Cl (endo) erishi | rules, `equation_free`, `fizik` |
| kinetik-0010 | Neytrallanish issiqligi | rules |

## Cheklovlar
- Dvigatelda haqiqiy muvozanat yo'q: yozuv chapdan o'ngga oxirigacha bajariladi. Shuning uchun xromat/dixromat ikkita yozuv (ikki yo'nalish) bilan ifodalangan. FeCl₃ + KSCN da reagent qo'shilganda rang quyuqlashadi, lekin KCl qo'shilgandagi siljishni dvigatel ko'rsatmaydi (`o'rta`).
- Harorat ta'siri alohida yozuv qilinmadi: bir xil tenglamali ikkinchi yozuv (`temp_min_C` bilan) bir guruhda raqobatlashib, tezlik modelini buzadi; dvigatel Vant-Goff omilini `kinetik-0001` ga o'zi qo'llaydi.
- `redoks-0070` da xuddi shu S₂O₃²⁻ + 2H⁺ reaksiyasi bor (`medium: kislotali`, aniqligi yuqoriroq) — kislotali muhitda u ishlaydi, `kinetik-0001` esa pH ≥ 4,5 da. Ikkalasi testdan o'tadi; kimyo bir xil.
- Fe³⁺ + 3SCN⁻ — `sifat-reaksiyalari` toifasi ham shu qisqa ionli tenglamani `record` sifatida yozsa, bitta guruhga tushadi va id tartibi bo'yicha faqat bittasi ishlaydi. O'shanda bittasini `engine: "rules"` qilish kerak.
- Yod soati (iodine clock) va NO₂ ⇄ N₂O₄ kiritilmadi: birinchisi bir nechta ketma-ket yozuvni talab qiladi (dvigatel tezliklar nisbatini ifodalamaydi), N₂O₄ bazada yo'q.
- Fizik erish tajribalarida (`equation_free`) muvofiqlik testi hech narsani tekshirmaydi; harorat o'zgarishi dvigatelda bor (NaOH `heat_of_dilution`, NH₄Cl uchun maxsus +25 kJ/mol).
