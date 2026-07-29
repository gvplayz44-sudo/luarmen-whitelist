import React from 'react';

interface SidebarProps {
  plan: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOwner: boolean;
  canUpload: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ plan, activeTab, setActiveTab, isOwner, canUpload }) => {
  const canGenerateKeys = ['basic', 'premium', 'pro', 'owner'].includes(plan);

  const ownerNavItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'scripts', label: '📜 All Scripts' },
    { id: 'upload', label: '📤 Upload Script' },
    { id: 'users', label: '👥 Users' },
    { id: 'killswitch', label: '🔫 Kill Switch' },
    { id: 'genkey', label: '🔑 Generate Key' },
    { id: 'profile', label: '👤 Profile' },
  ];

  const userNavItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'scripts', label: '📜 My Scripts' },
    ...(canUpload ? [{ id: 'upload', label: '📤 Upload Script' }] : []),
    ...(canGenerateKeys ? [{ id: 'genkey', label: '🔑 Generate Key' }] : []),
    { id: 'profile', label: '👤 Profile' },
  ];

  const navItems = isOwner ? ownerNavItems : userNavItems;

  return (
    <div style={{ width: '240px', background: '#11141f', borderRight: '1px solid #1a1e2e', padding: '20px', minHeight: '100vh' }}>
      <div style={{ paddingBottom: '20px', borderBottom: '1px solid #1a1e2e', marginBottom: '20px' }}>
        <h2 style={{ color: '#eef0f7' }}><span style={{ color: '#e8c468' }}>Luar</span>men</h2>
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          style={{
            width: '100%',
            padding: '12px 16px',
            textAlign: 'left',
            background: activeTab === item.id ? '#1f2937' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: activeTab === item.id ? '#eef0f7' : '#8b90a8',
            cursor: 'pointer',
            marginBottom: '4px',
            fontSize: '14px'
          }}
        >
          {item.label}
        </button>
      ))}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #1a1e2e', color: '#5c6178', fontSize: '12px' }}>
        Plan: <span style={{ color: '#eef0f7', fontWeight: 'bold' }}>{plan}</span>
      </div>
    </div>
  );
};

export default Sidebar;
