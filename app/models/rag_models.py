"""
Data models for the RAG system.

This module defines Pydantic models for the RAG system's inputs and outputs,
ensuring type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TextChunk(BaseModel):
    """Represents a chunk of text with its metadata."""
    
    text: str = Field(..., description="The text content of the chunk")
    embedding: Optional[List[float]] = Field(None, description="Vector embedding of the chunk")
    heading: Optional[str] = Field(None, description="Section heading associated with this chunk")
    source: str = Field(..., description="Source document name")
    subject: str = Field(..., description="Subject area (biology, physics, etc.)")
    filename: str = Field(..., description="Original filename")
    chunk_id: Optional[str] = Field(None, description="Unique identifier for the chunk")

class RetrievedContext(BaseModel):
    """Represents context retrieved from the RAG system."""
    
    chunks: List[TextChunk] = Field(..., description="Retrieved text chunks")
    relevance_scores: List[float] = Field(..., description="Relevance scores for each chunk")
    overall_confidence: float = Field(..., description="Overall confidence score (0-1)")
    
class VerificationResult(BaseModel):
    """Result of scientific verification."""
    
    is_verified: bool = Field(..., description="Whether the content is scientifically verified")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    warning_message: Optional[str] = Field(None, description="Warning message if not verified")
    relevant_subjects: List[str] = Field(default_factory=list, description="Relevant subject areas")

class EmbeddingRequest(BaseModel):
    """Request for text embedding."""
    
    text: str = Field(..., description="Text to embed")

class SearchRequest(BaseModel):
    """Request to search the vector database."""
    
    query: str = Field(..., description="Search query")
    top_k: int = Field(5, description="Number of results to return")
    min_score: float = Field(0.7, description="Minimum relevance score threshold")