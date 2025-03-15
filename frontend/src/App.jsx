/**
 * This file contains a placeholder quiz screen to preview styling and layout.
 * The "PREVIOUS" button does not appear on the initial screen (only after
 * a second screen is displayed), and option letters (A, B, C, D) are shown
 * as perfect circles.
 */

import React, { useState } from 'react';
import './App.css';

function App() {
  /**
   * State variables:
   * - learningObjective: user input text for the topic
   * - theory: placeholder text to simulate a summary screen
   * - showPlaceholderQuiz: whether the single sample question is visible
   * - selectedOption: which option (A, B, C, D) is currently chosen
   */
  const [learningObjective, setLearningObjective] = useState('');
  const [theory, setTheory] = useState('');
  const [showPlaceholderQuiz, setShowPlaceholderQuiz] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  /**
   * handleGenerateTheory()
   * Simulates generating a short theory text, showing the second screen.
   */
  const handleGenerateTheory = () => {
    setTheory(
      "Eukaryotic cells are complex cells that contain a nucleus and other membrane-bound organelles..."
    );
  };

  /**
   * handleStartQuiz()
   * Toggles the placeholder quiz screen.
   */
  const handleStartQuiz = () => {
    setShowPlaceholderQuiz(true);
  };

  /**
   * handleGoBack()
   * Navigates backward in the flow (theory -> initial OR quiz -> theory),
   * removing the selectedOption if leaving the quiz screen.
   */
  const handleGoBack = () => {
    if (showPlaceholderQuiz) {
      setShowPlaceholderQuiz(false);
      setSelectedOption('');
    } else if (theory) {
      setTheory('');
    }
  };

  /**
   * handleNext()
   * Logs and alerts the selected answer for now, then could proceed 
   * to additional questions if integrated with real data.
   */
  const handleNext = () => {
    console.log("Selected option:", selectedOption);
    alert(`You chose: ${selectedOption || "none"}`);
  };

  /**
   * selectOption(letter)
   * Records which letter (A, B, C, D) is currently selected.
   */
  const selectOption = (letter) => {
    setSelectedOption(letter);
  };

  return (
    <div className="app-container">
      {/* Labster logo in the top-left corner */}
      <img src="/labster.png" alt="Labster Logo" className="labster-logo" />

      {/**
       * Show "PREVIOUS" only if we are beyond the initial screen.
       * That means either 'theory' is non-empty or 'showPlaceholderQuiz' is true.
       */}
      {(theory || showPlaceholderQuiz) && (
        <button className="big-button previous-button" onClick={handleGoBack}>
          PREVIOUS
        </button>
      )}

      <div className="main-content">
        {/**
         * SCREEN 1: If we have neither theory nor quiz, user is on the initial screen.
         */}
        {!theory && !showPlaceholderQuiz && (
          <>
            <h1>What do you want to learn today?</h1>
            <input
              type="text"
              placeholder="Type something..."
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
            />
            <div className="subtitle">
              If you are not sure, choose among the most used topics.
            </div>
            <img src="/arrows.png" alt="Down arrow" className="arrow-icon" />
            <div className="suggestions">
              <button
                className="suggestion-btn"
                onClick={() =>
                  setLearningObjective(
                    'Balance chemical reactions using the law of conservation of mass'
                  )
                }
              >
                Balance chemical reactions using the law of conservation of mass
              </button>
              <button
                className="suggestion-btn"
                onClick={() =>
                  setLearningObjective(
                    'Identify the phases of mitosis in eukaryotic cells'
                  )
                }
              >
                Identify the phases of mitosis in eukaryotic cells
              </button>
              <button
                className="suggestion-btn"
                onClick={() =>
                  setLearningObjective('Describe the main steps of PCR')
                }
              >
                Describe the main steps of PCR
              </button>
            </div>
            <button className="big-button center-button" onClick={handleGenerateTheory}>
              START
            </button>
          </>
        )}

        {/**
         * SCREEN 2: Placeholder theory
         */}
        {theory && !showPlaceholderQuiz && (
          <div className="theory-section">
            <h2>{learningObjective}</h2>
            <p>{theory}</p>
            <button className="big-button center-button" onClick={handleStartQuiz}>
              START QUIZ
            </button>
          </div>
        )}

        {/**
         * SCREEN 3: Placeholder quiz question with 4 options
         */}
        {showPlaceholderQuiz && (
          <div className="quiz-section">
            <h2>What are the main differences between eukaryotic cells?</h2>
            <div className="options-container">
              <button
                className={`option-btn ${selectedOption === 'A' ? 'selected' : ''}`}
                onClick={() => selectOption('A')}
              >
                <span className="option-letter">A</span>
                They contain a nucleus
              </button>
              <button
                className={`option-btn ${selectedOption === 'B' ? 'selected' : ''}`}
                onClick={() => selectOption('B')}
              >
                <span className="option-letter">B</span>
                They do not have organelles
              </button>
              <button
                className={`option-btn ${selectedOption === 'C' ? 'selected' : ''}`}
                onClick={() => selectOption('C')}
              >
                <span className="option-letter">C</span>
                They undergo binary fission only
              </button>
              <button
                className={`option-btn ${selectedOption === 'D' ? 'selected' : ''}`}
                onClick={() => selectOption('D')}
              >
                <span className="option-letter">D</span>
                They cannot perform mitosis
              </button>
            </div>
            <button className="big-button center-button" onClick={handleNext}>
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* Footer*/}
      <div className="footer">
        2025 Labster Quiz Prototype - Machine Learning - Juan Navarro Muñoz
      </div>
    </div>
  );
}

export default App;
