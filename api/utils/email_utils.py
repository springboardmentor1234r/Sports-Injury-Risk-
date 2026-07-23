import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")

def send_email(to_email: str, subject: str, body: str) -> bool:
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        print("Warning: Email credentials not configured. Cannot send email.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

def send_forgot_password_otp(to_email: str, otp: str) -> bool:
    subject = "Reset Your Password"
    body = f"""We received a request to reset your password.

Your OTP-

{otp}

Valid for 5 minutes.

If you didn't request this, ignore this email.

Sports Injury Risk Detection Team
"""
    return send_email(to_email, subject, body)

def send_signup_otp(to_email: str, otp: str) -> bool:
    subject = "Account Verification OTP"
    body = f"""Hello,

Welcome to Sports Injury Risk Detection.

To complete your account registration, please verify your email using the OTP below.


        {otp}


This OTP is valid for 5 minutes.

If you did not attempt to create an account, simply ignore this email.

Regards,
Sports Injury Risk Detection Team
"""
    return send_email(to_email, subject, body)

def send_password_changed_success(to_email: str) -> bool:
    subject = "Password Changed Successfully"
    body = """Hello,

This email confirms that your account password has been changed successfully.

If you made this change, no further action is required.

If you did NOT change your password, please reset it immediately or contact support.

Regards,
Sports Injury Risk Detection Team
"""
    return send_email(to_email, subject, body)

def send_welcome_email(to_email: str, full_name: str) -> bool:
    subject = "Welcome to Sports Injury Risk Detection"
    body = f"""Hello {full_name},

Your account has been created successfully! Welcome to Sports Injury Risk Detection.

We are excited to help you analyze and improve your biomechanics.

Regards,
Sports Injury Risk Detection Team
"""
    return send_email(to_email, subject, body)
