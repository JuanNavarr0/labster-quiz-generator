"""
This module defines FastAPI endpoints for generating quiz questions 
based on a learning objective.
"""

from fastapi import APIRouter, HTTPException
from app.models.quiz_models import QuizRequest, MultipleQuizResponse
from app.core.openai_client import generate_quiz_questions

router = APIRouter()

@router.post("/generate_quiz", response_model=MultipleQuizResponse)
def generate_quiz_endpoint(data: QuizRequest):
    """
    POST endpoint that accepts a learning objective and returns multiple
    multiple-choice questions (each with 4 options and 1 correct answer).
    """
    result = generate_quiz_questions(data.learning_objective, num_questions=5)

    if "error" in result and result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])

    raw_questions = result.get("questions", [])
    return MultipleQuizResponse(questions=raw_questions)
