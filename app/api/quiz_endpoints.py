"""
Enhanced quiz generation endpoints with scientific verification.

This module defines FastAPI endpoints for generating scientifically
verified quiz questions based on a learning objective.
"""

from fastapi import APIRouter, HTTPException
from app.models.quiz_models import QuizRequest, MultipleQuizResponse
from app.core.openai_client import generate_quiz_questions
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate_quiz", response_model=MultipleQuizResponse)
def generate_quiz_endpoint(data: QuizRequest):
    """
    POST endpoint that accepts a learning objective and returns multiple
    multiple-choice questions with scientific verification.
    
    Each question has 4 options and 1 correct answer. If scientific
    content can't be fully verified, a warning is included.
    
    Args:
        data: QuizRequest with learning_objective, difficulty, and num_questions
        
    Returns:
        MultipleQuizResponse with questions and optional warning
    """
    # Log the incoming request
    logger.info(f"Generating quiz for objective: {data.learning_objective}, difficulty: {data.difficulty}")
    
    # Generate quiz questions with RAG verification
    result = generate_quiz_questions(
        data.learning_objective, 
        num_questions=data.num_questions,
        difficulty=data.difficulty,
        include_explanations=True
    )

    # Handle error response
    if "error" in result and result["error"]:
        logger.error(f"Error generating quiz: {result['error']}")
        raise HTTPException(status_code=500, detail=result["error"])

    # Extract questions and warning
    raw_questions = result.get("questions", [])
    warning = result.get("warning")
    metadata = result.get("metadata", {})
    
    # Log completion status
    if warning:
        logger.warning(f"Quiz generated with warning: {warning}")
    else:
        logger.info(f"Quiz generated successfully with {len(raw_questions)} questions")
    
    # Return the response
    return MultipleQuizResponse(
        questions=raw_questions,
        warning=warning,
        metadata=metadata
    )