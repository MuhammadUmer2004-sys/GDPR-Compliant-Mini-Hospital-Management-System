'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User as UserIcon, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please provide GDPR consent to proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '48px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            margin: '0 auto 20px',
            position: 'relative'
          }}>
            <img src="/shield.png" alt="Security" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>Hospital Privacy</h1>
          <p style={{ color: 'var(--secondary)', fontSize: '15px', fontWeight: '500' }}>Secure Management Dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
            <input 
              type="text" 
              placeholder="Username" 
              className="input" 
              style={{ paddingLeft: '40px' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              className="input" 
              style={{ paddingLeft: '40px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--secondary)', cursor: 'pointer', alignItems: 'flex-start' }}>
            <input 
              type="checkbox" 
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span>I acknowledge and consent to the hospital's data privacy policy and GDPR compliance.</span>
          </label>

          {error && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login to System'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--secondary)' }}>
          Authorized access only. All activities are logged.
        </p>
      </div>
    </div>
  );
}
