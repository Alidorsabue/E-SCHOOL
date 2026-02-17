"""
Utility functions for meetings
"""
from io import BytesIO
from django.http import HttpResponse
from django.template.loader import render_to_string
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch


def generate_meeting_report_pdf(meeting):
    """Generate PDF report for a meeting"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 100, f"Rapport de Réunion: {meeting.title}")
    
    # Meeting details
    y = height - 150
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Date: {meeting.meeting_date.strftime('%d/%m/%Y %H:%M')}")
    y -= 20
    p.drawString(100, y, f"Durée: {meeting.duration_minutes} minutes")
    y -= 20
    p.drawString(100, y, f"Type: {meeting.get_meeting_type_display()}")
    y -= 20
    if meeting.location:
        p.drawString(100, y, f"Lieu: {meeting.location}")
        y -= 20
    
    # Participants
    y -= 20
    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, y, "Participants:")
    y -= 20
    p.setFont("Helvetica", 10)
    
    if meeting.teacher:
        p.drawString(120, y, f"Enseignant: {meeting.teacher.user.get_full_name()} ({'Présent' if meeting.teacher_attended else 'Absent'})")
        y -= 15
    if meeting.parent:
        p.drawString(120, y, f"Parent: {meeting.parent.user.get_full_name()} ({'Présent' if meeting.parent_attended else 'Absent'})")
        y -= 15
    if meeting.student:
        p.drawString(120, y, f"Élève: {meeting.student.user.get_full_name()} ({'Présent' if meeting.student_attended else 'Absent'})")
        y -= 15
    
    # Additional participants
    for participant in meeting.participants.all():
        p.drawString(120, y, f"{participant.role}: {participant.user.get_full_name()} ({'Présent' if participant.attended else 'Absent'})")
        y -= 15
    
    # Agenda
    if meeting.agenda:
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "Ordre du jour:")
        y -= 20
        p.setFont("Helvetica", 10)
        # Split long text into multiple lines
        lines = meeting.agenda.split('\n')
        for line in lines[:10]:  # Limit to 10 lines
            if y < 100:
                p.showPage()
                y = height - 100
            p.drawString(120, y, line[:80])  # Limit line length
            y -= 15
    
    # Report/Notes
    if meeting.report:
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "Rapport:")
        y -= 20
        p.setFont("Helvetica", 10)
        lines = meeting.report.split('\n')
        for line in lines[:15]:  # Limit to 15 lines
            if y < 100:
                p.showPage()
                y = height - 100
            p.drawString(120, y, line[:80])
            y -= 15
    
    p.save()
    buffer.seek(0)
    
    # Save to file
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    
    filename = f"meetings/reports/meeting_{meeting.id}_report.pdf"
    file_content = ContentFile(buffer.read())
    saved_file = default_storage.save(filename, file_content)
    
    return saved_file
