"""
Enhanced Pydantic models for the quiz endpoints.

This module contains models to validate and structure the
request and response data for quiz generation, now including
scientific verification warnings and difficulty levels.
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class QuizRequest(BaseModel):
    """
    Represents the incoming request that contains the learning objective
    from which we generate quiz questions.
    """
    learning_objective: str
    difficulty: str = Field(
        default="medium", 
        description="Difficulty level of the quiz (easy, medium, hard)"
    )
    num_questions: int = Field(
        default=5,
        description="Number of questions to generate",
        ge=1,
        le=10
    )

class SingleQuizItem(BaseModel):
    """
    A single MCQ item with a question, a list of options, and a correct answer.
    """
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None

class MultipleQuizResponse(BaseModel):
    """
    Represents the response for multiple quiz questions,
    now with optional warning for scientific verification.
    """
    questions: List[SingleQuizItem]
    warning: Optional[str] = Field(
        None, 
        description="Warning message about scientific verification"
    )
    metadata: Optional[dict] = Field(
        None,
        description="Additional metadata about the quiz"
    )

class TheoryRequest(BaseModel):
    """
    Request model for theory generation.
    """
    learning_objective: str
    difficulty: str = Field(
        default="medium", 
        description="Difficulty level of the theory (easy, medium, hard)"
    )
    format: str = Field(
        default="html",
        description="Output format (html or markdown)"
    )

class TheoryResponse(BaseModel):
    """
    Response model for theory generation,
    including optional scientific verification warning.
    """
    summary_text: str
    warning: Optional[str] = Field(
        None, 
        description="Warning message about scientific verification"
    )
    metadata: Optional[dict] = Field(
        None,
        description="Additional metadata about the theory"
    )