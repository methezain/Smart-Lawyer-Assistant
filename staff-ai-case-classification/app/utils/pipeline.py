import os
import json
from ocr import extract_text_from_pdf
from category_prediction import predict_case_category


def process_pdf_directory(directory_path, json_file):
    results = []
    next_case_id = 1

    if os.path.exists(json_file):
        with open(json_file, "r") as f:
            results = json.load(f)
            if results:
                next_case_id = max(int(case["case_id"]) for case in results) + 1

    for filename in os.listdir(directory_path):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(directory_path, filename)
            
            pdf_text = extract_text_from_pdf(pdf_path)            
            category = predict_case_category(pdf_text)
            
            case_data = {
                "case_id": next_case_id,
                "pdf_text": pdf_text,
                "category": category
            }
            
            results.append(case_data)
            next_case_id += 1
    
    os.makedirs(os.path.dirname(json_file) or ".", exist_ok=True)
    with open(json_file, "w") as f:
        json.dump(results, f, indent=4)
    
    return results

pdf_directory = r"PDF_Data"
json_file = r"Output_JSON/predictions.json"

process_pdf_directory(pdf_directory, json_file) 