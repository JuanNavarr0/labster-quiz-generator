"""
User progress tracking endpoints.

This module defines FastAPI endpoints for saving and retrieving user learning progress.
"""

from fastapi import APIRouter, HTTPException
from app.models.user_models import (
    ProgressSaveRequest, 
    LearningHistory, 
    LearningHistoryItem,
    LearningStats
)
import logging
import json
import os
from typing import List
from datetime import datetime
from collections import defaultdict

# Configure logging
logger = logging.getLogger(__name__)

# Simple file-based storage for demo purposes
PROGRESS_FILE = "data/user_progress.json"

# Ensure data directory exists
os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)

router = APIRouter()

def get_progress_data() -> List[dict]:
    """
    Helper function to get progress data from file.
    
    Returns:
        List of progress dictionaries
    """
    if not os.path.exists(PROGRESS_FILE):
        # Create empty file if it doesn't exist
        with open(PROGRESS_FILE, 'w') as f:
            json.dump([], f)
        return []
    
    try:
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error reading progress file: {str(e)}")
        return []

def save_progress_data(progress_list: List[dict]) -> bool:
    """
    Helper function to save progress data to file.
    
    Args:
        progress_list: List of progress dictionaries
        
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(progress_list, f, indent=2)
        return True
    except (IOError, TypeError) as e:
        logger.error(f"Error saving progress file: {str(e)}")
        return False

@router.post("/save_progress")
def save_progress(data: ProgressSaveRequest):
    """
    Save user learning progress for a topic.
    
    Args:
        data: ProgressSaveRequest containing topic, score, etc.
        
    Returns:
        Success message
    """
    # Add timestamp if time_spent not provided
    if not data.time_spent:
        data.time_spent = datetime.now().strftime("%H:%M:%S")
    
    # Get existing progress data
    progress_list = get_progress_data()
    
    # Add new progress item
    progress_list.append(data.dict())
    
    # Save updated list
    if save_progress_data(progress_list):
        return {"message": "Progress saved successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save progress")

@router.get("/learning_history", response_model=LearningHistory)
def get_learning_history():
    """
    Get user's learning history.
    
    Returns:
        LearningHistory with list of history items
    """
    # Get progress data
    progress_list = get_progress_data()
    
    # Convert to model
    history_items = [
        LearningHistoryItem(**item) for item in progress_list
    ]
    
    # Sort by date (newest first)
    history_items.sort(key=lambda x: x.date, reverse=True)
    
    return LearningHistory(history=history_items)

@router.get("/learning_stats")
def get_learning_stats():
    """
    Get user's learning statistics.
    
    Returns:
        LearningStats with aggregated statistics
    """
    # Get progress data
    progress_list = get_progress_data()
    
    # Calculate statistics
    total_quizzes = len(progress_list)
    
    # Count unique topics
    topics = set(item["topic"] for item in progress_list)
    completed_topics = len(topics)
    
    # Calculate average score
    if total_quizzes > 0:
        average_score = sum(item["score"] for item in progress_list) / total_quizzes
    else:
        average_score = 0
    
    # Categorize topics by subject
    topics_by_subject = defaultdict(int)
    
    # Simple categorization based on keywords
    for item in progress_list:
        topic = item["topic"].lower()
        if any(kw in topic for kw in ["chemical", "reaction", "atom", "molecule", "acid", "base"]):
            topics_by_subject["chemistry"] += 1
        elif any(kw in topic for kw in ["cell", "dna", "protein", "mitosis", "organism", "pcr"]):
            topics_by_subject["biology"] += 1
        elif any(kw in topic for kw in ["force", "motion", "energy", "newton", "electric", "magnetic"]):
            topics_by_subject["physics"] += 1
        elif any(kw in topic for kw in ["heart", "nerve", "brain", "respiratory", "disease", "organ"]):
            topics_by_subject["medicine"] += 1
        else:
            topics_by_subject["other"] += 1
    
    return {
        "completed_topics": completed_topics,
        "total_quizzes": total_quizzes,
        "average_score": round(average_score, 1),
        "topics_by_subject": dict(topics_by_subject)
    }