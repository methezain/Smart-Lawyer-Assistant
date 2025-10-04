import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@smartlawyer.ai")

# Jinja2 setup for email templates
template_dir = Path(__file__).parent.parent / "templates"
env = Environment(loader=FileSystemLoader(template_dir))

def send_email(to_email, subject, template_name, context=None):
    """
    Send an email using a template.
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        template_name (str): Name of the template file (without extension)
        context (dict, optional): Context variables for the template
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if context is None:
        context = {}
    
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        
        # Render template
        try:
            template = env.get_template(f"{template_name}.html")
            html_content = template.render(**context)
        except Exception as e:
            print(f"Error rendering template: {e}")
            # Fallback to plain text if template fails
            html_content = f"<html><body><h1>{subject}</h1><p>Thank you for your registration.</p></body></html>"
        
        # Attach HTML content
        message.attach(MIMEText(html_content, "html"))
        
        # Connect to SMTP server
        if SMTP_USERNAME and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
                return True
        else:
            # If credentials are not provided, log instead of sending
            print(f"Email would be sent to {to_email} with subject '{subject}'")
            print(f"Email content: {html_content[:100]}...")
            return True
    
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def send_registration_confirmation(user_data):
    """
    Send a registration confirmation email.
    
    Args:
        user_data (dict): User registration data
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    to_email = user_data.get("email")
    if not to_email:
        print("No email address provided")
        return False
        
    subject = "SmartLawyer Registration Confirmation"
    template_name = "registration_confirmation"
    context = {
        "first_name": user_data.get("first_name", ""),
        "last_name": user_data.get("last_name", ""),
        "firm_name": user_data.get("firm_name", "")
    }
    
    # Try to send the email
    result = send_email(to_email, subject, template_name, context)
    
    # Log the result
    if result:
        print(f"Successfully sent confirmation email to {to_email}")
    else:
        print(f"Failed to send confirmation email to {to_email}")
    
    return result 

def send_status_update_email(user_data):
    """
    Send an email notification when a registration status changes (approved or rejected).
    
    Args:
        user_data (dict): User data containing email, name, firm, and status
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    to_email = user_data.get("email")
    if not to_email:
        print("No email address provided for status update")
        return False
    
    status = user_data.get("status", "").lower()
    if status not in ["approved", "rejected"]:
        print(f"Invalid status for email notification: {status}")
        return False
    
    # Set email subject and template based on status
    if status == "approved":
        subject = "SmartLawyer Registration Approved"
        template_name = "registration_approved"
    else:  # rejected
        subject = "SmartLawyer Registration Update"
        template_name = "registration_rejected"
    
    # Prepare context for the template
    context = {
        "first_name": user_data.get("first_name", ""),
        "last_name": user_data.get("last_name", ""),
        "firm_name": user_data.get("firm_name", ""),
        "status": status
    }
    
    # Try to send the email using the shared template with status-specific content
    # We'll create a generic status_update template that works for both approval and rejection
    template_name = "status_update"
    result = send_email(to_email, subject, template_name, context)
    
    # Log the result
    if result:
        print(f"Successfully sent {status} notification email to {to_email}")
    else:
        print(f"Failed to send {status} notification email to {to_email}")
    
    return result


async def send_reset_password_email(email: str, otp_code: str, first_name: str):
    """
    Send password reset email with OTP.
    
    Args:
        email (str): Recipient email address
        otp_code (str): 6-digit OTP code
        first_name (str): User's first name
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = "SmartLawyer - Password Reset Request"
    
    context = {
        "first_name": first_name,
        "otp_code": otp_code,
        "expiry_minutes": 15
    }
    
    # For now, create a simple text email since we don't have the template
    # In production, you'd want to create a proper HTML template
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = FROM_EMAIL
        message["To"] = email
        message["Subject"] = subject
        
        # Create simple HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background-color: #226447; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .otp-code {{ 
                    font-size: 24px; 
                    font-weight: bold; 
                    background-color: #226447; 
                    color: white; 
                    padding: 10px 20px; 
                    text-align: center; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SmartLawyer.ai</h1>
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Dear {first_name},</p>
                    <p>You have requested to reset your password for your SmartLawyer admin account.</p>
                    <p>Your password reset OTP is:</p>
                    <div class="otp-code">{otp_code}</div>
                    <p><strong>Important:</strong> This OTP will expire in {15} minutes for security reasons.</p>
                    <p>If you did not request this password reset, please ignore this email or contact support.</p>
                </div>
                <div class="footer">
                    <p>© 2025 SmartLawyer.ai - All rights reserved</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML content
        message.attach(MIMEText(html_content, "html"))
        
        # Connect to server and send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
        
        print(f"Password reset email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"Failed to send password reset email to {email}: {str(e)}")
        return False


def send_client_registration_confirmation(client_data):
    """
    Send registration confirmation email to a new client.

    Args:
        client_data (dict): Dictionary containing client information with keys:
            - email: client's email address
            - full_name: client's full name
            - username: client's username
            - phone: client's phone number (optional)
            - registration_date: date of registration

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    from datetime import datetime

    try:
        # Prepare email context
        context = {
            "full_name": client_data.get("full_name", ""),
            "username": client_data.get("username", ""),
            "email": client_data.get("email", ""),
            "phone": client_data.get("phone", ""),
            "registration_date": client_data.get("registration_date", datetime.now().strftime("%B %d, %Y")),
            "login_url": "http://localhost:3000/auth/client",
            "app_url": "http://localhost:3000",
            "unsubscribe_url": "http://localhost:3000/unsubscribe"
        }

        # Send email
        subject = f"Welcome to SmartLawyer, {client_data.get('full_name', 'Valued Client')}! 🎉"

        return send_email(
            to_email=client_data["email"],
            subject=subject,
            template_name="client_registration_confirmation",
            context=context
        )

    except Exception as e:
        print(f"Error sending client registration confirmation email: {e}")
        return False

def send_client_password_reset_email(email, reset_token, otp_code):
    """
    Send password reset email to a client with OTP.

    Args:
        email (str): Client's email address
        reset_token (str): Password reset token
        otp_code (str): 6-digit OTP code

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        context = {
            "email": email,
            "reset_token": reset_token,
            "otp_code": otp_code,
            "reset_url": f"http://localhost:3000/auth/client/reset-password?token={reset_token}",
            "login_url": "http://localhost:3000/auth/client"
        }

        subject = "SmartLawyer - Password Reset Request"

        return send_email(
            to_email=email,
            subject=subject,
            template_name="client_password_reset",
            context=context
        )

    except Exception as e:
        print(f"Error sending client password reset email: {e}")
        return False
