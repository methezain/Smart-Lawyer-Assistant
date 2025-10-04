from groq import Groq
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

api_key = os.getenv("API_KEY")
client = Groq(api_key=api_key)

def generate_JSON(case_text):
    if not case_text or not case_text.strip():
        return {}

    keys = [
        "Court Name",
        "Judge Name",
        
        "Judgement Date",
        "Judgement Summary",
        "Key Points",
        "Judgement Status",
        "Status Details",
    ]

    prompt = f"""
    Given the following legal case text, extract the keys {keys} and return ONLY a valid JSON object.
    - In judgement files the summary is usually not under a heading like 'summary'; it is continuous text explaining the case. If such text is found, treat the first 300–400 characters as the summary.
    - Key Points are the important points of the judgement; identify 3–5 key points from the text.
    - Judgement Status should be a single word capturing the outcome (e.g., Allowed, Dismissed, PartlyAllowed, Remanded, Withdrawn, Rejected). If multiple words are needed, return in CamelCase without spaces (e.g., PartlyAllowed). If not inferable, return an empty string.
    - Status Details should be a short 1–2 sentence rationale for the chosen status referencing the outcome or relief.
    - If a key is not present, use an empty string for that key.
    - Do not include any extra text, explanations, markdown formatting, or code blocks. Output only valid JSON.

    Case:
    {case_text}
    """

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
        top_p=1,
        stream=True
    )

    result = ""
    for chunk in completion:
        content_piece = getattr(chunk.choices[0].delta, "content", None)
        if content_piece:
            result += content_piece

    result = re.sub(r"```(?:json)?\s*", "", result)
    result = result.replace("```", "").strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        return {}
