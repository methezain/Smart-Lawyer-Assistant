"""LLM powered lease agreement generator using Groq API."""
from __future__ import annotations

import os
import textwrap
from datetime import datetime
from groq import Groq

INSTRUCTIONS_LEASE = textwrap.dedent(
    """
    Generate a formal Lease/Rental Agreement based on the provided information.

    Requirements:
    • Use professional legal contract language
    • Include sections: Parties, Property Details, Lease Term, Rent & Payment Terms,
      Security Deposit, Utilities & Maintenance, Restrictions, Termination, Governing Law, Signatures
    • Keep it concise yet comprehensive (500–900 words)
    • Ensure all provided information is naturally incorporated
    • Ready for official use between landlord and tenant
    """
).strip()


def _build_context(form_data: dict) -> str:
    return f"""
    Landlord Name: {form_data.get('landlord_name', '')}
    Landlord Address: {form_data.get('landlord_address', '')}
    Tenant Name: {form_data.get('tenant_name', '')}
    Tenant Address: {form_data.get('tenant_address', '')}
    Property Address: {form_data.get('property_address', '')}
    Lease Start Date: {form_data.get('lease_start_date', '')}
    Lease End Date: {form_data.get('lease_end_date', '')}
    Rent Amount: {form_data.get('rent_amount', '')}
    Payment Due Date: {form_data.get('payment_due_date', '')}
    Payment Method: {form_data.get('payment_method', '')}
    Security Deposit: {form_data.get('security_deposit', '')}
    Utilities & Maintenance: {form_data.get('utilities_maintenance', '')}
    Restrictions: {form_data.get('restrictions', '')}
    Termination Clause: {form_data.get('termination_clause', '')}
    Governing Law: {form_data.get('governing_law', 'Applicable local laws')}
    Date of Agreement: {form_data.get('date_of_agreement', datetime.now().strftime('%Y-%m-%d'))}
    """


def generate_lease_agreement(form_data: dict) -> str:
    api_key = os.getenv("API_KEY")
    if not api_key:
        return "Error generating lease agreement: GROQ API key not configured"

    client = Groq(api_key=api_key)
    context = _build_context(form_data)
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": INSTRUCTIONS_LEASE},
                {"role": "user", "content": context},
            ],
            temperature=0.3,
            max_tokens=2000,
            top_p=1,
            stream=False,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:  # pragma: no cover - network errors
        return f"Error generating lease agreement: {e}"