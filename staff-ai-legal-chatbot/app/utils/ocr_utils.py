import re
import pytesseract
import fitz  # PyMuPDF
from PIL import Image
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def clean_ocr_text(text: str) -> str:
    """Clean the text by removing unwanted characters and patterns."""
    text = text.replace("\u201d", "").replace("\n", " ").replace('\"', "").replace("/*", "").replace("\\", "")
    text = re.sub(r"_+", "", text)
    text = re.sub(r"-{2,}", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text 

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF file using PyMuPDF and OCR fallback.
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text from the PDF
    """
    try:
        logger.info(f"Extracting text from: {pdf_path}")
        pdf_document = fitz.open(pdf_path)
        text = ""

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text("text").strip()
            text += page_text + "\n" if page_text else ""

        text = clean_ocr_text(text)

        # If text extraction failed or returned minimal text, use OCR
        if not text or len(text) < 50:
            logger.info("Text extraction yielded minimal results, using OCR...")
            ocr_text = ""
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num] 
                pix = page.get_pixmap(dpi=300)
                img = Image.open(io.BytesIO(pix.tobytes())).convert("RGB")
                page_text = pytesseract.image_to_string(img)
                ocr_text += page_text + "\n"
            text = clean_ocr_text(ocr_text)

        pdf_document.close()
        
        logger.info(f"Successfully extracted {len(text)} characters from {pdf_path}")
        return text
    
    except Exception as e:
        logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
        return ""

def extract_text_from_docx(docx_path: str) -> str:
    """
    Extract text from Word document.
    
    Args:
        docx_path (str): Path to the DOCX file
        
    Returns:
        str: Extracted text from the document
    """
    try:
        from docx import Document
        
        logger.info(f"Extracting text from: {docx_path}")
        doc = Document(docx_path)
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
            
        text = clean_ocr_text(text)
        logger.info(f"Successfully extracted {len(text)} characters from {docx_path}")
        return text
    
    except Exception as e:
        logger.error(f"Error extracting text from {docx_path}: {str(e)}")
        return ""

def extract_text_from_txt(txt_path: str) -> str:
    """
    Extract text from plain text file.
    
    Args:
        txt_path (str): Path to the TXT file
        
    Returns:
        str: Content of the text file
    """
    try:
        logger.info(f"Reading text from: {txt_path}")
        with open(txt_path, 'r', encoding='utf-8') as file:
            text = file.read()
        
        text = clean_ocr_text(text)
        logger.info(f"Successfully read {len(text)} characters from {txt_path}")
        return text
    
    except Exception as e:
        logger.error(f"Error reading text from {txt_path}: {str(e)}")
        return ""

def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from various file types.
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: Extracted text content
    """
    file_extension = file_path.lower().split('.')[-1]
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == 'docx':
        return extract_text_from_docx(file_path)
    elif file_extension == 'txt':
        return extract_text_from_txt(file_path)
    else:
        logger.warning(f"Unsupported file type: {file_extension}")
        return ""
