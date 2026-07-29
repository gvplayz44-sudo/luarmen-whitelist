import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: LandingPage
});

function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Username and password required');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: apiKey || username })
        });
        const data = await res.json();
        
        if (data.valid) {
          localStorage.setItem('luarmen_user', JSON.stringify({
            api_key: apiKey || username,
            plan: data.plan,
            username: data.username
          }));
          window.location.href = '/dashboard';
        } else {
          setError('Invalid credentials');
        }
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            password: password,
            api_key: apiKey || ''
          })
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem('luarmen_user', JSON.stringify({
            api_key: data.api_key,
            plan: data.plan,
            username: data.username
          }));
          window.location.href = '/dashboard';
        } else {
          setError(data.message || 'Signup failed');
        }
      }
    } catch (e) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      background: '#0a0c14', 
      minHeight: '100vh', 
      color: '#eef0f7', 
      fontFamily: 'Inter, sans-serif', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ 
        background: '#11141f', 
        border: '1px solid #1a1e2e', 
        borderRadius: '16px', 
        padding: '40px', 
        maxWidth: '440px', 
        width: '100%' 
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '28px' }}>
          <span style={{ color: '#e8c468' }}>Luar</span>men
        </h1>
        <p style={{ color: '#8b90a8', textAlign: 'center', marginBottom: '20px' }}>
          {isLogin ? 'Log in with your API key' : 'Create your account'}
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#0c0e18', 
            border: '1px solid #1a1e2e', 
            borderRadius: '8px', 
            color: '#eef0f7', 
            fontSize: '14px', 
            marginBottom: '12px' 
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#0c0e18', 
            border: '1px solid #1a1e2e', 
            borderRadius: '8px', 
            color: '#eef0f7', 
            fontSize: '14px', 
            marginBottom: '12px' 
          }}
        />

        {!isLogin && (
          <input
            type="text"
            placeholder="API Key (optional - leave blank for free)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#0c0e18', 
              border: '1px solid #1a1e2e', 
              borderRadius: '8px', 
              color: '#eef0f7', 
              fontSize: '14px', 
              marginBottom: '12px' 
            }}
          />
        )}

        {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}

        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#e8c468', 
            color: '#0a0c14', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
        </button>

        <p style={{ color: '#8b90a8', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#e8c468', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}
