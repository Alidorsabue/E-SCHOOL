"""
Utilities for payment receipt generation
"""
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.core.files.base import ContentFile
from django.utils import timezone
from datetime import datetime


def generate_payment_receipt_pdf(receipt):
    """
    Génère un PDF de reçu de paiement
    """
    payment = receipt.payment
    
    # Créer le buffer pour le PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=1,  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    
    # Contenu du PDF
    story = []
    
    # Titre
    story.append(Paragraph("REÇU DE PAIEMENT", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations de l'école
    if payment.school:
        school_info = [
            [Paragraph(f"<b>{payment.school.name}</b>", normal_style)],
            [Paragraph(f"{payment.school.address or ''}", normal_style)],
            [Paragraph(f"Tél: {payment.school.phone or 'N/A'}", normal_style)],
        ]
        school_table = Table(school_info, colWidths=[16*cm])
        school_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(school_table)
        story.append(Spacer(1, 0.5*cm))
    
    # Ligne de séparation
    story.append(Spacer(1, 0.3*cm))
    
    # Informations du reçu
    receipt_data = [
        ['Numéro de reçu:', receipt.receipt_number],
        ['Date:', receipt.generated_at.strftime('%d/%m/%Y %H:%M') if receipt.generated_at else timezone.now().strftime('%d/%m/%Y %H:%M')],
    ]
    
    receipt_table = Table(receipt_data, colWidths=[6*cm, 10*cm])
    receipt_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(receipt_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Informations du paiement
    story.append(Paragraph("<b>DÉTAILS DU PAIEMENT</b>", heading_style))
    
    payment_data = [
        ['ID de paiement:', payment.payment_id],
        ['Payeur:', payment.user.get_full_name() if payment.user else 'N/A'],
    ]
    
    if payment.student:
        payment_data.append(['Élève:', f"{payment.student.user.get_full_name()} ({payment.student.student_id})"])
    
    # Méthode de paiement
    payment_method_display = dict(payment.PAYMENT_METHODS).get(payment.payment_method, payment.payment_method)
    # Statut
    status_display = dict(payment.STATUS_CHOICES).get(payment.status, payment.status)
    
    payment_data.extend([
        ['Montant:', f"{payment.amount} {payment.currency}"],
        ['Méthode de paiement:', payment_method_display],
        ['Statut:', status_display],
    ])
    
    if payment.payment_date:
        payment_data.append(['Date de paiement:', payment.payment_date.strftime('%d/%m/%Y %H:%M')])
    
    if payment.reference_number:
        payment_data.append(['Référence:', payment.reference_number])
    
    if payment.description:
        payment_data.append(['Description:', payment.description])
    
    payment_table = Table(payment_data, colWidths=[6*cm, 10*cm])
    payment_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(payment_table)
    story.append(Spacer(1, 1*cm))
    
    # Signature
    signature_data = [
        ['', ''],
        ['Signature du payeur', 'Signature de l\'école'],
    ]
    signature_table = Table(signature_data, colWidths=[8*cm, 8*cm])
    signature_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 30),
    ]))
    story.append(signature_table)
    
    # Construire le PDF
    doc.build(story)
    
    # Sauvegarder le PDF dans le modèle
    buffer.seek(0)
    filename = f'receipt_{receipt.receipt_number}.pdf'
    receipt.pdf_file.save(filename, ContentFile(buffer.read()), save=False)
    receipt.save()
    
    return receipt.pdf_file


def generate_cash_movement_voucher_pdf(movement):
    """
    Génère un PDF de bon d'entrée/sortie pour un mouvement de caisse
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Génération bon pour mouvement {movement.id} (type: {movement.movement_type}, source: {movement.source})")
    
    # Créer le buffer pour le PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#059669' if movement.movement_type == 'IN' else '#dc2626'),
        spaceAfter=30,
        alignment=1,  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    
    # Contenu du PDF
    story = []
    
    # Titre selon le type
    voucher_type = "BON D'ENTRÉE" if movement.movement_type == 'IN' else "BON DE SORTIE"
    story.append(Paragraph(voucher_type, title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations de l'école
    if movement.school:
        school_info = [
            [Paragraph(f"<b>{movement.school.name}</b>", normal_style)],
            [Paragraph(f"{movement.school.address or ''}", normal_style)],
            [Paragraph(f"Tél: {movement.school.phone or 'N/A'}", normal_style)],
        ]
        school_table = Table(school_info, colWidths=[16*cm])
        school_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(school_table)
        story.append(Spacer(1, 0.5*cm))
    
    # Ligne de séparation
    story.append(Spacer(1, 0.3*cm))
    
    # Informations du bon
    voucher_number = f"BON-{movement.id:06d}"
    from .models import CashMovement, Payment
    source_display = dict(CashMovement.SOURCE_CHOICES).get(movement.source, movement.source)
    payment_method_display = movement.payment_method or 'N/A'
    if movement.payment_method:
        payment_methods = dict(Payment.PAYMENT_METHODS)
        payment_method_display = payment_methods.get(movement.payment_method, movement.payment_method)
    
    voucher_data = [
        ['Numéro du bon:', voucher_number],
        ['Date:', movement.created_at.strftime('%d/%m/%Y %H:%M') if movement.created_at else timezone.now().strftime('%d/%m/%Y %H:%M')],
        ['Type:', movement.get_movement_type_display()],
        ['Origine:', source_display],
    ]
    
    voucher_table = Table(voucher_data, colWidths=[6*cm, 10*cm])
    voucher_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(voucher_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Détails du mouvement
    story.append(Paragraph("<b>DÉTAILS DU MOUVEMENT</b>", heading_style))
    
    movement_data = [
        ['Montant:', f"{movement.amount} {movement.currency}"],
        ['Type de paiement:', payment_method_display],
    ]
    
    if movement.description:
        movement_data.append(['Description:', movement.description])
    
    if movement.reference_type and movement.reference_id:
        movement_data.append(['Référence:', f"{movement.reference_type} #{movement.reference_id}"])
    
    if movement.created_by:
        movement_data.append(['Créé par:', movement.created_by.get_full_name()])
    
    movement_table = Table(movement_data, colWidths=[6*cm, 10*cm])
    movement_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(movement_table)
    story.append(Spacer(1, 1*cm))
    
    # Signature
    signature_data = [
        ['', ''],
        ['Signature du responsable', 'Signature du comptable'],
    ]
    signature_table = Table(signature_data, colWidths=[8*cm, 8*cm])
    signature_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 30),
    ]))
    story.append(signature_table)
    
    # Construire le PDF
    doc.build(story)
    
    # Sauvegarder le PDF dans le modèle
    buffer.seek(0)
    filename = f'bon_{movement.movement_type.lower()}_{movement.id}.pdf'
    logger.info(f"Sauvegarde du document '{filename}' pour mouvement {movement.id}")
    movement.document.save(filename, ContentFile(buffer.read()), save=True)
    logger.info(f"Document sauvegardé avec succès: {movement.document.name if movement.document else 'None'}")
    
    return movement.document
