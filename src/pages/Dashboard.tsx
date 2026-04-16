import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Volume2, BookOpen, EyeOff } from 'lucide-react';

export default function Dashboard({ session }: { session: any }) {
  const [words, setWords] = useState<any[]>([]);
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    fetchWords();
  }, [session]);

  useEffect(() => {
    const translateWord = async () => {
      if (english.trim().length > 1) {
        setIsTranslating(true);
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(english.trim())}&langpair=en|vi`);
          const data = await res.json();
          if (data && data.responseData && data.responseData.translatedText) {
            setVietnamese(data.responseData.translatedText);
          }
        } catch (e) {
          console.error("Translation error:", e);
        }
        setIsTranslating(false);
      } else if (english.trim().length === 0) {
        setVietnamese('');
      }
    };
    
    // Add debounce
    const timeoutId = setTimeout(translateWord, 800);
    return () => clearTimeout(timeoutId);
  }, [english]);

  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching words", error);
    else {
      setWords(data || []);
      setRevealedWords(new Set()); // Reset revealed words on fetch
    }
  };

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !vietnamese.trim()) return;
    
    setLoading(true);
    const { error } = await supabase.from('words').insert([
      { 
        user_id: session.user.id, 
        english: english.trim(), 
        vietnamese: vietnamese.trim() 
      }
    ]);

    if (error) {
      console.error("Error adding word", error);
      alert("Error adding word");
    } else {
      setEnglish('');
      setVietnamese('');
      fetchWords();
    }
    setLoading(false);
  };

  const deleteWord = async (id: string) => {
    const { error } = await supabase.from('words').delete().eq('id', id);
    if (!error) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser doesn't support text to speech!");
    }
  };

  const toggleReveal = (id: string) => {
    if (!isLearningMode) return;
    setRevealedWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <form onSubmit={addWord} className="add-word-form">
          <div className="form-group">
            <label>English Word</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. apple" 
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Vietnamese Meaning {isTranslating && <span style={{ fontSize: '12px', color: 'var(--primary)', marginLeft: '8px' }}>(Translating...)</span>}</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. quả táo" 
              value={vietnamese}
              onChange={(e) => setVietnamese(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={20} /> Add Word
          </button>
        </form>
      </div>

      <div className="word-list-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', marginBottom: '16px' }}>
          <div className="word-table-header" style={{ padding: 0, width: '100%', flex: 1 }}>
            <div>English Word</div>
            <div>Vietnamese Meaning</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          
          <button 
            className={`btn-secondary ${isLearningMode ? 'learning-active' : ''}`}
            onClick={() => {
              setIsLearningMode(!isLearningMode);
              setRevealedWords(new Set()); // Hide all when toggling
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '14px',
              background: isLearningMode ? 'var(--primary)' : 'var(--glass-bg)',
              color: isLearningMode ? 'white' : 'var(--text-main)',
              border: 'none', marginLeft: '16px'
            }}
          >
            {isLearningMode ? <EyeOff size={16}/> : <BookOpen size={16}/>}
            {isLearningMode ? 'Stop Learning' : 'Learn Mode'}
          </button>
        </div>
        
        <div className="word-list">
          {words.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No words added yet. Start building your vocabulary!
            </div>
          ) : (
            words.map(word => {
              const hidden = isLearningMode && !revealedWords.has(word.id);
              
              return (
                <div key={word.id} className="word-row glass-panel">
                  <div className="word-english" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => playAudio(word.english)} 
                      style={{ background: 'none', color: 'var(--primary)', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Listen"
                    >
                      <Volume2 size={18} />
                    </button>
                    {word.english}
                  </div>
                  
                  <div 
                    className="word-vietnamese" 
                    onClick={() => toggleReveal(word.id)}
                    style={{ 
                      cursor: isLearningMode ? 'pointer' : 'default',
                      filter: hidden ? 'blur(6px)' : 'none',
                      opacity: hidden ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      userSelect: hidden ? 'none' : 'auto',
                      padding: isLearningMode ? '8px 0' : '0'
                    }}
                    title={hidden ? "Click to reveal meaning" : ""}
                  >
                    {word.vietnamese}
                  </div>
                  
                  <div className="word-actions" style={{ textAlign: 'right' }}>
                    <button onClick={() => deleteWord(word.id)} title="Delete word">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
