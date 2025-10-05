#!/usr/bin/env python3

import requests
import json

# Test registration endpoint with frontend-like data
url = "http://localhost:8009/api/v1/registration/admin/complete/"

# Create a test payload that mimics what the frontend sends after our fixes
form_data = {
    # User Info (from userInfo step)
    "firstName": "Hassan",
    "middleName": "",
    "lastName": "Islam",
    "cnicNumber": "1234567890123",
    "dateOfBirth": "1990-01-01",
    "email": "hassan.test@example.com",
    "phone": "+92-300-1234567",
    
    # Firm Info (from firmInfo step)
    "firmName": "Test Law Associates",
    "firmTitle": "Leading Legal Services Provider",
    "firmType": "Partnership",
    "establishedYear": "2015",
    "services": '["Civil Law", "Criminal Law", "Corporate Law"]',  # JSON string
    "specialty": '["Family Law", "Property Law"]',
    "secondarySpecialties": '["Tax Law"]',
    "description": "A comprehensive law firm providing quality legal services across various domains.",
    "advisory": '["Senior Partner John Doe", "Consultant Jane Smith"]',
    
    # Contact Info (from contactInfo step)
    "address": "123 Main Street, Block A",
    "city": "Karachi",
    "state": "Sindh",
    "zipCode": "75600",
    "country": "Pakistan",
    "website": "https://testlawfirm.com",
    "officeHours": '[]',  # Fixed: Empty array as JSON string
    
    # Credentials (from credentials step)
    "username": "testuser456",
    "password": "SecurePass123!",
    
    # Pricing (from pricing step) - Fixed: Added paymentMethods
    "caseFee": "25000",
    "caseCurrency": "PKR",
    "caseUnit": "case",
    "hourlyRate": "",  # Empty since we're using case fee
    "hourlyCurrency": "PKR",
    "hourlyUnit": "hourly",
    "consultationFee": "2000",
    "consultationCurrency": "PKR",
    "consultationUnit": "hourly",
    "freeConsultation": "false",
    "retainerFee": "",
    "retainerCurrency": "PKR",
    "retainerUnit": "monthly",
    "paymentMethods": '["Bank Transfer", "Cash", "Cheque"]',  # Fixed: Added this
    
    # Billing Info (from billingInfo step)
    "bankName": "Allied Bank Limited",
    "accountTitle": "Test Law Associates",
    "accountNumber": "0123456789",
    "iban": "PK12ABCD0000000123456789",
    "swiftCode": "ABCDPKKA",
    "branchCode": "0123",
    "taxId": "TAX123456789",
    "vatNumber": "",
    "billingAddress": "123 Main Street, Block A",
    "billingCity": "Karachi",
    "billingState": "Sindh",
    "billingZipCode": "75600",
    "billingCountry": "Pakistan",
    
    # Verification (from verification step)
    "documentType": "Bar License",
    "barCouncilNumber": "BAR/2015/123456",
    "affiliation": "Karachi Bar Association",
    "termsAccepted": "true"
}

try:
    print("Testing registration endpoint with frontend-like data...")
    print(f"URL: {url}")
    
    # Make the request
    response = requests.post(url, data=form_data)
    
    print(f"\nStatus Code: {response.status_code}")
    
    # Print response content
    if response.headers.get('content-type', '').startswith('application/json'):
        try:
            json_response = response.json()
            print(f"JSON Response: {json.dumps(json_response, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
    else:
        print(f"Response Text: {response.text}")
        
    print("\n" + "="*50)
    
    if response.status_code == 200:
        print("✅ SUCCESS: Registration completed successfully!")
        print("The frontend fixes have resolved the validation issues.")
    else:
        print("❌ FAILED: Still getting validation errors.")
        if 'json_response' in locals() and 'errors' in json_response:
            print("Specific errors:")
            for error in json_response.get('errors', []):
                print(f"  - {error.get('field', 'general')}: {error.get('message', 'Unknown error')}")
        
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Error: {e}")