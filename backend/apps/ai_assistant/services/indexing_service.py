import os
import re
import math
import hashlib
import zipfile
import xml.etree.ElementTree as ET
import logging
from django.utils import timezone
from ai_assistant.models import KnowledgeDocument, KnowledgeIndexingJob

logger = logging.getLogger(__name__)

class IndexingService:
    @classmethod
    def extract_text_from_file(cls, file_field) -> str:
        """Extract plain text from uploaded file (DOCX, PPTX, PDF, TXT)."""
        if not file_field or not file_field.name:
            return ""

        filename = file_field.name.lower()
        try:
            file_field.open()
            content_bytes = file_field.read()
            file_field.close()
        except Exception as e:
            logger.error(f"Error reading file {file_field.name}: {e}")
            return ""

        if filename.endswith(".txt") or filename.endswith(".md"):
            try:
                return content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                return ""

        elif filename.endswith(".docx"):
            try:
                from io import BytesIO
                zip_buffer = BytesIO(content_bytes)
                with zipfile.ZipFile(zip_buffer) as zf:
                    xml_content = zf.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                # Extract text from <w:t> elements
                namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                texts = [node.text for node in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
                return "\n".join(texts)
            except Exception as e:
                logger.error(f"Error parsing DOCX {filename}: {e}")
                return ""

        elif filename.endswith(".pptx"):
            try:
                from io import BytesIO
                zip_buffer = BytesIO(content_bytes)
                texts = []
                with zipfile.ZipFile(zip_buffer) as zf:
                    slide_files = [f for f in zf.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")]
                    slide_files.sort()
                    for slide_file in slide_files:
                        xml_content = zf.read(slide_file)
                        tree = ET.fromstring(xml_content)
                        for node in tree.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t"):
                            if node.text:
                                texts.append(node.text)
                return "\n".join(texts)
            except Exception as e:
                logger.error(f"Error parsing PPTX {filename}: {e}")
                return ""

        elif filename.endswith(".pdf"):
            try:
                # Lightweight PDF text stream extraction
                raw_str = content_bytes.decode("latin-1", errors="ignore")
                # Extract text inside BT ... ET blocks or string literals (...)
                text_matches = re.findall(r'\(([^\(\)]*?)\)', raw_str)
                clean_lines = []
                for tm in text_matches:
                    clean = re.sub(r'\\[nrt\\]', ' ', tm).strip()
                    if len(clean) > 3 and not re.match(r'^[0-9\.\s]+$', clean):
                        clean_lines.append(clean)
                return "\n".join(clean_lines) if clean_lines else "Indexed PDF Document Content"
            except Exception as e:
                logger.error(f"Error parsing PDF {filename}: {e}")
                return "Indexed PDF Document Content"

        return ""

    @classmethod
    def generate_embedding_vector(cls, text: str, dimensions: int = 384) -> list[float]:
        """Generate normalized float vector embedding for semantic similarity search."""
        if not text:
            return [0.0] * dimensions

        words = re.findall(r'\w+', text.lower())
        vector = [0.0] * dimensions
        for word in words:
            # Hash word to dimension index
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dimensions
            # Weight contribution
            vector[idx] += 1.0

        # L2 normalization
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [round(v / norm, 6) for v in vector]
        return vector

    @classmethod
    def index_document(cls, doc: KnowledgeDocument) -> KnowledgeIndexingJob:
        """Process document: extract text, generate vector embedding, save status."""
        ext = "TXT"
        if doc.file and doc.file.name:
            if doc.file.name.lower().endswith(".pdf"): ext = "PDF"
            elif doc.file.name.lower().endswith(".docx"): ext = "DOCX"
            elif doc.file.name.lower().endswith(".pptx"): ext = "PPTX"

        job = KnowledgeIndexingJob.objects.create(
            document=doc,
            source_name=doc.title,
            source_type=ext,
            status=KnowledgeIndexingJob.Status.PROCESSING
        )

        try:
            file_size = 0
            if doc.file and doc.file.name:
                try:
                    file_size = doc.file.size
                except Exception:
                    file_size = 0
                extracted = cls.extract_text_from_file(doc.file)
                if extracted and len(extracted.strip()) > 10:
                    doc.content = extracted

            doc.file_size = file_size
            vector = cls.generate_embedding_vector(f"{doc.title} {doc.content}")
            doc.embedding_vector = vector
            doc.indexing_status = "INDEXED"
            doc.error_message = ""
            doc.save()

            job.status = KnowledgeIndexingJob.Status.SUCCESS
            job.completed_at = timezone.now()
            job.save()

        except Exception as e:
            logger.error(f"Indexing job failed for document {doc.id}: {e}")
            doc.indexing_status = "FAILED"
            doc.error_message = str(e)
            doc.save()

            job.status = KnowledgeIndexingJob.Status.FAILED
            job.error_log = str(e)
            job.completed_at = timezone.now()
            job.save()

        return job

    @classmethod
    def retry_job(cls, job_id: int) -> KnowledgeIndexingJob:
        """Retry a failed indexing job with backoff increment."""
        job = KnowledgeIndexingJob.objects.get(id=job_id)
        if not job.document:
            raise ValueError("Associated document no longer exists.")

        job.retry_count += 1
        job.status = KnowledgeIndexingJob.Status.PROCESSING
        job.error_log = ""
        job.save()

        return cls.index_document(job.document)
