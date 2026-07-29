import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
        <span style={{ color: '#8b90a8', fontSize: '14px' }}>{title}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eef0f7', marginTop: '4px' }}>{value}</div>
    </div>
  );
};

export default StatsCard;
