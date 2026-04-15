import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import DailyGame from './pages/DailyGame';
import { BookOpen, Gamepad2, LogOut } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="app-container"><p>Loading...</p></div>;
  }

  return (
    <Router>
      <div className="app-container">
        {session && (
          <header className="header">
            <h1><BookOpen size={28} color="var(--primary)" /> Skynet Language</h1>
            <nav className="nav-links">
              <Link to="/" className="btn-secondary">Dictionary</Link>
              <Link to="/game" className="btn-secondary"><Gamepad2 size={16} style={{display: 'inline', marginBottom: '-2px'}}/> Daily Game</Link>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="btn-secondary"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </nav>
          </header>
        )}
        
        <Routes>
          <Route 
            path="/auth" 
            element={!session ? <Auth /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/" 
            element={session ? <Dashboard session={session} /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/game" 
            element={session ? <DailyGame session={session} /> : <Navigate to="/auth" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
