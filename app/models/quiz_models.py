"""
This module contains Pydantic models to validate and structure the
request and response data for the quiz endpoints.
"""

from pydantic import BaseModel
from typing import List

class QuizRequest(BaseModel):
    """
    Represents the incoming request that contains the learning objective
    from which we generate quiz questions.
    """
    learning_objective: str

class SingleQuizItem(BaseModel):
    """
    A single MCQ item with a question, a list of options, and a correct answer.
    """
    question: str
    options: List[str]
    correct_answer: str

class MultipleQuizResponse(BaseModel):
    """
    Represents the response for multiple quiz questions.
    """
    questions: List[SingleQuizItem]
