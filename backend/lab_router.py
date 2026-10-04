"""Cognita Virtual Kimyo Laboratoriyasi — backend router.

FastAPI ``APIRouter``: reaksiyalar katalogi va ma'lumot fayllarini beradi, foydalanuvchi
taraqqiyoti, stol holatlari va laboratoriya jurnalini saqlaydi hamda pullik tajribalar
uchun tanga yechadi.

Ulash (batafsil: backend/README.md)::

    from fastapi import FastAPI
    from lab_router import router, mount_static

    app = FastAPI()
    app.include_router(router, prefix="/lab")   # API: /lab/api/...
    mount_static(app, path="/lab")              # frontend: /lab/  (ixtiyoriy, eng oxirida)

Cognita tomonidan almashtiriladigan IKKITA qoralama funksiya bor:

* ``get_current_user()`` — joriy foydalanuvchini qaytaradigan FastAPI dependency;
* ``charge_coins(user, amount, reason)`` — tanga yechish (``amount == 0`` — faqat balansni o'qish).

Qolgan hamma narsa (saqlash, validatsiya, endpointlar) platformadan mustaqil.
Saqlash: standart — JSON fayllar (``COGNITA_LAB_DATA_DIR``), muqobil — SQLite.
Bog'liqliklar: faqat stdlib + FastAPI/pydantic.
"""

from __future__ import annotations

import json
import os
import re
import sqlite3
import tempfile
import threading
import hashlib
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

__all__ = [
    "router",
    "get_current_user",
    "charge_coins",
    "InsufficientCoins",
    "LabStore",
    "JsonFileStore",
    "SqliteStore",
    "make_store_from_env",
    "frontend_dir",
    "get_store",
    "set_store",
    "mount_static",
    "LAB_EXPERIMENT_COST",
]

# ---------------------------------------------------------------------------
# Sozlamalar
# ---------------------------------------------------------------------------

#: Bitta tajribani boshlash narxi (tanga). Muhit o'zgaruvchisi: COGNITA_LAB_COST.
LAB_EXPERIMENT_COST: int = int(os.environ.get("COGNITA_LAB_COST", "0") or 0)

#: Stol holatining maksimal hajmi (JSON, bayt).
MAX_STATE_BYTES = 1_000_000
#: Bitta so'rovdagi jurnal yozuvlari soni va foydalanuvchi uchun umumiy chegara.
MAX_JOURNAL_BATCH = 500
MAX_JOURNAL_PER_USER = 5000
MAX_TEXT_LEN = 4000

EXPERIMENT_ID_RE = re.compile(r"^[a-z0-9'-]+-\d{4}$")
SLOT_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

BACKEND_DIR = Path(__file__).resolve().parent
#: Frontend papkasi (statik fayllar va ``data/``). Muhit o'zgaruvchisi: COGNITA_LAB_FRONTEND_DIR.
DEFAULT_FRONTEND_DIR = BACKEND_DIR.parent / "frontend" / "lab"
#: JSON omborining papkasi. Muhit o'zgaruvchisi: COGNITA_LAB_DATA_DIR.
DEFAULT_DATA_DIR = BACKEND_DIR / "lab_data"


def frontend_dir() -> Path:
    """Frontend papkasi (har chaqiruvda muhitdan o'qiladi)."""
    return Path(os.environ.get("COGNITA_LAB_FRONTEND_DIR") or DEFAULT_FRONTEND_DIR).resolve()


# ---------------------------------------------------------------------------
# 1-QORALAMA: joriy foydalanuvchi  (Cognita o'z autentifikatsiyasi bilan almashtiradi)
# ---------------------------------------------------------------------------

def get_current_user() -> Dict[str, Any]:
    """QORALAMA. Joriy foydalanuvchini qaytaradi.

    Cognita'da bu funksiya sessiya/JWT orqali haqiqiy foydalanuvchini olib,
    ``{"id": ..., "name": ...}`` (yoki ``id`` va ``name`` atributli obyekt)
    qaytarishi, avtorizatsiya bo'lmasa ``HTTPException(401)`` ko'tarishi kerak.
    """
    return {"id": "demo", "name": "Demo o'quvchi"}


# ---------------------------------------------------------------------------
# 2-QORALAMA: tanga yechish  (Cognita o'z hisob-kitobi bilan almashtiradi)
# ---------------------------------------------------------------------------

class InsufficientCoins(Exception):
    """Balansda tanga yetarli emas."""

    def __init__(self, balance: int, required: int):
        super().__init__(f"Tanga yetarli emas: balans {balance}, kerak {required}")
        self.balance = balance
        self.required = required


DEMO_START_BALANCE = 100
_demo_balances: Dict[str, int] = {}
_demo_lock = threading.Lock()


def charge_coins(user: Any, amount: int, reason: str) -> int:
    """QORALAMA. Foydalanuvchidan ``amount`` tanga yechadi va yangi balansni qaytaradi.

    * ``amount == 0`` — hech narsa yechilmaydi, joriy balans qaytariladi
      (``GET /api/me`` shu orqali balansni o'qiydi).
    * Tanga yetmasa ``InsufficientCoins`` ko'tariladi (router uni 402 ga aylantiradi).

    Demo varianti balansni xotirada saqlaydi (har foydalanuvchiga 100 tanga).
    """
    if amount < 0:
        raise ValueError("amount manfiy bo'lishi mumkin emas")
    uid = _user_id(user)
    with _demo_lock:
        balance = _demo_balances.setdefault(uid, DEMO_START_BALANCE)
        if amount > balance:
            raise InsufficientCoins(balance, amount)
        balance -= amount
        _demo_balances[uid] = balance
        return balance


# ---------------------------------------------------------------------------
# Yordamchilar
# ---------------------------------------------------------------------------

def _user_field(user: Any, key: str) -> Any:
    if isinstance(user, dict):
        return user.get(key)
    return getattr(user, key, None)


def _user_id(user: Any) -> str:
    uid = _user_field(user, "id")
    if uid is None or str(uid) == "":
        raise HTTPException(status_code=401, detail="Foydalanuvchi aniqlanmadi")
    return str(uid)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _check_experiment_id(experiment_id: str) -> str:
    if not EXPERIMENT_ID_RE.match(experiment_id or "") or len(experiment_id) > 120:
        raise HTTPException(status_code=422, detail="Noto'g'ri tajriba identifikatori")
    return experiment_id


def _check_slot(slot: str) -> str:
    if not SLOT_RE.match(slot or ""):
        raise HTTPException(
            status_code=422,
            detail="Noto'g'ri slot nomi (faqat lotin harflari, raqamlar, '-' va '_', 64 belgigacha)",
        )
    return slot


# ---------------------------------------------------------------------------
# Saqlash qatlami
#
# Standart: JsonFileStore — har foydalanuvchiga har tur uchun bitta JSON fayl
#   {COGNITA_LAB_DATA_DIR}/{states|journal|progress}/{foydalanuvchi}.json
# Muqobil: SqliteStore (COGNITA_LAB_STORE=sqlite, fayl — COGNITA_LAB_DB).
# Ikkalasi ham bir xil metodlarga ega; boshqa ombor uchun shu metodlarni yozing.
# ---------------------------------------------------------------------------

_SCHEMA = """
CREATE TABLE IF NOT EXISTS lab_states (
    user_id    TEXT NOT NULL,
    slot       TEXT NOT NULL,
    name       TEXT NOT NULL,
    state      TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, slot)
);
CREATE TABLE IF NOT EXISTS lab_journal (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT NOT NULL,
    t             TEXT NOT NULL,
    kind          TEXT NOT NULL,
    text          TEXT NOT NULL,
    experiment_id TEXT,
    equation      TEXT,
    created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS lab_journal_user ON lab_journal (user_id, id);
CREATE TABLE IF NOT EXISTS lab_progress (
    user_id       TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    completed     INTEGER NOT NULL DEFAULT 0,
    best_score    INTEGER NOT NULL DEFAULT 0,
    attempts      INTEGER NOT NULL DEFAULT 0,
    updated_at    TEXT NOT NULL,
    PRIMARY KEY (user_id, experiment_id)
);
"""


class SqliteStore:
    """SQLite ombori (muqobil). ``path=":memory:"`` — xotirada (jarayon tugaguncha)."""

    def __init__(self, path: Optional[str] = None):
        self.path = path or ":memory:"
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._db = sqlite3.connect(self.path, check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        with self._lock:
            self._db.executescript(_SCHEMA)
            self._db.commit()

    def close(self) -> None:
        with self._lock:
            self._db.close()

    def _q(self, sql: str, args: tuple = ()) -> List[sqlite3.Row]:
        with self._lock:
            cur = self._db.execute(sql, args)
            rows = cur.fetchall()
            self._db.commit()
            return rows

    # --- stol holatlari ---
    def list_states(self, uid: str) -> List[Dict[str, Any]]:
        rows = self._q(
            "SELECT slot, name, updated_at FROM lab_states WHERE user_id=? ORDER BY updated_at DESC, slot",
            (uid,),
        )
        return [dict(r) for r in rows]

    def get_state(self, uid: str, slot: str) -> Optional[Dict[str, Any]]:
        rows = self._q(
            "SELECT slot, name, state, updated_at FROM lab_states WHERE user_id=? AND slot=?",
            (uid, slot),
        )
        if not rows:
            return None
        r = dict(rows[0])
        r["state"] = json.loads(r["state"])
        return r

    def put_state(self, uid: str, slot: str, name: str, state_json: str) -> Dict[str, Any]:
        ts = _now()
        self._q(
            "INSERT INTO lab_states (user_id, slot, name, state, updated_at) VALUES (?,?,?,?,?) "
            "ON CONFLICT(user_id, slot) DO UPDATE SET name=excluded.name, state=excluded.state, "
            "updated_at=excluded.updated_at",
            (uid, slot, name, state_json, ts),
        )
        return {"slot": slot, "name": name, "updated_at": ts}

    def delete_state(self, uid: str, slot: str) -> bool:
        with self._lock:
            cur = self._db.execute("DELETE FROM lab_states WHERE user_id=? AND slot=?", (uid, slot))
            self._db.commit()
            return cur.rowcount > 0

    # --- jurnal ---
    def get_journal(self, uid: str, limit: int) -> List[Dict[str, Any]]:
        rows = self._q(
            "SELECT t, kind, text, experiment_id, equation FROM "
            "(SELECT * FROM lab_journal WHERE user_id=? ORDER BY id DESC LIMIT ?) ORDER BY id ASC",
            (uid, limit),
        )
        out = []
        for r in rows:
            d = dict(r)
            d["t"] = json.loads(d["t"])
            out.append({k: v for k, v in d.items() if v is not None})
        return out

    def append_journal(self, uid: str, entries: List[Dict[str, Any]]) -> int:
        ts = _now()
        with self._lock:
            self._db.executemany(
                "INSERT INTO lab_journal (user_id, t, kind, text, experiment_id, equation, created_at) "
                "VALUES (?,?,?,?,?,?,?)",
                [
                    (uid, json.dumps(e["t"]), e["kind"], e["text"], e.get("experiment_id"),
                     e.get("equation"), ts)
                    for e in entries
                ],
            )
            # eski yozuvlarni kesish
            self._db.execute(
                "DELETE FROM lab_journal WHERE user_id=? AND id NOT IN "
                "(SELECT id FROM lab_journal WHERE user_id=? ORDER BY id DESC LIMIT ?)",
                (uid, uid, MAX_JOURNAL_PER_USER),
            )
            self._db.commit()
            (count,) = self._db.execute(
                "SELECT COUNT(*) FROM lab_journal WHERE user_id=?", (uid,)
            ).fetchone()
            return int(count)

    def clear_journal(self, uid: str) -> int:
        with self._lock:
            cur = self._db.execute("DELETE FROM lab_journal WHERE user_id=?", (uid,))
            self._db.commit()
            return cur.rowcount

    # --- taraqqiyot ---
    def get_progress(self, uid: str) -> Dict[str, Dict[str, Any]]:
        rows = self._q(
            "SELECT experiment_id, completed, best_score, attempts, updated_at FROM lab_progress "
            "WHERE user_id=? ORDER BY experiment_id",
            (uid,),
        )
        return {
            r["experiment_id"]: {
                "completed": bool(r["completed"]),
                "best_score": r["best_score"],
                "attempts": r["attempts"],
                "updated_at": r["updated_at"],
            }
            for r in rows
        }

    def save_progress(self, uid: str, experiment_id: str, completed: bool, score: int) -> Dict[str, Any]:
        ts = _now()
        self._q(
            "INSERT INTO lab_progress (user_id, experiment_id, completed, best_score, attempts, updated_at) "
            "VALUES (?,?,?,?,1,?) ON CONFLICT(user_id, experiment_id) DO UPDATE SET "
            "completed=MAX(completed, excluded.completed), best_score=MAX(best_score, excluded.best_score), "
            "attempts=attempts+1, updated_at=excluded.updated_at",
            (uid, experiment_id, int(completed), score, ts),
        )
        return self.get_progress(uid)[experiment_id]


try:  # bir nechta worker jarayoni uchun fayl qulfi (POSIX)
    import fcntl  # type: ignore
except ImportError:  # pragma: no cover - Windows
    fcntl = None  # type: ignore

_SAFE_UID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


class JsonFileStore:
    """JSON fayl ombori (standart).

    * fayl: ``{root}/{kind}/{u-<id> | h-<sha256>}.json`` (kind: states, journal, progress);
    * yozish atomik: vaqtinchalik fayl + ``os.replace``;
    * parallellik: jarayon ichida ``threading.RLock``, jarayonlar orasida ``fcntl.flock``
      (``{root}/.lock``) — POSIX tizimlarida.
    """

    KINDS = ("states", "journal", "progress")

    def __init__(self, root: Optional[Union[str, Path]] = None):
        self.root = Path(root or os.environ.get("COGNITA_LAB_DATA_DIR") or DEFAULT_DATA_DIR)
        for kind in self.KINDS:
            (self.root / kind).mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._lock_path = self.root / ".lock"

    def close(self) -> None:  # interfeys muvofiqligi uchun
        pass

    # --- past daraja ---
    @staticmethod
    def _file_key(uid: str) -> str:
        if _SAFE_UID_RE.match(uid):
            return "u-" + uid
        return "h-" + hashlib.sha256(uid.encode("utf-8")).hexdigest()

    def _path(self, kind: str, uid: str) -> Path:
        return self.root / kind / (self._file_key(uid) + ".json")

    @contextmanager
    def _locked(self):
        with self._lock:
            if fcntl is None:
                yield
                return
            with open(self._lock_path, "a+") as fh:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
                try:
                    yield
                finally:
                    fcntl.flock(fh.fileno(), fcntl.LOCK_UN)

    def _read(self, kind: str, uid: str, default: Any) -> Any:
        p = self._path(kind, uid)
        try:
            with open(p, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except FileNotFoundError:
            return default
        except (OSError, ValueError):
            # buzilgan fayl: yo'qotmaslik uchun nusxasini qoldirib, bo'sh holatdan boshlaymiz
            try:
                os.replace(p, p.with_suffix(".corrupt-" + datetime.now().strftime("%Y%m%d%H%M%S")))
            except OSError:
                pass
            return default

    def _write(self, kind: str, uid: str, data: Any) -> None:
        p = self._path(kind, uid)
        fd, tmp = tempfile.mkstemp(prefix=".tmp-", suffix=".json", dir=str(p.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(tmp, p)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

    # --- stol holatlari ---
    def list_states(self, uid: str) -> List[Dict[str, Any]]:
        with self._locked():
            data = self._read("states", uid, {})
        items = [{"slot": v["slot"], "name": v["name"], "updated_at": v["updated_at"]} for v in data.values()]
        items.sort(key=lambda r: r["slot"])
        items.sort(key=lambda r: r["updated_at"], reverse=True)
        return items

    def get_state(self, uid: str, slot: str) -> Optional[Dict[str, Any]]:
        with self._locked():
            return self._read("states", uid, {}).get(slot)

    def put_state(self, uid: str, slot: str, name: str, state_json: str) -> Dict[str, Any]:
        ts = _now()
        with self._locked():
            data = self._read("states", uid, {})
            data[slot] = {"slot": slot, "name": name, "state": json.loads(state_json), "updated_at": ts}
            self._write("states", uid, data)
        return {"slot": slot, "name": name, "updated_at": ts}

    def delete_state(self, uid: str, slot: str) -> bool:
        with self._locked():
            data = self._read("states", uid, {})
            if slot not in data:
                return False
            del data[slot]
            self._write("states", uid, data)
            return True

    # --- jurnal ---
    def get_journal(self, uid: str, limit: int) -> List[Dict[str, Any]]:
        with self._locked():
            data = self._read("journal", uid, [])
        return [{k: v for k, v in e.items() if v is not None} for e in data[-limit:]]

    def append_journal(self, uid: str, entries: List[Dict[str, Any]]) -> int:
        with self._locked():
            data = self._read("journal", uid, [])
            data.extend({k: v for k, v in e.items() if v is not None} for e in entries)
            data = data[-MAX_JOURNAL_PER_USER:]
            if entries:
                self._write("journal", uid, data)
            return len(data)

    def clear_journal(self, uid: str) -> int:
        with self._locked():
            data = self._read("journal", uid, [])
            if data:
                self._write("journal", uid, [])
            return len(data)

    # --- taraqqiyot ---
    def get_progress(self, uid: str) -> Dict[str, Dict[str, Any]]:
        with self._locked():
            data = self._read("progress", uid, {})
        return dict(sorted(data.items()))

    def save_progress(self, uid: str, experiment_id: str, completed: bool, score: int) -> Dict[str, Any]:
        with self._locked():
            data = self._read("progress", uid, {})
            prev = data.get(experiment_id) or {"completed": False, "best_score": 0, "attempts": 0}
            rec = {
                "completed": bool(prev["completed"]) or bool(completed),
                "best_score": max(int(prev["best_score"]), int(score)),
                "attempts": int(prev["attempts"]) + 1,
                "updated_at": _now(),
            }
            data[experiment_id] = rec
            self._write("progress", uid, data)
            return dict(rec)


#: Orqaga moslik uchun nom.
LabStore = JsonFileStore


def make_store_from_env() -> Any:
    """``COGNITA_LAB_STORE`` bo'yicha ombor: ``json`` (standart) yoki ``sqlite``."""
    kind = (os.environ.get("COGNITA_LAB_STORE") or "json").strip().lower()
    if kind == "sqlite":
        return SqliteStore(os.environ.get("COGNITA_LAB_DB") or str(DEFAULT_DATA_DIR / "lab.sqlite"))
    if kind != "json":
        raise RuntimeError(f"Noma'lum COGNITA_LAB_STORE qiymati: {kind!r} (json yoki sqlite)")
    return JsonFileStore()


_store: Optional[Any] = None
_store_lock = threading.Lock()


def get_store() -> Any:
    """FastAPI dependency: joriy ombor (birinchi chaqiruvda muhit bo'yicha yaratiladi)."""
    global _store
    if _store is None:
        with _store_lock:
            if _store is None:
                _store = make_store_from_env()
    return _store


def set_store(store: Optional[Any]) -> None:
    """Omborni almashtirish (testlar yoki boshqa saqlash tizimi uchun)."""
    global _store
    _store = store


# ---------------------------------------------------------------------------
# So'rov modellari
# ---------------------------------------------------------------------------

class StateIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    state: Dict[str, Any]


class JournalEntry(BaseModel):
    t: Union[float, str]
    kind: str = Field(..., min_length=1, max_length=40)
    text: str = Field(..., max_length=MAX_TEXT_LEN)
    experiment_id: Optional[str] = Field(None, max_length=120)
    equation: Optional[str] = Field(None, max_length=1000)


class JournalIn(BaseModel):
    entries: List[JournalEntry] = Field(..., max_length=MAX_JOURNAL_BATCH)


class ProgressIn(BaseModel):
    experiment_id: str
    completed: bool
    score: int = Field(..., ge=0, le=100)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(tags=["lab"])


@router.get("/api/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "cognita-lab", "time": _now()}


@router.get("/api/me")
def me(user: Any = Depends(get_current_user)) -> Dict[str, Any]:
    return {
        "id": _user_id(user),
        "name": _user_field(user, "name") or "",
        "coins": charge_coins(user, 0, "balance"),
    }


# --- katalog va ma'lumot fayllari (ochiq, autentifikatsiyasiz) ---

def _data_dir() -> Path:
    return frontend_dir() / "data"


def _safe_data_file(rel: str) -> Path:
    """``frontend/lab/data`` ichidagi .json faylni xavfsiz topadi (aks holda 404)."""
    not_found = HTTPException(status_code=404, detail="Fayl topilmadi")
    if not rel or "\\" in rel or "\x00" in rel or rel.startswith("/"):
        raise not_found
    parts = rel.split("/")
    if any(p in ("", ".", "..") or p.startswith(".") for p in parts):
        raise not_found
    if not rel.lower().endswith(".json"):
        raise not_found
    root = _data_dir().resolve()
    target = (root / rel).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        raise not_found
    if not target.is_file():
        raise not_found
    return target


def _json_file(path: Path) -> FileResponse:
    return FileResponse(str(path), media_type="application/json; charset=utf-8",
                        headers={"Cache-Control": "public, max-age=300"})


@router.get("/api/catalog")
def catalog():
    return _json_file(_safe_data_file("reactions/index.json"))


@router.get("/api/data/{path:path}")
def data_file(path: str):
    return _json_file(_safe_data_file(path))


# --- stol holatlari ---

@router.get("/api/states")
def list_states(user: Any = Depends(get_current_user), store: Any = Depends(get_store)):
    return store.list_states(_user_id(user))


@router.get("/api/states/{slot}")
def get_state(slot: str, user: Any = Depends(get_current_user), store: Any = Depends(get_store)):
    _check_slot(slot)
    item = store.get_state(_user_id(user), slot)
    if item is None:
        raise HTTPException(status_code=404, detail="Saqlangan holat topilmadi")
    return item


@router.put("/api/states/{slot}")
def put_state(
    slot: str,
    body: StateIn,
    user: Any = Depends(get_current_user),
    store: Any = Depends(get_store),
):
    _check_slot(slot)
    state = body.state
    if "version" not in state:
        raise HTTPException(status_code=422, detail="Holatda 'version' maydoni yo'q")
    if not isinstance(state.get("items"), list):
        raise HTTPException(status_code=422, detail="Holatda 'items' ro'yxati bo'lishi kerak")
    raw = json.dumps(state, ensure_ascii=False, separators=(",", ":"))
    if len(raw.encode("utf-8")) > MAX_STATE_BYTES:
        raise HTTPException(status_code=413, detail="Holat juda katta (1 MB dan oshmasin)")
    return store.put_state(_user_id(user), slot, body.name, raw)


@router.delete("/api/states/{slot}")
def delete_state(slot: str, user: Any = Depends(get_current_user), store: Any = Depends(get_store)):
    _check_slot(slot)
    if not store.delete_state(_user_id(user), slot):
        raise HTTPException(status_code=404, detail="Saqlangan holat topilmadi")
    return {"ok": True}


# --- jurnal ---

@router.get("/api/journal")
def get_journal(
    limit: int = Query(200, ge=1, le=MAX_JOURNAL_PER_USER),
    user: Any = Depends(get_current_user),
    store: Any = Depends(get_store),
):
    return store.get_journal(_user_id(user), limit)


@router.post("/api/journal")
def append_journal(
    body: JournalIn,
    user: Any = Depends(get_current_user),
    store: Any = Depends(get_store),
):
    entries = [e.model_dump() for e in body.entries]
    for e in entries:
        if e.get("experiment_id") is not None:
            _check_experiment_id(e["experiment_id"])
    total = store.append_journal(_user_id(user), entries)
    return {"ok": True, "added": len(entries), "total": total}


@router.delete("/api/journal")
def clear_journal(user: Any = Depends(get_current_user), store: Any = Depends(get_store)):
    return {"ok": True, "deleted": store.clear_journal(_user_id(user))}


# --- taraqqiyot ---

@router.get("/api/progress")
def get_progress(user: Any = Depends(get_current_user), store: Any = Depends(get_store)):
    return store.get_progress(_user_id(user))


@router.post("/api/progress")
def save_progress(
    body: ProgressIn,
    user: Any = Depends(get_current_user),
    store: Any = Depends(get_store),
):
    _check_experiment_id(body.experiment_id)
    rec = store.save_progress(_user_id(user), body.experiment_id, body.completed, body.score)
    return {"experiment_id": body.experiment_id, **rec}


# --- pullik amal: tajribani boshlash ---

@router.post("/api/experiments/{experiment_id}/start")
def start_experiment(experiment_id: str, user: Any = Depends(get_current_user)):
    _check_experiment_id(experiment_id)
    cost = int(LAB_EXPERIMENT_COST)
    try:
        coins = charge_coins(user, cost, f"lab:experiment:{experiment_id}")
    except InsufficientCoins as exc:
        raise HTTPException(
            status_code=402,
            detail=f"Tanga yetarli emas: tajriba narxi {exc.required}, balansingizda {exc.balance}.",
        )
    return {"ok": True, "coins": coins, "charged": cost}


# ---------------------------------------------------------------------------
# Ixtiyoriy: frontendni shu ilovadan berish
# ---------------------------------------------------------------------------

def mount_static(app: Any, path: str = "/lab", directory: Optional[Union[str, Path]] = None) -> None:
    """``frontend/lab`` papkasini ``path`` yo'liga StaticFiles (html=True) sifatida ulaydi.

    Routerdan KEYIN chaqiring: ``app.include_router(router, prefix=path)`` dagi
    ``{path}/api/...`` yo'llari statik fayllardan oldin tekshiriladi.
    """
    from fastapi.staticfiles import StaticFiles

    directory = Path(directory) if directory else frontend_dir()
    app.mount(path, StaticFiles(directory=str(directory), html=True), name="cognita-lab-static")
