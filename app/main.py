"""
main.py

Entry point of the FastAPI application with improved RAG initialization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import logging

from app.api.quiz_endpoints import router as quiz_router
from app.api.theory_endpoints import router as theory_router
from app.api.user_endpoints import router as user_router
from app.core.rag_system import rag_system

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI application
    """
    app = FastAPI(
        title="Labster Quiz Generator",
        description="Generates theoretical summaries and multiple-choice questions (MCQs) using OpenAI.",
        version="0.2.0"
    )

    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(theory_router, prefix="/theory", tags=["Theory"])
    app.include_router(quiz_router, prefix="/quiz", tags=["Quiz"])
    app.include_router(user_router, prefix="/user", tags=["User"])

    # Initialize RAG system explicitly
    @app.on_event("startup")
    async def startup_event():
        logger.info("Application starting up - initializing RAG system")
        
        # Force RAG system to load (with retry logic)
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            logger.info(f"Attempt {attempt} to load RAG index")
            
            # Try to load index
            success = rag_system.load_index()
            
            if success and rag_system.index is not None and hasattr(rag_system.index, 'ntotal'):
                logger.info(f"Successfully loaded RAG index with {rag_system.index.ntotal} vectors and {len(rag_system.chunks)} chunks")
                # Test retrieval
                test_query = "chemical reactions"
                context = rag_system.retrieve_context(test_query)
                logger.info(f"Test retrieval returned {len(context.chunks)} chunks with confidence {context.overall_confidence}")
                break
            else:
                logger.warning(f"Failed to load RAG index on attempt {attempt}")
                if attempt < max_attempts:
                    logger.info(f"Waiting 2 seconds before retry...")
                    time.sleep(2)
        
        if rag_system.index is None or not hasattr(rag_system.index, 'ntotal'):
            logger.error("Failed to load RAG index after multiple attempts")

    return app

app = create_app()

@app.get("/")
def read_root():
    """Root endpoint that returns a welcome message."""
    return {"message": "Welcome to the Labster Quiz Generator API!"}