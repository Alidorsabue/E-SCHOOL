"""
Utility functions for academics (PDF generation, class ranking, etc.)
"""
from decimal import Decimal
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from .models import ReportCard, Grade, GradeBulletin
from apps.accounts.models import Student
from apps.schools.models import SchoolClass, ClassSubject, StudentClassEnrollment


def get_class_ranking_map(school_class, academic_year):
    """
    Pour une classe et une année, retourne { student_id: {'rank': int, 'percentage': float} }.
    Utilisé pour enrichir l'historique des classes et la génération du bulletin PDF.
    """
    if not school_class or not (academic_year or '').strip():
        return {}
    ac_year = (academic_year or '').strip()
    class_subjects = ClassSubject.objects.filter(school_class=school_class).select_related('subject')
    max_per_subject = {cs.subject_id: (cs.period_max or 20) * 8 for cs in class_subjects}
    subject_ids = list(max_per_subject.keys())
    total_max = sum(max_per_subject.values()) or 1
    enrollment_ids = set(StudentClassEnrollment.objects.filter(
        school_class=school_class
    ).values_list('student_id', flat=True).distinct())
    bulletin_ids = set(GradeBulletin.objects.filter(
        school_class=school_class, academic_year=ac_year
    ).values_list('student_id', flat=True).distinct())
    student_ids = list(enrollment_ids | bulletin_ids)
    if not student_ids:
        return {}
    students = Student.objects.filter(id__in=student_ids).select_related('user')
    bulletins = GradeBulletin.objects.filter(
        student__in=students,
        academic_year=ac_year,
        subject_id__in=subject_ids,
    ).filter(Q(school_class=school_class) | Q(school_class__isnull=True)).select_related('student', 'subject')
    by_student = {}
    for b in bulletins:
        sid = b.student_id
        if sid not in by_student:
            by_student[sid] = {}
        by_student[sid][b.subject_id] = (b.total_general or Decimal('0'))
    rows = []
    for s in students:
        pts = sum(by_student.get(s.id, {}).values())
        pct = (float(pts) / total_max * 100) if total_max else 0
        name = (s.user.get_full_name() or s.user.username) if s.user else f'Élève #{s.id}'
        rows.append({'student_id': s.id, 'student_name': name, 'percentage': round(pct, 2)})
    rows.sort(key=lambda x: (-sum(by_student.get(x['student_id'], {}).values()), x['student_name']))
    for i, r in enumerate(rows, 1):
        r['rank'] = i
    return {r['student_id']: {'rank': r['rank'], 'percentage': r['percentage']} for r in rows}


def generate_bulletin_grade_pdf(student, school_class, academic_year):
    """
    Génère le bulletin PDF (notes RDC) pour un élève, une classe et une année.
    Retourne un BytesIO (à envoyer en téléchargement, non enregistré).
    """
    ac_year = (academic_year or '').strip()
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # En-tête
    title = Paragraph(
        "<b>REPUBLIQUE DEMOCRATIQUE DU CONGO<br/>MINISTERE DE L'EDUCATION NATIONALE</b>",
        styles['Title']
    )
    story.append(title)
    story.append(Spacer(1, 0.15*inch))
    class_name = school_class.name if school_class else 'N/A'
    info = f"""
    <b>Élève:</b> {student.user.get_full_name() if student.user else 'N/A'} &nbsp;&nbsp;
    <b>Matricule:</b> {getattr(student, 'student_id', '') or '-'} &nbsp;&nbsp;
    <b>Classe:</b> {class_name}<br/>
    <b>Année scolaire:</b> {ac_year}
    """
    story.append(Paragraph(info, styles['Normal']))
    story.append(Spacer(1, 0.25*inch))

    # Tableau des notes (GradeBulletin pour cette classe et année)
    grades = GradeBulletin.objects.filter(
        student=student,
        academic_year=ac_year
    ).filter(Q(school_class=school_class) | Q(school_class__isnull=True)).select_related('subject').order_by('subject__name')

    headers = [
        'BRANCHES',
        '1ère P.', '2ème P.', 'EXAM.', 'TOT. S1',
        '3ème P.', '4ème P.', 'EXAM.', 'TOT. S2',
        'T.G.', 'Repêch. %'
    ]
    data = [headers]
    for g in grades:
        def _v(f, d='-'):
            v = getattr(g, f, None)
            if v is not None and v != '':
                try:
                    return str(Decimal(str(v)).quantize(Decimal('0.01')))
                except Exception:
                    return d
            return d
        data.append([
            g.subject.name if g.subject else '-',
            _v('s1_p1'), _v('s1_p2'), _v('s1_exam'), _v('total_s1'),
            _v('s2_p3'), _v('s2_p4'), _v('s2_exam'), _v('total_s2'),
            _v('total_general'),
            _v('reclamation_score'),
        ])

    if len(data) > 1:
        col_widths = [1.4*inch] + [0.5*inch]*10
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("<i>Aucune note (bulletin RDC) enregistrée pour cette classe et année.</i>", styles['Normal']))

    story.append(Spacer(1, 0.2*inch))
    # Place et Pourcentage (depuis le classement)
    ranking = get_class_ranking_map(school_class, ac_year).get(student.id, {})
    rank = ranking.get('rank')
    pct = ranking.get('percentage')
    place = f"{rank}" if rank is not None else '-'
    pct_str = f"{pct} %" if pct is not None else '-'
    story.append(Paragraph(
        f"<b>Place:</b> {place} &nbsp;&nbsp; <b>Pourcentage:</b> {pct_str}",
        styles['Normal']
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_bulletin_rdc_pdf(report_card):
    """
    Génère le bulletin au format officiel RDC: 2 semestres, 4 périodes (Trav. journaliers),
    2 examens, TOT. S1/S2, T.G., repêchage; APPLICATION, CONDUITE, Place, Décision.
    """
    from decimal import Decimal
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    student = report_card.student
    # En-tête
    title = Paragraph(
        "<b>REPUBLIQUE DEMOCRATIQUE DU CONGO<br/>MINISTERE DE L'EDUCATION NATIONALE</b>",
        styles['Title']
    )
    story.append(title)
    story.append(Spacer(1, 0.15*inch))
    info = f"""
    <b>Élève:</b> {student.user.get_full_name()} &nbsp;&nbsp;
    <b>Matricule:</b> {student.student_id} &nbsp;&nbsp;
    <b>Classe:</b> {student.school_class.name if student.school_class else 'N/A'}<br/>
    <b>Année scolaire:</b> {report_card.academic_year}
    """
    story.append(Paragraph(info, styles['Normal']))
    story.append(Spacer(1, 0.25*inch))

    # Tableau des notes (GradeBulletin)
    grades = GradeBulletin.objects.filter(
        student=student,
        academic_year=report_card.academic_year
    ).select_related('subject').order_by('subject__name')

    headers = [
        'BRANCHES',
        '1ère P.', '2ème P.', 'EXAM.', 'TOT. S1',
        '3ème P.', '4ème P.', 'EXAM.', 'TOT. S2',
        'T.G.', 'Repêch. %'
    ]
    data = [headers]
    for g in grades:
        def _v(f, d='-'):
            v = getattr(g, f, None)
            if v is not None and v != '':
                try:
                    return str(Decimal(str(v)).quantize(Decimal('0.01')))
                except Exception:
                    return d
            return d
        data.append([
            g.subject.name if g.subject else '-',
            _v('s1_p1'), _v('s1_p2'), _v('s1_exam'), _v('total_s1'),
            _v('s2_p3'), _v('s2_p4'), _v('s2_exam'), _v('total_s2'),
            _v('total_general'),
            _v('reclamation_score'),
        ])

    if len(data) > 1:
        col_widths = [1.4*inch] + [0.5*inch]*10
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("<i>Aucune note (bulletin RDC) enregistrée.</i>", styles['Normal']))

    story.append(Spacer(1, 0.2*inch))
    # APPLICATION, CONDUITE, Place
    app = report_card.application if report_card.application is not None else '-'
    cond = report_card.conduite if report_card.conduite is not None else '-'
    place = f"{report_card.rank or '-'} / {report_card.total_students or '-'}"
    story.append(Paragraph(
        f"<b>Application:</b> {app} &nbsp;&nbsp; <b>Conduite:</b> {cond} &nbsp;&nbsp; "
        f"<b>Place / Nombre d'élèves:</b> {place}",
        styles['Normal']
    ))
    if report_card.decision:
        story.append(Paragraph(f"<b>Décision:</b> {report_card.get_decision_display()}", styles['Normal']))
    if report_card.reclamation_subject:
        story.append(Paragraph(
            f"<b>Repêchage:</b> {report_card.reclamation_subject.name} — "
            f"Réussi: {'Oui' if report_card.reclamation_passed else 'Non'}",
            styles['Normal']
        ))
    story.append(Spacer(1, 0.15*inch))
    if report_card.teacher_comment:
        story.append(Paragraph(f"<b>Commentaire du titulaire:</b> {report_card.teacher_comment}", styles['Normal']))
    if report_card.principal_comment:
        story.append(Paragraph(f"<b>Chef d'établissement:</b> {report_card.principal_comment}", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    filename = f"academics/report_cards/bulletin_rdc_{report_card.id}.pdf"
    file_content = ContentFile(buffer.read())
    return default_storage.save(filename, file_content)


def generate_report_card_pdf(report_card):
    """Generate PDF report card"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph(f"<b>BULLETIN SCOLAIRE</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.2*inch))
    
    # Student info
    student = report_card.student
    student_info = f"""
    <b>Élève:</b> {student.user.get_full_name()}<br/>
    <b>Matricule:</b> {student.student_id}<br/>
    <b>Classe:</b> {student.school_class.name if student.school_class else 'N/A'}<br/>
    <b>Année scolaire:</b> {report_card.academic_year}<br/>
    <b>Trimestre:</b> {report_card.get_term_display()}<br/>
    """
    story.append(Paragraph(student_info, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Grades table
    grades = Grade.objects.filter(
        student=student,
        academic_year=report_card.academic_year,
        term=report_card.term
    )
    
    if grades.exists():
        data = [['Matière', 'Contrôle continu', 'Examen', 'Total', 'Appréciation']]
        
        for grade in grades:
            appreciation = get_appreciation(grade.total_score)
            data.append([
                grade.subject.name,
                str(grade.continuous_assessment),
                str(grade.exam_score) if grade.exam_score else '-',
                str(grade.total_score),
                appreciation
            ])
        
        # Summary row
        data.append([
            '<b>TOTAL</b>',
            '',
            '',
            f'<b>{report_card.average_score}/20</b>',
            get_appreciation(report_card.average_score)
        ])
        
        table = Table(data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.3*inch))
    
    # Comments
    if report_card.teacher_comment:
        story.append(Paragraph("<b>Commentaire de l'enseignant:</b>", styles['Heading3']))
        story.append(Paragraph(report_card.teacher_comment, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    if report_card.principal_comment:
        story.append(Paragraph("<b>Commentaire du directeur:</b>", styles['Heading3']))
        story.append(Paragraph(report_card.principal_comment, styles['Normal']))
    
    # Rank
    if report_card.rank:
        story.append(Spacer(1, 0.2*inch))
        rank_text = f"<b>Rang:</b> {report_card.rank}/{report_card.total_students}"
        story.append(Paragraph(rank_text, styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"academics/report_cards/report_{report_card.id}.pdf"
    file_content = ContentFile(buffer.read())
    saved_file = default_storage.save(filename, file_content)
    
    return saved_file


def get_appreciation(score):
    """Get appreciation based on score"""
    if score >= 16:
        return "Excellent"
    elif score >= 14:
        return "Très bien"
    elif score >= 12:
        return "Bien"
    elif score >= 10:
        return "Assez bien"
    elif score >= 8:
        return "Passable"
    else:
        return "Insuffisant"
