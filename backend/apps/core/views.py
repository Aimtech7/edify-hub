from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import InstitutionProfile

class InstitutionProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        profile = InstitutionProfile.get_solo()
        return Response({
            "name": profile.name,
            "abbreviation": profile.abbreviation,
            "tagline": profile.tagline,
            "phone_primary": profile.phone_primary,
            "phone_secondary": profile.phone_secondary,
            "whatsapp_number": profile.whatsapp_number,
            "email_primary": profile.email_primary,
            "website": profile.website,
            "postal_address": profile.postal_address,
            "physical_address": profile.physical_address,
            "facebook_link": profile.facebook_link,
            "instagram_link": profile.instagram_link,
            "tiktok_link": profile.tiktok_link,
            "twitter_link": profile.twitter_link,
            "linkedin_link": profile.linkedin_link,
            "google_maps_link": profile.google_maps_link,
        })
