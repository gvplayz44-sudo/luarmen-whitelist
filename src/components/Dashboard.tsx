import React, { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('luarmen_user');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('luarmen_user');
    window.location.href = '/';
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0c14', color: '#eef0f7' }}>Loading...</div>;
  }

  return (
    <div style={{ background: '#0a0c14', minHeight: '100vh', color: '#eef0f7', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #1a1e2e' }}>
          <h1 style={{ fontSize: '24px' }}>Dashboard</h1>
          <div>
            <span style={{ marginRight: '16px' }}>Welcome, {user?.username}</span>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff6b6b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        <div style={{ padding: '20px', marginTop: '20px', background: '#11141f', borderRadius: '12px', border: '1px solid #1a1e2e' }}>
          <h2>Plan: {user?.plan || 'Free'}</h2>
          <p>API Key: {user?.api_key}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
