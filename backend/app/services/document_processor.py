import re
import uuid
import io
from typing import List, Tuple, Optional
import pypdf
from ..models.schemas import DocumentMetadata, DocumentChunk

class DocumentProcessor:
    def __init__(self, max_chunk_words: int = 220, overlap_words: int = 40):
        self.max_chunk_words = max_chunk_words
        self.overlap_words = overlap_words

    def sanitize_untrusted_study_text(self, text: str) -> str:
        """Sanitizes text and removes null characters, keeping content untrusted."""
        if not text:
            return ""
        # Remove null bytes and non-printable control chars
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        return sanitized

    def extract_from_txt(self, content_bytes: bytes, filename: str) -> Tuple[str, List[Tuple[int, str]]]:
        """Extracts text from TXT or MD bytes. Returns (full_text, [(page_num, text)])."""
        try:
            full_text = content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            try:
                full_text = content_bytes.decode('latin-1')
            except Exception as e:
                raise ValueError(f"Unable to decode text file: {str(e)}")
        
        full_text = self.sanitize_untrusted_study_text(full_text)
        # TXT files are treated as 1 single logical page or split by form feed
        pages = full_text.split('\x0c')
        page_tuples = [(idx + 1, page.strip()) for idx, page in enumerate(pages) if page.strip()]
        if not page_tuples:
            page_tuples = [(1, full_text.strip())]
        return full_text, page_tuples

    def extract_from_pdf(self, content_bytes: bytes, filename: str) -> Tuple[str, List[Tuple[int, str]], bool]:
        """
        Extracts text from PDF bytes using pypdf.
        Returns (full_text, [(page_num, page_text)], is_scanned_or_empty)
        """
        stream = io.BytesIO(content_bytes)
        try:
            reader = pypdf.PdfReader(stream)
        except Exception as e:
            raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")

        page_tuples = []
        total_text_list = []
        total_pages = len(reader.pages)

        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""
            clean_text = self.sanitize_untrusted_study_text(page_text).strip()
            page_tuples.append((i + 1, clean_text))
            if clean_text:
                total_text_list.append(clean_text)

        full_text = "\n\n".join(total_text_list)
        
        # Check if scanned or image-only PDF
        avg_chars_per_page = (len(full_text) / max(total_pages, 1))
        is_scanned = total_pages > 0 and avg_chars_per_page < 30
        
        return full_text, page_tuples, is_scanned

    def chunk_document(
        self,
        doc_id: str,
        filename: str,
        pages: List[Tuple[int, str]]
    ) -> List[DocumentChunk]:
        """
        Splits pages into structured, overlapping chunks with section titles and page numbers.
        """
        chunks: List[DocumentChunk] = []

        for page_num, text in pages:
            if not text.strip():
                continue

            # Detect sections by markdown headers or all-caps headings
            raw_paragraphs = re.split(r'\n{2,}', text)
            current_section = "General Overview"
            
            accumulated_words = []
            chunk_start_char = 0

            for para in raw_paragraphs:
                para = para.strip()
                if not para:
                    continue

                # Check if paragraph is a section header (e.g. ## Section or SECTION TITLE)
                header_match = re.match(r'^(?:#{1,4}\s+|[0-9]+\.\s+)?([A-Z][A-Za-z0-9\s\-_:]{3,50})$', para)
                if header_match and len(para.split()) < 10:
                    current_section = header_match.group(1).strip()

                words = para.split()
                if len(accumulated_words) + len(words) <= self.max_chunk_words:
                    accumulated_words.extend(words)
                else:
                    # Flush current chunk
                    chunk_text = " ".join(accumulated_words)
                    if chunk_text.strip():
                        chunks.append(
                            DocumentChunk(
                                id=str(uuid.uuid4()),
                                doc_id=doc_id,
                                source_filename=filename,
                                page_number=page_num,
                                section_title=current_section,
                                content=chunk_text,
                                start_char=chunk_start_char,
                                end_char=chunk_start_char + len(chunk_text)
                            )
                        )
                    # Maintain sliding window overlap
                    overlap = accumulated_words[-self.overlap_words:] if len(accumulated_words) > self.overlap_words else accumulated_words
                    accumulated_words = overlap + words
                    chunk_start_char += len(chunk_text)

            if accumulated_words:
                chunk_text = " ".join(accumulated_words)
                chunks.append(
                    DocumentChunk(
                        id=str(uuid.uuid4()),
                        doc_id=doc_id,
                        source_filename=filename,
                        page_number=page_num,
                        section_title=current_section,
                        content=chunk_text,
                        start_char=chunk_start_char,
                        end_char=chunk_start_char + len(chunk_text)
                    )
                )

        return chunks

document_processor = DocumentProcessor()
