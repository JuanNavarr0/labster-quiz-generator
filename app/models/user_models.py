"""
User progress tracking models.

This module contains Pydantic models for user progress and learning history.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProgressSaveRequest(BaseModel):
    """
    Request model for saving user learning progress.
    """
    topic: str
    score: float = Field(..., ge=0, le=100)
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    notes: Optional[str] = None
    difficulty: str = "medium"
    time_spent: Optional[str] = None
    
class LearningHistoryItem(BaseModel):
    """
    Model for a single learning history item.
    """
    topic: str
    date: str
    score: float
    difficulty: str = "medium"
    time_spent: Optional[str] = None
    
class LearningHistory(BaseModel):
    """
    Model for the full learning history response.
    """
    history: List[LearningHistoryItem]
    
class LearningStats(BaseModel):
    """
    Model for user learning statistics.
    """
    completed_topics: int
    total_quizzes: int
    average_score: float
    topics_by_subject: Optional[dict] = None