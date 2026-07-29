import React, { useState, useEffect } from 'react';

const KillSwitch: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [allowSourceView, setAllowSourceView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/owner/kill-switch');
        if (res.ok) {
          const data = await res.json();
          setIsEnabled(data.enabled || false);
        }

        const sourceRes = await fetch('/api/owner/source-view');
        if (sourceRes.ok) {
          const data = await sourceRes.json();
          setAllowSourceView(data.enabled || false);
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }
    };
    fetchStatus();
  }, []);

  const handleToggleKillSwitch = async () => {
    const confirmAction = window.confirm(isEnabled 
      ? 'Are you sure you want to ENABLE all scripts?' 
      : '⚠️ Are you sure you want to DISABLE ALL SCRIPTS?'
    );
    if (!confirmAction) return;

    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: userData.api_key, enabled: !isEnabled })
      });
      if (res.ok) {
        setIsEnabled(!isEnabled);
        alert(!isEnabled ? '⚠️ All scripts DISABLED!' : '✅ All scripts ENABLED!');
      }
    } catch (e) {
      console.error('Failed to toggle kill switch:', e);
      alert('❌ Failed to toggle kill switch');
    }
    setIsLoading(false);
  };

  const handleToggleSourceView = async () => {
    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/source-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: userData.api_key, enabled: !allowSourceView })
      });
      if (res.ok) {
        setAllowSourceView(!allowSourceView);
        alert(!allowSourceView 
          ? '✅ Source view ENABLED' 
          : '🔒 Source view DISABLED'
        );
      }
    } catch (e) {
      console.error('Failed to toggle source view:', e);
      alert('❌ Failed to toggle source view');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🔫 Global Kill Switch</h3>
      <p style={{ color: '#8b90a8', fontSize: '14px', marginBottom: '16px' }}>
        {isEnabled ? '🔴 All scripts are DISABLED' : '🟢 All scripts are ENABLED'}
      </p>
      <button 
        onClick={handleToggleKillSwitch} 
        disabled={isLoading} 
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          background: isEnabled ? '#3ddc84' : '#ff6b6b',
          color: isEnabled ? 'black' : 'white'
        }}
      >
        {isLoading ? 'Processing...' : isEnabled ? 'Enable All Scripts' : 'Disable All Scripts'}
      </button>

      <hr style={{ margin: '20px 0', borderColor: '#1a1e2e' }} />

      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>👁️ Source View Toggle</h3>
      <p style={{ color: '#8b90a8', fontSize: '14px', marginBottom: '16px' }}>
        {allowSourceView ? '✅ Anyone can view source in browser' : '🔒 Browser access shows "Not Authorized"'}
      </p>
      <button 
        onClick={handleToggleSourceView} 
        disabled={isLoading} 
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          background: allowSourceView ? '#ff6b6b' : '#3ddc84',
          color: allowSourceView ? 'white' : 'black'
        }}
      >
        {isLoading ? 'Processing...' : allowSourceView ? '🔒 Disable Source View' : '🌐 Enable Source View'}
      </button>
    </div>
  );
};

export default KillSwitch;
