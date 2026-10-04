"""Mahalliy ishga tushirish uchun minimal ilova.

    cd backend
    uvicorn example_app:app --reload --port 8000
    # brauzerda: http://localhost:8000/lab/?api=/lab

API /lab/api/... da, frontend /lab/ da. Frontend backendni faqat manzil berilganda
ishlatadi (?api=..., <meta name="cognita-lab-api"> yoki window.COGNITA_LAB_API);
aks holda ma'lumotlar brauzerda (localStorage) saqlanadi.
"""

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from lab_router import mount_static, router

app = FastAPI(title="Cognita Virtual Kimyo Laboratoriyasi")
app.include_router(router, prefix="/lab")


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/lab/?api=/lab")


mount_static(app, path="/lab")  # routerdan keyin bo'lishi shart

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
