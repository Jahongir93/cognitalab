# Cognita Virtual Kimyo Laboratoriyasi — backend

`lab_router.py` — mustaqil FastAPI `APIRouter`. U reaksiyalar katalogi va ma'lumot
fayllarini beradi, foydalanuvchining stol holatlarini, laboratoriya jurnalini va tajribalar
bo'yicha taraqqiyotini JSON fayllarga saqlaydi, pullik amal uchun tanga yechadi.
Bog'liqliklar: FastAPI + pydantic + Python standart kutubxonasi.

Frontend backendsiz ham to'liq ishlaydi: backend topilmasa hamma narsa brauzerning
`localStorage`'ida saqlanadi (`frontend/lab/js/platform/api.js`).

## 1. `/lab` yo'liga ulash

```python
# Cognita'ning asosiy ilovasi (masalan, main.py)
from fastapi import FastAPI
from lab_router import router as lab_router, mount_static

app = FastAPI()
# ... Cognita'ning boshqa routerlari ...

app.include_router(lab_router, prefix="/lab")   # API: /lab/api/...
mount_static(app, path="/lab")                  # frontend: /lab/ (ixtiyoriy)
```

Bosqichlar:

1. `backend/lab_router.py` faylini Cognita backendiga ko'chiring (yoki `backend/` papkasini
   `PYTHONPATH`ga qo'shing).
2. Ikki qoralama funksiyani almashtiring (2-bo'lim).
3. `app.include_router(router, prefix="/lab")` bilan ulang.
4. Frontendni berish:
   - **a)** shu ilovaning o'zidan: `mount_static(app, path="/lab")` — `frontend/lab` papkasini
     `StaticFiles(html=True)` sifatida ulaydi. Uni **routerdan keyin** chaqiring, aks holda
     `/lab/api/...` so'rovlarini statik fayllar "yutib" yuboradi. Boshqa joydagi papka uchun:
     `mount_static(app, "/lab", directory="/srv/cognita/lab")`.
   - **b)** nginx/CDN orqali — `frontend/lab` papkasini `/lab/` ga statik qilib bering.
5. Frontendga backend manzilini bildiring (bittasi yetarli):
   - `frontend/lab/index.html` `<head>`iga: `<meta name="cognita-lab-api" content="/lab">`
   - yoki sahifada modullardan oldin: `<script>window.COGNITA_LAB_API = '/lab';</script>`
   - yoki URL parametri: `/lab/?api=/lab`

   Manzil berilmasa yoki `{manzil}/api/health` 1,5 soniyada javob bermasa, frontend
   avtomatik ravishda `localStorage` rejimiga o'tadi.
6. Frontend so'rovlari `credentials: 'include'` bilan yuboriladi — Cognita sessiya cookie'si
   bir xil domenda o'z-o'zidan uzatiladi. Boshqa domendan ulansa, CORS'da
   `allow_credentials=True` va aniq `allow_origins` bering.

## 2. Ikki qoralama funksiyani almashtirish

Faylda platformaga bog'liq faqat **ikkita** funksiya bor, ikkalasi ham `QORALAMA` deb belgilangan.

### `get_current_user()` — joriy foydalanuvchi

FastAPI dependency. `id` va `name` maydonli dict yoki shunday atributli obyekt qaytarsin;
foydalanuvchi kirmagan bo'lsa `HTTPException(401)` ko'tarsin.

```python
from cognita.auth import current_user  # Cognita'ning o'z dependency'si

def get_current_user(user = Depends(current_user)):
    return {"id": user.id, "name": user.full_name}
```

Eng oddiy yo'l — fayldagi funksiya tanasini almashtirish. Faylni o'zgartirmasdan ham bo'ladi:

```python
import lab_router
app.dependency_overrides[lab_router.get_current_user] = cognita_current_user
```

### `charge_coins(user, amount, reason)` — tanga yechish

* `amount` tanga yechib, **yangi balansni** (`int`) qaytaradi;
* `amount == 0` bo'lsa hech narsa yechmaydi, faqat joriy balansni qaytaradi
  (`GET /api/me` balansni shu orqali oladi);
* tanga yetmasa `lab_router.InsufficientCoins(balance, required)` ko'tarsin — router uni
  o'zbekcha xabarli `402` javobga aylantiradi;
* `reason` — tranzaksiya izohi, masalan `lab:experiment:metall-kislota-0003`.

```python
from cognita.billing import wallet

def charge_coins(user, amount, reason):
    if amount == 0:
        return wallet.balance(user["id"])
    try:
        return wallet.debit(user["id"], amount, reason=reason)
    except wallet.NotEnough as e:
        raise InsufficientCoins(e.balance, amount)
```

Qoralama varianti balansni xotirada saqlaydi (har foydalanuvchiga 100 tanga) va server
qayta ishga tushganda yo'qoladi.

## 3. Sozlamalar (muhit o'zgaruvchilari)

| O'zgaruvchi | Ma'nosi | Standart |
|---|---|---|
| `COGNITA_LAB_DATA_DIR` | JSON ombori papkasi | `backend/lab_data/` |
| `COGNITA_LAB_STORE` | Ombor turi: `json` yoki `sqlite` | `json` |
| `COGNITA_LAB_DB` | SQLite fayl yo'li (faqat `COGNITA_LAB_STORE=sqlite` bo'lsa) | `backend/lab_data/lab.sqlite` |
| `COGNITA_LAB_FRONTEND_DIR` | Frontend papkasi (`/api/catalog`, `/api/data/...` va `mount_static` uchun) | `frontend/lab/` |
| `COGNITA_LAB_COST` | Bitta tajribani boshlash narxi, tanga (`LAB_EXPERIMENT_COST`) | `0` (bepul) |

### Saqlash

Standart ombor — `JsonFileStore`: har foydalanuvchiga har tur uchun bitta JSON fayl:

```
lab_data/
  states/u-<id>.json      {"<slot>": {slot, name, state, updated_at}}
  journal/u-<id>.json     [{t, kind, text, experiment_id?, equation?}, ...]
  progress/u-<id>.json    {"<experiment_id>": {completed, best_score, attempts, updated_at}}
```

* Fayl nomi: `u-<id>` (id faqat `A-Za-z0-9_-` dan iborat bo'lsa) yoki `h-<sha256(id)>` —
  foydalanuvchi id'si hech qachon fayl yo'liga xom holda tushmaydi.
* Yozish atomik: vaqtinchalik fayl → `fsync` → `os.replace`; uzilish faylni buzmaydi.
* Parallellik: jarayon ichida `threading.RLock`, bir nechta uvicorn worker uchun
  `lab_data/.lock` ustida `fcntl.flock` (Linux/macOS).
* Buzilgan JSON fayl `*.corrupt-<vaqt>` nomi bilan chetga olinadi, foydalanuvchi bo'sh
  holatdan davom etadi.
* `backend/lab_data/` `.gitignore`da. Zaxira nusxa uchun shu papkani nusxalash kifoya.

Muqobil — `SqliteStore` (`COGNITA_LAB_STORE=sqlite`). Boshqa tizim (PostgreSQL va h.k.)
kerak bo'lsa, `JsonFileStore` metodlariga ega klass yozib `lab_router.set_store(MyStore())`
chaqiring yoki `app.dependency_overrides[lab_router.get_store]` dan foydalaning.

Cheklovlar: stol holati ≤ 1 MB (JSON); bitta so'rovda ≤ 500 ta jurnal yozuvi; har
foydalanuvchiga eng so'nggi 5000 ta jurnal yozuvi saqlanadi.

## 4. API

Barcha yo'llar router prefiksiga nisbatan (`/lab` bilan ulanganda: `/lab/api/...`).
Barcha ma'lumotlar foydalanuvchi bo'yicha ajratilgan. Xatolar: `{"detail": "<o'zbekcha xabar>"}`.

| Metod | Yo'l | Tana / parametrlar | Javob |
|---|---|---|---|
| GET | `/api/health` | — | `{ok: true, service, time}` |
| GET | `/api/catalog` | — | `frontend/lab/data/reactions/index.json` (ochiq) |
| GET | `/api/data/{path}` | `path` — `data/` ichidagi `.json` fayl, masalan `substances.json`, `reactions/index.json` | fayl (ochiq); boshqa hammasi 404 |
| GET | `/api/me` | — | `{id, name, coins}` |
| GET | `/api/states` | — | `[{slot, name, updated_at}]` |
| GET | `/api/states/{slot}` | — | `{slot, name, state, updated_at}`; yo'q bo'lsa 404 |
| PUT | `/api/states/{slot}` | `{name, state}`; `state` — obyekt, `version` va `items: []` majburiy, ≤ 1 MB | `{slot, name, updated_at}`; 413 / 422 |
| DELETE | `/api/states/{slot}` | — | `{ok: true}`; yo'q bo'lsa 404 |
| GET | `/api/journal?limit=200` | `limit` 1…5000 | eng so'nggi yozuvlar, eskidan yangiga: `[{t, kind, text, experiment_id?, equation?}]` |
| POST | `/api/journal` | `{entries: [{t, kind, text, experiment_id?, equation?}]}` | `{ok, added, total}` |
| DELETE | `/api/journal` | — | `{ok, deleted}` |
| GET | `/api/progress` | — | `{"<experiment_id>": {completed, best_score, attempts, updated_at}}` |
| POST | `/api/progress` | `{experiment_id, completed: bool, score: 0…100}` | `{experiment_id, completed, best_score, attempts, updated_at}` |
| POST | `/api/experiments/{experiment_id}/start` | — | `{ok, coins, charged}`; tanga yetmasa 402 |

* `/api/catalog` va `/api/data/...` autentifikatsiyasiz (umumiy ma'lumot). Faqat `.json`
  kengaytmali, `data/` ichida joylashgan fayllar beriladi: `..`, absolyut yo'l, teskari
  slash, yashirin (`.` bilan boshlanuvchi) nomlar va `data/`dan tashqariga olib chiquvchi
  symlinklar rad etiladi (404).
* `slot` — `^[A-Za-z0-9_-]{1,64}$`.
* `experiment_id` — `^[a-z0-9'-]+-\d{4}$` (masalan `metall-kislota-0003`,
  `oksidlanish-qaytarilish-0012`; katalogdagi `data/reactions/index.json` → `items[].id`).
* Taraqqiyot birlashtiriladi: `completed` bir marta `true` bo'lsa shunday qoladi,
  `best_score` — eng yuqori ball, `attempts` har yuborishda +1.
* `t` — vaqt belgisi (millisekund raqam yoki ISO satr), qanday yuborilsa shunday qaytadi.

## 5. Mahalliy ishga tushirish va testlar

```bash
cd backend
pip install -r requirements.txt
python -m pytest -q                        # backend testlari
uvicorn example_app:app --reload --port 8000
# brauzerda: http://localhost:8000/lab/?api=/lab
```

Frontend adapterining localStorage rejimi testi (loyiha ildizidan):

```bash
node --test tests/engine/api_local.test.mjs
```

## 6. Frontend adapteri

`frontend/lab/js/platform/api.js` — frontendning backend bilan gaplashadigan yagona joyi:

```js
import { api } from './platform/api.js';
await api.ready;            // backendni tekshirish tugashini kutadi
api.mode;                   // 'backend' | 'local'
await api.me();             // local rejimda {id: 'local', name: 'Mehmon', coins: null}
await api.saveState('auto', 'Avto saqlash', { version: 1, items: [] });
await api.appendJournal([{ t: Date.now(), kind: 'note', text: 'Kuzatuv' }]);
await api.saveProgress('metall-kislota-0003', true, 90);
await api.startExperiment('metall-kislota-0003'); // local: {ok: true, coins: null, charged: 0}
```

Xatolar o'zbekcha `Error` sifatida tashlanadi (`err.status` — HTTP kodi, tanga yetmasa
`err.code === 'insufficient_coins'`). Local rejimda kalitlar `cognita-lab:` prefiksli;
`localStorage` yopiq bo'lsa ma'lumot sahifa yopilguncha xotirada turadi.
