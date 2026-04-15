import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';

export default function DailyGame({ session }: { session: any }) {
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const DAILY_LIMIT = 5;

  useEffect(() => {
    fetchGameWords();
  }, [session]);

  const fetchGameWords = async () => {
    // For a simple daily randomized game, we just fetch a random sample of words.
    // In PostgreSQL/Supabase, we can use order by random() or client-side shuffle.
    // Client-side shuffle is easier for small datasets:
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error("Error fetching words", error);
      return;
    }
    
    if (data && data.length > 0) {
      const shuffled = data.sort(() => 0.5 - Math.random());
      setWords(shuffled.slice(0, DAILY_LIMIT));
    }
  };

  const startGame = () => {
    if (words.length === 0) {
      alert("You need to add some words first!");
      return;
    }
    setCurrentIndex(0);
    setStats({ correct: 0, total: 0 });
    setFeedback('none');
    setAnswer('');
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== 'none') return; // Cannot re-submit

    const currentWord = words[currentIndex];
    // Simple verification (case insensitive, trim)
    const isCorrect = answer.trim().toLowerCase() === currentWord.vietnamese.trim().toLowerCase();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      
      // Update correct_count in DB async
      await supabase.from('words').update({ 
        correct_count: (currentWord.correct_count || 0) + 1,
        last_tested_at: new Date().toISOString()
      }).eq('id', currentWord.id);
    }

    setStats(prev => ({ ...prev, total: prev.total + 1 }));

    // Move to next word after a short delay
    setTimeout(() => {
      if (currentIndex + 1 < words.length) {
        setCurrentIndex(currentIndex + 1);
        setAnswer('');
        setFeedback('none');
      } else {
        // Game Over
        setCurrentIndex(words.length);
      }
    }, 1500);
  };

  if (currentIndex === -1) {
    return (
      <div className="game-container">
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Daily Challenge</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Test your memory! We will show you English words and you have to type the Vietnamese meaning.
          </p>
          <button className="btn-primary" onClick={startGame} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Play size={20} /> Start Game
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= words.length) {
    return (
      <div className="game-container">
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Finished!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            You got {stats.correct} out of {stats.total} correct.
          </p>
          <button className="btn-secondary" onClick={() => { fetchGameWords(); setCurrentIndex(-1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} /> Play Again
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="game-container">
      <div className="game-card glass-panel">
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Word {currentIndex + 1} of {words.length}
        </div>
        
        <div className="game-word">
          {currentWord.english}
        </div>

        <form onSubmit={submitAnswer}>
          <input
            type="text"
            className="glass-input game-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type Vietnamese meaning..."
            autoFocus
            disabled={feedback !== 'none'}
          />

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', opacity: feedback !== 'none' ? 0.5 : 1 }}
            disabled={feedback !== 'none' || !answer.trim()}
          >
            Check Answer
          </button>
        </form>

        {feedback === 'correct' && (
          <div style={{ marginTop: '24px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 }}>
            <CheckCircle size={24} /> Correct!
          </div>
        )}

        {feedback === 'incorrect' && (
          <div style={{ marginTop: '24px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 }}>
             <XCircle size={24} /> Incorrect! It was "{currentWord.vietnamese}"
          </div>
        )}

        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value" style={{ color: 'var(--primary)' }}>{stats.correct}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
