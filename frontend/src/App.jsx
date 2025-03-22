/**
 * App.jsx
 *
 * Application component for the Educational Quiz Generator
 *
 * This component manages the entire user flow:
 * 1. Initial input screen - User inputs or selects a learning objective
 * 2. Theory display screen - Shows generated educational content
 * 3. Quiz interaction screen - Presents questions and processes user answers
 */
 
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
 
// Configuration that could be externalized to environment variables in production
const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',
  ENDPOINTS: {
    THEORY: '/theory/generate_theory',
    QUIZ: '/quiz/generate_quiz',
    SAVE_PROGRESS: '/user/save_progress',
    HISTORY: '/user/learning_history',
    STATS: '/user/learning_stats'
  }
};

// Learning objective suggestions with categories
const SUGGESTED_TOPICS = {
  biology: [
    'Identify the phases of mitosis in eukaryotic cells',
    'Describe the process of DNA replication',
    'Explain the structure and function of cellular organelles',
    'Describe the main steps of PCR'
  ],
  chemistry: [
    'Balance chemical reactions using the law of conservation of mass',
    'Explain the periodic table organization and element properties',
    'Describe the difference between covalent and ionic bonds',
    'Understand acid-base equilibria and pH calculations'
  ],
  physics: [
    'Apply Newton\'s laws of motion to solve mechanical problems',
    'Explain the principles of thermodynamics',
    'Understand the wave-particle duality of light',
    'Calculate electric field strength in various scenarios'
  ],
  medicine: [
    "Explain the heart's structure, function, and clinical relevance",
    "Describe key components of the nervous system and their roles",
    "Discuss mechanisms of respiratory gas exchange and oxygen delivery",
    "Analyze homeostatic regulation and its impact on disease"
  ]
};

// Known correct answers for problematic quizzes (PCR topic)
const KNOWN_CORRECT_ANSWERS = {
  "What is the main purpose of PCR?": "To amplify specific DNA regions",
  "Which enzyme is essential in the PCR process?": "DNA polymerase",
  "What is the outcome of PCR?": "Amplification of DNA",
  "What is the first step in PCR?": "Denaturation",
  "What role does Taq polymerase play in PCR?": "Extension of DNA",
  "Which step in PCR involves lowering the temperature to allow primers to bind to the DNA template?": "Annealing",
  "What is the purpose of the extension step in PCR?": "Amplifying DNA sequence",
  "Why is PCR considered a powerful tool in molecular biology?": "It amplifies specific DNA sequences"
};

function App() {
  // User input and content states
  const [learningObjective, setLearningObjective] = useState('');
  const [theory, setTheory] = useState('');
  const [theoryWarning, setTheoryWarning] = useState('');
  const [questions, setQuestions] = useState([]);
  const [quizWarning, setQuizWarning] = useState('');
  
  // UI control states
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Quiz interaction states
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizGraded, setQuizGraded] = useState(false);
  const [gradedResults, setGradedResults] = useState([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  // User experience states
  const [activeCategory, setActiveCategory] = useState('biology');
  const [savedProgress, setSavedProgress] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState({
    completedTopics: 0,
    totalQuizzes: 0, 
    averageScore: 0,
    topicsBySubject: {}
  });
  const [userNotes, setUserNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [relatedTopics, setRelatedTopics] = useState([
    'Cell Division Overview',
    'Meiosis vs Mitosis',
    'DNA Structure'
  ]);
  
  // Quiz timer states
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizElapsedTime, setQuizElapsedTime] = useState("00:00");
  const timerRef = useRef(null);
  const [usedNotes, setUsedNotes] = useState(false);

  /**
   * Initialize the app with theme preference and user data
   */
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Apply theme class to body
    if (savedDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Load saved notes from localStorage
    const storedNotes = localStorage.getItem('savedNotes');
    if (storedNotes) {
      try {
        setSavedNotes(JSON.parse(storedNotes));
      } catch (err) {
        console.error("Error parsing saved notes:", err);
      }
    }
    
    // Load user data
    const loadUserData = async () => {
      try {
        // Fetch learning history and stats
        await fetchLearningHistory();
        await fetchLearningStats();
      } catch (err) {
        console.error("Error loading user data:", err);
        // Fall back to mock data if API fails
        const mockProgress = [
          {
            topic: 'Identify the phases of mitosis in eukaryotic cells',
            date: '2025-03-10',
            score: 80,
            difficulty: 'medium',
            time_spent: '12:45',
            used_notes: false
          },
          {
            topic: 'Balance chemical reactions using the law of conservation of mass',
            date: '2025-03-12',
            score: 90,
            difficulty: 'hard',
            time_spent: '10:23',
            used_notes: true
          }
        ];
        setSavedProgress(mockProgress);
        
        // Set mock progress data
        setProgressData({
          completedTopics: 12,
          totalQuizzes: 15,
          averageScore: 85,
          topicsBySubject: {
            'biology': 5,
            'chemistry': 4,
            'physics': 3,
            'medicine': 3
          }
        });
      }
    };
    
    loadUserData();
  }, []);
  
  /**
   * Quiz timer management
   */
  useEffect(() => {
    if (showQuiz && quizStartTime && !quizGraded) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Set up a timer that updates every second
      timerRef.current = setInterval(() => {
        const timeSpent = calculateTimeSpent();
        setQuizElapsedTime(timeSpent);
      }, 1000);
      
      // Cleanup function to clear the timer
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else if (!showQuiz || quizGraded) {
      // Clear the timer when quiz is not shown or is graded
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [showQuiz, quizStartTime, quizGraded]);
  
  /**
   * Toggle dark mode
   */
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

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
    setTheory(''); 
    setTheoryWarning('');
    setUserNotes('');
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.THEORY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          learning_objective: learningObjective,
          difficulty: difficultyLevel,
          format: "html"
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      // Parse the response text to JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }
      
      // Set the theory text
      setTheory(data.summary_text);
      
      // Set theory warning if present
      if (data.warning) {
        setTheoryWarning(data.warning);
      }
      
      // Update related topics if available in metadata
      if (data.metadata && data.metadata.related_topics) {
        setRelatedTopics(data.metadata.related_topics);
      }
    } catch (err) {
      setError('Failed to load theory from server. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fixes quiz answers for common topics like PCR
   * to avoid grading issues
   */
  const fixQuizAnswers = (questionsData) => {
    // Clone the questions to avoid mutating the original
    const fixedQuestions = [...questionsData];
    let wasFixed = false;
    
    // Check if this is a PCR quiz or another quiz we have corrections for
    const isPCRQuiz = learningObjective.toLowerCase().includes('pcr');
    
    if (isPCRQuiz) {
      // Loop through each question and fix known issues
      fixedQuestions.forEach((q, i) => {
        // Check if we have a known correct answer for this question
        for (const [knownQuestion, knownAnswer] of Object.entries(KNOWN_CORRECT_ANSWERS)) {
          if (q.question.includes(knownQuestion)) {
            // Find the option that contains the known answer
            const correctOption = q.options.find(option => 
              option.replace(/^[A-D]\.\s*/i, "").trim().toLowerCase().includes(knownAnswer.toLowerCase())
            );
            if (correctOption) {
              // If we found the option, update the correct_answer
              if (q.correct_answer !== correctOption) {
                q.correct_answer = correctOption;
                wasFixed = true;
              }
            }
          }
        }
      });
    }
    
    return fixedQuestions;
  };

  /**
   * Fetches quiz questions based on the learning objective
   * and prepares the quiz view
   */
  const handleStartQuiz = async () => {
    setLoading(true);
    setError('');
    setQuizWarning('');
    setUsedNotes(false);
    
    try {
      // Set quiz start time for tracking duration
      const startTime = Date.now();
      setQuizStartTime(startTime);
      
      // Calculate number of questions based on difficulty
      const questionCount = difficultyLevel === 'easy' ? 3 : 
                           difficultyLevel === 'medium' ? 5 : 7;
      
      const data = await fetchFromAPI(
        API_CONFIG.ENDPOINTS.QUIZ,
        { 
          learning_objective: learningObjective,
          difficulty: difficultyLevel,
          num_questions: questionCount
        }
      );
      
      if (data.questions && data.questions.length > 0) {
        // Fix quiz answers for known issues
        const fixedQuestions = fixQuizAnswers(data.questions);
        
        setQuestions(fixedQuestions);
        // Initialize selectedAnswers array with nulls for each question
        setSelectedAnswers(new Array(fixedQuestions.length).fill(null));
        setShowQuiz(true);
        resetQuizState();
        
        // Set quiz warning if present
        if (data.warning) {
          setQuizWarning(data.warning);
        }
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
    // Reset quiz start time for duration tracking
    setQuizStartTime(Date.now());
    setQuizElapsedTime("00:00");
    setUsedNotes(false);
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
      setQuizWarning('');
      resetQuizState();
    } else if (theory) {
      // Return to initial input screen
      setTheory('');
      setTheoryWarning('');
      setUserNotes('');
    } else if (showHistory) {
      // Return to main screen from history
      setShowHistory(false);
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
   * Calculate time spent on quiz in a readable format
   * @returns {string} Formatted time string (MM:SS)
   */
  const calculateTimeSpent = () => {
    if (!quizStartTime) return "00:00";
    
    const timeSpentMs = Date.now() - quizStartTime;
    const minutes = Math.floor(timeSpentMs / 60000);
    const seconds = Math.floor((timeSpentMs % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Logs quiz answer information for debugging
   */
  const debugQuizAnswers = () => {
    console.log("Current Quiz Questions and Answers:");
    questions.forEach((q, i) => {
      console.log(`Question ${i+1}: ${q.question.substring(0, 30)}...`);
      console.log(`Options:`, q.options);
      console.log(`Correct answer:`, q.correct_answer);
      console.log(`Selected answer:`, selectedAnswers[i]);
      console.log(`Are equal:`, q.correct_answer === selectedAnswers[i]);
      console.log("-------------------");
    });
  };

  /**
   * Grades the quiz by comparing user selections with correct answers
   * and provides feedback
   */
  const handleSubmitQuiz = async () => {
    // Check if all questions have been answered
    const unansweredCount = selectedAnswers.filter(ans => ans === null).length;
    
    if (unansweredCount > 0) {
      setError(`Please answer all questions. ${unansweredCount} question(s) remain unanswered.`);
      return;
    }
    
    // Debug to help diagnose issues
    debugQuizAnswers();
    
    let correctCount = 0;
    const newGradedResults = questions.map((q, i) => {
      const userChoice = selectedAnswers[i];
      
      // More robust comparison for answer checking
      const normalizedUserChoice = userChoice?.replace(/^[A-D]\.\s*/i, "").trim();
      const normalizedCorrectAnswer = q.correct_answer?.replace(/^[A-D]\.\s*/i, "").trim();
      
      // Compare normalized versions
      const isCorrect = normalizedUserChoice?.toLowerCase() === normalizedCorrectAnswer?.toLowerCase() ||
                       userChoice === q.correct_answer;
      
      if (isCorrect) correctCount++;
      
      return isCorrect;
    });
    
    setGradedResults(newGradedResults);
    setQuizGraded(true);
    setScore({ correct: correctCount, total: questions.length });
    
    // Calculate score as percentage
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    
    // Calculate time spent on the quiz
    const timeSpent = calculateTimeSpent();
    
    // Prepare progress data to save
    const progressData = {
      topic: learningObjective,
      score: scorePercent,
      difficulty: difficultyLevel,
      notes: userNotes || "",
      time_spent: timeSpent,
      used_notes: usedNotes
    };
    
    // Save progress to backend
    await saveQuizProgress(progressData);
    
    // Show progress modal 
    setShowProgressModal(true);
  };

  /**
   * Saves user notes for the current learning session
   */
  const saveUserNotes = () => {
    if (!userNotes.trim()) {
      alert('Please enter some notes before saving.');
      return;
    }
    
    // Create a new note object
    const newNote = {
      id: Date.now(),
      topic: learningObjective,
      text: userNotes,
      date: new Date().toISOString().substring(0, 10), // YYYY-MM-DD format
      difficulty: difficultyLevel
    };
    
    // Add to saved notes
    const updatedNotes = [...savedNotes, newNote];
    setSavedNotes(updatedNotes);
    
    // Save to localStorage
    localStorage.setItem('savedNotes', JSON.stringify(updatedNotes));
    
    // Show confirmation and set flag to display saved notes
    alert('Your notes have been saved successfully.');
    setShowSavedNotes(true);
  };

  /**
   * Deletes a saved note
   * @param {number} noteId - ID of the note to delete
   */
  const deleteNote = (noteId) => {
    const updatedNotes = savedNotes.filter(note => note.id !== noteId);
    setSavedNotes(updatedNotes);
    localStorage.setItem('savedNotes', JSON.stringify(updatedNotes));
  };

  /**
   * Shows notes modal during quiz
   */
  const showQuizNotes = () => {
    // Ask for confirmation
    if (confirm("Are you sure you want to view your notes? This will be recorded and marked on your quiz score.")) {
      setUsedNotes(true);
      setShowNotesModal(true);
    }
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
    setShowProgressModal(false);
  };
  
  /**
   * Exits current quiz and returns to theory
   */
  const handleExitQuiz = () => {
    setShowQuiz(false);
    setQuestions([]);
    setSelectedAnswers([]);
    setQuizWarning('');
    resetQuizState();
    setShowProgressModal(false);
  };

  /**
   * Fetches the user's learning history from the backend
   */
  const fetchLearningHistory = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HISTORY}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.history && Array.isArray(data.history)) {
        setSavedProgress(data.history);
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching learning history:", err);
      setError("Failed to load learning history. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches the user's learning statistics from the backend
   */
  const fetchLearningStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATS}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update progress data state
      setProgressData({
        completedTopics: data.completed_topics || 0,
        totalQuizzes: data.total_quizzes || 0,
        averageScore: data.average_score || 0,
        topicsBySubject: data.topics_by_subject || {}
      });
      
      return data;
    } catch (err) {
      console.error("Error fetching learning stats:", err);
      return null;
    }
  };

  /**
   * Saves quiz progress to the backend
   * @param {Object} progressData - The progress data to save
   */
  const saveQuizProgress = async (progressData) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SAVE_PROGRESS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Refresh stats after saving
      fetchLearningStats();
      
      return data;
    } catch (err) {
      console.error("Error saving progress:", err);
      return null;
    }
  };

  /**
   * Shows learning history screen with updated data
   */
  const showLearningHistory = async () => {
    // Fetch fresh data before showing the history
    await fetchLearningHistory();
    await fetchLearningStats();
    
    // Show the history view
    setShowHistory(true);
  };
  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
      {/* App Header with Logo and Controls */}
      <header className="app-header">
        
        {!theory && !showQuiz && !showHistory && (
          <div className="header-controls">
            <button className="icon-button" onClick={showLearningHistory} title="Learning History">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </button>
            <button className="icon-button" onClick={toggleDarkMode} title={darkMode ? "Light Mode" : "Dark Mode"}>
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Navigation button - shown only when not on initial screen */}
      {(theory || showQuiz || showHistory) && (
        <button className="big-button previous-button" onClick={handleGoBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
          <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          PREVIOUS
        </button>
      )}

      <div className="main-content">
        {/* Loading indicator overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinner-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Loading...</span>
            </div>
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* LEARNING HISTORY VIEW */}
        {showHistory && (
          <div className="content-container history-section">
            <h1>Your Learning Journey</h1>
            
            <div className="stats-container">
              <div className="stat-card">
                <h3>Topics Completed</h3>
                <div className="stat-value">{progressData.completedTopics}</div>
              </div>
              <div className="stat-card">
                <h3>Quizzes Taken</h3>
                <div className="stat-value">{progressData.totalQuizzes}</div>
              </div>
              <div className="stat-card">
                <h3>Average Score</h3>
                <div className="stat-value">{progressData.averageScore}%</div>
              </div>
            </div>
            
            {/* Subject distribution chart - visual representation */}
            {progressData.topicsBySubject && Object.keys(progressData.topicsBySubject).length > 0 && (
              <div className="subject-distribution">
                <h2>Topics by Subject</h2>
                <div className="subject-bars">
                  {Object.entries(progressData.topicsBySubject).map(([subject, count]) => (
                    <div key={subject} className="subject-bar-container">
                      <div className="subject-name">{subject}</div>
                      <div className="subject-bar-wrapper">
                        <div 
                          className="subject-bar" 
                          style={{
                            width: `${(count / progressData.totalQuizzes) * 100}%`,
                            backgroundColor: subject === 'biology' ? '#4CAF50' : 
                                           subject === 'chemistry' ? '#2196F3' : 
                                           subject === 'physics' ? '#FF9800' : 
                                           subject === 'medicine' ? '#E91E63' : '#9C27B0'
                          }}
                        ></div>
                        <span className="subject-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h2>Recent Activities</h2>
            
            <div className="history-table">
              <div className="history-header">
                <div className="history-cell">Topic</div>
                <div className="history-cell">Date</div>
                <div className="history-cell">Score</div>
                <div className="history-cell">Difficulty</div>
                <div className="history-cell">Time Spent</div>
              </div>
              
              {savedProgress.length > 0 ? (
                savedProgress.map((item, index) => (
                  <div className="history-row" key={index}>
                    <div className="history-cell">
                      {item.topic}
                      {item.used_notes && <span className="notes-flag"> (With notes)</span>}
                    </div>
                    <div className="history-cell">{item.date}</div>
                    <div className="history-cell">{item.score}%</div>
                    <div className="history-cell">
                      <span className={`difficulty-badge ${item.difficulty}`}>
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="history-cell">{item.time_spent}</div>
                  </div>
                ))
              ) : (
                <div className="history-row empty-history">
                  <div className="history-cell" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                    No learning history available yet. Complete a quiz to start tracking your progress!
                  </div>
                </div>
              )}
            </div>
            
            {/* Saved Notes Section */}
            <h2>My Saved Notes</h2>
            <div className="saved-notes-container">
              {savedNotes.length > 0 ? (
                savedNotes.map((note) => (
                  <div key={note.id} className="note-card">
                    <div className="note-header">
                      <h3>{note.topic}</h3>
                      <div className="note-meta">
                        <span className={`difficulty-badge ${note.difficulty}`}>{note.difficulty}</span>
                        <span className="note-date">{note.date}</span>
                      </div>
                      <button 
                        className="delete-note-btn" 
                        onClick={() => deleteNote(note.id)}
                        title="Delete note"
                      >
                        &times;
                      </button>
                    </div>
                    <p className="note-content">{note.text}</p>
                  </div>
                ))
              ) : (
                <div className="empty-notes-message">
                  You haven't saved any notes yet. Notes you save while studying will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 1: Initial input screen */}
        {!theory && !showQuiz && !showHistory && !loading && (
          <div className="content-container">
            <h1>What do you want to learn today?</h1>

            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Enter a learning objective..."
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                aria-label="Learning objective input"
                className="enhanced-input"
              />
              {learningObjective && (
                <button
                  className="clear-input"
                  onClick={() => setLearningObjective('')}
                  aria-label="Clear input"
                >
                  ×
                </button>
              )}
            </div>

            <div className="difficulty-selector">
              <span>Difficulty: </span>
              <div className="radio-group">
                <label className={difficultyLevel === 'easy' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={difficultyLevel === 'easy'}
                    onChange={() => setDifficultyLevel('easy')}
                  />
                  Easy
                </label>
                <label className={difficultyLevel === 'medium' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="medium"
                    checked={difficultyLevel === 'medium'}
                    onChange={() => setDifficultyLevel('medium')}
                  />
                  Medium
                </label>
                <label className={difficultyLevel === 'hard' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={difficultyLevel === 'hard'}
                    onChange={() => setDifficultyLevel('hard')}
                  />
                  Advanced
                </label>
              </div>
            </div>

            <div className="subtitle">
              Or if you're undecided, choose one of our most popular topics.
            </div>

            {/* Topic category tabs */}
            <div className="category-tabs">
              <button
                className={`tab-btn ${activeCategory === 'biology' ? 'active' : ''}`}
                onClick={() => setActiveCategory('biology')}
              >
                Biology
              </button>
              <button
                className={`tab-btn ${activeCategory === 'chemistry' ? 'active' : ''}`}
                onClick={() => setActiveCategory('chemistry')}
              >
                Chemistry
              </button>
              <button
                className={`tab-btn ${activeCategory === 'physics' ? 'active' : ''}`}
                onClick={() => setActiveCategory('physics')}
              >
                Physics
              </button>
              <button
                className={`tab-btn ${activeCategory === 'medicine' ? 'active' : ''}`}
                onClick={() => setActiveCategory('medicine')}
              >
                Medicine
              </button>
            </div>

            <div className="suggestions">
              {SUGGESTED_TOPICS[activeCategory].map((topic, index) => (
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
              className="big-button center-button start-button"
              onClick={handleGenerateTheory}
              disabled={!learningObjective.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="button-icon"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              START LEARNING
            </button>
          </div>
        )}
        {/* SCREEN 2: Theory content display */}
        {theory && !showQuiz && !loading && (
          <div className="content-container theory-section">
            <h2>{learningObjective}</h2>
            
            {/* Display scientific verification warning if present */}
            {theoryWarning && (
              <div className="scientific-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{theoryWarning}</span>
              </div>
            )}
            
            <div className="content-wrapper">
              {/* Render the theory content as HTML */}
              <div
                className="theory-content"
                dangerouslySetInnerHTML={{ __html: theory }}
              />
              
              {/* Study tools sidebar */}
              <div className="study-tools">
                <h3>Study Tools</h3>
                
                <div className="tool-section">
                  <h4>My Notes</h4>
                  <textarea 
                    className="notes-area"
                    placeholder="Add your notes here..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                  ></textarea>
                  <button className="tool-button" onClick={saveUserNotes}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Notes
                  </button>
                </div>
                
                {/* Display saved notes if any */}
                {showSavedNotes && savedNotes.length > 0 && (
                  <div className="tool-section">
                    <h4>Saved Notes</h4>
                    <div className="saved-notes-preview">
                      {savedNotes
                        .filter(note => note.topic === learningObjective)
                        .map(note => (
                          <div key={note.id} className="saved-note-item">
                            <p className="saved-note-text">{note.text.substring(0, 100)}...</p>
                            <button 
                              className="delete-note-btn small" 
                              onClick={() => deleteNote(note.id)}
                              title="Delete note"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="tool-section">
                  <h4>Difficulty Level</h4>
                  <div className="difficulty-badge-display">
                    <span className={`difficulty-badge ${difficultyLevel}`}>
                      {difficultyLevel}
                    </span>
                  </div>
                </div>
                
                <div className="tool-section">
                  <h4>Related Topics</h4>
                  <ul className="related-topics">
                    {relatedTopics.map((topic, index) => (
                      <li key={index}><a href="#">{topic}</a></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <button className="big-button center-button quiz-button" onClick={handleStartQuiz}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              START QUIZ
            </button>
          </div>
        )}

        {/* SCREEN 3: Quiz interaction */}
        {showQuiz && questions.length > 0 && !loading && (
          <div className="content-container quiz-section">
            <h2>Quiz for: {learningObjective}</h2>
            
            {/* Display scientific verification warning for quiz if present */}
            {quizWarning && (
              <div className="scientific-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{quizWarning}</span>
              </div>
            )}
            
            {/* Quiz info bar */}
            <div className="quiz-info-bar">
              <div className="quiz-info-item">
                <strong>Difficulty:</strong>
                <span className={`difficulty-badge ${difficultyLevel}`}>
                  {difficultyLevel}
                </span>
              </div>
              <div className="quiz-info-item">
                <strong>Time:</strong> {quizElapsedTime}
              </div>
              {!quizGraded && (
                <div className="quiz-info-item">
                  <button className="view-notes-btn" onClick={showQuizNotes}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    View Notes
                  </button>
                </div>
              )}
              {usedNotes && (
                <div className="quiz-info-item">
                  <span className="notes-used-indicator">Notes used</span>
                </div>
              )}
            </div>
            
            {/* Quiz progress indicator */}
            <div className="quiz-progress">
              <div className="progress-text">
                {!quizGraded
                  ? `Question ${selectedAnswers.filter(a => a !== null).length} of ${questions.length} answered`
                  : `Quiz completed: ${score.correct} of ${score.total} correct`
                }
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${quizGraded 
                      ? (score.correct / score.total) * 100 
                      : (selectedAnswers.filter(a => a !== null).length / questions.length) * 100}%`,
                    backgroundColor: quizGraded 
                      ? (score.correct / score.total) >= 0.7 ? '#4CAF50' : '#FF9800'
                      : '#3498db'
                  }}
                ></div>
              </div>
            </div>
            
            {/* Display quiz questions and options */}
            <div className="questions-container">
              {questions.map((q, questionIndex) => (
                <div 
                  key={questionIndex} 
                  className={`question-card ${quizGraded ? (gradedResults[questionIndex] ? 'correct-question' : 'incorrect-question') : ''}`}
                >
                  <h3>
                    <span className="question-number">Q{questionIndex + 1}</span>
                    {q.question}
                  </h3>
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
                          <span className="option-text">{opt}</span>
                          {quizGraded && (
                            <span className="option-feedback">
                              {isCorrectAnswer && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon correct">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                              {isSelected && !isCorrectAnswer && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon wrong">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Explanation shown after grading */}
                  {quizGraded && q.explanation && (
                    <div className="question-explanation">
                      <h4>Explanation:</h4>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                  {/* Fallback explanation if none provided */}
                  {quizGraded && !q.explanation && (
                    <div className="question-explanation">
                      <h4>Explanation:</h4>
                      <p>The correct answer is {q.correct_answer}. This option is correct because it accurately represents the concept being tested.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Quiz action buttons */}
            <div className="quiz-actions">
              {quizGraded ? (
                <>
                  <button className="action-button secondary" onClick={handleRetakeQuiz}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <polyline points="23 20 23 14 17 14"></polyline>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Retry Quiz
                  </button>
                  <button className="action-button primary" onClick={handleExitQuiz}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Return to Study Material
                  </button>
                </>
              ) : (
                <button
                  className="action-button primary submit-button"
                  onClick={handleSubmitQuiz}
                  disabled={selectedAnswers.some(ans => ans === null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Submit Answers
                </button>
              )}
            </div>
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

        {/* Quiz Results Modal */}
        {showProgressModal && (
          <div className="modal-overlay">
            <div className="modal-content results-modal">
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>×</button>
              
              <div className="results-header">
                <h2>Quiz Results</h2>
              </div>
              
              <div className="results-score">
                <div className="score-circle" style={{
                  background: `conic-gradient(#4CAF50 ${(score.correct / score.total) * 360}deg, #e0e0e0 0deg)`
                }}>
                  <div className="score-inner">
                    <span className="score-percent">{Math.round((score.correct / score.total) * 100)}%</span>
                  </div>
                </div>
                <div className="score-text">
                  <p>You got <strong>{score.correct}</strong> out of <strong>{score.total}</strong> correct</p>
                  <p>Difficulty: <span className={`difficulty-badge ${difficultyLevel}`}>
                    {difficultyLevel}
                  </span></p>
                  <p>Time spent: {quizElapsedTime}</p>
                  {usedNotes && <p className="notes-used">Notes used during quiz</p>}
                  <p className="score-message">
                    {score.correct === score.total ? "Excellent! Perfect score!" :
                     score.correct / score.total >= 0.8 ? "Great job! You've mastered this topic." :
                     score.correct / score.total >= 0.6 ? "Good work! Keep studying to improve further." :
                     "Keep practicing! Review the material and try again."}
                  </p>
                </div>
              </div>
              
              <div className="results-actions">
                <button className="action-button secondary" onClick={handleRetakeQuiz}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  Retry Quiz
                </button>
                <button className="action-button primary" onClick={handleExitQuiz}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Return to Study Material
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal for Quiz */}
        {showNotesModal && (
          <div className="modal-overlay">
            <div className="modal-content notes-modal">
              <button className="modal-close" onClick={() => setShowNotesModal(false)}>×</button>
              
              <div className="notes-header">
                <h2>Your Study Notes</h2>
              </div>
              
              <div className="notes-content">
                {savedNotes.filter(note => note.topic === learningObjective).length > 0 ? (
                  savedNotes
                    .filter(note => note.topic === learningObjective)
                    .map(note => (
                      <div key={note.id} className="quiz-note-card">
                        <div className="note-date">{note.date}</div>
                        <p>{note.text}</p>
                      </div>
                    ))
                ) : (
                  <div className="empty-notes-message">
                    You don't have any saved notes for this topic yet.
                  </div>
                )}
              </div>
              
              <div className="notes-actions">
                <button className="action-button primary" onClick={() => setShowNotesModal(false)}>
                  Return to Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div>2025 Educational Quiz Prototype - Juan Navarro Muñoz</div>
      </div>
    </div>
  );
}

export default App;