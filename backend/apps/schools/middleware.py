"""
Middleware for multi-tenant support
"""
from django.http import Http404
from .models import School


class TenantMiddleware:
    """
    Middleware to set the current school (tenant) based on request headers or subdomain
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Get school from header (X-School-Code) or subdomain
        school_code = request.headers.get('X-School-Code') or request.GET.get('school_code')
        
        if school_code:
            try:
                school = School.objects.get(code=school_code, is_active=True)
                request.school = school
            except School.DoesNotExist:
                request.school = None
        else:
            request.school = None
        
        response = self.get_response(request)
        return response
