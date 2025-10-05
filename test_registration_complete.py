#!/usr/bin/env python3

import requests
import json

# Test registration with complete data that matches what the frontend should send
url = "http://localhost/api/v1/registration/admin/complete/"

# Complete form data that matches the frontend form structure
form_data = {
    # User Information (Step 1 - FirmInfo component includes user info)
    "firstName": "Hassan",
    "middleName": "",
    "lastName": "Islam", 
    "cnicNumber": "1234567890123",
    "dateOfBirth": "1990-01-01",
    "email": "hassan.test.final@example.com",
    "phone": "+92-300-1234567",
    
    # Firm Information (Step 1 - FirmInfo component)
    "firmName": "Test Law Associates", 
    "firmTitle": "Leading Legal Services",
    "firmType": "Partnership",
    "establishedYear": "2015",
    "services": '["Civil Law", "Criminal Law"]',  # JSON string
    "specialty": '["Family Law"]',
    "secondarySpecialties": '["Tax Law"]', 
    "description": "A comprehensive law firm providing quality legal services.",
    "advisory": '["Senior Partner John Doe"]',  # JSON string
    
    # Contact Information (Step 1 - FirmInfo includes contact info)
    "address": "123 Main Street, Block A",
    "city": "Karachi", 
    "state": "Sindh",
    "zipCode": "75600",
    "country": "Pakistan",
    "website": "https://testlawfirm.com",
    "officeHours": '[]',  # JSON string - empty array
    
    # Credentials (Step 2)
    "username": "testuser789",
    "password": "SecurePass123!",
    
    # Pricing (Step 3) 
    "caseFee": "25000",
    "caseCurrency": "PKR", 
    "caseUnit": "case",
    "hourlyRate": "",  # Empty since using case fee
    "hourlyCurrency": "PKR",
    "hourlyUnit": "hourly", 
    "consultationFee": "2000",
    "consultationCurrency": "PKR",
    "consultationUnit": "hourly",
    "freeConsultation": "false",
    "retainerFee": "",
    "retainerCurrency": "PKR", 
    "retainerUnit": "monthly",
    "paymentMethods": '["Bank Transfer", "Cash"]',  # JSON string
    
    # Billing Information (Step 4)
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
    
    # Verification (Step 5)
    "documentType": "Bar License",
    "barCouncilNumber": "BAR/2015/123456", 
    "affiliation": "Karachi Bar Association",
    "termsAccepted": "true"
}

try:
    print("🧪 Testing Complete Registration Flow...")
    print(f"📡 URL: {url}")
    
    # Make the request
    response = requests.post(url, data=form_data)
    
    print(f"\n📊 Status Code: {response.status_code}")
    
    # Print response content
    if response.headers.get('content-type', '').startswith('application/json'):
        try:
            json_response = response.json()
            print(f"📋 JSON Response:")
            print(json.dumps(json_response, indent=2))
            
            if response.status_code == 200:
                print("\n✅ SUCCESS: Registration validation is now working!")
                print("🎉 The frontend fixes have resolved the validation issues.")
                print("👤 User can now complete the firm registration process.")
            else:
                print(f"\n❌ VALIDATION FAILED: Status {response.status_code}")
                if 'errors' in json_response:
                    print("🔍 Remaining validation errors:")
                    for error in json_response.get('errors', []):
                        field = error.get('field', 'general')
                        message = error.get('message', 'Unknown error')
                        print(f"  ❌ {field}: {message}")
                
        except json.JSONDecodeError:
            print(f"📄 Response Text: {response.text}")
    else:
        print(f"📄 Response Text: {response.text}")
        
    print("\n" + "="*60)
    
except requests.exceptions.RequestException as e:
    print(f"🚫 Request failed: {e}")
except Exception as e:
    print(f"💥 Error: {e}")