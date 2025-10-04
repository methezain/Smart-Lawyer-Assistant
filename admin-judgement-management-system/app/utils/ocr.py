import pytesseract
import pdfplumber
import cv2
from pathlib import Path
from pdf2image import convert_from_path
import numpy as np


def extract_text(file_path) -> str:
    ext = file_path.suffix.lower()
    if ext in {'.png', '.jpg', '.jpeg'}:
        return extract_from_image(file_path)
    elif ext == '.pdf':
        return extract_from_pdf(file_path)
    
    return ''

def extract_from_image(image_path) -> str:
    img = cv2.imread(str(image_path)) 
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return pytesseract.image_to_string(gray)

def extract_from_pdf(pdf_path) -> str:
    text = ''
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num, page in enumerate(pdf.pages): 
            page_text = page.extract_text() 
            if page_text and page_text.strip():
                text += page_text + '\n'
            else:
                images = convert_from_path(str(pdf_path), first_page=page_num+1, last_page=page_num+1)
                for img in images:
                    img_np = np.array(img)
                    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
                    ocr_text = pytesseract.image_to_string(gray)
                    text += ocr_text + '\n'
    return text

def perform_OCR(input_file):
    input_file = Path(input_file)

    if input_file.is_file():
        raw_text = extract_text(input_file)
        if raw_text:
            return raw_text
        else:
            return ""
