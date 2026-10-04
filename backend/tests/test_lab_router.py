import json
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
REPO = Path(__file__).resolve().parents[2]

import lab_router  # noqa: E402
from lab_router import JsonFileStore, SqliteStore, get_current_user, get_store, router  # noqa: E402

ALICE = {"id": "u-alice", "name": "Alisa"}
BOB = {"id": "u-bob", "name": "Bobur"}
EXP = "metall-kislota-0003"
STATE = {"version": 1, "items": [{"id": "beaker-1", "type": "beaker", "pos": [0, 0, 0]}]}


@pytest.fixture(params=["json", "sqlite"])
def ctx(request, monkeypatch, tmp_path):
    store = JsonFileStore(tmp_path / "lab_data") if request.param == "json" else SqliteStore(":memory:")
    monkeypatch.setattr(lab_router, "_demo_balances", {})
    current = {"user": ALICE}
    app = FastAPI()
    app.include_router(router, prefix="/lab")
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_current_user] = lambda: current["user"]
    client = TestClient(app)

    def as_user(u):
        current["user"] = u

    yield client, as_user
    store.close()


def test_health(ctx):
    c, _ = ctx
    r = c.get("/lab/api/health")
    assert r.status_code == 200 and r.json()["ok"] is True


def test_me_default_stub():
    app = FastAPI()
    app.include_router(router, prefix="/lab")
    r = TestClient(app).get("/lab/api/me")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "demo" and body["name"] and isinstance(body["coins"], int)


def test_me(ctx):
    c, _ = ctx
    assert c.get("/lab/api/me").json() == {"id": "u-alice", "name": "Alisa", "coins": 100}


def test_states_crud(ctx):
    c, _ = ctx
    assert c.get("/lab/api/states").json() == []
    r = c.put("/lab/api/states/slot1", json={"name": "Mening stolim", "state": STATE})
    assert r.status_code == 200 and r.json()["slot"] == "slot1"
    lst = c.get("/lab/api/states").json()
    assert len(lst) == 1 and lst[0]["name"] == "Mening stolim" and lst[0]["updated_at"]
    got = c.get("/lab/api/states/slot1").json()
    assert got["state"] == STATE and got["name"] == "Mening stolim"
    # qayta yozish
    c.put("/lab/api/states/slot1", json={"name": "Yangi", "state": {**STATE, "items": []}})
    got = c.get("/lab/api/states/slot1").json()
    assert got["name"] == "Yangi" and got["state"]["items"] == []
    assert c.delete("/lab/api/states/slot1").status_code == 200
    assert c.get("/lab/api/states/slot1").status_code == 404
    assert c.delete("/lab/api/states/slot1").status_code == 404


@pytest.mark.parametrize(
    "state",
    [{"items": []}, {"version": 1}, {"version": 1, "items": "x"}],
)
def test_state_validation(ctx, state):
    c, _ = ctx
    r = c.put("/lab/api/states/s", json={"name": "x", "state": state})
    assert r.status_code == 422


def test_state_bad_body_and_slot(ctx):
    c, _ = ctx
    assert c.put("/lab/api/states/s", json={"name": "x", "state": [1, 2]}).status_code == 422
    assert c.put("/lab/api/states/s", json={"name": "", "state": STATE}).status_code == 422
    assert c.put("/lab/api/states/bad%20slot", json={"name": "x", "state": STATE}).status_code == 422
    assert c.get("/lab/api/states/" + "a" * 65).status_code == 422


def test_state_too_large(ctx):
    c, _ = ctx
    big = {"version": 1, "items": ["x" * 1000] * 1100}
    r = c.put("/lab/api/states/big", json={"name": "katta", "state": big})
    assert r.status_code == 413
    assert "1 MB" in r.json()["detail"]


def test_journal(ctx):
    c, _ = ctx
    entries = [
        {"t": 1000, "kind": "action", "text": "Stakanga suv quyildi"},
        {"t": 2000, "kind": "reaction", "text": "Gaz ajraldi", "experiment_id": EXP,
         "equation": "Zn + 2HCl → ZnCl2 + H2↑"},
    ]
    r = c.post("/lab/api/journal", json={"entries": entries})
    assert r.status_code == 200 and r.json()["added"] == 2 and r.json()["total"] == 2
    c.post("/lab/api/journal", json={"entries": [{"t": "2026-10-04T10:00:00Z", "kind": "note", "text": "3"}]})
    j = c.get("/lab/api/journal").json()
    assert [e["text"] for e in j] == ["Stakanga suv quyildi", "Gaz ajraldi", "3"]
    assert j[1]["equation"].startswith("Zn") and "equation" not in j[0]
    last2 = c.get("/lab/api/journal?limit=2").json()
    assert [e["text"] for e in last2] == ["Gaz ajraldi", "3"]
    assert c.get("/lab/api/journal?limit=0").status_code == 422
    assert c.delete("/lab/api/journal").json()["deleted"] == 3
    assert c.get("/lab/api/journal").json() == []


def test_journal_validation(ctx):
    c, _ = ctx
    assert c.post("/lab/api/journal", json={"entries": [{"t": 1, "text": "x"}]}).status_code == 422
    bad = {"t": 1, "kind": "a", "text": "x", "experiment_id": "BAD ID"}
    assert c.post("/lab/api/journal", json={"entries": [bad]}).status_code == 422
    assert c.post("/lab/api/journal", json={}).status_code == 422


def test_progress(ctx):
    c, _ = ctx
    assert c.get("/lab/api/progress").json() == {}
    r = c.post("/lab/api/progress", json={"experiment_id": EXP, "completed": False, "score": 40})
    assert r.status_code == 200 and r.json()["attempts"] == 1
    c.post("/lab/api/progress", json={"experiment_id": EXP, "completed": True, "score": 90})
    c.post("/lab/api/progress", json={"experiment_id": EXP, "completed": False, "score": 70})
    p = c.get("/lab/api/progress").json()[EXP]
    assert p["completed"] is True and p["best_score"] == 90 and p["attempts"] == 3 and p["updated_at"]


@pytest.mark.parametrize(
    "body",
    [
        {"experiment_id": EXP, "completed": True, "score": 101},
        {"experiment_id": EXP, "completed": True, "score": -1},
        {"experiment_id": "Metall-0003", "completed": True, "score": 5},
        {"experiment_id": "metall-kislota", "completed": True, "score": 5},
        {"experiment_id": "../etc-0001", "completed": True, "score": 5},
        {"experiment_id": EXP, "score": 5},
    ],
)
def test_progress_validation(ctx, body):
    c, _ = ctx
    assert c.post("/lab/api/progress", json=body).status_code == 422


def test_real_experiment_ids_accepted():
    idx = Path(__file__).resolve().parents[2] / "frontend" / "lab" / "data" / "reactions" / "index.json"
    if not idx.exists():
        pytest.skip("index.json yo'q")
    ids = [it["id"] for it in json.loads(idx.read_text(encoding="utf-8"))["items"]]
    assert ids and all(lab_router.EXPERIMENT_ID_RE.match(i) for i in ids)


def test_start_experiment_free(ctx):
    c, _ = ctx
    r = c.post(f"/lab/api/experiments/{EXP}/start")
    assert r.status_code == 200 and r.json() == {"ok": True, "coins": 100, "charged": 0}
    assert c.post("/lab/api/experiments/Yomon_ID/start").status_code == 422


def test_start_experiment_paid_and_insufficient(ctx, monkeypatch):
    c, _ = ctx
    monkeypatch.setattr(lab_router, "LAB_EXPERIMENT_COST", 40)
    assert c.post(f"/lab/api/experiments/{EXP}/start").json() == {"ok": True, "coins": 60, "charged": 40}
    assert c.post(f"/lab/api/experiments/{EXP}/start").json()["coins"] == 20
    r = c.post(f"/lab/api/experiments/{EXP}/start")
    assert r.status_code == 402
    assert "Tanga yetarli emas" in r.json()["detail"]
    assert c.get("/lab/api/me").json()["coins"] == 20


def test_user_isolation(ctx):
    c, as_user = ctx
    c.put("/lab/api/states/s1", json={"name": "Alisaniki", "state": STATE})
    c.post("/lab/api/journal", json={"entries": [{"t": 1, "kind": "note", "text": "A"}]})
    c.post("/lab/api/progress", json={"experiment_id": EXP, "completed": True, "score": 80})

    as_user(BOB)
    assert c.get("/lab/api/me").json()["id"] == "u-bob"
    assert c.get("/lab/api/states").json() == []
    assert c.get("/lab/api/states/s1").status_code == 404
    assert c.delete("/lab/api/states/s1").status_code == 404
    assert c.get("/lab/api/journal").json() == []
    assert c.get("/lab/api/progress").json() == {}
    c.put("/lab/api/states/s1", json={"name": "Boburniki", "state": STATE})
    assert c.delete("/lab/api/journal").json()["deleted"] == 0

    as_user(ALICE)
    assert c.get("/lab/api/states/s1").json()["name"] == "Alisaniki"
    assert len(c.get("/lab/api/journal").json()) == 1
    assert EXP in c.get("/lab/api/progress").json()


def test_user_as_object(ctx):
    c, as_user = ctx

    class U:
        id = 42
        name = "Obyekt"

    as_user(U())
    assert c.get("/lab/api/me").json() == {"id": "42", "name": "Obyekt", "coins": 100}


def test_sqlite_file_persistence(tmp_path):
    db = tmp_path / "sub" / "lab.sqlite"
    s = SqliteStore(str(db))
    s.put_state("u", "a", "n", '{"version":1,"items":[]}')
    s.close()
    s2 = SqliteStore(str(db))
    assert s2.get_state("u", "a")["state"] == {"version": 1, "items": []}
    s2.close()


def test_json_store_files(tmp_path):
    root = tmp_path / "data"
    s = JsonFileStore(root)
    s.put_state("alice", "a", "n", '{"version":1,"items":[]}')
    s.append_journal("alice", [{"t": 1, "kind": "k", "text": "x", "experiment_id": None, "equation": None}])
    s.save_progress("alice", EXP, True, 70)
    for kind in ("states", "journal", "progress"):
        assert (root / kind / "u-alice.json").is_file()
    assert json.loads((root / "journal" / "u-alice.json").read_text()) == [{"t": 1, "kind": "k", "text": "x"}]
    # vaqtinchalik fayllar qolmagan
    assert not list(root.rglob(".tmp-*"))
    # xavfli id fayl nomiga to'g'ridan-to'g'ri tushmaydi
    s.put_state("../../evil", "a", "n", '{"version":1,"items":[]}')
    names = [p.name for p in (root / "states").iterdir()]
    assert all(n.startswith(("u-", "h-")) for n in names) and len(names) == 2
    assert not (tmp_path / "evil.json").exists()
    # qayta ochilganda saqlangan
    s2 = JsonFileStore(root)
    assert s2.get_state("alice", "a")["state"] == {"version": 1, "items": []}
    assert s2.get_progress("alice")[EXP]["best_score"] == 70
    assert s2.get_state("../../evil", "a") is not None and s2.get_state("bob", "a") is None


def test_json_store_corrupt_file(tmp_path):
    s = JsonFileStore(tmp_path)
    (tmp_path / "progress" / "u-x.json").write_text("{buzuq", encoding="utf-8")
    assert s.get_progress("x") == {}
    assert list((tmp_path / "progress").glob("u-x.corrupt-*"))


def test_json_store_concurrency(tmp_path):
    import threading

    s = JsonFileStore(tmp_path)

    def worker(n):
        for i in range(20):
            s.append_journal("u", [{"t": n * 100 + i, "kind": "k", "text": str(i)}])

    ts = [threading.Thread(target=worker, args=(n,)) for n in range(5)]
    [t.start() for t in ts]
    [t.join() for t in ts]
    assert len(s.get_journal("u", 5000)) == 100


def test_get_store_env_default_json(tmp_path, monkeypatch):
    monkeypatch.delenv("COGNITA_LAB_STORE", raising=False)
    monkeypatch.setenv("COGNITA_LAB_DATA_DIR", str(tmp_path / "jd"))
    lab_router.set_store(None)
    try:
        st = lab_router.get_store()
        assert isinstance(st, JsonFileStore) and st.root == tmp_path / "jd"
        assert (tmp_path / "jd" / "states").is_dir()
    finally:
        lab_router.set_store(None)


def test_get_store_env_sqlite(tmp_path, monkeypatch):
    monkeypatch.setenv("COGNITA_LAB_STORE", "sqlite")
    monkeypatch.setenv("COGNITA_LAB_DB", str(tmp_path / "env.sqlite"))
    lab_router.set_store(None)
    try:
        st = lab_router.get_store()
        assert isinstance(st, SqliteStore) and st.path == str(tmp_path / "env.sqlite")
        st.close()
    finally:
        lab_router.set_store(None)
    monkeypatch.setenv("COGNITA_LAB_STORE", "boshqa")
    with pytest.raises(RuntimeError):
        lab_router.make_store_from_env()


# --- katalog va ma'lumot fayllari ---

@pytest.fixture
def data_client():
    app = FastAPI()
    app.include_router(router, prefix="/lab")
    return TestClient(app)


def test_catalog(data_client):
    r = data_client.get("/lab/api/catalog")
    assert r.status_code == 200 and r.headers["content-type"].startswith("application/json")
    idx = REPO / "frontend" / "lab" / "data" / "reactions" / "index.json"
    assert r.json() == json.loads(idx.read_text(encoding="utf-8"))


def test_data_files(data_client):
    r = data_client.get("/lab/api/data/substances.json")
    assert r.status_code == 200 and r.headers["content-type"].startswith("application/json")
    assert r.json() == json.loads((REPO / "frontend/lab/data/substances.json").read_text(encoding="utf-8"))
    assert data_client.get("/lab/api/data/reactions/index.json").status_code == 200


@pytest.mark.parametrize(
    "path",
    [
        "nope.json",
        "reactions",
        "../index.html",
        "..%2Findex.html",
        "..%2F..%2Fbackend%2Flab_router.py",
        "reactions/../../index.html",
        "reactions/..%2F..%2Fjs%2Fmain.js",
        "%2Fetc%2Fpasswd",
        "..%5C..%5Cindex.html",
        "../../backend/tests/test_lab_router.py",
        ".hidden.json",
    ],
)
def test_data_traversal_blocked(data_client, path):
    r = data_client.get("/lab/api/data/" + path)
    assert r.status_code == 404


def test_data_non_json_blocked(tmp_path, monkeypatch, data_client):
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "a.json").write_text('{"x": 1}', encoding="utf-8")
    (tmp_path / "data" / "secret.txt").write_text("maxfiy", encoding="utf-8")
    (tmp_path / "outside.json").write_text('{"o": 1}', encoding="utf-8")
    (tmp_path / "data" / "link.json").symlink_to(tmp_path / "outside.json")
    monkeypatch.setenv("COGNITA_LAB_FRONTEND_DIR", str(tmp_path))
    assert data_client.get("/lab/api/data/a.json").json() == {"x": 1}
    assert data_client.get("/lab/api/data/secret.txt").status_code == 404
    assert data_client.get("/lab/api/data/link.json").status_code == 404
    assert data_client.get("/lab/api/catalog").status_code == 404


def test_mount_static():
    app = FastAPI()
    app.include_router(router, prefix="/lab")
    lab_router.mount_static(app, "/lab")
    c = TestClient(app)
    assert c.get("/lab/api/health").json()["ok"] is True
    r = c.get("/lab/")
    assert r.status_code == 200 and "<html" in r.text.lower()
