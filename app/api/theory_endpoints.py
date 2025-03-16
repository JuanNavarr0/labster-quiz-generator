"""
Enhanced theory generation endpoints with scientific verification.

This module defines FastAPI endpoints for generating scientifically
verified theoretical summaries based on learning objectives.
"""

from fastapi import APIRouter, HTTPException
from app.models.quiz_models import TheoryRequest, TheoryResponse
from app.core.openai_client import generate_theory_text
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate_theory", response_model=TheoryResponse)
def generate_theory_endpoint(data: TheoryRequest):
    """
    POST endpoint that accepts a learning objective and returns a 
    scientifically verified theory summary.
    
    If the content cannot be fully verified against scientific
    reference materials, a warning is included.
    
    Args:
        data: TheoryRequest with learning_objective, difficulty, and format
        
    Returns:
        TheoryResponse with summary_text, optional warning, and metadata
    """
    # Log the incoming request
    logger.info(f"Generating theory for objective: {data.learning_objective}, difficulty: {data.difficulty}")
    
    # Generate theory with RAG verification
    result = generate_theory_text(
        data.learning_objective,
        difficulty=data.difficulty,
        format=data.format
    )

    # Handle error response
    if "error" in result and result["error"]:
        logger.error(f"Error generating theory: {result['error']}")
        raise HTTPException(status_code=500, detail=result["error"])

    # Extract content and warning
    summary_text = result.get("summary_text", "")
    warning = result.get("warning")
    metadata = result.get("metadata", {})
    
    # Log completion status
    if warning:
        logger.warning(f"Theory generated with warning: {warning}")
    else:
        logger.info(f"Theory generated successfully")
    
    # Return the response
    return TheoryResponse(
        summary_text=summary_text,
        warning=warning,
        metadata=metadata
    )