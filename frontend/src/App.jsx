/**
 * Main application component for the Labster Quiz Generator
 * 
 * This component manages the entire user flow:
 * 1. Initial input screen - User inputs or selects a learning objective
 * 2. Theory display screen - Shows generated educational content
 * 3. Quiz interaction screen - Presents questions and processes user answers
 * 
 * Key features:
 * - Communication with FastAPI backend endpoints
 * - State management for different application views
 * - Loading state indicators during API calls
 * - Quiz grading with visual feedback
 * - Navigation between application states
 */

import React, { useState } from 'react';
import './App.css';

// Configuration that could be externalized to environment variables in production
const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',
  ENDPOINTS: {
    THEORY: '/theory/generate_theory',
    QUIZ: '/quiz/generate_quiz'
  }
};

// Common learning objective suggestions for user convenience
const SUGGESTED_TOPICS = [
  'Balance chemical reactions using the law of conservation of mass',
  'Identify the phases of mitosis in eukaryotic cells',
  'Describe the main steps of PCR'
];

function App() {
  // User input and content states
  const [learningObjective, setLearningObjective] = useState('');
  const [theory, setTheory] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // UI control states
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Quiz interaction states
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizGraded, setQuizGraded] = useState(false);
  const [gradedResults, setGradedResults] = useState([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  /**
   * Makes API requests with consistent error handling
   * @param {string} endpoint - API endpoint path
   * @param {Object} payload - Request body data
   * @returns {Promise<Object>} Response data or throws error
   */
  const fetchFromAPI = async (endpoint, payload) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`API Error (${endpoint}):`, err);
      throw err;
    }
  };

  /**
   * Validates user input and generates theoretical content
   * from the backend API
   */
  const handleGenerateTheory = async () => {
    // Input validation
    if (!learningObjective.trim()) {
      setError('Please enter a learning objective or select a suggestion');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchFromAPI(
        API_CONFIG.ENDPOINTS.THEORY,
        { learning_objective: learningObjective }
      );
      
      setTheory(data.summary_text || '');
    } catch (err) {
      setError('Failed to generate theory. Please try again or choose a different topic.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches quiz questions based on the learning objective
   * and prepares the quiz view
   */
  const handleStartQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchFromAPI(
        API_CONFIG.ENDPOINTS.QUIZ,
        { learning_objective: learningObjective }
      );
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        // Initialize selectedAnswers array with nulls for each question
        setSelectedAnswers(new Array(data.questions.length).fill(null));
        setShowQuiz(true);
        resetQuizState();
      } else {
        throw new Error('No questions returned from the server');
      }
    } catch (err) {
      setError('Failed to generate quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets quiz-related state variables
   */
  const resetQuizState = () => {
    setQuizGraded(false);
    setGradedResults([]);
    setScore({ correct: 0, total: 0 });
  };

  /**
   * Handles navigation to previous screens in the flow
   */
  const handleGoBack = () => {
    if (showQuiz) {
      // Return to theory screen
      setShowQuiz(false);
      setQuestions([]);
      setSelectedAnswers([]);
      resetQuizState();
    } else if (theory) {
      // Return to initial input screen
      setTheory('');
    }
    
    setError(''); // Clear any error messages when navigating
  };

  /**
   * Records the user's answer selection for a specific question
   * @param {number} questionIndex - Index of the question being answered
   * @param {string} choice - The selected answer option
   */
  const selectAnswer = (questionIndex, choice) => {
    // Prevent changes after quiz submission
    if (quizGraded) return;
    
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[questionIndex] = choice;
    setSelectedAnswers(updatedAnswers);
  };

  /**
   * Grades the quiz by comparing user selections with correct answers
   * and provides feedback
   */
  const handleSubmitQuiz = () => {
    // Check if all questions have been answered
    const unansweredCount = selectedAnswers.filter(ans => ans === null).length;
    
    if (unansweredCount > 0) {
      setError(`Please answer all questions. ${unansweredCount} question(s) remain unanswered.`);
      return;
    }
    
    let correctCount = 0;
    const newGradedResults = questions.map((q, i) => {
      const userChoice = selectedAnswers[i];
      const isCorrect = (userChoice === q.correct_answer);
      if (isCorrect) correctCount++;
      return isCorrect;
    });
    
    setGradedResults(newGradedResults);
    setQuizGraded(true);
    setScore({ correct: correctCount, total: questions.length });
    
    // Show score feedback
    alert(`You got ${correctCount} out of ${questions.length} correct.`);
  };

  /**
   * Sets the learning objective to a predefined suggestion
   * @param {string} suggestion - The suggested learning objective to use
   */
  const selectSuggestion = (suggestion) => {
    setLearningObjective(suggestion);
    setError('');
  };

  /**
   * Restarts the quiz with the same questions but resets answers
   */
  const handleRetakeQuiz = () => {
    setSelectedAnswers(new Array(questions.length).fill(null));
    resetQuizState();
  };

  return (
    <div className="app-container">
      {/* Labster logo in top-left corner */}
      <img src="/labster.png" alt="Labster Logo" className="labster-logo" />

      {/* Navigation button - shown only when not on initial screen */}
      {(theory || showQuiz) && (
        <button className="big-button previous-button" onClick={handleGoBack}>
          PREVIOUS
        </button>
      )}

      <div className="main-content">
        {/* Loading indicator overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Loading...</div>
          </div>
        )}

        {/* Error message display */}
        {error && <div className="error-message">{error}</div>}

        {/* SCREEN 1: Initial input screen */}
        {!theory && !showQuiz && !loading && (
          <div className="content-container">
            <h1>What do you want to learn today?</h1>
            <input
              type="text"
              placeholder="Type something..."
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              aria-label="Learning objective input"
            />
            <div className="subtitle">
              If you are not sure, choose among the most used topics.
            </div>
            <img src="/arrows.png" alt="Down arrow" className="arrow-icon" />
            <div className="suggestions">
              {SUGGESTED_TOPICS.map((topic, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => selectSuggestion(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
            <button 
              className="big-button center-button" 
              onClick={handleGenerateTheory}
              disabled={!learningObjective.trim()}
            >
              START
            </button>
          </div>
        )}

        {/* SCREEN 2: Theory content display */}
        {theory && !showQuiz && !loading && (
          <div className="content-container theory-section">
            <h2>{learningObjective}</h2>
            <p>{theory}</p>
            <button className="big-button center-button" onClick={handleStartQuiz}>
              START QUIZ
            </button>
          </div>
        )}

        {/* SCREEN 3: Quiz interaction */}
        {showQuiz && questions.length > 0 && !loading && (
          <div className="content-container quiz-section">
            <h2>Quiz for: {learningObjective}</h2>
            
            {/* Display quiz questions and options */}
            {questions.map((q, questionIndex) => (
              <div key={questionIndex} style={{ marginBottom: '2rem' }}>
                <h3>Q{questionIndex + 1}: {q.question}</h3>
                <div className="options-container">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = (selectedAnswers[questionIndex] === opt);
                    const isCorrectAnswer = (opt === q.correct_answer);
                    let highlightClass = '';

                    // Handle different option states based on quiz grading
                    if (quizGraded) {
                      if (isSelected && isCorrectAnswer) {
                        highlightClass = 'selected-correct';
                      } else if (isSelected && !isCorrectAnswer) {
                        highlightClass = 'selected-wrong';
                      } else if (isCorrectAnswer && !isSelected) {
                        highlightClass = 'correct-answer';
                      }
                    } else {
                      highlightClass = isSelected ? 'selected' : '';
                    }

                    return (
                      <button
                        key={optIndex}
                        className={`option-btn ${highlightClass}`}
                        onClick={() => selectAnswer(questionIndex, opt)}
                        disabled={quizGraded}
                        aria-pressed={isSelected}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Quiz action buttons */}
            {quizGraded ? (
              <button className="big-button center-button" onClick={handleRetakeQuiz}>
                RETRY QUIZ
              </button>
            ) : (
              <button 
                className="big-button center-button" 
                onClick={handleSubmitQuiz}
                disabled={selectedAnswers.some(ans => ans === null)}
              >
                SUBMIT ANSWERS
              </button>
            )}
          </div>
        )}

        {/* Fallback for quiz screen with no questions */}
        {showQuiz && questions.length === 0 && !loading && !error && (
          <div className="content-container" style={{ textAlign: 'center' }}>
            <p>No questions available or an error occurred. Please try again.</p>
            <button className="big-button" onClick={handleGoBack}>
              GO BACK
            </button>
          </div>
        )}
      </div>

      <div className="footer">
        2025 Labster Quiz Prototype - Machine Learning - Juan Navarro Muñoz
      </div>
    </div>
  );
}

export default App;