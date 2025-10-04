# SmartLawyer Backend

A FastAPI backend for the SmartLawyer.ai law firm registration system. This backend handles the entire registration process, including user information, firm details, credentials, pricing, billing, and verification.

## Features

- Complete law firm registration with 6 steps
- File upload handling for documents and images
- Email notifications for registration confirmation
- User authentication and password hashing
- Registration status tracking

## Tech Stack

- FastAPI: Modern, fast web framework for building APIs
- SQLModel: ORM for interacting with the database
- SQLite: Lightweight database for development
- Pydantic: Data validation and settings management
- JWT: Authentication and authorization
- Jinja2: Templating for emails

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/smartlawyer-backend.git
cd smartlawyer-backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=sqlite:///./smartlawyer.db

# JWT Configuration
SECRET_KEY=BjME82TQITFVLoKKNcIXZzM680uF3oH-bWJARfalNa4
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@smartlawyer.ai
```

5. Run the application:

```bash
uvicorn app.main:app --reload
```

6. Access the API documentation:

```
http://localhost:8000/docs
```

## API Endpoints

- `POST /api/v1/registration/complete/`: Complete registration for a law firm
- `GET /api/v1/registration/status/{cnic_number}`: Get registration status by CNIC number

## Development

### Project Structure

```
app/
├── api/
│   └── routers/
│       └── registration.py
├── models/
│   ├── database.py
│   └── registration.py
├── schemas/
│   └── registration.py
├── templates/
│   └── registration_confirmation.html
├── utils/
│   ├── email.py
│   ├── file_handler.py
│   └── security.py
├── main.py
└── .env
```

## Frontend Integration

This backend is designed to work with the SmartLawyer.ai frontend, which uses RTK Query for API calls. The frontend components are located at:

- `src/components/registration/RegisterFirm.jsx`: Main registration component
- `src/components/registration/modules/`: Individual step components
- `src/reduxstore/services/RegistrationAPI.js`: RTK Query API service
