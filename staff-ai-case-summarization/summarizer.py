from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("API_KEY")
client = Groq(api_key=api_key)

def summarize_text(case_text):
    """
    Produce a concise, well‑structured summary of a legal case.
    Args:
        case_text (str): Full text of the legal case (any length).
    Returns:
        str: A summary that preserves the key facts, dates, parties,
             and court decisions, written in plain English.
    """
    case_text = case_text[:5000]

    if not case_text.strip():
        return "No content provided."

    content = f"""
    Summarize the following legal case accurately and clearly.

    Instructions:
    - Preserve all critical facts, including names, dates, court names, case numbers, and orders.
    - Include important procedural history, hearing details, and any interim or final rulings.
    - Mention pending suits, legal undertakings, or commitments if referenced.
    - Clearly state the roles of all parties involved (e.g., petitioner, respondent, counsel).
    - Use plain, professional English suitable for a general audience.
    - Make the summary as concise or detailed as necessary to fully reflect the substance of the case.
    - Do not omit or downplay any legally or procedurally significant information.
    """


    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": content},
                  {"role": "user",   "content": case_text}],
        temperature=0.1,
        max_tokens=600,   
        top_p=1,
        stream=True
    )

    result = ""
    for chunk in completion:
        delta_content = getattr(chunk.choices[0].delta, "content", None)
        if delta_content:
            result += delta_content

    return result.strip()
