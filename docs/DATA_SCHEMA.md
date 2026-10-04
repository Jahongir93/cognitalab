# Ma'lumot sxemasi

Barcha ma'lumotlar `frontend/lab/data/` ichida JSON ko'rinishida. Yangi reaksiya qo'shish uchun kod yozilmaydi — tegishli toifa fayliga yozuv qo'shiladi va `npm run validate` ishga tushiriladi.

| Fayl | Mazmuni |
|------|---------|
| `substances.json` | moddalar (kalit — modda `id`) |
| `ions.json` | ionlar (kalit — `"SO4^2-"` ko'rinishidagi id) |
| `rules.json` | umumiy qoidalar jadvallari: eruvchanlik, kislota-asos tizimlari, faollik qatori, komplekslar, indikatorlar, elektroliz |
| `equipment.json` | jihozlar katalogi (portlari bilan) |
| `ports.json` | portlar mosligi jadvali |
| `templates.json` | tayyor asbob andozalari |
| `mechanisms.json` | organik mexanizm andozalari (SVG animatsiya bosqichlari) |
| `reactions/index.json` | toifalar ro'yxati va fayl nomlari (kerak bo'lganda yuklanadi) |
| `reactions/<toifa>.json` | shu toifadagi tajribalar |

## Formula yozuvi

- Tenglamalarda indekslar oddiy raqam (`H2SO4`), zaryad Unicode daraja belgisi bilan (`SO4²⁻`, `Na⁺`, `[Fe(CN)6]⁴⁻`).
- Cho'kma `↓`, gaz `↑` belgisi had oxirida. Konsentratsiya izohi: `H2SO4(kons.)`, `HNO3(suyult.)`.
- Izomerlar izoh bilan ajratiladi: `C6H12O6(fruktoza)` (izohsiz `C6H12O6` — glyukoza).
- Organik tuzilish formulalari: `CH2=CH2`, `CH3–CH2–OH`, polimer `(–CH2–CH2–)n`, koeffitsiyent `n`, `2n`.
- Strelka: ` = ` (anorganik) yoki ` → ` (organik), qaytar reaksiyada ` ⇄ `. Strelka atrofida bo'sh joy majburiy.
- Elektron balans: `Mn⁺⁷ + 5e⁻ = Mn⁺²`, `Fe²⁺ − 1e⁻ = Fe³⁺` (oksidlanish darajasi zaryad kabi tekshiriladi).

Har bir had bazadagi modda yoki ionga bog'lanishi shart: formula `substances.json`dagi `formula` yoki `aliases` bilan, ion esa `ions.json`dagi formula bilan mos kelishi kerak.

## Modda (`substances.json`)

```json
{
  "id": "BaSO4",
  "formula": "BaSO4",
  "display": "BaSO₄",
  "name_uz": "bariy sulfat",
  "class": "tuz",
  "state": "s",
  "M": 233.386,
  "appearance": {"color": "#f4f4ee", "form": "kukun", "desc_uz": null},
  "solubility": "N",
  "ions": {"Ba^2+": 1, "SO4^2-": 1},
  "dissociation": null,
  "precipitate": {"color": "#f4f4ee", "texture": "mayda-kristall"},
  "acid_soluble": null,
  "hazards": ["zaharli"],
  "storage": "tiqinli-sklyanka",
  "solutions": [{"conc_M": 0.1, "grade": "suyultirilgan", "label": "0,1 M"}],
  "reagent": true
}
```

| Maydon | Ma'nosi |
|--------|---------|
| `state` | 25 °C dagi holati: `s` qattiq, `l` suyuq, `g` gaz, `aq` faqat eritmada |
| `solubility` | `R` eriydi, `M` kam eriydi (`s_gL` — g/L), `N` erimaydi, `-` suvda mavjud emas |
| `dissociation` | eritmada hosil qiladigan ionlar (kuchli elektrolitlar) |
| `dissolve_molecular` | eriganda hosil bo'ladigan molekulalar (`NH3·H2O` → `NH3` + `H2O`) |
| `acid_system` | kuchsiz kislota-asos tizimi (`rules.acid_base`) |
| `acid_soluble` | qattiq modda kislotada eriydimi: `kuchsiz` (sirka kislotada ham), `kuchli` (faqat kuchli kislotada), `null` (erimaydi) |
| `precipitate` | cho'kma ko'rinishi: `texture` — `suzmasimon`, `iviqsimon`, `mayda-kristall`, `kristall`, `kukunsimon`, `oltin-yomg'ir`, `kolloid` |
| `metal` | metallar uchun: `ion`, `E0` (V), `n`, `water` (`sovuq`/`issiq`/`yo'q`), `film` |
| `oxide` | oksid turi (`asosli`/`kislotali`/`amfoter`/`befarq`) va gidrati |
| `gas` | gazlar: `water_solubility`, `smell_uz`, `toxic`, `color`, `rel_density_air` |
| `aq_color` | eritmadagi rangi (`hex`, `ref_M`) — molekulyar moddalar uchun (I₂, Br₂ ...) |
| `indicator` | indikator id (`rules.indicators`) |
| `mixture` | aralashma reaktivlar (Lugol, ohakli suv, Feling ...): komponentlar, mol/L |
| `conc_threshold_M` | shu konsentratsiyadan yuqorisi "konsentrlangan" hisoblanadi |
| `hazards` | `korroziv`, `zaharli`, `yonuvchan`, `oksidlovchi`, `zararli`, `atrof-muhit`, `kanserogen`, `bosim`, `portlash-xavfi` |
| `storage` | `tiqinli-sklyanka`, `shlif-tiqinli-sklyanka`, `qoramtir-sklyanka`, `rezina-tiqinli-sklyanka`, `kerosin-ostida`, `ballon`, `germetik-idish`, `polietilen-idish`, `yuvgich`, `kipp-apparati`, `yangi-tayyorlanadi` |

## Ion (`ions.json`)

```json
{"id": "Cu^2+", "formula": "Cu^2+", "display": "Cu²⁺", "name_uz": "mis(II) ioni", "charge": 2,
 "color": {"hex": "#4aa3dc", "ref_M": 0.5}, "flame": {"color": "#21c47a", "desc_uz": "yashil"}, "pKa_h": 7.5}
```

`color` — `ref_M` konsentratsiyada ~1,5 sm qatlamdagi rang (taxminiy). `pKa_h` — akva-ion kislotaligi (gidroliz ko'rinishi uchun, taxminiy).

## Reaksiya (tajriba) yozuvi

```json
{
  "id": "chokma-0012",
  "category": "ion-almashinish-chokma",
  "title_uz": "Bariy xlorid va natriy sulfat eritmalarining o'zaro ta'siri",
  "level": "8-sinf",
  "topic_uz": "Ion almashinish reaksiyalari",
  "engine": "rules",
  "reactants": [
    {"species": "BaCl2", "state": "aq", "conc_M": 0.1, "volume_mL": 2},
    {"species": "Na2SO4", "state": "aq", "conc_M": 0.1, "volume_mL": 2}
  ],
  "conditions": {"heating": false, "temp_min_C": null, "catalyst": null, "medium": null, "light": false, "note_uz": null},
  "equation": {
    "molecular": "BaCl2 + Na2SO4 = BaSO4↓ + 2NaCl",
    "ionic_full": "Ba²⁺ + 2Cl⁻ + 2Na⁺ + SO4²⁻ = BaSO4↓ + 2Na⁺ + 2Cl⁻",
    "ionic_net": "Ba²⁺ + SO4²⁻ = BaSO4↓",
    "electron_balance": null
  },
  "mechanism": {"type": "ion-almashinish", "steps_uz": ["..."], "organic": null},
  "observations": {
    "precipitate": {"species": "BaSO4", "color": "#f4f4ee", "texture": "mayda-kristall"},
    "gas": null,
    "solution_color_change": null,
    "heat": "sezilarsiz",
    "flame": null,
    "effects": [],
    "text_uz": "Oq mayda kristall cho'kma tushadi."
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

### Maydonlar

- `engine`:
  - `rules` — natijani dvigatel umumiy qoidalardan o'zi chiqaradi; yozuv faqat tekshiruv va o'quv matni uchun.
  - `record` — dvigatel shu yozuvning `ionic_net` (bo'lmasa `molecular`) tenglamasini bajaradi.
- `reactants[]`: `species` (modda id yoki formula), `state` (`aq`/`s`/`l`/`g`), eritma uchun `conc_M`, `volume_mL`; qattiq modda uchun `mass_g`, `form`; konsentratsiya sharti `conc_min_M` / `conc_max_M`.
- `conditions`: `heating`, `temp_min_C`, `temp_max_C`, `catalyst` (modda id yoki ro'yxat), `medium` (`kislotali`/`neytral`/`ishqoriy`), `light`, `ignition` (yondirish), `ignition_C`, `electricity`, `note_uz`.
- `no_reaction: true` — reaksiya ketmaydigan holat (masalan, Cu + suyult. H₂SO₄); `explanation_uz` sababni tushuntiradi.
- `observations.heat`: `kuchli-ekzotermik`, `ekzotermik`, `sezilarsiz`, `endotermik`, `kuchli-endotermik` (son qiymat to'qib chiqarilmaydi).
- `observations.effects[]` — qo'shimcha effekt primitivlari: `{"type": "sparks"}`, `light`, `smoke`, `glow`, `pop`, `foam`, `crystals`, `deposit`, `fog`, `condensate`, `layers`, `volcano`, `mirror`, `color-gas`.
- `observations.flame`: `{"color": "#...", "desc_uz": "..."}`.
- `kinetics`: `bir-zumda`, `tez`, `o'rtacha`, `sekin`, `juda-sekin`.
- `level`: `7-sinf` … `11-sinf`, `litsey`, `universitet`, `umumiy`.
- `mechanism.type`: anorganik — `neytrallanish`, `ion-almashinish`, `oksidlanish-qaytarilish`, `kompleks`, `gidroliz`, `elektroliz`, `galvanik`, `termik-parchalanish`, `birikish`, `o'rin-olish`, `sifat-reaksiya`, `fizik`; organik — `mechanism.organic.template` `mechanisms.json`dagi andoza id'si (`SR`, `AdE`, `AdR`, `SN1`, `SN2`, `E1`, `E2`, `SEAr`, `AdN`, `atsil`, `aldol`, `oksidlanish`, `qaytarilish`, `polimer-radikal`, `polimer-ion`, `polikondensatlanish`), `params` — shu reaksiya moddalari.
- `confidence`: `yuqori` yoki `o'rta` (`o'rta` — kimyogar tekshirishi kerak).

## Tekshiruvlar

`npm run validate` (`tools/validate_data.mjs`) har bir yozuv uchun:

1. sxemaga muvofiqlik (majburiy maydonlar, ruxsat etilgan qiymatlar);
2. har bir tenglamada atomlar va zaryad balansi (polimerlarda ikki xil `n` bilan);
3. tenglamadagi har bir modda/ion bazada mavjudligi;
4. `reactants` molekulyar tenglamaning chap tomonida borligi; kuzatuvdagi cho'kma/gaz o'ng tomonda `↓`/`↑` bilan turganligi, cho'kma rangi bazadagi rang bilan mosligi;
5. takrorlanuvchi yozuvlar yo'qligi (id va reaktivlar+shartlar imzosi);
6. jihozlar `equipment.json`da borligi;
7. toifalar bo'yicha sonlar.

Validatordan o'tmagan yozuv katalogga kirmaydi (brauzer ham yuklashda xato yozuvlarni tashlab yuboradi).

`npm test` — dvigatel birlik testlari va **muvofiqlik testi**: har bir tajriba Node'da dvigatel orqali bajariladi va dvigatel bergan mahsulotlar/kuzatuvlar yozuvdagi bilan solishtiriladi.
