import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      if (!isSignUp) {
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
          localStorage.setItem('savedPassword', password);
        } else {
          localStorage.removeItem('savedEmail');
          localStorage.removeItem('savedPassword');
        }
      } else {
        setMessage({ type: 'success', text: 'Success! Please check your email for the confirmation link.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          {isSignUp ? 'Sign up to start saving your vocabulary.' : 'Log in to continue learning.'}
        </p>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-4px' }}>
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="remember" style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)' }}>
              Nhớ mật khẩu (Remember me)
            </label>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? 'Processing...' : (isSignUp ? <><UserPlus size={18}/> Sign Up</> : <><LogIn size={18} /> Log In</>)}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: '4px' }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
