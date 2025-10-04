from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("API_KEY")
client = Groq(api_key=api_key)

def predict_case_category(case_text):
    if not case_text.strip():
        return "No content provided."
    
    case_text = case_text[:2000] 
    print(case_text)

    content = f"""
    Given the following legal case text, predict and return the **most appropriate legal category** that describes the case (e.g. "Domestic violence", "Divorce dispute", "Educational migration", etc.).

    Only return the category name. Do not explain.

    Case:
    {case_text}
    """

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": content}
        ],
        temperature=0.1,
        max_tokens=512,
        top_p=1,
        stream=True
    ) 

    chunks = []
    for chunk in completion:
        chunks.append(chunk) 


    result = ""
    for chunk in chunks:
        choice = chunk.choices[0]
        delta = choice.delta
        content = getattr(delta, "content", None)
        if content:
            result += content
    print(result)
    return result.strip()



