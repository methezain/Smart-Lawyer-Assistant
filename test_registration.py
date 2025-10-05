#!/usr/bin/env python3

import requests
import json

# Test registration endpoint
url = "http://localhost:8009/api/v1/registration/admin/complete/"

# Create a test payload with minimum required fields
form_data = {
    # User Info
    "firstName": "Hassan",
    "lastName": "Islam",
    "cnicNumber": "123456789",
    "dateOfBirth": "1990-01-01",
    "email": "hassan@test.com",
    "phone": "1234567890",
    
    # Firm Info
    "firmName": "Test Law Firm",
    "firmType": "Solo Practice",
    "establishedYear": "2020",
    "services": "[]",  # Empty JSON array
    "specialty": "[]",
    "secondarySpecialties": "[]",
    "description": "Test firm description",
    "advisory": "[]",
    "officeHours": "[]",
    
    # Contact Info
    "address": "123 Test Street",
    "city": "Test City",
    "state": "Test State",
    "zipCode": "12345",
    "country": "Pakistan",
    "website": "https://test.com",
    
    # Credentials
    "username": "testuser123",
    "password": "testpass123",
    
    # Pricing (either case fee or hourly rate required)
    "caseFee": "5000",
    "caseCurrency": "PKR",
    "caseUnit": "case",
    "consultationFee": "500",
    "consultationCurrency": "PKR",
    "consultationUnit": "hourly",
    "freeConsultation": "false",
    "paymentMethods": "[]",
    
    # Billing Info
    "bankName": "Test Bank",
    "accountTitle": "Test Account",
    "accountNumber": "123456789",
    "iban": "PK12BANK0000123456789",
    "billingAddress": "123 Billing Street",
    "billingCity": "Billing City",
    "billingState": "Billing State",
    "billingZipCode": "54321",
    "billingCountry": "Pakistan",
    
    # Verification
    "documentType": "Bar License",
    "barCouncilNumber": "BAR123456",
    "affiliation": "Pakistan Bar Council",
    "termsAccepted": "true"
}

try:
    print("Testing registration endpoint...")
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
    
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Error: {e}")