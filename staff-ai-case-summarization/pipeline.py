import os
import json
from ocr import extract_text_from_pdf
from summarizer import summarize_text

def process_single_pdf(pdf_path, json_file):
    results = []
    next_case_id = 1

    if os.path.exists(json_file):
        with open(json_file, "r") as f:
            results = json.load(f)
            if results:
                next_case_id = max(int(case["case_id"]) for case in results) + 1

    pdf_text = extract_text_from_pdf(pdf_path)
    summary = summarize_text(pdf_text)

    case_data = {
        "case_id": next_case_id,
        "pdf_text": pdf_text,
        "case_summary": summary
    }

    results.append(case_data)

    os.makedirs(os.path.dirname(json_file) or ".", exist_ok=True)
    with open(json_file, "w") as f:
        json.dump(results, f, indent=4)

    return results

pdf_path = r"PDF_Data\case_24.pdf"  
json_file = r"Output_JSON/predictions.json" 

process_single_pdf(pdf_path, json_file)
