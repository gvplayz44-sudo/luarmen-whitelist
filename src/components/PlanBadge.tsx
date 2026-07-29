import React from 'react';

interface PlanBadgeProps {
  plan: string;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
  const planStyles: Record<string, { bg: string; text: string; emoji: string; label: string }> = {
    owner: { bg: '#e8c468', text: '#1a1206', emoji: '👑', label: 'Owner' },
    pro: { bg: '#a855f7', text: '#ffffff', emoji: '⭐', label: 'Pro' },
    premium: { bg: '#3b82f6', text: '#ffffff', emoji: '💎', label: 'Premium' },
    basic: { bg: '#22c55e', text: '#ffffff', emoji: '🔰', label: 'Basic' },
    free: { bg: '#6b7280', text: '#ffffff', emoji: '', label: 'Free' }
  };

  const style = planStyles[plan] || planStyles.free;

  return (
    <span style={{
      fontSize: '12px',
      fontWeight: 'bold',
      padding: '4px 12px',
      borderRadius: '20px',
      backgroundColor: style.bg,
      color: style.text
    }}>
      {style.emoji} {style.label}
    </span>
  );
};

export default PlanBadge;
