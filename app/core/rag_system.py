"""
Core RAG (Retrieval-Augmented Generation) system implementation.

This module implements:
1. Vector embedding of text chunks using sentence-transformers
2. Efficient similarity search using FAISS
3. Context retrieval based on user queries
4. Scientific content verification
"""

import os
import json
import numpy as np
import faiss
from typing import List, Dict, Tuple, Optional, Any
import logging
from sentence_transformers import SentenceTransformer
from app.models.rag_models import TextChunk, RetrievedContext, VerificationResult
import time

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RAGSystem:
    """Implements the Retrieval-Augmented Generation system."""
    
    def __init__(self, 
                index_path: str = "data/vector_index",
                chunk_data_path: str = "data/chunks.json",
                model_name: str = "all-MiniLM-L6-v2",
                dimension: int = 384,
                load_on_init: bool = True):
        """
        Initialize the RAG system.
        
        Args:
            index_path: Path to the FAISS index file
            chunk_data_path: Path to the chunk metadata JSON file
            model_name: Sentence transformer model to use for embeddings
            dimension: Embedding dimension
            load_on_init: Whether to load index on initialization
        """
        # Make paths absolute if they're relative
        if not os.path.isabs(index_path):
            # Get the project root directory (where app directory is)
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            index_path = os.path.join(project_root, index_path)
            logger.info(f"Using absolute index path: {index_path}")
            
        if not os.path.isabs(chunk_data_path):
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            chunk_data_path = os.path.join(project_root, chunk_data_path)
            logger.info(f"Using absolute chunks path: {chunk_data_path}")
            
        self.index_path = index_path
        self.chunk_data_path = chunk_data_path
        self.model_name = model_name
        self.dimension = dimension
        
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        os.makedirs(os.path.dirname(chunk_data_path), exist_ok=True)
        
        # Initialize embedding model
        logger.info(f"Loading sentence transformer model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        # Initialize FAISS index
        self.index = None
        self.chunks = []
        
        if load_on_init:
            self.load_index()
    
    def load_index(self) -> bool:
        """
        Load the FAISS index and chunk metadata from disk.
        
        Returns:
            Boolean indicating success
        """
        try:
            # Load FAISS index if it exists
            if os.path.exists(self.index_path):
                logger.info(f"Loading FAISS index from {self.index_path}")
                self.index = faiss.read_index(self.index_path)
                
                # Load chunk metadata
                if os.path.exists(self.chunk_data_path):
                    logger.info(f"Loading chunk data from {self.chunk_data_path}")
                    with open(self.chunk_data_path, 'r') as f:
                        self.chunks = json.load(f)
                    
                    logger.info(f"Loaded {len(self.chunks)} chunks and index with {self.index.ntotal} vectors")
                    return True
                else:
                    logger.warning(f"Chunk data file not found: {self.chunk_data_path}")
            else:
                logger.warning(f"Index file not found: {self.index_path}")
                # Initialize empty index
                self._initialize_empty_index()
                
            return False
        except Exception as e:
            logger.error(f"Error loading index: {str(e)}")
            # Initialize empty index on error
            self._initialize_empty_index()
            return False
    
    def _initialize_empty_index(self):
        """Initialize an empty FAISS index."""
        logger.info(f"Initializing new empty index with dimension {self.dimension}")
        self.index = faiss.IndexFlatL2(self.dimension)  # L2 distance
        self.chunks = []
    
    def create_index(self, chunks: List[Dict[str, Any]]) -> bool:
        """
        Create a new FAISS index from the provided chunks.
        
        Args:
            chunks: List of text chunks with metadata
            
        Returns:
            Boolean indicating success
        """
        try:
            start_time = time.time()
            logger.info(f"Creating new index with {len(chunks)} chunks")
            
            # Initialize a new index
            self.index = faiss.IndexFlatL2(self.dimension)
            self.chunks = []
            
            # Process chunks in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                
                # Generate embeddings for the batch
                texts = [chunk["text"] for chunk in batch]
                embeddings = self.model.encode(texts, show_progress_bar=True)
                
                # Add embeddings to the index
                self.index.add(np.array(embeddings).astype('float32'))
                
                # Store chunk metadata (without embeddings to save space)
                for j, chunk in enumerate(batch):
                    # Create a unique ID for the chunk
                    chunk_id = f"chunk_{i + j}"
                    chunk_copy = {
                        "text": chunk["text"],
                        "heading": chunk.get("heading", ""),
                        "source": chunk.get("source", "unknown"),
                        "subject": chunk.get("subject", "unknown"),
                        "filename": chunk.get("filename", "unknown"),
                        "chunk_id": chunk_id
                    }
                    self.chunks.append(chunk_copy)
                
                logger.info(f"Processed {i + len(batch)}/{len(chunks)} chunks")
            
            # Save the index and metadata
            self._save_index()
            
            elapsed_time = time.time() - start_time
            logger.info(f"Index creation completed in {elapsed_time:.2f} seconds")
            return True
            
        except Exception as e:
            logger.error(f"Error creating index: {str(e)}")
            return False
    
    def _save_index(self) -> bool:
        """
        Save the FAISS index and chunk data to disk.
        
        Returns:
            Boolean indicating success
        """
        try:
            # Save FAISS index
            logger.info(f"Saving index with {self.index.ntotal} vectors to {self.index_path}")
            faiss.write_index(self.index, self.index_path)
            
            # Save chunk metadata
            logger.info(f"Saving {len(self.chunks)} chunks to {self.chunk_data_path}")
            with open(self.chunk_data_path, 'w') as f:
                json.dump(self.chunks, f)
                
            return True
        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
            return False
    
    def add_chunks(self, new_chunks: List[Dict[str, Any]]) -> bool:
        """
        Add new chunks to an existing index.
        
        Args:
            new_chunks: List of new text chunks with metadata
            
        Returns:
            Boolean indicating success
        """
        try:
            if self.index is None:
                logger.warning("No index loaded. Creating new index instead.")
                return self.create_index(new_chunks)
            
            start_time = time.time()
            logger.info(f"Adding {len(new_chunks)} new chunks to existing index")
            
            # Generate embeddings
            texts = [chunk["text"] for chunk in new_chunks]
            embeddings = self.model.encode(texts, show_progress_bar=True)
            
            # Add to index
            self.index.add(np.array(embeddings).astype('float32'))
            
            # Store chunk metadata
            base_id = len(self.chunks)
            for i, chunk in enumerate(new_chunks):
                chunk_id = f"chunk_{base_id + i}"
                chunk_copy = {
                    "text": chunk["text"],
                    "heading": chunk.get("heading", ""),
                    "source": chunk.get("source", "unknown"),
                    "subject": chunk.get("subject", "unknown"),
                    "filename": chunk.get("filename", "unknown"),
                    "chunk_id": chunk_id
                }
                self.chunks.append(chunk_copy)
            
            # Save updated index
            self._save_index()
            
            elapsed_time = time.time() - start_time
            logger.info(f"Added chunks in {elapsed_time:.2f} seconds")
            return True
            
        except Exception as e:
            logger.error(f"Error adding chunks: {str(e)}")
            return False
    
    def retrieve_context(self, query: str, top_k: int = 5, min_score: float = 0.7) -> RetrievedContext:
        """
        Retrieve relevant context for a query.
        
        Args:
            query: The query string
            top_k: Number of chunks to retrieve
            min_score: Minimum similarity score (0-1)
            
        Returns:
            RetrievedContext with relevant chunks and confidence scores
        """
        try:
            if self.index is None or not hasattr(self.index, 'ntotal') or self.index.ntotal == 0:
                logger.warning("No index available for retrieval")
                return RetrievedContext(
                    chunks=[],
                    relevance_scores=[],
                    overall_confidence=0.0
                )
            
            # Compute query embedding
            query_embedding = self.model.encode([query])[0]
            
            # Search for similar chunks
            scores, indices = self.index.search(
                np.array([query_embedding]).astype('float32'), 
                k=min(top_k, self.index.ntotal)
            )
            
            # Normalize scores to 0-1 range (lower distance = higher similarity)
            max_distance = 4.0  # Approximate maximum L2 distance for normalized embeddings
            normalized_scores = [max(0, 1 - (distance / max_distance)) for distance in scores[0]]
            
            # Filter by minimum score
            filtered_chunks = []
            filtered_scores = []
            
            for i, (idx, score) in enumerate(zip(indices[0], normalized_scores)):
                if score >= min_score and idx < len(self.chunks):
                    chunk_data = self.chunks[idx]
                    chunk = TextChunk(
                        text=chunk_data["text"],
                        heading=chunk_data.get("heading"),
                        source=chunk_data.get("source", "unknown"),
                        subject=chunk_data.get("subject", "unknown"),
                        filename=chunk_data.get("filename", "unknown"),
                        chunk_id=chunk_data.get("chunk_id", f"chunk_{idx}")
                    )
                    filtered_chunks.append(chunk)
                    filtered_scores.append(score)
            
            # Calculate overall confidence
            if filtered_scores:
                # Weight by position (earlier results matter more)
                weights = [1.0 / (i + 1) for i in range(len(filtered_scores))]
                weight_sum = sum(weights)
                overall_confidence = sum(score * weight / weight_sum 
                                        for score, weight in zip(filtered_scores, weights))
            else:
                overall_confidence = 0.0
            
            return RetrievedContext(
                chunks=filtered_chunks,
                relevance_scores=filtered_scores,
                overall_confidence=overall_confidence
            )
            
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return RetrievedContext(
                chunks=[],
                relevance_scores=[],
                overall_confidence=0.0
            )
    
    def verify_scientific_content(self, learning_objective: str) -> VerificationResult:
        """
        Verify if we have sufficient scientific content to answer accurately.
        
        Args:
            learning_objective: The learning objective to verify
            
        Returns:
            VerificationResult with confidence score and warning if needed
        """
        # Retrieve context for the learning objective
        context = self.retrieve_context(
            query=learning_objective,
            top_k=5,
            min_score=0.65  # Lower threshold for verification
        )
        
        # Extract subject areas from retrieved chunks
        subjects = [chunk.subject for chunk in context.chunks]
        
        # Decision logic for verification
        if context.overall_confidence >= 0.8:
            return VerificationResult(
                is_verified=True,
                confidence_score=context.overall_confidence,
                warning_message=None,
                relevant_subjects=subjects
            )
        elif context.overall_confidence >= 0.65:
            return VerificationResult(
                is_verified=True,
                confidence_score=context.overall_confidence,
                warning_message="Some content may not be fully verified due to limited reference material.",
                relevant_subjects=subjects
            )
        else:
            return VerificationResult(
                is_verified=False,
                confidence_score=context.overall_confidence,
                warning_message="Cannot guarantee scientific accuracy due to insufficient reference material.",
                relevant_subjects=subjects
            )
    
    def get_enhanced_prompt(self, learning_objective: str, context: Optional[RetrievedContext] = None) -> str:
        """
        Create an enhanced prompt with retrieved context for better accuracy.
        
        Args:
            learning_objective: The learning objective
            context: Optional pre-retrieved context
            
        Returns:
            Enhanced prompt string for OpenAI
        """
        if context is None:
            context = self.retrieve_context(learning_objective)
        
        # Format retrieved chunks as context
        context_text = ""
        for i, (chunk, score) in enumerate(zip(context.chunks, context.relevance_scores)):
            if i < 3:  # Limit to top 3 chunks to keep prompt size reasonable
                context_text += f"\n--- BEGIN REFERENCE MATERIAL (Source: {chunk.source}) ---\n"
                if chunk.heading:
                    context_text += f"Section: {chunk.heading}\n\n"
                context_text += f"{chunk.text}\n"
                context_text += f"--- END REFERENCE MATERIAL ---\n"
        
        # Build enhanced prompt
        enhanced_prompt = f"""
        You are an expert quiz creator for science education.
        
        IMPORTANT: Base your content on the following reference materials from peer-reviewed textbooks:
        {context_text}
        
        Create scientifically accurate multiple-choice questions about this learning objective:
        '{learning_objective}'
        
        Ensure all questions and answers are consistent with the provided reference materials.
        """
        
        return enhanced_prompt

# Initialize the singleton instance for global use - force loading on initialization
# First try explicit paths if relative ones don't work
try:
    import os
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    index_path = os.path.join(project_root, "data", "vector_index")
    chunk_data_path = os.path.join(project_root, "data", "chunks.json")
    
    if os.path.exists(index_path) and os.path.exists(chunk_data_path):
        logger.info(f"Initializing RAG system with absolute paths: {index_path}")
        rag_system = RAGSystem(
            index_path=index_path,
            chunk_data_path=chunk_data_path,
            load_on_init=True
        )
    else:
        logger.info("Initializing RAG system with default paths")
        rag_system = RAGSystem(load_on_init=True)
except Exception as e:
    logger.error(f"Error initializing RAG system: {str(e)}")
    rag_system = RAGSystem(load_on_init=True)