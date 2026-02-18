"""
Utility functions for tutoring
"""
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch


def generate_tutoring_report_pdf(report):
    """Generate PDF report for tutoring"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 100, f"Rapport d'Encadrement: {report.title}")
    
    # Report details
    y = height - 150
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Élève: {report.student.user.get_full_name()}")
    y -= 20
    p.drawString(100, y, f"Enseignant: {report.teacher.user.get_full_name()}")
    y -= 20
    p.drawString(100, y, f"Période: {report.report_period_start} - {report.report_period_end}")
    y -= 30
    
    # Academic Progress
    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, y, "Progrès Scolaire:")
    y -= 20
    p.setFont("Helvetica", 10)
    lines = report.academic_progress.split('\n')
    for line in lines[:10]:
        if y < 100:
            p.showPage()
            y = height - 100
        p.drawString(120, y, line[:80])
        y -= 15
    
    # Behavior Observations
    if report.behavior_observations:
        y -= 10
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "Observations Comportementales:")
        y -= 20
        p.setFont("Helvetica", 10)
        lines = report.behavior_observations.split('\n')
        for line in lines[:8]:
            if y < 100:
                p.showPage()
                y = height - 100
            p.drawString(120, y, line[:80])
            y -= 15
    
    # Recommendations
    y -= 10
    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, y, "Recommandations:")
    y -= 20
    p.setFont("Helvetica", 10)
    lines = report.recommendations.split('\n')
    for line in lines[:10]:
        if y < 100:
            p.showPage()
            y = height - 100
        p.drawString(120, y, line[:80])
        y -= 15
    
    # Parent Feedback
    if report.parent_feedback:
        y -= 10
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y, "Retour du Parent:")
        y -= 20
        p.setFont("Helvetica", 10)
        lines = report.parent_feedback.split('\n')
        for line in lines[:8]:
            if y < 100:
                p.showPage()
                y = height - 100
            p.drawString(120, y, line[:80])
            y -= 15
    
    p.save()
    buffer.seek(0)
    
    filename = f"tutoring/reports/report_{report.id}.pdf"
    file_content = ContentFile(buffer.read())
    saved_file = default_storage.save(filename, file_content)
    
    return saved_file
