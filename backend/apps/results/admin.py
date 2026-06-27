from django.contrib import admin
from .models import Result

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = [f.name for f in Result._meta.fields[:6]]
