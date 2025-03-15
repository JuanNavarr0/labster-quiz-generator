"""
This module encapsulates the logic for communicating with the OpenAI API
using the newer interface introduced in openai>=1.0.0.
"""

import openai
from openai import chat
import json
from app.core.config import settings

# Set the API key once from our settings
openai.api_key = settings.OPENAI_API_KEY

def generate_theory_text(learning_objective: str) -> dict:
    """
    Calls the OpenAI API to generate a brief theoretical summary about the given learning objective.
    """
    prompt = f"""
    You are an expert teacher. Please provide a concise theoretical explanation
    (around 100-200 words) about the following topic:
    '{learning_objective}'.

    The text should be understandable for a higher education student.
    Output must be a plain text without JSON or bullet points, but well-structured paragraphs.
    """

    try:
        response = chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        summary_content = response.choices[0].message.content
        return {"summary_text": summary_content}

    except Exception as e:
        return {
            "error": str(e),
            "summary_text": ""
        }

def generate_quiz_questions(learning_objective: str, num_questions: int = 5) -> dict:
    """
    Calls OpenAI to generate multiple quiz questions at once in valid JSON format.

    Each question has:
      - question (string)
      - options (list of strings)
      - correct_answer (string)

    :param learning_objective: The topic to generate questions about.
    :param num_questions: How many MCQs to generate.
    :return: A dict with key "questions" if successful or key "error" if something went wrong.
    """

    prompt = f"""
    You are a professional quiz maker. Generate {num_questions} multiple-choice questions 
    about the following learning objective: '{learning_objective}'.
    Each question should have exactly 4 options, only one is correct. 

    Return them in valid JSON format with the following structure:
    [
      {{
        "question": "...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Option X"
      }},
      ...
    ]

    Do not include any additional keys or text outside of this JSON array.
    """

    try:
        response = chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        raw_content = response.choices[0].message.content

        # Attempt to parse JSON
        questions_list = json.loads(raw_content)

        # We expect a list of dicts
        return {"questions": questions_list}

    except Exception as e:
        return {"error": str(e)}
