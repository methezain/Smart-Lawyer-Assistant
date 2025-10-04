from fastapi import FastAPI, File, UploadFile, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import io
from ocr import extract_text_from_pdf
from summarizer import summarize_text
import logging

app = FastAPI()

# CORS for frontend (Vite dev server and local hosts)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for results (replace with database in production)
results = []
next_case_id = 1

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global next_case_id
    try:
        # Validate file type
        if not file.filename.endswith(".pdf"):
            return JSONResponse(
                status_code=400,
                content={"message": "Only PDF files are allowed."}
            )

        # Read PDF content
        pdf_content = await file.read()
        
        # Save temporary file
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(pdf_content)

        # Process PDF
        pdf_text = extract_text_from_pdf(temp_path)
        if not pdf_text:
            os.remove(temp_path)
            return JSONResponse(
                status_code=400,
                content={"message": "Failed to extract text from PDF."}
            )

        # Summarize text
        summary = summarize_text(pdf_text)

        # Store result
        case_data = {
            "case_id": next_case_id,
            "pdf_text": pdf_text,
            "case_summary": summary,
            "filename": file.filename
        }
        results.append(case_data)
        next_case_id += 1

        # Save to JSON file
        os.makedirs("Output_JSON", exist_ok=True)
        with open("Output_JSON/predictions.json", "w") as f:
            json.dump(results, f, indent=4)

        # Clean up
        os.remove(temp_path)

        return JSONResponse(
            status_code=200,
            content={
                "message": "PDF processed successfully",
                "case_id": case_data["case_id"],
                "case_summary": case_data["case_summary"],
                # Include text length for UI metrics without returning full text
                "pdf_text_length": len(pdf_text),
            }
        )

    except Exception as e:
        logger.error(f"Error processing {file.filename}: {str(e)}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing PDF: {str(e)}"}
        )

@app.get("/summarize/") 
async def get_summaries():
    try:
        if os.path.exists("Output_JSON/predictions.json"):
            with open("Output_JSON/predictions.json", "r") as f:
                return JSONResponse(
                    status_code=200,
                    content=json.load(f)
                )
        return JSONResponse(
            status_code=200,
            content=[]
        )
    except Exception as e:
        logger.error(f"Error retrieving summaries: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error retrieving summaries: {str(e)}"}
        )


# New endpoint: summarize raw text (non-PDF)
@app.post("/summarize_text/")
async def summarize_text_endpoint(payload: dict = Body(...)):
    global next_case_id
    try:
        input_text = payload.get("text", "")
        if not input_text or not input_text.strip():
            return JSONResponse(status_code=400, content={"message": "Text is required"})

        # Summarize provided text
        summary = summarize_text(input_text)

        # Store result consistent with PDF entries (use pdf_text key for compatibility)
        case_data = {
            "case_id": next_case_id,
            "pdf_text": input_text,
            "case_summary": summary,
            "filename": "Text Input",
        }
        results.append(case_data)
        next_case_id += 1

        # Persist to JSON
        os.makedirs("Output_JSON", exist_ok=True)
        with open("Output_JSON/predictions.json", "w") as f:
            json.dump(results, f, indent=4)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Text summarized successfully",
                "case_id": case_data["case_id"],
                "case_summary": case_data["case_summary"],
                "pdf_text_length": len(input_text),
            },
        )
    except Exception as e:
        logger.error(f"Error summarizing text: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error: {str(e)}"})
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
