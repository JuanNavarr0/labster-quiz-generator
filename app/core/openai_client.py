"""
Enhanced OpenAI client module with RAG integration.
 
This module manages communication with the OpenAI API
and leverages the RAG system for scientific content verification.

Features:
- Dynamic prompt construction based on difficulty level
- Enhanced content formatting with HTML and markdown support
- Scientific content verification with source attribution
"""
 
import openai
import json
import logging
from openai import chat
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from app.core.config import settings
from app.core.rag_system import rag_system

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
 
# Set the API key from settings
openai.api_key = settings.OPENAI_API_KEY

def generate_theory_text(
    learning_objective: str, 
    difficulty: str = "medium", 
    format: str = "html",
    enhanced_context = None
) -> dict:
    """
    Generate a theoretical explanation with scientific verification.
    
    Uses the RAG system to retrieve relevant context and verify scientific accuracy.
    
    Args:
        learning_objective: The learning objective to explain
        difficulty: Level of complexity (easy, medium, hard)
        format: Output format (html or markdown)
        enhanced_context: Optional pre-retrieved context
        
    Returns:
        Dict with summary_text (formatted content) and optional warning
    """
    # Verify scientific content using RAG if not provided
    verification = enhanced_context.verification if enhanced_context else rag_system.verify_scientific_content(learning_objective)
    
    # Retrieve context if not provided
    context = enhanced_context if enhanced_context else rag_system.retrieve_context(learning_objective)
    
    # Adjust complexity based on difficulty
    detail_level = {
        "easy": "Explain core concepts in simple terms with basic examples. Use clear, straightforward language. Avoid complex terminology. Target first-year students with no prior knowledge.",
        "medium": "Cover main concepts with moderate depth and some detailed examples. Include important terminology and provide explanations of terms when first introduced. Target intermediate students with some background.",
        "hard": "Provide in-depth explanations with advanced concepts. Include technical terminology and nuanced details. Focus on edge cases and exceptions. Target advanced students or professionals in the field."
    }.get(difficulty, "Cover main concepts with moderate depth and some detailed examples.")
    
    # Adjust word count based on difficulty
    word_count = {
        "easy": "250-350",
        "medium": "350-500",
        "hard": "450-700"
    }.get(difficulty, "350-500")
    
    # Adjust context depth based on difficulty
    context_depth = {
        "easy": 1,  # Use fewer chunks for easier content
        "medium": 2,
        "hard": 3   # Use more chunks for harder content
    }.get(difficulty, 2)
    
    # Format instructions based on requested format
    format_instructions = ""
    if format == "html":
        format_instructions = """
       Format the response using HTML tags for structure and engagement:
       - Use <h3> for section headings
       - Use <p> for paragraphs
       - Use <ul> and <li> for lists or schemes (e.g., steps or key points)
       - Use <blockquote> for scientific curiosities or standout facts
       - Use <div class="image-suggestion"> for suggesting where an image could go, with a brief description inside
        """
    else:  # markdown
        format_instructions = """
        Format the response using Markdown for structure and engagement:
        - Use ## for section headings
        - Use standard paragraphs with blank lines between them
        - Use * or - for bullet points in lists
        - Use > for blockquotes with scientific curiosities or standout facts
        - Use *Image suggestion:* in italics for suggesting where an image could go
        """
    
    # Create theory prompt with formatting instructions
    prompt = f"""
    You are an enthusiastic educator creating a theoretical explanation on the following topic:
    '{learning_objective}'
    
    IMPORTANT INSTRUCTIONS:
    1. {detail_level}
    2. Focus on clear explanations of concepts, principles, and processes
    3. Use a conversational tone, as if you're a passionate teacher talking to curious students
    4. {format_instructions}
    5. Include relatable analogies or real-world examples to make it engaging
    6. Add a scientific curiosity or historical fact related to the topic
    7. Keep it suitable for higher education students, between {word_count} words
    8. Do NOT include multiple choice questions or any quiz elements
    """
    
    # Add context from retrieved documents if available
    if verification.is_verified and context.chunks:
        prompt += "Base your explanation on these scientific references:\n\n"
        for i, chunk in enumerate(context.chunks[:context_depth + 1]):
            prompt += f"--- BEGIN REFERENCE ({chunk.source}) ---\n"
            if chunk.heading:
                prompt += f"{chunk.heading}\n"
            prompt += f"{chunk.text}\n"
            prompt += f"--- END REFERENCE ---\n\n"
    
    prompt += f"Now, provide a clear and engaging theoretical explanation about {learning_objective} in {format} format."

    # Adjust temperature based on difficulty
    temperature = {
        "easy": 0.6,  # More consistent, straightforward explanations
        "medium": 0.7, # Balanced creativity
        "hard": 0.8    # More variation for complex explanations
    }.get(difficulty, 0.7)
    
    try:
        # Call OpenAI with the appropriate prompt
        response = chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,  # Increased for more detailed content
            temperature=temperature
        )
        summary_content = response.choices[0].message.content.strip()
        
        # Return the content with metadata
        result = {"summary_text": summary_content}
        if not verification.is_verified or verification.warning_message:
            result["warning"] = verification.warning_message
            
        # Add basic metadata
        result["metadata"] = {
            "difficulty": difficulty,
            "related_topics": generate_related_topics(learning_objective, 3)
        }
            
        return result
 
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return {
            "error": str(e),
            "summary_text": ""
        }

def generate_quiz_questions(
    learning_objective: str, 
    num_questions: int = 5,
    difficulty: str = "medium",
    include_explanations: bool = True
) -> dict:
    """
    Generate scientifically verified quiz questions based on the learning objective.
    
    Args:
        learning_objective: The topic to generate questions about
        num_questions: How many MCQs to generate
        difficulty: Level of complexity (easy, medium, hard)
        include_explanations: Whether to include explanations for answers
        
    Returns:
        Dict with questions array and optional warning
    """
    # Verify scientific content first
    verification = rag_system.verify_scientific_content(learning_objective)
    
    # Retrieve relevant context but adapt to difficulty
    context = rag_system.retrieve_context(learning_objective)
    
    # Adjust complexity based on difficulty
    question_complexity = {
        "easy": "Focus on basic recall and fundamental understanding. Use straightforward language with core concepts only. Questions should be suitable for beginners. Keep vocabulary simple.",
        "medium": "Include questions that test both recall and application of concepts. Mix straightforward and moderately complex questions. Use standard terminology.",
        "hard": "Create challenging questions that test deep understanding, application, and analysis. Include some questions that require connecting multiple concepts. Use advanced terminology and test edge cases. Questions should challenge even subject matter experts."
    }.get(difficulty, "Include questions that test both recall and application of concepts.")
    
    # Adjust prompt content depth based on difficulty
    context_depth = {
        "easy": 1,  # Use fewer chunks for easier questions
        "medium": 2,
        "hard": 3   # Use more chunks for harder questions
    }.get(difficulty, 2)
    
    # Define response format with or without explanations
    explanation_instruction = ""
    response_format = ""
    
    if include_explanations:
        explanation_instruction = "- Include a brief explanation for why the correct answer is right and the others are wrong"
        response_format = """
        [
          {
            "question": "...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option X",
            "explanation": "Explanation of why the correct answer is right and others are wrong"
          },
          ...
        ]
        """
    else:
        response_format = """
        [
          {
            "question": "...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option X"
          },
          ...
        ]
        """
    
    # Build prompt with or without context
    if verification.is_verified and context.chunks:
        # Create enhanced prompt with scientific context
        prompt = f"""
        You are a professional quiz maker creating scientifically accurate questions.
        
        IMPORTANT: Base your content on the following reference materials:
        """
        
        # Add context from top chunks, but number of chunks depends on difficulty
        for i, chunk in enumerate(context.chunks[:context_depth + 1]):
            prompt += f"\n--- BEGIN REFERENCE ({chunk.source}) ---\n"
            if chunk.heading:
                prompt += f"{chunk.heading}\n"
            prompt += f"{chunk.text}\n"
            prompt += f"--- END REFERENCE ---\n"
        
        prompt += f"""
        Generate {num_questions} multiple-choice questions about this learning objective:
        '{learning_objective}'
        
        Difficulty level: {difficulty}
        {question_complexity}
        
        Each question should:
        - Be scientifically accurate and based on the reference materials
        - Have exactly 4 options (A, B, C, D)
        - Have only one correct answer
        {explanation_instruction}
        - For {difficulty} difficulty questions, ensure that:
          - {"Options are clearly distinct and straightforward" if difficulty == "easy" else ""}
          - {"Distractors (wrong options) are plausible but clearly incorrect upon careful reading" if difficulty == "medium" else ""}
          - {"Distractors include common misconceptions and are highly plausible" if difficulty == "hard" else ""}
        
        Return them in valid JSON format with this structure:
        {response_format}
        
        Do not include any text outside the JSON array.
        """
    else:
        # Fallback to basic prompt without scientific context
        prompt = f"""
        You are a professional quiz maker. Generate {num_questions} multiple-choice questions
        about the following learning objective: '{learning_objective}'.
        
        Difficulty level: {difficulty}
        {question_complexity}
        
        Each question should:
        - Be scientifically accurate
        - Have exactly 4 options
        - Have only one correct answer
        {explanation_instruction}
        - For {difficulty} difficulty questions, ensure that:
          - {"Options are clearly distinct and straightforward" if difficulty == "easy" else ""}
          - {"Distractors (wrong options) are plausible but clearly incorrect upon careful reading" if difficulty == "medium" else ""}
          - {"Distractors include common misconceptions and are highly plausible" if difficulty == "hard" else ""}
        
        Return them in valid JSON format with the following structure:
        {response_format}
        
        Do not include any additional keys or text outside of this JSON array.
        """

    # Adjust temperature based on difficulty
    temperature = {
        "easy": 0.5,  # More consistent, straightforward questions
        "medium": 0.7, # Balanced creativity
        "hard": 0.8    # More variation for complex questions
    }.get(difficulty, 0.7)
 
    try:
        # Call OpenAI with the appropriate prompt
        response = chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,  # Increased for explanations
            temperature=temperature
        )
        raw_content = response.choices[0].message.content
 
        # Parse JSON
        questions_list = json.loads(raw_content)
 
        # Return questions with warning if needed
        result = {"questions": questions_list}
        if not verification.is_verified or verification.warning_message:
            result["warning"] = verification.warning_message
            
        # Add metadata about the quiz
        result["metadata"] = {
            "difficulty": difficulty,
            "question_count": len(questions_list),
            "generated_at": datetime.now().isoformat(),
            "has_explanations": include_explanations
        }
            
        return result
 
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return {"error": str(e)}

def generate_related_topics(learning_objective: str, count: int = 3) -> List[str]:
    """
    Generate related learning topics that complement the current objective.
    
    Args:
        learning_objective: The current learning objective
        count: Number of related topics to generate
        
    Returns:
        List of related topic strings
    """
    prompt = f"""
    You are an educational content expert. Based on the learning objective:
    '{learning_objective}'
    
    Generate {count} closely related learning topics that would complement or extend 
    understanding of this subject. Each topic should be specific enough to 
    be studied as a separate learning objective, but clearly connected to the main topic.
    
    Return only the list of topics, one per line, with no numbering or additional text.
    """
    
    try:
        response = chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        
        # Process the response into a clean list
        content = response.choices[0].message.content.strip()
        topics = [topic.strip() for topic in content.split('\n') if topic.strip()]
        
        # Limit to requested count
        return topics[:count]
        
    except Exception as e:
        logger.error(f"Error generating related topics: {str(e)}")
        return ["DNA Structure", "Cell Division Overview", "Genetics Fundamentals"]