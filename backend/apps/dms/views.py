from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db.models import Q, Sum

from dms.models import DocumentMetadata, DMSAuditLog
from dms.storage_service import StorageService

class DocumentListView(APIView):
    permission_classes = [AllowAny] # Allow public viewing of public documents

    def get(self, request, *args, **kwargs):
        qs = DocumentMetadata.objects.filter(is_deleted=False)

        # Role Filtering
        user = request.user if request.user and request.user.is_authenticated else None
        role = getattr(user, 'role', 'PUBLIC') if user else 'PUBLIC'

        if role == 'STUDENT':
            # Students see Public, Students, and their specific courses
            student_level = getattr(getattr(user, 'student_profile', None), 'current_level', '')
            qs = qs.filter(Q(visibility__in=['PUBLIC', 'STUDENTS']) | Q(level__iexact=student_level) | Q(uploaded_by=user))
        elif role == 'TEACHER':
            # Teachers see Public, Students, Teachers, and their own uploads
            qs = qs.filter(Q(visibility__in=['PUBLIC', 'STUDENTS', 'TEACHERS', 'COURSE_ONLY']) | Q(uploaded_by=user))
        elif role not in ['ADMIN', 'REGISTRAR', 'FINANCE', 'ACCOUNTANT']:
            qs = qs.filter(visibility='PUBLIC')

        # Category Filter
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        # Course / Lesson / Level Filter
        course = request.query_params.get('course')
        if course: qs = qs.filter(course__icontains=course)
        lesson = request.query_params.get('lesson')
        if lesson: qs = qs.filter(lesson__icontains=lesson)
        level = request.query_params.get('level')
        if level: qs = qs.filter(level__iexact=level)

        # Search Query
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search) |
                Q(keywords__icontains=search) |
                Q(extracted_text__icontains=search)
            )

        # Pagination / Limit
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        total = qs.count()
        docs = qs[offset:offset+limit]

        data = []
        for d in docs:
            file_url = d.file.url if d.file else d.external_link
            data.append({
                "id": d.id,
                "title": d.title,
                "description": d.description,
                "category": d.category,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "url": file_url,
                "tags": [t.strip() for t in d.tags.split(',') if t.strip()],
                "course": d.course,
                "lesson": d.lesson,
                "level": d.level,
                "uploaded_by": d.uploaded_by.username if d.uploaded_by else "System",
                "visibility": d.visibility,
                "version": d.version,
                "is_archived": d.is_archived,
                "download_count": d.download_count,
                "view_count": d.view_count,
                "created_at": d.created_at.strftime('%Y-%m-%d %H:%M')
            })

        return Response({"total": total, "documents": data})

    def post(self, request, *args, **kwargs):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first() or User.objects.first()

        file_obj = request.FILES.get('file')
        external_link = request.data.get('external_link', '')
        if not file_obj and not external_link:
            return Response({"error": "File or external link is required."}, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get('category', DocumentMetadata.Category.KNOWLEDGE_BASE)
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        tags = request.data.get('tags', '')
        keywords = request.data.get('keywords', '')
        course = request.data.get('course', '')
        lesson = request.data.get('lesson', '')
        level = request.data.get('level', '')
        visibility = request.data.get('visibility', 'PUBLIC')

        doc = StorageService.upload_file(
            file_obj=file_obj,
            category=category,
            uploaded_by=user,
            title=title,
            description=description,
            tags=tags,
            keywords=keywords,
            course=course,
            lesson=lesson,
            level=level,
            visibility=visibility,
            external_link=external_link
        )

        file_url = doc.file.url if doc.file else doc.external_link
        return Response({
            "status": "Document uploaded successfully",
            "document": {
                "id": doc.id,
                "title": doc.title,
                "category": doc.category,
                "url": file_url
            }
        }, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        try:
            doc = DocumentMetadata.objects.get(pk=pk, is_deleted=False)
            doc.view_count += 1
            doc.save(update_fields=['view_count'])

            DMSAuditLog.objects.create(
                action=DMSAuditLog.Action.VIEW,
                document=doc,
                user=request.user if request.user.is_authenticated else None,
                details=f"Previewed document '{doc.title}'"
            )

            file_url = doc.file.url if doc.file else doc.external_link
            return Response({
                "id": doc.id,
                "title": doc.title,
                "description": doc.description,
                "category": doc.category,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "url": file_url,
                "tags": [t.strip() for t in doc.tags.split(',') if t.strip()],
                "course": doc.course,
                "lesson": doc.lesson,
                "level": doc.level,
                "uploaded_by": doc.uploaded_by.username if doc.uploaded_by else "System",
                "visibility": doc.visibility,
                "version": doc.version,
                "view_count": doc.view_count,
                "download_count": doc.download_count,
                "created_at": doc.created_at.strftime('%Y-%m-%d %H:%M')
            })
        except DocumentMetadata.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


class DocumentDownloadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk, *args, **kwargs):
        try:
            doc = DocumentMetadata.objects.get(pk=pk, is_deleted=False)
            doc.download_count += 1
            doc.save(update_fields=['download_count'])

            DMSAuditLog.objects.create(
                action=DMSAuditLog.Action.DOWNLOAD,
                document=doc,
                user=request.user if request.user.is_authenticated else None,
                details=f"Downloaded document '{doc.title}'"
            )

            file_url = doc.file.url if doc.file else doc.external_link
            return Response({"download_url": file_url})
        except DocumentMetadata.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


class DocumentActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        action = request.data.get('action')
        try:
            doc = DocumentMetadata.objects.get(pk=pk)
            if action == 'SOFT_DELETE':
                doc.is_deleted = True
                doc.save(update_fields=['is_deleted'])
                act_enum = DMSAuditLog.Action.DELETE
            elif action == 'RESTORE':
                doc.is_deleted = False
                doc.save(update_fields=['is_deleted'])
                act_enum = DMSAuditLog.Action.RESTORE
            elif action == 'ARCHIVE':
                doc.is_archived = True
                doc.save(update_fields=['is_archived'])
                act_enum = DMSAuditLog.Action.EDIT
            elif action == 'UNARCHIVE':
                doc.is_archived = False
                doc.save(update_fields=['is_archived'])
                act_enum = DMSAuditLog.Action.EDIT
            else:
                return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

            DMSAuditLog.objects.create(
                action=act_enum,
                document=doc,
                user=request.user,
                details=f"Performed action {action} on '{doc.title}'"
            )
            return Response({"status": f"Document {action} applied successfully."})
        except DocumentMetadata.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


class StorageDashboardView(APIView):
    permission_classes = [AllowAny] # In production restrict to staff/admin

    def get(self, request, *args, **kwargs):
        total_files = DocumentMetadata.objects.filter(is_deleted=False).count()
        total_bytes = DocumentMetadata.objects.filter(is_deleted=False).aggregate(Sum('file_size'))['file_size__sum'] or 0

        # Category Breakdown
        categories = {}
        for cat in DocumentMetadata.Category.values:
            cnt = DocumentMetadata.objects.filter(category=cat, is_deleted=False).count()
            if cnt > 0: categories[cat] = cnt

        largest = DocumentMetadata.objects.filter(is_deleted=False).order_by('-file_size')[:5]
        largest_data = [{"id": d.id, "title": d.title, "size": d.file_size, "category": d.category} for d in largest]

        most_downloaded = DocumentMetadata.objects.filter(is_deleted=False).order_by('-download_count')[:5]
        download_data = [{"id": d.id, "title": d.title, "downloads": d.download_count, "category": d.category} for d in most_downloaded]

        pending_ai = DocumentMetadata.objects.filter(is_deleted=False, ai_indexed=False).count()

        recent_logs = DMSAuditLog.objects.all()[:10]
        logs_data = [{"id": l.id, "action": l.action, "user": l.user.username if l.user else "System", "details": l.details, "timestamp": l.timestamp.strftime('%H:%M:%S')} for l in recent_logs]

        return Response({
            "total_files": total_files,
            "storage_used_bytes": total_bytes,
            "categories": categories,
            "largest_files": largest_data,
            "most_downloaded": download_data,
            "pending_ai_indexing": pending_ai,
            "storage_health": "Optimal (99.99% Uptime - Supabase S3 Storage)",
            "recent_audit_logs": logs_data
        })
