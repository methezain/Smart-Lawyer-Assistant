# from fastapi import FastAPI, UploadFile, File, HTTPException, status
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from typing import List
# from pathlib import Path
# import json
# import tempfile
# import shutil
# import logging
# from ocr import extract_text_from_pdfs
# from verdict_prediction import verdict_prediction


# app = FastAPI(title="Verdict‑Prediction Service", version="1.0")
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("verdict_service")

# # ─── Constants & Paths ───────────────────────────────────────────────
# OUTPUT_DIR = Path("Output_JSON")
# OUTPUT_DIR.mkdir(exist_ok=True)
# PRED_PATH = OUTPUT_DIR / "predictions.json"

# # ─── Pydantic models ────────────────────────────────────────────────
# class PredictionOut(BaseModel):
#     case_id: int
#     verdict: str

# class UploadResponse(BaseModel):
#     message: str
#     results: List[PredictionOut] 

# # ─── Helper: load existing predictions ───────────────────────────────
# def load_predictions() -> List[dict]:
#     if PRED_PATH.exists():
#         with PRED_PATH.open("r", encoding="utf-8") as fh:
#             return json.load(fh)
#     return []

# # ─── Helper: atomic save ─────────────────────────────────────────────
# def save_predictions(preds: List[dict]) -> None:
#     tmp = PRED_PATH.with_suffix(".tmp")
#     with tmp.open("w", encoding="utf-8") as fh:
#         json.dump(preds, fh, indent=4)
#     tmp.replace(PRED_PATH)

# # ─── POST /upload_pdf/ ───────────────────────────────────────────────
# @app.post("/upload_pdf/", response_model=UploadResponse)
# async def upload_pdf(files: List[UploadFile] = File(...)):
#     """
#     Accept multiple PDF files, run OCR + model, persist results,
#     and return summary with sequential int case_id.
#     """
#     if not files:
#         raise HTTPException(status_code=400, detail="No files supplied.")

#     existing_cases = load_predictions()
#     next_case_id = max((c["case_id"] for c in existing_cases), default=0) + 1  

#     new_cases = []

#     for file in files:
#         if not file.filename.lower().endswith(".pdf"):
#             raise HTTPException(status_code=400,
#                                 detail=f"{file.filename} is not a PDF.")

#         # ---- Write to a temp file so OCR libraries can read it
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
#             shutil.copyfileobj(file.file, tmp) 
#             tmp_path = Path(tmp.name)

#         try:
#             text = extract_text_from_pdfs([tmp_path]) 
#         finally:
#             tmp_path.unlink(missing_ok=True)          

#         if not text:
#             raise HTTPException(status_code=400,
#                                 detail=f"OCR failed for {file.filename}")

#         verdict = verdict_prediction(text)           

#         new_cases.append({
#             "case_id": next_case_id,
#             "pdf_text": text,
#             "verdict": verdict
#         })
#         logger.info("Processed %s → case_id=%d", file.filename, next_case_id)
#         next_case_id += 1

#     # ---- Persist atomically
#     save_predictions(existing_cases + new_cases)

#     return UploadResponse(
#         message="Processed",
#         results=[PredictionOut(case_id=c["case_id"], verdict=c["verdict"])
#                  for c in new_cases]
#     )

# # ─── GET /verdict_prediction/ ────────────────────────────────────────
# @app.get("/verdict_prediction/", response_model=List[dict])
# def get_predictions():
#     """Return all stored predictions."""
#     return load_predictions()

# # ─── Stand‑alone entrypoint (optional) ───────────────────────────────
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from pathlib import Path
import json
import tempfile
import shutil
import logging
from ocr import extract_text_from_pdfs
from verdict_prediction import verdict_prediction


app = FastAPI(title="Verdict‑Prediction Service", version="1.0")

# ─── CORS (adjust origins as needed) ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verdict_service")

# ─── Constants & Paths ───────────────────────────────────────────────
OUTPUT_DIR = Path("Output_JSON")
OUTPUT_DIR.mkdir(exist_ok=True)
PRED_PATH = OUTPUT_DIR / "predictions.json"

# ─── Pydantic models ────────────────────────────────────────────────
class PredictionOut(BaseModel):
    case_id: int
    verdict: str
    file_name: str

class UploadResponse(BaseModel):
    message: str
    results: List[PredictionOut] 

# ─── Helper: load existing predictions ───────────────────────────────
def load_predictions() -> List[dict]:
    if PRED_PATH.exists():
        with PRED_PATH.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    return []

# ─── Helper: atomic save ─────────────────────────────────────────────
def save_predictions(preds: List[dict]) -> None:
    tmp = PRED_PATH.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(preds, fh, indent=4)
    tmp.replace(PRED_PATH)

# ─── POST /upload_pdf/ ───────────────────────────────────────────────
@app.post("/upload_pdf/", response_model=UploadResponse)
async def upload_pdf(files: List[UploadFile] = File(...)):
    """
    Accept multiple PDF files, run OCR + model, persist results,
    and return summary with sequential int case_id.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files supplied.")

    existing_cases = load_predictions()
    next_case_id = max((c["case_id"] for c in existing_cases), default=0) + 1  

    new_cases = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400,
                                detail=f"{file.filename} is not a PDF.")

        # ---- Write to a temp file so OCR libraries can read it
        # Using NamedTemporaryFile (short operation) acceptable in this context  # noqa: E800
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        try:
            text = extract_text_from_pdfs([tmp_path]) 
        finally:
            tmp_path.unlink(missing_ok=True)          

        if not text:
            raise HTTPException(status_code=400,
                                detail=f"OCR failed for {file.filename}")

        verdict = verdict_prediction(text)           

        new_cases.append({
            "case_id": next_case_id,
            "pdf_text": text,
            "verdict": verdict,
            "file_name": file.filename,
        })
        logger.info("Processed %s → case_id=%d", file.filename, next_case_id)
        next_case_id += 1

    # ---- Persist atomically
    save_predictions(existing_cases + new_cases)

    return UploadResponse(
        message="Processed",
        results=[PredictionOut(case_id=c["case_id"], verdict=c["verdict"], file_name=c["file_name"]) for c in new_cases]
    )

# ─── GET /verdict_prediction/ ────────────────────────────────────────
@app.get("/verdict_prediction/", response_model=List[dict])
def get_predictions():
    """Return all stored predictions."""
    return load_predictions()

# ─── GET /health ───────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8013, reload=True)

