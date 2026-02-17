"""
Celery tasks for communication (SMS, WhatsApp)
"""
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from twilio.rest import Client
from .models import SMSLog, WhatsAppLog


@shared_task
def send_sms(sms_log_id):
    """Send SMS using Twilio"""
    try:
        sms_log = SMSLog.objects.get(id=sms_log_id)
        
        # Initialize Twilio client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Send SMS
        message = client.messages.create(
            body=sms_log.message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=sms_log.recipient_phone
        )
        
        # Update log
        sms_log.status = 'SENT'
        sms_log.provider_message_id = message.sid
        sms_log.sent_at = timezone.now()
        sms_log.save()
        
        return f"SMS sent: {message.sid}"
    except Exception as e:
        sms_log = SMSLog.objects.get(id=sms_log_id)
        sms_log.status = 'FAILED'
        sms_log.error_message = str(e)
        sms_log.save()
        raise


@shared_task
def send_whatsapp(whatsapp_log_id):
    """Send WhatsApp message using Twilio"""
    try:
        whatsapp_log = WhatsAppLog.objects.get(id=whatsapp_log_id)
        
        # Initialize Twilio client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Send WhatsApp (using Twilio WhatsApp API)
        message = client.messages.create(
            body=whatsapp_log.message,
            from_=f'whatsapp:{settings.TWILIO_PHONE_NUMBER}',
            to=f'whatsapp:{whatsapp_log.recipient_phone}'
        )
        
        # Update log
        whatsapp_log.status = 'SENT'
        whatsapp_log.provider_message_id = message.sid
        whatsapp_log.sent_at = timezone.now()
        whatsapp_log.save()
        
        return f"WhatsApp sent: {message.sid}"
    except Exception as e:
        whatsapp_log = WhatsAppLog.objects.get(id=whatsapp_log_id)
        whatsapp_log.status = 'FAILED'
        whatsapp_log.error_message = str(e)
        whatsapp_log.save()
        raise
