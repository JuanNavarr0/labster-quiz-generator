"""
This module defines FastAPI endpoints for generating a brief theoretical summary
based on a learning objective.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.openai_client import generate_theory_text

router = APIRouter()

class TheoryRequest(BaseModel):
    learning_objective: str

class TheoryResponse(BaseModel):
    summary_text: str

@router.post("/generate_theory", response_model=TheoryResponse)
def generate_theory_endpoint(data: TheoryRequest):
    """
    POST endpoint that accepts a learning objective and returns a concise theory summary.

    :param data: An object with 'learning_objective' describing the topic
    :return: A brief theoretical explanation in summary_text
    """
    result = generate_theory_text(data.learning_objective)

    if "error" in result and result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])

    return TheoryResponse(summary_text=result["summary_text"])
