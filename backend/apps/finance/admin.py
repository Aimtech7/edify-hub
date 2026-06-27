from django.contrib import admin
from .models import (
    FeeStructure, Payment, Allocation, Receipt,
    MpesaTransaction, StudentLedger, PaymentPlan, PaymentPlanInstallment
)

for model in [FeeStructure, Payment, Allocation, Receipt, MpesaTransaction, StudentLedger, PaymentPlan, PaymentPlanInstallment]:
    @admin.register(model)
    class GenericFinAdmin(admin.ModelAdmin):
        list_display = [f.name for f in model._meta.fields[:6]]
