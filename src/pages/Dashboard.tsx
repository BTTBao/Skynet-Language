import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function Dashboard({ session }: { session: any }) {
  const [words, setWords] = useState<any[]>([]);
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWords();
  }, [session]);

  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching words", error);
    else setWords(data || []);
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
            <label>Vietnamese Meaning</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. quả táo" 
              value={vietnamese}
              onChange={(e) => setVietnamese(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Add Word
          </button>
        </form>
      </div>

      <div className="word-list-container">
        <div className="word-table-header">
          <div>English Word</div>
          <div>Vietnamese Meaning</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>
        
        <div className="word-list" style={{ marginTop: '16px' }}>
          {words.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No words added yet. Start building your vocabulary!
            </div>
          ) : (
            words.map(word => (
              <div key={word.id} className="word-row glass-panel">
                <div className="word-english">{word.english}</div>
                <div className="word-vietnamese">{word.vietnamese}</div>
                <div className="word-actions" style={{ textAlign: 'right' }}>
                  <button onClick={() => deleteWord(word.id)} title="Delete word">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
