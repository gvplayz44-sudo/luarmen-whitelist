import React, { useState } from 'react';

interface UserCardProps {
  user: any;
  onUpdate?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [plan, setPlan] = useState(user.plan || 'free');
  const isOwner = user.plan === 'owner' || user.username === 'yathush';

  const handlePlanChange = async (newPlan: string) => {
    if (isOwner) {
      alert('❌ Cannot modify owner account!');
      return;
    }
    
    setIsUpdating(true);
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: userData.api_key, 
          user_id: user.id, 
          plan: newPlan 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPlan(newPlan);
        alert(`✅ Plan changed to ${newPlan}`);
        if (onUpdate) onUpdate();
        window.location.reload();
      } else {
        alert('❌ ' + (data.error || 'Failed to change plan'));
      }
    } catch (e) { 
      console.error('Failed to change plan:', e);
      alert('❌ Failed to change plan');
    }
    setIsUpdating(false);
  };

  const handleWhitelist = async () => {
    if (isOwner) {
      alert('❌ Cannot modify owner account!');
      return;
    }
    
    const days = prompt('Days to whitelist (leave blank for permanent):');
    const duration = days ? parseInt(days) : 0;
    if (days && isNaN(duration as number)) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: userData.api_key, 
          user_id: user.id, 
          plan: 'premium', 
          duration_days: duration 
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ User whitelisted${duration ? ` for ${duration} days` : ' (permanent)'}!`);
        if (onUpdate) onUpdate();
        window.location.reload();
      } else {
        alert('❌ ' + (data.error || 'Failed to whitelist'));
      }
    } catch (e) { 
      console.error('Failed to whitelist:', e);
      alert('❌ Failed to whitelist');
    }
  };

  const handleBlacklist = async () => {
    if (isOwner) {
      alert('❌ Cannot modify owner account!');
      return;
    }
    
    const reason = prompt('Reason for blacklist:');
    if (reason === null) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch('/api/owner/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: userData.api_key, 
          user_id: user.id, 
          reason: reason || 'No reason provided' 
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ User blacklisted and revoked to FREE plan!');
        if (onUpdate) onUpdate();
        window.location.reload();
      } else {
        alert('❌ ' + (data.error || 'Failed to blacklist'));
      }
    } catch (e) { 
      console.error('Failed to blacklist:', e);
      alert('❌ Failed to blacklist');
    }
  };

  const handleUnblacklist = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch(`/api/owner/blacklist?api_key=${userData.api_key}&user_id=${user.id}`, { 
        method: 'DELETE' 
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ User removed from blacklist!');
        if (onUpdate) onUpdate();
        window.location.reload();
      } else {
        alert('❌ ' + (data.error || 'Failed to unblacklist'));
      }
    } catch (e) { 
      console.error('Failed to unblacklist:', e);
      alert('❌ Failed to unblacklist');
    }
  };

  const handleDelete = async () => {
    if (isOwner) {
      alert('❌ Cannot delete owner account!');
      return;
    }
    
    if (!confirm(`⚠️ Delete user "${user.username}"? This CANNOT be undone!`)) return;
    try {
      const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
      const res = await fetch(`/api/owner/delete-user?api_key=${userData.api_key}&user_id=${user.id}`, { 
        method: 'DELETE' 
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ User deleted successfully!');
        if (onUpdate) onUpdate();
        window.location.reload();
      } else {
        alert('❌ ' + (data.error || 'Failed to delete user'));
      }
    } catch (e) { 
      console.error('Failed to delete user:', e);
      alert('❌ Failed to delete user');
    }
  };

  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#eef0f7', fontWeight: 'bold' }}>{user.username || 'Unknown'}</span>
          <span style={{ 
            fontSize: '12px', 
            padding: '2px 12px', 
            borderRadius: '20px', 
            background: plan === 'owner' ? '#e8c468' : '#1f2937', 
            color: plan === 'owner' ? 'black' : '#eef0f7' 
          }}>
            {plan.toUpperCase()}
          </span>
          {isOwner && <span style={{ fontSize: '12px', background: '#e8c468', color: 'black', padding: '2px 8px', borderRadius: '4px' }}>👑 OWNER</span>}
        </div>
        {user.blacklisted && <div style={{ color: '#ff6b6b', fontSize: '12px' }}>🚫 Blacklisted: {user.blacklist_reason || 'No reason'}</div>}
        {user.whitelisted && !user.blacklisted && <div style={{ color: '#3ddc84', fontSize: '12px' }}>✅ Whitelisted</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!isOwner && (
          <>
            <select 
              value={plan} 
              onChange={(e) => handlePlanChange(e.target.value)} 
              disabled={isUpdating} 
              style={{ background: '#1f2937', color: '#eef0f7', border: '1px solid #1a1e2e', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
            {!user.whitelisted && !user.blacklisted && (
              <button onClick={handleWhitelist} style={{ padding: '4px 12px', background: '#3ddc84', border: 'none', borderRadius: '6px', color: 'black', cursor: 'pointer', fontSize: '12px' }}>
                ✅ Whitelist
              </button>
            )}
            {user.blacklisted ? (
              <button onClick={handleUnblacklist} style={{ padding: '4px 12px', background: '#3ddc84', border: 'none', borderRadius: '6px', color: 'black', cursor: 'pointer', fontSize: '12px' }}>
                🔓 Unblacklist
              </button>
            ) : (
              <button onClick={handleBlacklist} style={{ padding: '4px 12px', background: '#ff6b6b', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>
                🚫 Blacklist
              </button>
            )}
            <button onClick={handleDelete} style={{ padding: '4px 12px', background: '#ff6b6b', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>
              🗑 Delete
            </button>
          </>
        )}
        {isOwner && (
          <span style={{ padding: '4px 12px', background: '#e8c468/20', color: '#e8c468', borderRadius: '6px', fontSize: '12px' }}>🔒 Protected</span>
        )}
      </div>
    </div>
  );
};

export default UserCard;
