from groq import Groq
from dotenv import load_dotenv
import os, textwrap

load_dotenv()
client = Groq(api_key=os.getenv("API_KEY"))

INSTRUCTIONS = textwrap.dedent("""
    Predict the likely verdict of the following legal case in one line, with clear reasoning.

    • Analyze key facts (names, dates, court, case #, orders).
    • Consider history, hearings, interim/final rulings.
    • Account for the roles of all parties.
    • Weigh legal arguments and evidence.
    • Output: one‑line (100-200 characters) prediction (e.g., “In favor of the petitioner – because …”).
    • Use plain, professional English.
""").strip()

def verdict_prediction(case_texts):
    if isinstance(case_texts, str):
        case_texts = [case_texts]

    outputs = []
    for idx, case_text in enumerate(case_texts, start=1):
        case_text = case_text[:5000].strip()
        if not case_text:
            outputs.append(f"No content provided.")
            continue

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": INSTRUCTIONS},
                {"role": "user",   "content": case_text}
            ],
            temperature=0.2,
            max_tokens=100,
            top_p=1,
            stream=False      # switch to False while debugging
        )

        verdict = completion.choices[0].message.content.strip().split("\n")[0]
        outputs.append(f"{verdict}") 

    return "\n".join(outputs)
