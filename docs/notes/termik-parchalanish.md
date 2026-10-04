# termik-parchalanish — muallif izohlari

Generator: `tools/seed/reactions/termik-parchalanish.mjs` (termik-0001 qo'lda yozilgan, o'zgarishsiz saqlanadi).
Holat: 45 yozuv, validator 0 xato, muvofiqlik 45/45; `o'rta` — 10 ta.

## Gazlar toifasi bilan takrorlanish
Quyidagilar dastlab shu toifaga rejalashtirilgan, lekin `gazlar` toifasida aynan bir xil yozuv bor
(dvigatel bir xil chap tomonli yozuvlardan faqat bittasini bajaradi, ikkinchisi muvofiqlik testidan yiqiladi), shuning uchun bu yerdan olib tashlandi:
- KMnO₄ → K₂MnO₄ + MnO₂ + O₂ — `gazolish-0004`
- KClO₃ (MnO₂ katalizatori) → KCl + O₂ — `gazolish-0006` (katalizatorsiz variant `termik-0031` shu yerda: 4KClO₃ = 3KClO₄ + KCl)
- H₂O₂ (MnO₂) → H₂O + O₂ — `gazolish-0005` (KI katalizatori bilan varianti `kinetik-0004`)

## Ma'lumot/dvigatel bo'yicha eslatmalar
- `gazolish-0015` (NH₃ + HCl = NH₄Cl) da `temp_max_C` yo'q. NH₄Cl ni qizdirish (`termik-0021`, 340 °C) jarayonida gazlar o'sha issiq idishda darhol qayta birikadi — parchalanish/birikish sikli. Oldin `termik-0021` `endotermik` bo'lganida har sikl idishni qizdirib, haroratni ~1000 °C gacha ko'targan; endi `kuchli-endotermik` (haqiqiy ΔH ≈ +176 kJ/mol). Tavsiya: `gazolish-0015` ga `temp_max_C: 300` qo'shish.
- CoCl₂ (suvsiz) bazada pushti rangda (`#c8507a`, tavsifi "kristallogidrat"); suvsiz CoCl₂ ko'k bo'lishi kerak. `termik-0034` da `solid_color_change.to` ko'k (`#2f55c8`) qilib yozildi; baza rangini tuzatish kerak (substances_data.mjs — mening faylim emas).
- Suvsiz FeSO₄ bazada och yashil (`#b4d8a8`); aslida oq-kulrang. `solid_color_change` da `#e6e6dc` ishlatildi.
- Juda yuqori haroratli yozuvlar (BaCO₃ 1050 °C, CuO → Cu₂O 1050 °C, BaO₂ 800 °C) — taxminiy modellash chegaralari, `o'rta`.
- Qaytar juftliklar harorat oynalari bilan ajratilgan: BaO + O₂ (`yonish`, 500–650 °C) ↔ BaO₂ parchalanishi (800 °C); Hg + O₂ (`yonish`, 300–420 °C) ↔ HgO parchalanishi (450 °C); NH₄Cl ↔ NH₃ + HCl (yuqoriga qarang).
- NH₄NO₂ eritma holida (`NH4⁺ + NO2⁻`, 70 °C) — qattiq NH₄NO₂ ni qizdirish xavfli. Agar `gazlar` toifasi ham N₂ ni NH₄Cl + NaNO₂ dan xuddi shu qisqa ionli tenglama bilan olsa, bitta guruh bo'ladi — ikkalasi bir-birini to'sadi.
- NH₄NO₃ parchalanishi ataylab kiritilmagan.
