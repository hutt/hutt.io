import os
import emails
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ContactForm(BaseModel):
    name: str
    email: str
    betreff: str
    nachricht: str

@app.post("/api/kontakt")
async def send_mail(form: ContactForm):
    message = emails.html(
        html=f"<p><strong>Name:</strong> {form.name}</p><p><strong>Mail:</strong> {form.email}</p><p>{form.nachricht}</p>",
        subject=f"Anfrage hutt.io: {form.betreff}",
        mail_from=(form.name, os.getenv("MAIL_FROM"))
    )
    
    response = message.send(
        to=os.getenv("MAIL_TO"),
        smtp={
            "host": os.getenv("SMTP_SERVER"),
            "port": int(os.getenv("SMTP_PORT")),
            "user": os.getenv("SMTP_USER"),
            "password": os.getenv("SMTP_PASS"),
            "tls": True
        }
    )
    
    if not response.success:
        raise HTTPException(status_code=500, detail="Mail konnte nicht gesendet werden.")
        
    return {"message": "Erfolg"}