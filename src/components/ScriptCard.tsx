import React, { useState } from 'react';

interface ScriptCardProps {
  script: any;
  plan: string;
  onToggle?: (id: string) => void;
  onToggleKeyless?: (id: string) => void;
  onDelete?: (id: string) => void;
  showSource?: boolean;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  plan,
  onToggle,
  onToggleKeyless,
  onDelete,
  showSource = false
}) => {
  const [showSourceCode, setShowSourceCode] = useState(false);

  const canToggle = ['owner', 'premium', 'pro', 'basic'].includes(plan);
  const canToggleKeyless = ['owner', 'premium', 'pro'].includes(plan);

  const handleCopy = () => {
    const loadstring = `script_key="${script.script_key}"; loadstring(game:HttpGet("https://api.luarmen.lovable.app${script.loader_path}"))()`;
    navigator.clipboard.writeText(loadstring);
    alert('Loadstring copied!');
  };

  return (
    <div style={{ background: '#11141f', border: '1px solid #1a1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ color: '#eef0f7', margin: 0 }}>{script.script_name || 'Unnamed Script'}</h4>
          <div style={{ color: '#5c6178', fontSize: '12px', marginTop: '4px' }}>ID: {script.script_key?.substring(0, 8)}...</div>
          <div style={{ color: '#5c6178', fontSize: '12px' }}>📥 {script.downloads || 0} downloads</div>
        </div>
        <span style={{ 
          fontSize: '12px', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          background: script.enabled ? '#3ddc84/20' : '#ff6b6b/20', 
          color: script.enabled ? '#3ddc84' : '#ff6b6b' 
        }}>
          {script.enabled ? '✅ Active' : '❌ Disabled'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        <button onClick={handleCopy} style={{ padding: '4px 12px', background: '#1f2937', border: 'none', borderRadius: '6px', color: '#eef0f7', cursor: 'pointer', fontSize: '12px' }}>
          📋 Copy
        </button>
        {canToggle && onToggle && (
          <button onClick={() => onToggle(script.id)} style={{ 
            padding: '4px 12px', 
            background: script.enabled ? '#ff6b6b' : '#3ddc84', 
            border: 'none', 
            borderRadius: '6px', 
            color: script.enabled ? 'white' : 'black', 
            cursor: 'pointer', 
            fontSize: '12px' 
          }}>
            {script.enabled ? 'Disable' : 'Enable'}
          </button>
        )}
        {canToggleKeyless && onToggleKeyless && (
          <button onClick={() => onToggleKeyless(script.id)} style={{ 
            padding: '4px 12px', 
            background: script.keyless_mode ? '#e8c468' : '#1f2937', 
            border: 'none', 
            borderRadius: '6px', 
            color: script.keyless_mode ? 'black' : '#eef0f7', 
            cursor: 'pointer', 
            fontSize: '12px' 
          }}>
            {script.keyless_mode ? '🔓 Keyless OFF' : '🔒 Keyless ON'}
          </button>
        )}
        {(plan === 'owner' || onDelete) && (
          <button onClick={() => onDelete?.(script.id)} style={{ padding: '4px 12px', background: '#ff6b6b', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>
            🗑 Delete
          </button>
        )}
        {showSource && (
          <button onClick={() => setShowSourceCode(!showSourceCode)} style={{ padding: '4px 12px', background: '#1f2937', border: 'none', borderRadius: '6px', color: '#eef0f7', cursor: 'pointer', fontSize: '12px' }}>
            📄 Source
          </button>
        )}
      </div>

      {showSourceCode && script.source_code && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#0a0c14', border: '1px solid #1a1e2e', borderRadius: '8px', maxHeight: '200px', overflow: 'auto' }}>
          <pre style={{ color: '#8b90a8', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{script.source_code}</pre>
        </div>
      )}
    </div>
  );
};

export default ScriptCard;
