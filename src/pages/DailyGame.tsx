import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Layers, Link as LinkIcon, Type, ArrowRight } from 'lucide-react';

type GameMode = 'select' | 'typing' | 'flashcard' | 'match';

export default function DailyGame({ session }: { session: any }) {
  const [words, setWords] = useState<any[]>([]);
  const [mode, setMode] = useState<GameMode>('select');
  const DAILY_LIMIT = 5;

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Typing Game State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  // Flashcard State
  const [isFlipped, setIsFlipped] = useState(false);

  // Match State
  const [leftItems, setLeftItems] = useState<{id: string, text: string}[]>([]);
  const [rightItems, setRightItems] = useState<{id: string, text: string}[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchError, setMatchError] = useState(false);

  useEffect(() => {
    fetchGameWords();
  }, [session]);

  const fetchGameWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error("Error fetching words", error);
      return;
    }
    
    if (data && data.length > 0) {
      const shuffled = shuffleArray(data);
      setWords(shuffled.slice(0, DAILY_LIMIT));
    }
  };

  const initTypingMode = () => {
    if (words.length === 0) return alert("You need to add some words first!");
    setCurrentIndex(0);
    setStats({ correct: 0, total: 0 });
    setFeedback('none');
    setAnswer('');
    setMode('typing');
  };

  const initFlashcardMode = () => {
    if (words.length === 0) return alert("You need to add some words first!");
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode('flashcard');
  };

  const initMatchMode = () => {
    if (words.length < 2) return alert("You need at least 2 words to play match game!");
    const left = shuffleArray(words).map(w => ({ id: w.id, text: w.english }));
    const right = shuffleArray(words).map(w => ({ id: w.id, text: w.vietnamese }));
    setLeftItems(left);
    setRightItems(right);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairs([]);
    setMatchError(false);
    setMode('match');
  };

  // Typing logic
  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== 'none') return; 

    const currentWord = words[currentIndex];
    const isCorrect = answer.trim().toLowerCase() === currentWord.vietnamese.trim().toLowerCase();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      await supabase.from('words').update({ 
        correct_count: (currentWord.correct_count || 0) + 1,
        last_tested_at: new Date().toISOString()
      }).eq('id', currentWord.id);
    }
    setStats(prev => ({ ...prev, total: prev.total + 1 }));

    setTimeout(() => {
      setFeedback('none');
      setAnswer('');
      setCurrentIndex(curr => curr + 1);
    }, 1500);
  };

  // Match logic
  const handleMatchClick = (side: 'left' | 'right', id: string) => {
    if (matchedPairs.includes(id)) return;
    if (matchError) return;

    let newLeft = selectedLeft;
    let newRight = selectedRight;

    if (side === 'left') {
      if (selectedLeft === id) { setSelectedLeft(null); return; }
      newLeft = id;
      setSelectedLeft(id);
    } else {
      if (selectedRight === id) { setSelectedRight(null); return; }
      newRight = id;
      setSelectedRight(id);
    }

    if (newLeft && newRight) {
      if (newLeft === newRight) {
        // success
        setMatchedPairs(prev => [...prev, newLeft as string]);
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        // error
        setMatchError(true);
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setMatchError(false);
        }, 800);
      }
    }
  };

  if (mode === 'select') {
    return (
      <div className="game-container">
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Daily Practice</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Choose how you want to practice your vocabulary today.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <button className="glass-panel" onClick={initFlashcardMode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <Layers size={32} color="var(--primary)" />
              <div style={{ fontWeight: 600, fontSize: '18px' }}>Flashcards</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Lật thẻ học từ vựng</div>
            </button>
            <button className="glass-panel" onClick={initMatchMode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <LinkIcon size={32} color="var(--success)" />
              <div style={{ fontWeight: 600, fontSize: '18px' }}>Nối Từ</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Ghép từ Tiếng Anh và Nghĩa</div>
            </button>
            <button className="glass-panel" onClick={initTypingMode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <Type size={32} color="var(--danger)" />
              <div style={{ fontWeight: 600, fontSize: '18px' }}>Gõ Từ</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Nhập nghĩa tiếng việt</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Finished state shared for typing & flashcard
  if ((mode === 'typing' || mode === 'flashcard') && currentIndex >= words.length && words.length > 0) {
    return (
      <div className="game-container">
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Finished!</h2>
          {mode === 'typing' && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              You got {stats.correct} out of {stats.total} correct.
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => fetchGameWords().then(() => setMode('select'))} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} /> Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* HEADER -> Back to Menu */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
         <button className="btn-secondary" onClick={() => setMode('select')} style={{ padding: '8px 16px', fontSize: '14px' }}>
            ← Back to Menu
         </button>
      </div>

      {mode === 'typing' && (
        <div className="game-card glass-panel">
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Word {currentIndex + 1} of {words.length}
          </div>
          
          <div className="game-word">
            {words[currentIndex]?.english}
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
               <XCircle size={24} /> Incorrect! It was "{words[currentIndex]?.vietnamese}"
            </div>
          )}

          <div className="game-stats">
             <div className="stat-item">Score: <span style={{ color: 'var(--primary)', marginLeft: '8px', fontWeight: 'bold' }}>{stats.correct}</span></div>
          </div>
        </div>
      )}

      {mode === 'flashcard' && (
        <div className="game-card glass-panel" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
            Card {currentIndex + 1} of {words.length}
          </div>
          
          <div 
            style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease',
              marginBottom: '24px'
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {isFlipped ? (
               <div style={{ fontSize: '32px', color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                 {words[currentIndex]?.vietnamese}
               </div>
            ) : (
               <div style={{ fontSize: '48px', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center' }}>
                 {words[currentIndex]?.english}
               </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
             <button className="btn-secondary" onClick={() => setIsFlipped(!isFlipped)} style={{ flex: 1 }}>
               Lật thẻ (Flip)
             </button>
             <button className="btn-primary" onClick={() => { setIsFlipped(false); setCurrentIndex(curr => curr + 1); }} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
               Tiếp theo <ArrowRight size={18} />
             </button>
          </div>
        </div>
      )}

      {mode === 'match' && (
         <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Ghép từ Tiếng Anh với nghĩa Tiếng Việt (Matched: {matchedPairs.length}/{words.length})
            </div>

            {matchedPairs.length === words.length && words.length > 0 ? (
               <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                  <h2 style={{ marginBottom: '16px', fontSize: '28px', color: 'var(--success)' }}>Hoàn Thành!</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Bạn đã ghép đúng tất cả các từ.</p>
                  <button className="btn-primary" onClick={() => fetchGameWords().then(() => setMode('select'))}>
                    <RefreshCw size={18} style={{marginRight: '8px', display: 'inline'}} /> Menu
                  </button>
               </div>
            ) : (
               <div style={{ display: 'flex', gap: '16px' }}>
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leftItems.map((item) => {
                       const isMatched = matchedPairs.includes(item.id);
                       const isSelected = selectedLeft === item.id;
                       let bg = 'rgba(255,255,255,0.05)';
                       let border = 'rgba(255,255,255,0.1)';
                       if (isMatched) { bg = 'rgba(16, 185, 129, 0.1)'; border = 'rgba(16, 185, 129, 0.5)'; }
                       else if (isSelected && matchError) { bg = 'rgba(239, 68, 68, 0.2)'; border = 'rgba(239, 68, 68, 0.8)'; }
                       else if (isSelected) { bg = 'rgba(59, 130, 246, 0.2)'; border = 'rgba(59, 130, 246, 0.8)'; }

                       return (
                          <button 
                            key={`l-${item.id}`}
                            className="glass-panel"
                            style={{ 
                              padding: '16px', fontSize: '18px', fontWeight: 600, background: bg, border: `1px solid ${border}`,
                              opacity: isMatched ? 0.5 : 1, pointerEvents: isMatched ? 'none' : 'auto', cursor: 'pointer',
                              transition: 'all 0.2s', color: isMatched ? 'var(--success)' : 'var(--text-main)', textAlign: 'center'
                            }}
                            onClick={() => handleMatchClick('left', item.id)}
                          >
                            {item.text}
                          </button>
                       )
                    })}
                 </div>
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rightItems.map((item) => {
                       const isMatched = matchedPairs.includes(item.id);
                       const isSelected = selectedRight === item.id;
                       let bg = 'rgba(255,255,255,0.05)';
                       let border = 'rgba(255,255,255,0.1)';
                       if (isMatched) { bg = 'rgba(16, 185, 129, 0.1)'; border = 'rgba(16, 185, 129, 0.5)'; }
                       else if (isSelected && matchError) { bg = 'rgba(239, 68, 68, 0.2)'; border = 'rgba(239, 68, 68, 0.8)'; }
                       else if (isSelected) { bg = 'rgba(59, 130, 246, 0.2)'; border = 'rgba(59, 130, 246, 0.8)'; }

                       return (
                          <button 
                            key={`r-${item.id}`}
                            className="glass-panel"
                            style={{ 
                              padding: '16px', fontSize: '18px', fontWeight: 600, background: bg, border: `1px solid ${border}`,
                              opacity: isMatched ? 0.5 : 1, pointerEvents: isMatched ? 'none' : 'auto', cursor: 'pointer',
                              transition: 'all 0.2s', color: isMatched ? 'var(--success)' : 'var(--text-main)', textAlign: 'center'
                            }}
                            onClick={() => handleMatchClick('right', item.id)}
                          >
                            {item.text}
                          </button>
                       )
                    })}
                 </div>
               </div>
            )}
         </div>
      )}
    </div>
  );
}
