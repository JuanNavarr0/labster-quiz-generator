"""
Document processing utilities for the RAG system.

This module provides functions to:
1. Extract text from PDF files
2. Clean and preprocess the extracted text
3. Split text into manageable chunks for embedding
4. Extract metadata from documents
"""

import os
import re
import PyPDF2
from typing import List, Dict, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Process PDF documents for the RAG system."""
    
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 200):
        """
        Initialize the document processor.
        
        Args:
            chunk_size: The target size of text chunks in characters
            chunk_overlap: The overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text as a string
        """
        try:
            logger.info(f"Extracting text from {file_path}")
            text = ""
            
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                num_pages = len(reader.pages)
                
                for page_num in range(num_pages):
                    page = reader.pages[page_num]
                    page_text = page.extract_text() or ""
                    text += page_text + "\n\n"
                    
                    # Log progress for large documents
                    if page_num % 50 == 0 and page_num > 0:
                        logger.info(f"Processed {page_num}/{num_pages} pages from {os.path.basename(file_path)}")
            
            logger.info(f"Completed extraction of {num_pages} pages from {os.path.basename(file_path)}")
            return text
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise
    
    def clean_text(self, text: str) -> str:
        """
        Clean extracted text by removing noise and formatting issues.
        
        Args:
            text: Raw text extracted from PDF
            
        Returns:
            Cleaned text
        """
        # Replace multiple newlines with double newlines to preserve paragraph structure
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove header/footer patterns
        text = re.sub(r'Page \d+ of \d+', '', text)
        
        # Remove footnote markers
        text = re.sub(r'\[\d+\]', '', text)
        
        # Clean up excessive whitespace within lines
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Remove empty lines
        text = re.sub(r'\n[ \t]*\n', '\n\n', text)
        
        return text.strip()
    
    def split_into_chunks(self, text: str, include_headings: bool = True) -> List[Dict[str, str]]:
        """
        Split text into overlapping chunks suitable for embedding.
        
        Args:
            text: Cleaned text to split
            include_headings: Whether to detect and include headings with chunks
            
        Returns:
            List of dictionaries with chunk text and metadata
        """
        chunks = []
        
        # Step 1: Split text into paragraphs
        paragraphs = text.split('\n\n')
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        if not paragraphs:
            logger.warning("No paragraphs found in text")
            return []
        
        # Step 2: Identify potential headings
        is_heading = []
        headings = []
        current_heading = ""
        
        for i, para in enumerate(paragraphs):
            if self._is_heading(para):
                is_heading.append(True)
                headings.append(para)
                current_heading = para
            else:
                is_heading.append(False)
                headings.append(current_heading)
        
        # Step 3: Create chunks with appropriate size
        current_chunk = ""
        current_chunk_headings = set()
        current_length = 0
        
        for i, para in enumerate(paragraphs):
            # If this is a heading, store it and continue to next paragraph
            if is_heading[i]:
                if current_length > 0:
                    current_chunk_headings.add(para)
                continue
            
            para_len = len(para)
            
            # If adding this paragraph would exceed chunk size and we already have content
            if current_length + para_len > self.chunk_size and current_length > 0:
                # Store the current chunk
                chunks.append({
                    "text": current_chunk.strip(),
                    "heading": "; ".join(current_chunk_headings) if current_chunk_headings else ""
                })
                
                # Reset for next chunk, with overlap
                current_chunk = ""
                current_length = 0
                
                # Preserve the most recent heading for context
                if headings[i]:
                    current_chunk_headings = {headings[i]}
                else:
                    current_chunk_headings = set()
            
            # Add the paragraph to the current chunk
            if current_chunk:
                current_chunk += "\n\n" + para
            else:
                current_chunk = para
            
            current_length += para_len
            
            # Add the heading for this paragraph if it exists
            if headings[i] and headings[i] not in current_chunk_headings:
                current_chunk_headings.add(headings[i])
        
        # Add the final chunk if it has content
        if current_chunk.strip():
            chunks.append({
                "text": current_chunk.strip(),
                "heading": "; ".join(current_chunk_headings) if current_chunk_headings else ""
            })
        
        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks
    
    def _is_heading(self, text: str) -> bool:
        """
        Determine if a paragraph is likely a heading.
        
        Args:
            text: Paragraph text
            
        Returns:
            Boolean indicating if text is likely a heading
        """
        # Skip empty text
        if not text.strip():
            return False
            
        # Simple heuristics for heading detection
        text = text.strip()
        
        # Short text ending without punctuation often indicates a heading
        if len(text) < 100 and not text.endswith(('.', '?', '!', ',')):
            return True
            
        # Check for chapter/section patterns
        if re.match(r'^(Chapter|Section|CHAPTER|SECTION)\s+\d+', text):
            return True
            
        # Check for numbered sections (e.g., "1.2 Physics Concepts")
        if re.match(r'^\d+(\.\d+)*\s+[A-Z]', text):
            return True
        
        # Check for all-caps titles (common in textbooks)
        if text.isupper() and len(text) < 80:
            return True
            
        return False
    
    def process_document(self, file_path: str) -> Tuple[List[Dict[str, str]], Dict[str, str]]:
        """
        Process a document end-to-end: extract, clean, split and gather metadata.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Tuple of (chunks, metadata)
        """
        # Extract metadata from filename
        filename = os.path.basename(file_path)
        metadata = self._extract_metadata(filename)
        
        # Process text
        raw_text = self.extract_text_from_pdf(file_path)
        clean_text = self.clean_text(raw_text)
        chunks = self.split_into_chunks(clean_text)
        
        # Add metadata to each chunk
        for chunk in chunks:
            chunk.update(metadata)
        
        return chunks, metadata
    
    def _extract_metadata(self, filename: str) -> Dict[str, str]:
        """
        Extract metadata from filename.
        
        Args:
            filename: Name of the file
            
        Returns:
            Dictionary of metadata
        """
        # Remove file extension
        name = os.path.splitext(filename)[0]
        
        # Identify subject area based on filename
        subject = "unknown"
        
        if "Biology" in name:
            subject = "biology"
        elif "Chemistry" in name or "Organic" in name:
            subject = "chemistry"
        elif "Physics" in name:
            subject = "physics"
        elif "Anatomy" in name or "Physiology" in name:
            subject = "medicine"
        elif "Microbiology" in name:
            subject = "microbiology"
        
        return {
            "source": name,
            "subject": subject,
            "filename": filename
        }