import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { commonWords } from './words';

function App() {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedCharacters, setTypedCharacters] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [totalCharCount, setTotalCharCount] = useState(0);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  
  // Generate random words
  useEffect(() => {
    generateWords();
  }, []);

  const generateWords = () => {
    const shuffled = [...commonWords].sort(() => 0.5 - Math.random());
    setWords(shuffled.slice(0, 100));
  };

  // Handle timer
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
    }
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Set focus for the entire app
  useEffect(() => {
    document.addEventListener('click', () => {
      document.body.focus();
    });
    document.body.focus();
  }, []);

  // Calculate current word
  const currentWord = words[currentWordIndex] || '';
  
  // Handle keydown events
  const handleKeyDown = useCallback((e) => {
    if (isFinished) return;

    // Start timer on first key press
    if (!isRunning) {
      setIsRunning(true);
    }

    if (e.key === ' ') {
      // Check if the user has typed something
      if (typedCharacters.length > 0) {
        // Check if the word was typed correctly for stats
        if (typedCharacters === currentWord) {
          setCorrectWords(prev => prev + 1);
          // Add correct characters to our count (including space)
          setCorrectCharCount(prev => prev + currentWord.length + 1);
        } else {
          // Word was incorrect - count only the space as correct
          setCorrectCharCount(prev => prev + 1);
        }
        
        // Always move to the next word when space is pressed
        setCurrentWordIndex(prev => prev + 1);
        
        // Update visible start index if new word would be on a new line
        if ((currentWordIndex + 1) % 10 === 0) {
          setVisibleStartIndex(current => current + 10);
        }
        
        setTypedCharacters('');
        setCurrentIndex(0);
        setWordsTyped(prev => prev + 1);
        
        // Count the total characters (word length + space)
        setTotalCharCount(prev => prev + currentWord.length + 1);
      }
      e.preventDefault(); // Prevent scrolling on space
    } else if (e.key === 'Backspace') {
      // Handle backspace
      if (typedCharacters.length > 0) {
        setTypedCharacters(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
        setTotalCharCount(prev => prev + 1); // Count backspace as a keystroke
      }
    } else if (e.key.length === 1) {
      // Add character to typed characters
      setTypedCharacters(prev => prev + e.key);
      setCurrentIndex(prev => prev + 1);
      
      // Track accuracy: check if this character is correct
      if (currentIndex < currentWord.length && e.key === currentWord[currentIndex]) {
        setCorrectCharCount(prev => prev + 1);
      }
      
      // Count all keystrokes
      setTotalCharCount(prev => prev + 1);
    }
  }, [isRunning, isFinished, currentWord, typedCharacters, currentWordIndex, currentIndex]);

  // Add keydown event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setTypedCharacters('');
    setCurrentIndex(0);
    setTimeLeft(15);
    setIsRunning(false);
    setIsFinished(false);
    setWordsTyped(0);
    setCorrectWords(0);
    setCorrectCharCount(0);
    setTotalCharCount(0);
    setVisibleStartIndex(0);
    generateWords();
    document.body.focus();
  };

  const calculateWPM = () => {
    return Math.round(correctWords * (60 / 15)); // words per minute based on 15 second test
  };

  const calculateAccuracy = () => {
    if (totalCharCount === 0) return 0;
    return Math.round((correctCharCount / totalCharCount) * 100);
  };

  // Render visible words with proper styling
  const renderWords = () => {
    // Show a fixed number of words from the visible start index
    const wordsToShow = 30;
    const endIndex = Math.min(words.length, visibleStartIndex + wordsToShow);
    
    return words.slice(visibleStartIndex, endIndex).map((word, index) => {
      const wordIndex = visibleStartIndex + index;
      
      if (wordIndex === currentWordIndex) {
        // Current word - show with typed characters
        const typedChars = typedCharacters.split('');
        const wordChars = [];
        
        // Create character spans for the current word with cursor at appropriate position
        word.split('').forEach((char, charIndex) => {
          // Add cursor before this character if it's the current position
          if (charIndex === typedChars.length) {
            wordChars.push(<span key={`cursor-${charIndex}`} className="cursor"></span>);
          }
          
          const isTyped = charIndex < typedChars.length;
          const isCorrect = isTyped && typedChars[charIndex] === char;
          const isError = isTyped && typedChars[charIndex] !== char;
          
          wordChars.push(
            <span 
              key={charIndex} 
              className={`character ${isTyped ? (isCorrect ? 'correct' : 'error') : ''}`}
            >
              {char}
            </span>
          );
        });

        // If cursor should be at the end of the word
        if (typedChars.length === word.length) {
          wordChars.push(<span key="cursor-end" className="cursor"></span>);
        }
        
        // Add extra characters that are typed beyond the word length
        if (typedChars.length > word.length) {
          const extraChars = typedChars.slice(word.length);
          extraChars.forEach((char, i) => {
            wordChars.push(
              <span 
                key={`extra-${i}`}
                className="character error extra"
              >
                {char}
              </span>
            );
            
            // Add cursor after the last extra character
            if (i === extraChars.length - 1) {
              wordChars.push(<span key="cursor-extra-end" className="cursor"></span>);
            }
          });
        }

        return (
          <div key={wordIndex} className="word active">
            {wordChars}
          </div>
        );
      } else {
        // Other words - just show them normally
        return (
          <div 
            key={wordIndex} 
            className={`word ${wordIndex < currentWordIndex ? 'completed' : ''}`}
          >
            {word.split('').map((char, i) => (
              <span key={i} className="character">
                {char}
              </span>
            ))}
          </div>
        );
      }
    });
  };

  return (
    <div className="App" tabIndex={-1}>
      <header className="header">
        <h1>MonkeyType</h1>
      </header>
      <div className="container">
        <div className="timer">Time: {timeLeft}s</div>
        
        {!isFinished ? (
          <div className="test-container">
            <div className="words-container">
              <div className="words-wrapper">
                {renderWords()}
              </div>
            </div>
            <div className="instruction">
              {isRunning ? "Type the highlighted word" : "Click anywhere and start typing..."}
            </div>
          </div>
        ) : (
          <div className="results">
            <h2>Test Complete!</h2>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">{calculateWPM()}</span>
                <span className="stat-label">WPM</span>
              </div>
              <div className="stat">
                <span className="stat-value">{calculateAccuracy()}%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat">
                <span className="stat-value">{correctWords}</span>
                <span className="stat-label">Words</span>
              </div>
            </div>
            <button className="restart-btn" onClick={handleRestart}>
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
