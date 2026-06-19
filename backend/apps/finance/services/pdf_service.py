import io
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

class FinancePDFService:
    @staticmethod
    def generate_receipt_pdf(receipt):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=inch, leftMargin=inch,
                                topMargin=inch, bottomMargin=inch)
        elements = []
        styles = getSampleStyleSheet()
        
        # Styles
        title_style = ParagraphStyle(name='TitleStyle', parent=styles['Heading1'], alignment=TA_CENTER)
        normal_style = styles['Normal']
        right_style = ParagraphStyle(name='Right', parent=styles['Normal'], alignment=TA_RIGHT)
        
        # Header
        elements.append(Paragraph("<b>HORIZON DEUTSCH TRAINING INSTITUTE</b>", title_style))
        elements.append(Paragraph("Official Payment Receipt", ParagraphStyle(name='Sub', parent=styles['Heading3'], alignment=TA_CENTER)))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Receipt Details
        payment = receipt.payment
        student = payment.student
        
        info_data = [
            ["Receipt No:", receipt.receipt_number, "Date:", receipt.issue_date.strftime("%Y-%m-%d")],
            ["Student No:", student.admission_number, "Status:", receipt.status],
            ["Student Name:", f"{student.first_name} {student.last_name}", "Payment Method:", payment.payment_method],
            ["Payer Name:", payment.payer_name, "Transaction ID:", payment.transaction_id]
        ]
        
        info_table = Table(info_data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 1.5*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Allocations
        elements.append(Paragraph("<b>Payment Allocation Breakdown</b>", styles['Heading4']))
        elements.append(Spacer(1, 0.1 * inch))
        
        alloc_data = [["Category", "Amount (KES)"]]
        for alloc in payment.allocations.filter(is_deleted=False):
            alloc_data.append([alloc.category, f"{alloc.amount:,.2f}"])
            
        alloc_data.append(["TOTAL PAID", f"{payment.amount:,.2f}"])
        
        alloc_table = Table(alloc_data, colWidths=[4*inch, 2.4*inch])
        alloc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e6e6e6')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(alloc_table)
        elements.append(Spacer(1, 0.4 * inch))
        
        # Balance Summary
        elements.append(Paragraph("<b>Account Summary</b>", styles['Heading4']))
        elements.append(Spacer(1, 0.1 * inch))
        
        bal_data = [
            ["Total Fees Charged:", f"KES {student.total_fees:,.2f}"],
            ["Total Paid to Date:", f"KES {student.total_paid:,.2f}"],
            ["Outstanding Balance:", f"KES {student.outstanding_balance:,.2f}"],
        ]
        if student.credit_balance > 0:
            bal_data.append(["Credit Balance:", f"KES {student.credit_balance:,.2f}"])
            
        bal_table = Table(bal_data, colWidths=[4*inch, 2.4*inch])
        bal_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(bal_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Footer
        elements.append(Paragraph("<i>This is a computer generated receipt and requires no signature.</i>", center_title))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
