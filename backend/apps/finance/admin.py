from django.contrib import admin

# Register your models here.

from .models import PaymentPlan, PaymentPlanInstallment

class PaymentPlanInstallmentInline(admin.TabularInline):
    model = PaymentPlanInstallment
    extra = 1

@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ('student', 'fee_structure', 'total_fee', 'amount_paid', 'status')
    inlines = [PaymentPlanInstallmentInline]
