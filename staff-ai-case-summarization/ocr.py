import re
import pytesseract
import fitz  # PyMuPDF
from PIL import Image
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_ocr_text(text):
    """Clean the text by removing unwanted characters and patterns."""
    text = text.replace("\u201d", "").replace("\n", " ").replace('\"', "").replace("/*", "").replace("\\", "")
    text = re.sub(r"_+", "", text)
    text = re.sub(r"-{2,}", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text 

def extract_text_from_pdf(pdf_path):
    try:
        logger.info(f"Extracting text from: {pdf_path}")
        pdf_document = fitz.open(pdf_path)
        text = ""

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text("text").strip()
            text += page_text + "\n" if page_text else ""

        text = clean_ocr_text(text)

        if not text or len(text) < 50:
            ocr_text = ""
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num] 
                pix = page.get_pixmap(dpi=300)
                img = Image.open(io.BytesIO(pix.tobytes())).convert("RGB")
                page_text = pytesseract.image_to_string(img)
                ocr_text += page_text + "\n"
            text = clean_ocr_text(ocr_text)

        pdf_document.close()
        return text
    
    except Exception as e:
        logger.error(f"Error extracting {pdf_path}: {str(e)}")
        return ""
    