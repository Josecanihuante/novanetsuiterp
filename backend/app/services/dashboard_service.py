from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from app.models.accounting import JournalEntry, JournalLine, Account
from app.models.commerce import Invoice, Customer
from app.models.inventory import Product
from app.models.taxes import TaxResult, PpmPayment
from app.models.financial import BscSnapshot


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    """
    Get key metrics for dashboard display
    """
    # Get current month/year
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total invoices this month
    invoices_this_month = db.query(Invoice).filter(
        Invoice.issue_date >= start_of_month,
        Invoice.deleted_at.is_(None)
    ).count()
    
    # Total customers
    total_customers = db.query(Customer).filter(
        Customer.deleted_at.is_(None),
        Customer.is_active == True
    ).count()
    
    # Total accounts payable (simplified)
    # In a real system, this would be more complex
    accounts_payable = db.query(func.sum(Invoice.total - Invoice.paid_amount)).filter(
        Invoice.issue_date >= start_of_month,
        Invoice.deleted_at.is_(None),
        Invoice.status.in_(["issued", "overdue"])
    ).scalar() or 0
    
    # Total revenue this month
    revenue_this_month = db.query(func.sum(Invoice.total)).filter(
        Invoice.issue_date >= start_of_month,
        Invoice.deleted_at.is_(None),
        Invoice.status.in_(["issued", "paid"])
    ).scalar() or 0
    
    # PPM for current month (would come from tax service)
    ppm_this_month = db.query(func.sum(PpmPayment.amount_due)).filter(
        PpmPayment.payment_date >= start_of_month,
        PpmPayment.deleted_at.is_(None)
    ).scalar() or 0
    
    return {
        "total_invoices_month": invoices_this_month,
        "total_customers": total_customers,
        "accounts_payable": float(accounts_payable),
        "revenue_month": float(revenue_this_month),
        "ppm_month": float(ppm_this_month),
        "currency": "CLP"
    }


def get_dashboard_charts(db: Session) -> Dict[str, Any]:
    """
    Get data for dashboard charts
    """
    # Get last 6 months for trend charts
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    
    # Monthly revenue trend
    monthly_revenue = db.query(
        func.strftime('%Y-%m', Invoice.issue_date).label('month'),
        func.sum(Invoice.total).label('total')
    ).filter(
        Invoice.issue_date >= six_months_ago,
        Invoice.deleted_at.is_(None),
        Invoice.status.in_(["issued", "paid"])
    ).group_by(
        func.strftime('%Y-%m', Invoice.issue_date)
    ).order_by(
        func.strftime('%Y-%m', Invoice.issue_date)
    ).all()
    
    # Expense vs Revenue (simplified)
    # In real system, this would come from proper expense tracking
    monthly_expenses = db.query(
        func.strftime('%Y-%m', JournalEntry.entry_date).label('month'),
        func.sum(JournalLine.debit).label('total')
    ).join(JournalLine).filter(
        JournalEntry.entry_date >= six_months_ago,
        JournalEntry.deleted_at.is_(None),
        JournalEntry.status == "posted"
    ).group_by(
        func.strftime('%Y-%m', JournalEntry.entry_date)
    ).order_by(
        func.strftime('%Y-%m', JournalEntry.entry_date)
    ).all()
    
    # Format data for charts
    revenue_data = [{"month": item.month, "value": float(item.total or 0)} for item in monthly_revenue]
    expense_data = [{"month": item.month, "value": float(item.total or 0)} for item in monthly_expenses]
    
    # BSC metrics for radar chart
    latest_bsc = db.query(BscSnapshot).filter(
        BscSnapshot.deleted_at.is_(None)
    ).order_by(BscSnapshot.created_at.desc()).limit(10).all()
    
    # Group by perspective
    perspectives = {}
    for metric in latest_bsc:
        if metric.perspective not in perspectives:
            perspectives[metric.perspective] = []
        perspectives[metric.perspective].append({
            "name": metric.metric_name,
            "value": float(metric.actual_value or 0),
            "target": float(metric.target_value or 0)
        })
    
    return {
        "monthly_revenue": revenue_data,
        "monthly_expenses": expense_data,
        "bsc_by_perspective": perspectives
    }