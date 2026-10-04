# spirtlar-fenollar — muallif izohlari

Generator: `tools/seed/reactions/spirtlar-fenollar.mjs`. 30 ta yozuv, 9 tasi `o'rta`.

- Qo'shilgan modda: CH3CHClCH3 (2-xlorpropan, Lukas sinovi). Mis glitserat / etilenglikolyat uchun bazadagi `Cu(C3H7O3)2`, `Cu(C2H5O2)2` ishlatildi.
- Etanol → etilen (170 °C) `gazlar` toifasida (gazolish-0041) bor — takrorlanmadi; dietil efir yozuvi (spirt-0007) 140–160 °C oralig'ida (`temp_max_C: 160`).
- Fenol + NaOH / Na2CO3, fenolyat + HCl / CO2 — `engine: "rules"` (kislota-asos qoidalari beradi), `mechanism.type = "neytrallanish"`. Fenol + FeCl3 — equation_free (kompleks tarkibi bazada yo'q). Glitserin/etilenglikol + Cu(OH)2 — `kompleks`, organik andozasiz.
- spirt-0006 (etanol + KMnO4/H⁺ → CH3COOH): boshqa toifadagi redoks-0012 (2MnO4⁻ + 3Mn²⁺ + 4CH3COO⁻ → MnO2) kuchli kislotali eritmada ham ishlaydi (dvigatel CH3COO⁻ ni CH3COOH dan oladi) va Mn²⁺ ni yeydi; shu sababli yozuv kinetikasi `tez`. redoks-0012 ga muhit sharti qo'yish tavsiya etiladi.
