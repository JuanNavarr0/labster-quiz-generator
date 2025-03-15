"""
Entry point of the FastAPI application. 
Defines the main FastAPI instance and includes routers for different endpoints.
"""

from fastapi import FastAPI
from app.api.quiz_endpoints import router as quiz_router
from app.api.theory_endpoints import router as theory_router

def create_app() -> FastAPI:
    """
    Creates and configures the FastAPI application instance.
    :return: A FastAPI application.
    """
    application = FastAPI(
        title="Labster Quiz Generator",
        description="Generates theoretical summaries and multiple-choice questions (MCQs) using OpenAI.",
        version="0.2.0"
    )

    # Include the theory endpoints under /theory
    application.include_router(theory_router, prefix="/theory", tags=["Theory"])

    # Include the quiz endpoints under /quiz
    application.include_router(quiz_router, prefix="/quiz", tags=["Quiz"])

    return application

app = create_app()

@app.get("/")
def read_root():
    """
    Basic root endpoint to verify the application is running.
    """
    return {"message": "Welcome to the Labster Quiz Generator API!"}
