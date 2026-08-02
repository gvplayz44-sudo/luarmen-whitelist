import React, { useState, useEffect, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
interface Script {
  id: string;
  script_name: string;
  script_key: string;
  loader_path: string;
  enabled: boolean;
  keyless_mode: boolean;
  downloads: number;
  created_at: string;
  source_code?: string;
}

interface SubKey {
  id: string;
  key: string;
  plan: string;
  duration_days: number;
  expires_at: string;
  is_active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  profiles?: { username: string };
}

interface User {
  id: string;
  username: string;
  plan: string;
  whitelisted: boolean;
  blacklisted: boolean;
  email: string;
  created_at: string;
  blacklist_reason?: string;
}

interface Stats {
  total_scripts: number;
  total_downloads: number;
  active_keys: number;
  total_keys: number;
}

interface UserPlan {
  plan: string;
  daysRemaining: number | null;
  expiresAt: string | null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const Dashboard: React.FC = () => {
  // ----- State -----
  const [activePage, setActivePage] = useState("dashboard");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_scripts: 0,
    total_downloads: 0,
    active_keys: 0,
    total_keys: 0,
  });
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [username, setUsername] = useState("John Doe");
  const [apiKey, setApiKey] = useState("");
  const [subKeys, setSubKeys] = useState<SubKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [whitelistKeys, setWhitelistKeys] = useState<SubKey[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingScriptCode, setEditingScriptCode] = useState("");
  const [editingScriptName, setEditingScriptName] = useState("New Script");
  const [redeemKey, setRedeemKey] = useState("");
  const [wlScript, setWlScript] = useState("");
  const [wlUsername, setWlUsername] = useState("");
  const [genPlan, setGenPlan] = useState("Basic");
  const [genDays, setGenDays] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("No API key generated");
  const [showDiscordSetup, setShowDiscordSetup] = useState(false);
  const [selectedServer, setSelectedServer] = useState("Luarmen Community");
  const [botInstalled, setBotInstalled] = useState(false);
  const [showObfuscation, setShowObfuscation] = useState(false);
  const [obfPercent, setObfPercent] = useState(0);
  const [obfStatus, setObfStatus] = useState("Preparing secure protection layers…");
  const [showTermsNotice, setShowTermsNotice] = useState(true);
  const [showTermsViewer, setShowTermsViewer] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [activationPercent, setActivationPercent] = useState(0);
  const [activationStep2, setActivationStep2] = useState(false);
  const [activationStep3, setActivationStep3] = useState(false);
  const [pendingScriptName, setPendingScriptName] = useState("");
  const [pendingScriptCode, setPendingScriptCode] = useState("-- Your Lua script here...");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [editorStep, setEditorStep] = useState(1);

  // Editor toggles
  const [editorToggles, setEditorToggles] = useState({
    ffa: false,
    silent: false,
    heartbeat: true,
    lightning: true,
    v4: true,
    verified: false,
  });

  // Refs
  const luaCodeRef = useRef<HTMLTextAreaElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const scriptSelectRef = useRef<HTMLSelectElement>(null);
  const whitelistInputRef = useRef<HTMLInputElement>(null);

  // User from localStorage
  const user = JSON.parse(localStorage.getItem("luarmen_user") || "{}");
  const isOwner = user.username === "yathush098" || userPlan?.plan === "owner";

  // ----- Toast -----
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3200);
  };

  // ----- Fetch data -----
  useEffect(() => {
    if (!user.api_key) {
      window.location.href = "/";
      return;
    }
    setUsername(user.username || "John Doe");
    setApiKey(user.api_key);

    const fetchData = async () => {
      try {
        const scriptsRes = await fetch(`/api/scripts?api_key=${user.api_key}`);
        const scriptsData = await scriptsRes.json();
        if (scriptsData.scripts) setScripts(scriptsData.scripts);

        const statsRes = await fetch(`/api/stats?api_key=${user.api_key}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const planRes = await fetch(`/api/user/plan?api_key=${user.api_key}`);
        let planData = await planRes.json();
        if (user.username === "yathush098") {
          planData.plan = "owner";
          planData.daysRemaining = null;
        }
        setUserPlan(planData);

        const discordRes = await fetch(`/api/user/all-connections`);
        const discordData = await discordRes.json();
        if (discordData.connections) {
          const conn = discordData.connections.find((c: any) => c.api_key === user.api_key);
          if (conn) {
            setDiscordConnected(true);
            setDiscordUsername(conn.discord_username || "Discord User");
          }
        }

        if (isOwner) {
          const keysRes = await fetch(`/api/owner/subscription-keys?api_key=${user.api_key}`);
          const keysData = await keysRes.json();
          if (keysData.keys) setSubKeys(keysData.keys);

          const usersRes = await fetch(`/api/owner/all-users?api_key=${user.api_key}`);
          const usersData = await usersRes.json();
          if (usersData.users) setUsers(usersData.users);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ----- Navigation -----
  const showPage = (page: string) => {
    setActivePage(page);
  };

  // ----- SCRIPT CRUD (upload only after obfuscation) -----
  const createScriptOnServer = async (name: string, code: string) => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: user.api_key,
          script_name: name,
          source_code: code,
          keyless_mode: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScripts([data.script, ...scripts]);
        showToast("Script created and protected!");
        return true;
      } else {
        showToast(data.error || "Failed to create script", "error");
        return false;
      }
    } catch (err) {
      showToast("Failed to create script", "error");
      return false;
    }
  };

  const saveScript = async () => {
    if (!editingScriptId) return;
    try {
      const res = await fetch(`/api/script/${editingScriptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: user.api_key,
          source_code: editingScriptCode,
        }),
      });
      if (res.ok) {
        setScripts(scripts.map(s => s.id === editingScriptId ? { ...s, source_code: editingScriptCode } : s));
        setShowEditor(false);
        setEditingScriptId(null);
        showToast("Script saved!");
        const statsRes = await fetch(`/api/stats?api_key=${user.api_key}`);
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to save script", "error");
      }
    } catch (err) {
      showToast("Failed to save script", "error");
    }
  };

  const deleteScript = async (id: string) => {
    if (!confirm("Delete this script?")) return;
    try {
      const res = await fetch(`/api/script/${id}?api_key=${user.api_key}`, { method: "DELETE" });
      if (res.ok) {
        setScripts(scripts.filter(s => s.id !== id));
        showToast("Script deleted");
        const statsRes = await fetch(`/api/stats?api_key=${user.api_key}`);
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to delete script", "error");
      }
    } catch (err) {
      showToast("Failed to delete script", "error");
    }
  };

  const toggleScript = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/script/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: user.api_key, script_id: id, enabled: !current }),
      });
      if (res.ok) {
        setScripts(scripts.map(s => s.id === id ? { ...s, enabled: !current } : s));
        showToast(`Script ${!current ? "enabled" : "disabled"}`);
      } else {
        showToast("Failed to toggle script", "error");
      }
    } catch (err) {
      showToast("Failed to toggle script", "error");
    }
  };

  const toggleKeyless = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/script/keyless", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: user.api_key, script_id: id, keyless_mode: !current }),
      });
      if (res.ok) {
        setScripts(scripts.map(s => s.id === id ? { ...s, keyless_mode: !current } : s));
        showToast(`Keyless mode ${!current ? "enabled" : "disabled"}`);
      } else {
        showToast("Failed to toggle keyless mode", "error");
      }
    } catch (err) {
      showToast("Failed to toggle keyless mode", "error");
    }
  };

  const copyScript = (script: Script) => {
    const loadstring = `script_key="${script.script_key}"; loadstring(game:HttpGet("https://luarmen.up.railway.app${script.loader_path}"))()`;
    navigator.clipboard.writeText(loadstring);
    showToast("Loadstring copied to clipboard!");
  };

  // ----- WHITELIST -----
  const generateWhitelistKey = () => {
    const scriptEl = document.getElementById("scriptSelect") as HTMLSelectElement;
    const script = scriptEl?.value || "";
    const userInput = (document.querySelector("#whitelist .input") as HTMLInputElement)?.value || "";
    if (script === "Select script..." || !userInput) {
      showToast("Select a script and enter a username", "error");
      return;
    }
    const key = "LG-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const newKey = {
      id: Date.now().toString(),
      key,
      plan: "basic",
      duration_days: 0,
      expires_at: "Never",
      is_active: true,
      used_by: null,
      used_at: null,
      created_at: new Date().toISOString(),
      profiles: { username: userInput },
    };
    setWhitelistKeys([newKey, ...whitelistKeys]);
    const keyBody = document.getElementById("keyBody");
    if (keyBody) {
      keyBody.className = "";
      keyBody.innerHTML = `<div class="table-head" style="height:52px;border:0;color:#d6e1ec;font-size:12px;letter-spacing:0"><span>${key}</span><span>${script}</span><span>${userInput}</span><span>Never</span><span><b style="color:#1be1b3">Active</b></span><span>•••</span></div>`;
    }
    const totalCount = document.getElementById("totalCount");
    const activeCount = document.getElementById("activeCount");
    const profileKeyCount = document.getElementById("profileKeyCount");
    const whiteActive = document.getElementById("whiteActive");
    const whiteUsers = document.getElementById("whiteUsers");
    const scriptMetricKeys = document.getElementById("scriptMetricKeys");
    if (totalCount) totalCount.textContent = String(Number(totalCount.textContent) + 1);
    if (activeCount) activeCount.textContent = String(Number(activeCount.textContent) + 1);
    if (profileKeyCount) profileKeyCount.textContent = String(Number(profileKeyCount.textContent) + 1);
    if (whiteActive) whiteActive.textContent = String(Number(whiteActive.textContent) + 1);
    if (whiteUsers) whiteUsers.textContent = String(Number(whiteUsers.textContent) + 1);
    if (scriptMetricKeys) scriptMetricKeys.textContent = String(Number(scriptMetricKeys.textContent) + 1);
    showToast("Whitelist key generated!");
  };

  // ----- SUBSCRIPTION KEY GENERATION (owner only) -----
  const generateSubKey = async (plan: string, days: number) => {
    if (!isOwner) {
      showToast("Only owners can generate subscription keys", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/owner/generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: user.api_key,
          plan: plan.toLowerCase(),
          duration_days: days,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubKeys([data, ...subKeys]);
        const genTotal = document.getElementById("generatedTotal");
        const genActive = document.getElementById("generatedActive");
        if (genTotal) genTotal.textContent = String(subKeys.length + 1);
        if (genActive) genActive.textContent = String(subKeys.filter(k => k.is_active).length + 1);
        const keysContainer = document.getElementById("generatedKeys");
        if (keysContainer) {
          keysContainer.className = "";
          keysContainer.innerHTML = subKeys.map(k =>
            `<div class="generated-row"><span>${k.key}</span><span>${k.plan}</span><span>${k.duration_days} days</span><span style="color:${k.is_active ? '#19e2a0' : '#ff5c5c'}">${k.is_active ? 'Active' : 'Used'}</span><span>${k.profiles?.username || 'Not redeemed'}</span><span><button onclick="navigator.clipboard?.writeText('${k.key}');toast('Subscription key copied','success')">⧉</button></span></div>`
          ).join("");
        }
        showToast(`Subscription key generated: ${data.key}`);
      } else {
        showToast(data.error || "Failed to generate key", "error");
      }
    } catch (err) {
      showToast("Failed to generate key", "error");
    } finally {
      setGenerating(false);
    }
  };

  // ----- REDEEM -----
  const redeemPlan = async () => {
    if (!redeemKey.trim()) {
      showToast("Enter a subscription key first", "error");
      return;
    }
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: user.api_key, key: redeemKey }),
      });
      const data = await res.json();
      if (data.success) {
        startActivation();
        setRedeemKey("");
        const planRes = await fetch(`/api/user/plan?api_key=${user.api_key}`);
        const planData = await planRes.json();
        if (user.username === "yathush098") planData.plan = "owner";
        setUserPlan(planData);
      } else {
        showToast(data.error || "Failed to redeem", "error");
      }
    } catch (err) {
      showToast("Failed to redeem", "error");
    }
  };

  const startActivation = () => {
    setShowActivation(true);
    setActivationPercent(0);
    setActivationStep2(false);
    setActivationStep3(false);
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 2);
      setActivationPercent(p);
      if (p >= 35) setActivationStep2(true);
      if (p >= 70) setActivationStep3(true);
      if (p === 100) {
        clearInterval(timer);
        setTimeout(() => {
          setShowActivation(false);
          showToast("Subscription key redeemed successfully!", "success");
          showPage("dashboard");
        }, 900);
      }
    }, 100);
  };

  // ----- DISCORD SETUP -----
  const openDiscordSetup = () => {
    setShowDiscordSetup(true);
    setActivePage("discordIntegration");
  };
  const closeDiscordSetup = () => setShowDiscordSetup(false);
  const beginBotSetup = () => {
    setShowDiscordSetup(true);
    showToast("Discord account linked", "success");
  };
  const finishDiscordSetup = () => {
    closeDiscordSetup();
    showPage("dashboard");
    showToast("Luarmen bot setup complete", "success");
  };
  const selectServer = (name: string) => {
    setSelectedServer(name);
    setBotInstalled(false);
  };
  const confirmBot = () => {
    setBotInstalled(true);
    showToast("Bot installation confirmed", "success");
  };

  // ----- TERMS & OBFUSCATION -----
  const openTerms = () => setShowTermsViewer(true);
  const closeTerms = () => setShowTermsViewer(false);
  const agreeTerms = () => {
    setShowTermsNotice(false);
    setShowTermsViewer(false);
    showToast("Terms of Service accepted", "success");
  };

  const startObfuscation = () => {
    if (!pendingScriptName) return;
    setShowObfuscation(true);
    setObfPercent(0);
    const statuses = [
      "Preparing secure protection layers…",
      "Encrypting Lua source…",
      "Binding whitelist access control…",
      "Optimizing protected loader…",
      "Finalizing secure build…",
    ];
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 1);
      setObfPercent(percent);
      setObfStatus(statuses[Math.min(statuses.length - 1, Math.floor(percent / 21))]);
      if (percent === 100) {
        clearInterval(timer);
        setTimeout(() => {
          setShowObfuscation(false);
          finishScript();
        }, 450);
      }
    }, 100);
  };

  const nextStudioStep = () => {
    if (editorStep === 1) {
      // Save the source code from textarea
      if (luaCodeRef.current) {
        setPendingScriptCode(luaCodeRef.current.value);
        setEditingScriptCode(luaCodeRef.current.value);
      }
      setEditorStep(2);
      showToast("Source saved — configure protection options", "success");
    } else if (editorStep === 2) {
      startObfuscation();
    }
  };

  // ----- API KEY -----
  const generateApiKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
    setApiKeyValue("sk_" + token);
    showToast("New API key generated", "success");
  };
  const copyApiKey = () => {
    if (!apiKeyValue.startsWith("sk_")) {
      showToast("Generate an API key first", "error");
      return;
    }
    navigator.clipboard?.writeText(apiKeyValue).catch(() => {});
    showToast("API key copied", "success");
  };

  // ----- MODALS (New Script & Editor) -----
  const openNew = () => {
    setEditingIndex(null);
    setNewScriptName("");
    setPendingScriptName("");
    setPendingScriptCode("-- Your Lua script here...");
    setShowModal(true);
    setTimeout(() => {
      const input = document.getElementById("newName") as HTMLInputElement;
      if (input) input.focus();
    }, 10);
  };
  const closeNew = () => setShowModal(false);
  const cancelEditor = () => {
    setShowEditor(false);
    setEditingScriptId(null);
    setPendingScriptName("");
    setEditorStep(1);
  };

  const selectTemplate = (type: string) => {
    setSelectedTemplate(type);
    const templates: any = {
      blank: "-- Paste your Lua script here...\n",
      hello: "-- Luarmen protected Lua script\nlocal function main()\n    print('Hello World!')\nend\n\nmain()",
      module: "-- Luarmen module\nlocal Module = {}\n\nfunction Module.start()\n    -- Your protected code here\nend\n\nreturn Module",
    };
    const code = templates[type] || templates.blank;
    setPendingScriptCode(code);
    if (luaCodeRef.current) luaCodeRef.current.value = code;
  };

  const finishScript = async () => {
    if (!pendingScriptName) return;
    // Upload the script to server only now (after obfuscation)
    const success = await createScriptOnServer(pendingScriptName, pendingScriptCode);
    if (success) {
      setShowEditor(false);
      setEditingIndex(null);
      setPendingScriptName("");
      setEditorStep(1);
      renderScripts();
      showPage("scripts");
      showToast("Script created and protected", "success");
    }
  };

  const renderScripts = () => {
    const list = document.getElementById("scriptList");
    const dash = document.getElementById("dashScriptList");
    const select = document.getElementById("scriptSelect");
    if (select) {
      select.innerHTML = `<option>Select script...</option>` + scripts.map(s => `<option>${s.script_name}</option>`).join("");
    }
    // The actual rendering is done in JSX below, but this helps with dynamic updates
  };

  // ----- HELPER -----
  const escapeHTML = (s: string) => {
    return s.replace(/[&<>'"]/g, (c) => {
      const map: any = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
      return map[c];
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#070d18", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0f4fa" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "30px", height: "30px", border: "2px solid #13d7f2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#71809a" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▥", section: "WORKSPACE" },
    { id: "scripts", label: "Scripts", icon: "♧", section: "WORKSPACE" },
    { id: "whitelist", label: "Whitelist", icon: "⚿", section: "WORKSPACE" },
    { id: "users", label: "Users", icon: "♧", section: "WORKSPACE", ownerOnly: true },
    { id: "setup", label: "Setup", icon: "⌘", section: "TOOLS" },
    { id: "generate", label: "Generate", icon: "⚿", section: "TOOLS", ownerOnly: true },
    { id: "profile", label: "Profile", icon: "◉", section: "TOOLS" },
    { id: "settings", label: "Settings", icon: "⚙", section: "TOOLS" },
  ];

  const visibleNavItems = navItems.filter(item => !item.ownerOnly || isOwner);

  return (
    <div style={{ minHeight: "100vh", background: "#070d18", color: "#f0f4fa", font: "13px Inter, ui-sans-serif, sans-serif" }}>
      {/* ============ ALL CSS (exactly as your HTML) ============ */}
      <style>{`
        :root{--bg:#070d18;--side:#0c1424;--panel:#0c1526;--panel2:#0a1221;--line:#1b2940;--muted:#71809a;--text:#f0f4fa;--cyan:#13d7f2;--cyan2:#05b9dc;--blue:#1598df}
        *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font:13px Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .app{min-height:100vh;display:flex;background:radial-gradient(800px 500px at 80% 20%,#08132460,transparent 70%),var(--bg)}
        aside{position:fixed;inset:0 auto 0 0;width:209px;background:linear-gradient(90deg,#0d1627,#0b1322);border-right:1px solid var(--line);display:flex;flex-direction:column;z-index:5}
        .brand{height:77px;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 27px;gap:14px}.shield{width:21px;height:24px;border:2px solid var(--cyan);border-radius:8px 8px 10px 10px;box-shadow:0 0 22px #00d8f199;position:relative}.shield:after{content:"";position:absolute;width:5px;height:7px;border:1px solid #29e9ff;border-top:0;border-left:0;transform:rotate(45deg);left:6px;top:5px}.brand strong{font-size:15px;color:#21d7ee;letter-spacing:-.4px}.brand small{display:block;font-size:9px;color:#8290a8;margin-top:1px}
        nav{padding:21px 12px} .nav{width:100%;border:1px solid transparent;border-radius:13px;height:40px;background:transparent;color:#8390a6;text-align:left;display:flex;gap:13px;align-items:center;padding:0 13px;margin:0 0 1px;cursor:pointer;font:inherit;transition:height .2s ease,transform .2s ease,background .2s ease,border-color .2s ease}.nav:hover{background:#101c2f;color:#c8d4e2}.nav.active{height:46px;transform:scale(1.02);color:#16d6f2;border-color:#00b9d6;background:linear-gradient(90deg,#0b2b39,#0d2936);box-shadow:inset 0 0 18px #00cde52e,0 0 12px #00d4ed18;font-weight:600}.ico{width:14px;height:14px;opacity:.9;display:inline-grid;place-items:center;font-size:17px;font-family:Arial}.dot{margin-left:auto;width:5px;height:5px;background:#10d6f2;border-radius:50%;box-shadow:0 0 8px #00e5ff}
        .profile{border-top:1px solid var(--line);margin-top:auto;height:75px;padding:0 27px;display:flex;align-items:center;gap:11px}.avatar{height:26px;width:26px;border-radius:50%;background:#202a3c;display:grid;place-items:center;font-size:9px;font-weight:700}.who{line-height:1.4}.who b{font-size:11px;font-weight:600}.who span{display:block;color:#8490a5;font-size:10px}.logout{margin-left:auto;color:#7d8ba1;font-size:17px}
        main{margin-left:209px;width:calc(100% - 209px);min-height:100vh;overflow-y:auto}.top{min-height:54px;border-bottom:1px solid var(--line);padding:6px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px}.top h1{font-size:20px;margin:0;font-weight:750;letter-spacing:-.5px}.quick-actions{display:flex;align-items:center;gap:8px}.quick-pill{height:30px;border:1px solid #19344e;border-radius:9px;background:#0a1728;color:#cbd7e6;padding:0 12px;display:inline-flex;align-items:center;gap:7px;font-size:12px;white-space:nowrap;font-weight:600}.quick-pill .cyan{color:#0ad7f2;font-size:17px}.quick-pill .soft{color:#8193aa;font-weight:500}.quick-pill.discord{color:#12bdf0;border-color:#006397;background:#062a46}.quick-pill.plain{background:#0a1322}.quick-pill:hover{border-color:#12cde9;box-shadow:0 0 12px #0bcce334;color:#fff}.page{padding:26px;max-width:1600px}.card{background:linear-gradient(105deg,#0c1526,#0a1425);border:1px solid #1a2a43;border-radius:10px;overflow:hidden;box-shadow:0 7px 18px #0000000d}.card-head{height:69px;border-bottom:1px solid var(--line);padding:15px 20px}.title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700}.title .key{color:var(--cyan);font-size:20px}.subtitle{margin-top:2px;color:var(--muted);font-size:12px}.toolbar{min-height:60px;border-bottom:1px solid var(--line);padding:13px 20px;display:flex;gap:11px}.input,.select{height:33px;border:1px solid #17243a;background:#080e1a;border-radius:8px;color:#7e8ba2;padding:0 10px;font:12px inherit;outline:none}.select{color:#e4eaf2;min-width:156px;cursor:pointer}.input{flex:1}.button{height:33px;border:0;border-radius:8px;padding:0 15px;color:#003346;background:linear-gradient(135deg,#39e5fa,#08c9e8);font:12px inherit;font-weight:650;cursor:pointer;box-shadow:0 0 18px #05c9e755}.button:hover{filter:brightness(1.1)}.plus{font-size:19px;vertical-align:-1px;margin-right:8px;font-weight:400}
        .table-head{height:34px;padding:0 20px;display:grid;grid-template-columns:1.35fr .85fr 1.25fr 1.1fr .87fr .78fr;align-items:center;color:#78879e;font-size:10px;letter-spacing:.45px;border-bottom:1px solid var(--line)}.empty{height:151px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#718199;font-size:12px}.empty-symbol{font-size:41px;color:#26354b;line-height:40px;margin-bottom:10px}
        .top{background:linear-gradient(90deg,#091321,#0b1423 55%,#0a1727);position:relative}.top:after{content:"";height:1px;position:absolute;left:0;right:0;bottom:-1px;background:linear-gradient(90deg,transparent,#17ddeb55 25%,#17ddeb55 75%,transparent)}.quick-actions{padding:4px;border:1px solid #1a3850;border-radius:13px;background:#081422;box-shadow:inset 0 0 15px #0be1ef0d,0 5px 15px #0005;gap:5px}.quick-pill{height:34px;border:1px solid transparent;border-radius:9px;background:transparent;color:#a8c2d0;padding:0 10px;font-size:11px;position:relative;transition:.22s;cursor:pointer;text-decoration:none}.quick-pill:hover{transform:translateY(-2px);color:#effcff}.plan-status{display:flex;align-items:center;gap:8px;padding-right:8px;background:linear-gradient(90deg,#0c2939,#0a1f30);border-color:#1b5669}.plan-orb{width:23px;height:23px;border-radius:7px;display:grid;place-items:center;background:#10dced;color:#032731;font-size:13px;box-shadow:0 0 13px #0adfec7f}.plan-status b,.plan-status small{display:block;line-height:1.1}.plan-status b{font-size:11px;color:#e5f9fb}.plan-status small{font-size:9px;color:#88adbc;margin-top:3px}.plan-status small i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#47e5ae;box-shadow:0 0 7px #47e5ae}.plan-status em{font-style:normal;font-size:8px;color:#59e8bb;border:1px solid #1b6e5c;background:#0b2e2d;border-radius:8px;padding:3px 5px}.redeem-action{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#075377,#07324d);border-color:#0a9cc5;color:#87f4ff}.redeem-action:hover{border-color:#18e5fa;box-shadow:0 0 17px #0bdff273;background:#086787}.redeem-action>i{font-style:normal;margin-left:2px;font-size:15px;transition:.2s}.redeem-action:hover>i{transform:translateX(3px)}.quick-icon{width:19px;height:19px;border-radius:6px;display:grid;place-items:center;background:#143247;color:#53eaf7;font-size:13px}.plans-action:hover{border-color:#e7c124;background:#2b250f;color:#ffe68c;box-shadow:0 0 15px #dabb2552}.plans-action:hover .quick-icon{background:#4a3d16;color:#ffd643}.discord-action{border-color:#202f49}.discord-action:hover{border-color:#5d72ff;background:#151a39;box-shadow:0 0 16px #6375ff55}.discord-action .quick-icon{color:#aab4ff;background:#212853}.online-mini{width:6px;height:6px;border-radius:50%;background:#43e5aa;box-shadow:0 0 8px #43e5aa;margin-left:1px}.quick-actions .cyan,.quick-actions .soft{display:none}
        aside{overflow:hidden;background:radial-gradient(circle at 20% 0,#0c57673d,transparent 25%),linear-gradient(180deg,#0d1728 0%,#0a1221 53%,#080f1c 100%);box-shadow:12px 0 35px #00000038}aside:before{content:"";position:absolute;left:-90px;top:160px;width:210px;height:210px;border:1px solid #12dced20;border-radius:50%;box-shadow:0 0 0 35px #12dced09,0 0 0 70px #12dced06;animation:sidebarOrbit 18s linear infinite;pointer-events:none}.brand{position:relative;height:91px;padding:0 25px;border-bottom-color:#1b3549}.brand:after{content:"";position:absolute;left:25px;right:25px;bottom:0;height:1px;background:linear-gradient(90deg,transparent,#10dfee,transparent);opacity:.65}.shield{width:29px;height:32px;border-radius:10px 10px 13px 13px;display:grid;place-items:center;background:#0b3341;box-shadow:0 0 25px #00d8f19c,inset 0 0 14px #00d8f13a}.shield:after{left:9px;top:8px}.brand strong{font-size:17px;text-shadow:0 0 12px #0adff07a}.brand small{font-size:10px;letter-spacing:.2px;margin-top:2px}nav{position:relative;padding:17px 13px;z-index:1}.nav-caption{display:block;color:#486a81;font-size:9px;font-weight:850;letter-spacing:1.35px;padding:5px 12px 8px}.nav-caption-space{padding-top:17px}.nav{height:42px;margin:2px 0;border-radius:11px;color:#7891a8;position:relative;overflow:hidden}.nav:before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 4px 4px 0;background:transparent;transition:.22s}.nav .ico{width:21px;height:21px;border-radius:7px;background:#101f33;color:#799db2;font-size:15px;transition:.2s}.nav:hover{transform:translateX(3px);background:#102235;color:#e2f4fa}.nav:hover .ico{background:#123847;color:#1bddeb}.nav.active{height:46px;transform:translateX(2px) scale(1);border-color:#11cfe5;background:linear-gradient(90deg,#0b3a48,#0c2838 77%,#0c1f31);box-shadow:inset 0 0 22px #00d8f12e,0 0 17px #00d8f13a}.nav.active:before{background:#1be6f5;box-shadow:0 0 10px #14dff1}.nav.active .ico{background:#14dbe9;color:#032833;box-shadow:0 0 16px #0ddfec8f}.nav.active .dot{width:6px;height:6px;box-shadow:0 0 12px #00e5ff}.profile{position:relative;z-index:1;height:91px;padding:0 20px;border-top-color:#1b3549;background:linear-gradient(90deg,#0c1728,#0a1220)}.profile:before{content:"";position:absolute;left:20px;right:20px;top:0;height:1px;background:linear-gradient(90deg,transparent,#179aae,transparent)}.avatar{width:36px;height:36px;background:linear-gradient(135deg,#1ce6f4,#087893);color:#032831;font-size:11px;box-shadow:0 0 17px #08ddef64}.who b{font-size:12px;color:#e5f3f7}.who span{font-size:10px;color:#4be1b5}.logout{width:28px;height:28px;border:1px solid #254457;border-radius:8px;display:grid;place-items:center;color:#79a5b7;font-size:16px;transition:.2s}.logout:hover{color:#1be2f2;border-color:#15d9ec;box-shadow:0 0 12px #0be0ef55}@keyframes sidebarOrbit{to{transform:rotate(360deg)}}
        .scripts-premium{max-width:1200px;margin:auto;animation:settingsReveal .42s ease}.scripts-hero{display:flex;align-items:center;gap:18px;padding:26px;border:1px solid #176375;border-radius:21px;background:radial-gradient(circle at 8% 0,#0de4ef3d,transparent 31%),linear-gradient(110deg,#092a37,#0b1728 68%);box-shadow:0 0 26px #0bdeef32}.script-hero-orb{width:68px;height:68px;border-radius:21px;display:grid;place-items:center;background:linear-gradient(135deg,#20efff,#07809c);color:#032830;font-size:31px;box-shadow:0 0 28px #0adeef95;animation:floatBot 3s ease-in-out infinite}.scripts-hero span,.script-vault-top span{color:#20dfef;font-size:10px;font-weight:850;letter-spacing:1.5px}.scripts-hero h2{margin:7px 0;font-size:27px}.scripts-hero p{margin:0;color:#9ab4c2}.scripts-hero-actions{margin-left:auto;display:flex;gap:8px}.secondary-script-btn,.create-script-btn{border-radius:9px;padding:11px 13px;font-size:11px;font-weight:850;cursor:pointer}.secondary-script-btn{border:1px solid #21566a;background:#0a2633;color:#77dfe9}.create-script-btn{border:0;background:#14d9ec;color:#032831;box-shadow:0 0 18px #0bdeed70}.script-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.script-metrics article{display:flex;align-items:center;gap:10px;padding:14px;border:1px solid #1c4052;border-radius:13px;background:#0c1929;transition:.2s}.script-metrics article:hover{transform:translateY(-4px);border-color:#17ddea;box-shadow:0 0 17px #0bdfec44}.script-metrics i{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:#0d3846;color:#1de0ef;font-size:18px;font-style:normal}.script-metrics span{flex:1}.script-metrics small,.script-metrics b{display:block}.script-metrics small{color:#7594a8;font-size:9px;font-weight:800}.script-metrics b{font-size:16px;margin-top:4px}.script-metrics em{font-size:9px;color:#7795a9;font-style:normal}.script-green{color:#48e4ad!important}.script-vault{border:1px solid #1b4053;border-radius:17px;background:#0b1727;overflow:hidden}.script-vault-top{padding:20px;display:flex;justify-content:space-between;align-items:center}.script-vault-top h3{font-size:17px;margin:6px 0}.script-vault-top p{font-size:11px;color:#849fb0;margin:0}.script-tools{display:flex;gap:7px}.script-tools label{border:1px solid #23465a;background:#081522;border-radius:8px;color:#7998ac;padding:8px}.script-tools input{border:0;outline:0;background:transparent;color:#dceff4;font-size:11px;width:125px}.script-tools button{border:1px solid #23465a;background:#0b1f2d;color:#91c1cf;border-radius:8px;padding:8px;font-size:10px;cursor:pointer}.script-tools button:last-child{background:#0d6174;color:#c9fcff;border-color:#0eb9cf}.script-library-bar{display:flex;justify-content:space-between;border-top:1px solid #1a3348;border-bottom:1px solid #1a3348;padding:10px 20px;color:#7798aa;font-size:10px}.script-library-bar span:first-child{color:#66e4c0}.script-library-bar i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4be5ad;box-shadow:0 0 8px #4be5ad}.script-empty-premium{min-height:287px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.empty-script-orb{width:68px;height:68px;border:1px solid #226478;border-radius:21px;display:grid;place-items:center;background:#0d2d3a;color:#18dff1;font-size:30px;position:relative;box-shadow:0 0 19px #0adeef3a}.empty-script-orb i{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#43e4ab;color:#07362a;font-size:10px;font-style:normal;border:2px solid #0b1727}.script-empty-premium h2{margin:15px 0 7px;font-size:17px}.script-empty-premium p{color:#829eaf;font-size:11px;margin:0}.script-empty-premium button{border:0;border-radius:8px;background:#14d9eb;color:#032831;margin:16px 0 9px;padding:11px 14px;font-weight:850;cursor:pointer;box-shadow:0 0 16px #0bdeed69}.script-empty-premium small{font-size:9px;color:#668698}.script-help{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.script-help article{display:flex;gap:10px;padding:13px;border:1px solid #1a3c4d;border-radius:13px;background:#0b1828}.script-help i{width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:9px;background:#103845;color:#1ce0f1;font-style:normal;font-weight:850}.script-help b,.script-help span{display:block}.script-help b{font-size:11px}.script-help span{color:#7897a9;font-size:10px;margin-top:4px}.script-grid{padding:16px 20px;min-height:230px}.script-grid .script-item{background:#0d2130;border-color:#1c5262;transition:.2s}.script-grid .script-item:hover{transform:translateY(-4px);border-color:#16dcea;box-shadow:0 0 18px #0bdeed42}.script-grid .tag{background:#0b3a3b;border-color:#176966;color:#65e9c7}@media(max-width:900px){.script-metrics{grid-template-columns:repeat(2,1fr)}.scripts-hero{flex-wrap:wrap}.scripts-hero-actions{margin-left:0}.script-vault-top{align-items:start;flex-direction:column;gap:12px}.script-tools{flex-wrap:wrap}.script-help{grid-template-columns:1fr}}
        .whitelist-premium{max-width:1200px;margin:auto;animation:settingsReveal .42s ease}.whitelist-hero{display:flex;align-items:center;gap:18px;padding:26px;border:1px solid #176475;border-radius:21px;background:radial-gradient(circle at 9% 0,#0ce5f03e,transparent 30%),linear-gradient(110deg,#092b37,#0b1728 68%);box-shadow:0 0 26px #0adfeb35}.key-hero-orb{width:68px;height:68px;border-radius:21px;display:grid;place-items:center;background:linear-gradient(135deg,#1ef0ff,#07829d);color:#032831;font-size:31px;box-shadow:0 0 28px #0adff099;animation:floatBot 3s ease-in-out infinite}.whitelist-hero span,.key-create-title span,.key-tips>span,.vault-title span{color:#1ee0f1;font-size:10px;font-weight:850;letter-spacing:1.5px}.whitelist-hero h2{margin:7px 0;font-size:27px}.whitelist-hero p{margin:0;color:#9bb5c2}.whitelist-status{margin-left:auto;text-align:right}.whitelist-status i{display:block;color:#4be8b1;font-size:10px;font-style:normal}.whitelist-status b,.whitelist-status small{display:block}.whitelist-status b{margin-top:5px}.whitelist-status small{font-size:10px;color:#7998ab;margin-top:4px}.whitelist-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.whitelist-metrics article{display:flex;align-items:center;gap:10px;padding:14px;border:1px solid #1c4052;border-radius:13px;background:#0c1929;transition:.2s}.whitelist-metrics article:hover{transform:translateY(-4px);border-color:#17ddea;box-shadow:0 0 17px #0bdfec44}.whitelist-metrics i{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:#0d3846;color:#1de0ef;font-size:18px;font-style:normal}.whitelist-metrics span{flex:1}.whitelist-metrics small,.whitelist-metrics b{display:block}.whitelist-metrics small{color:#7594a8;font-size:9px;font-weight:800}.whitelist-metrics b{font-size:17px;margin-top:4px}.whitelist-metrics em{font-size:9px;color:#7795a9;font-style:normal}.white-green{color:#48e4ad!important}.whitelist-workspace{display:grid;grid-template-columns:1.45fr .8fr;gap:16px}.key-create-card,.key-tips,.whitelist-vault{border:1px solid #1b4053;border-radius:17px;background:linear-gradient(145deg,#0d1b2b,#0a1525);padding:20px}.key-create-card{background:radial-gradient(circle at 100% 0,#0ce4ef2b,transparent 39%),#0b1828}.key-create-title{display:flex;justify-content:space-between}.key-create-title h3,.key-tips h3,.vault-title h3{margin:6px 0;font-size:17px}.key-create-title p{color:#88a5b6;font-size:11px;margin:0}.key-create-title>b{font-size:9px;color:#60e3c5;background:#0a2e31;border:1px solid #1b5953;border-radius:16px;padding:6px 8px;height:max-content}.whitelist-steps{display:flex;gap:8px;margin:19px 0}.whitelist-steps span{font-size:10px;color:#9bb6c4;background:#0a2633;border:1px solid #1c4e5c;border-radius:18px;padding:5px 8px}.whitelist-steps i{font-style:normal;color:#18e0f1;margin-right:4px}.key-toolbar{padding:0;border:0;min-height:0;display:grid;grid-template-columns:1fr 1.25fr auto;align-items:end}.key-toolbar label{display:block}.key-toolbar small{display:block;color:#6f92a5;font-size:9px;font-weight:850;letter-spacing:.7px;margin-bottom:6px}.key-toolbar .select,.key-toolbar .input{width:100%;height:39px}.key-toolbar .button{height:39px;white-space:nowrap}.key-notice{margin-top:14px;color:#7da5b5;font-size:10px}.key-notice i{font-style:normal;color:#1ce0f1;font-size:16px;vertical-align:middle;margin-right:4px}.key-tips>span{font-size:9px}.key-tips h3{font-size:16px}.key-tips article{display:flex;gap:9px;margin-top:14px}.key-tips article>i{width:25px;height:25px;border-radius:8px;background:#0e3844;color:#21e0f1;display:grid;place-items:center;font-style:normal;font-size:11px}.key-tips b{font-size:11px}.key-tips p{color:#7897aa;font-size:10px;line-height:1.4;margin:4px 0}.key-tips button{border:0;background:none;color:#25e0f0;padding:0;margin-top:12px;font-size:10px;font-weight:800;cursor:pointer}.whitelist-vault{margin-top:16px;padding:0;overflow:hidden}.vault-title{display:flex;justify-content:space-between;align-items:center;padding:18px 20px}.vault-title h3{margin-bottom:0}.vault-title button{border:1px solid #23465a;background:#0b1f2d;color:#91c4d1;border-radius:7px;padding:7px;font-size:10px}.whitelist-table{padding:0 20px;background:#091522;grid-template-columns:1.35fr .85fr 1.25fr 1.1fr .87fr .78fr}.premium-empty{height:180px}.premium-empty b{color:#c5dbe4;font-size:13px;margin-bottom:7px}.premium-empty span{font-size:11px}.whitelist-vault:hover,.key-create-card:hover,.key-tips:hover{border-color:#17deef;box-shadow:0 0 22px #0bdeed32}
        .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin:3px 0 29px}.stat{height:108px;border:1px solid #1b2940;border-radius:11px;background:#0c1526;padding:22px 23px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 20px #00000012;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease,filter .22s ease;cursor:default;position:relative}.stat:hover{transform:scale(1.055);z-index:2;filter:brightness(1.13)}.stat:hover i{transform:scale(1.12);filter:brightness(1.4);transition:transform .22s ease,filter .22s ease}.stat span{display:block;color:#8090a7;font-size:12px;margin-bottom:10px}.stat b{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:25px;line-height:1;color:#f1f5fb}.stat i{width:46px;height:46px;display:grid;place-items:center;font-style:normal;font-size:27px;border-radius:11px;background:#182238;color:#7c8ca5}.stat-protected{border-color:#0c5164;background:linear-gradient(100deg,#0b1a27,#0b1525)}.stat-protected i{color:#10d5ed}.stat-protected:hover{border-color:#14dff6;box-shadow:0 0 12px #0ad8f280,0 0 35px #0ad8f245,0 12px 25px #0008}.stat-active{border-color:#10473e;background:linear-gradient(100deg,#0b1b25,#0c1825)}.stat-active i{color:#08c985}.stat-active:hover{border-color:#13e998;box-shadow:0 0 12px #0ee19480,0 0 35px #0ee19442,0 12px 25px #0008}.stat-total:hover{border-color:#93a3c2;box-shadow:0 0 12px #7d93bf80,0 0 35px #7d93bf42,0 12px 25px #0008}.stat-executions{border-color:#4a421b;background:#151515}.stat-executions i{color:#e5bd00}.stat-executions:hover{border-color:#ffd21a;box-shadow:0 0 12px #f6c80080,0 0 35px #f6c80042,0 12px 25px #0008}.dash-scripts{min-height:319px}.dash-head{height:80px;display:flex;align-items:center;justify-content:space-between}.script-doc{font-size:18px;color:#16d4ee;margin-right:2px}.dash-empty{height:237px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7888a0}.dash-empty .document{font-size:48px;line-height:47px;color:#2d3a50;margin-bottom:12px}.dash-empty h2{color:#e5eaf0;font-size:16px;margin:0 0 9px}.dash-empty p{font-size:13px;margin:0}.dash-script-grid{padding:18px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
        .dash-grid{display:grid;grid-template-columns:1.65fr .85fr;gap:18px;margin-bottom:18px}.dash-chart,.security-score,.activity-feed,.quick-start{border:1px solid #1b3048;border-radius:15px;background:linear-gradient(145deg,#0d1a2b,#0a1424);padding:20px;overflow:hidden}.dash-card-title{display:flex;align-items:start;justify-content:space-between}.dash-card-title span,.quick-start>span{color:#14d7ed;font-size:9px;font-weight:850;letter-spacing:1.4px}.dash-card-title h3{margin:6px 0 0;font-size:16px}.dash-card-title button{border:1px solid #244259;background:#0a1928;color:#8fc8d5;border-radius:7px;padding:7px 9px;font-size:10px;cursor:pointer}.chart-legend{display:flex;justify-content:space-between;align-items:end;margin:16px 0 6px}.chart-legend b{font-size:11px;color:#9bb1c1}.chart-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16dff1;box-shadow:0 0 9px #16dff1}.chart-legend strong{font-size:24px}.chart-legend small{font-size:10px;font-weight:400;color:#8090a5}.line-chart{height:176px;position:relative}.chart-grid{position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent 34px,#1a2e42 35px),repeating-linear-gradient(to right,transparent 0,transparent 20%,#14283b 20.2%)}.line-chart svg{position:absolute;inset:0;width:100%;height:150px}.chart-line{fill:none;stroke:#15dff1;stroke-width:3;filter:drop-shadow(0 0 5px #15dff1)}.chart-days{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;color:#617b91;font-size:10px}.security-score{text-align:center;position:relative}.live-state{font-size:9px;color:#42e5ad}.score-wheel{width:133px;height:133px;margin:15px auto 11px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#16dff1 0deg 331deg,#1b3347 331deg 360deg);box-shadow:0 0 23px #0bd8ed47;position:relative}.score-wheel:before{content:"";position:absolute;width:107px;height:107px;border-radius:50%;background:#0c1828}.score-wheel div{z-index:1}.score-wheel b{font-size:30px;display:block}.score-wheel small{color:#758da2}.perfect-score{background:conic-gradient(#48e9b1 0deg,#17e4f3 190deg,#79f0c6 360deg);box-shadow:0 0 15px #32e8b482,0 0 36px #16dff271,0 0 67px #16dff133;animation:scorePop .8s cubic-bezier(.2,1.4,.35,1) both,scoreGlow 2.2s ease-in-out infinite .8s}.perfect-score:after{content:"";position:absolute;inset:-12px;border:1px solid #1de7ef5c;border-radius:50%;animation:scorePulse 2.2s ease-out infinite}.perfect-score b{font-size:31px;color:#eafff8;text-shadow:0 0 14px #2ceab5}.perfect-score small{color:#5ee7be}.perfect-score em{display:block;color:#37e9ae;font-size:8px;font-style:normal;font-weight:900;letter-spacing:1.1px;margin-top:3px}.score-spark{position:absolute;z-index:2;color:#75f3cf;font-size:16px;text-shadow:0 0 10px #2ae8b6;animation:sparkFloat 2s ease-in-out infinite}.score-spark.s1{right:-10px;top:8px}.score-spark.s2{left:-12px;bottom:27px;animation-delay:.45s}.score-spark.s3{right:4px;bottom:-12px;animation-delay:.85s}@keyframes scorePop{0%{transform:scale(.35) rotate(-30deg);opacity:0}70%{transform:scale(1.16) rotate(4deg)}100%{transform:scale(1);opacity:1}}@keyframes scoreGlow{50%{box-shadow:0 0 22px #32e8b4aa,0 0 48px #16dff299,0 0 78px #16dff144}}@keyframes scorePulse{0%{transform:scale(.75);opacity:.9}100%{transform:scale(1.45);opacity:0}}@keyframes sparkFloat{50%{transform:translateY(-7px) rotate(16deg);opacity:.48}}.security-score>p{font-size:11px;color:#a3b9c6;margin:0 0 12px}.score-points{display:flex;justify-content:center;gap:7px;flex-wrap:wrap}.score-points span{font-size:9px;border:1px solid #16586a;background:#0a2934;color:#68dfe9;border-radius:16px;padding:5px 7px}.dashboard-lower{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-bottom:18px}.activity-empty{display:flex;align-items:center;gap:12px;margin-top:19px}.activity-empty>i{width:36px;height:36px;border-radius:11px;background:#103444;color:#18dff1;display:grid;place-items:center;font-style:normal}.activity-empty b{font-size:12px}.activity-empty p{margin:4px 0 0;color:#788fa3;font-size:11px}.quick-start{background:radial-gradient(circle at 85% 0,#0bd8ed38,transparent 42%),linear-gradient(145deg,#0c2733,#0b1727);border-color:#176174}.quick-start h3{margin:9px 0 6px;font-size:17px}.quick-start p{color:#91a9b9;font-size:11px;margin:0 0 15px}.quick-start button{border:0;border-radius:8px;background:#13d7eb;color:#032831;padding:10px 12px;font-weight:850;cursor:pointer;box-shadow:0 0 15px #0ad9eb64}.dash-chart:hover,.security-score:hover,.activity-feed:hover,.quick-start:hover{border-color:#18dff3;box-shadow:0 0 22px #0bdff13a}
        .hidden{display:none!important}.script-grid{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.script-item{background:#091222;border:1px solid #1a2a42;border-radius:9px;padding:16px}.script-item h3{margin:0 0 7px;font-size:14px}.script-item p{color:#728199;margin:0 0 14px;font-size:11px}.tag{display:inline-block;color:#13d7ef;background:#0a3040;border:1px solid #176377;border-radius:30px;padding:3px 8px;font-size:10px}.empty-big{height:280px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#738299}.empty-big h2{color:#dae3ee;margin:12px 0 5px;font-size:16px}.empty-big p{margin:0;font-size:12px}.notice{margin:auto;max-width:540px;text-align:center;padding:100px 20px}.notice .gear{font-size:44px;color:#17d5ee}.notice h2{font-size:20px;margin:15px 0 8px}.notice p{color:#79869a}
        .modal{position:fixed;inset:0;background:#030814bd;display:flex;align-items:center;justify-content:center;z-index:20;padding:20px}.dialog{width:min(450px,100%);background:#0d1728;border:1px solid #28405e;border-radius:12px;box-shadow:0 20px 60px #000;padding:23px}.dialog h2{margin:0;font-size:18px}.dialog p{color:#8290a6;margin:6px 0 19px;font-size:12px}.field-label{display:block;color:#b1bece;font-size:11px;margin-bottom:7px}.field{height:38px;width:100%;border-radius:7px;border:1px solid #26364e;background:#080f1c;color:white;padding:0 11px;outline-color:#12d4ef}.dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:19px}.cancel{background:#172236;color:#b4c0d0;border:1px solid #2b3a50}
        .editor-modal{position:fixed;inset:0;background:#050b17eF;z-index:30;padding:16px;overflow:auto}.editor-panel{min-height:100%;background:#0b1424;border:1px solid #1d2b42;border-radius:9px;overflow:hidden}.editor-top{height:50px;border-bottom:1px solid #202d43;padding:0 23px;display:flex;align-items:center;justify-content:space-between}.editor-top strong{font-size:14px}.editor-top>div{display:flex;gap:8px}.editor-action{border:0;border-radius:9px;width:39px;height:35px;color:#fff;font-size:20px;cursor:pointer}.editor-action.save{background:#19ad58;box-shadow:0 0 18px #15ae586b}.editor-action.close{background:#e52d38;box-shadow:0 0 18px #e52d3860}.editor-options{padding:9px 23px 0}.setting{min-height:75px;border-bottom:1px solid #202d43;display:flex;align-items:center;gap:16px;cursor:pointer}.setting input{display:none}.toggle{width:43px;height:24px;border-radius:20px;background:#222d42;flex:none;position:relative;transition:.2s}.toggle:after{content:"";position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#e8eef5;transition:.2s}.setting input:checked+.toggle{background:#0ad8ef;box-shadow:0 0 14px #00dbf1a0}.setting input:checked+.toggle:after{left:21px;background:#07303d}.setting b{font-size:13px;display:block;color:#e8eef7;font-weight:600}.setting small{display:block;color:#7e8da4;font-size:11px;margin-top:6px}.setting em{font-style:normal;color:#10d9f0;font-size:18px;margin-right:7px}.setting em.green{color:#2ed17b}.code-area{padding:18px 23px 14px}.code-title{height:32px;display:flex;justify-content:space-between;align-items:center;color:#e6ecf5;font-size:13px}.code-title b:first-letter{color:#0fdaef}.code-title button{background:#0a1220;border:1px solid #122138;color:#8090a5;border-radius:8px;font-size:11px;padding:8px 13px}.code-area textarea{display:block;width:100%;height:190px;resize:vertical;border:1px solid #24344c;border-radius:9px;background:#070d18;color:#8da0c5;padding:12px;font:13px/20px ui-monospace,SFMono-Regular,Menlo,monospace;outline-color:#12d8ef}.protect{width:100%;height:41px;border:0;border-radius:8px;margin-top:14px;background:#118aa0;color:#03222a;font-weight:750;cursor:pointer}.protect:hover{background:#12b9d4;box-shadow:0 0 20px #0ac6e667}
        .users-premium{max-width:1180px;margin:auto;animation:settingsReveal .42s ease}.users-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:18px;padding:26px;border:1px solid #176274;border-radius:21px;background:radial-gradient(circle at 10% 0,#0ce4f03b,transparent 31%),linear-gradient(110deg,#0b2936,#0b1728 68%);box-shadow:0 0 26px #0bdeef2e}.users-hero:after{content:"";position:absolute;right:20px;width:180px;height:180px;border-radius:50%;border:1px dashed #18dce935;animation:spin 18s linear infinite}.users-orb{width:66px;height:66px;position:relative;z-index:1;border-radius:21px;display:grid;place-items:center;background:#0d3946;color:#1ee2f2;box-shadow:0 0 23px #0be1ef7a,inset 0 0 18px #0be1ef2d}.users-orb i{font-style:normal;font-size:27px}.users-orb span{position:absolute;width:10px;height:10px;right:-2px;bottom:2px;border-radius:50%;background:#45e7ad;box-shadow:0 0 10px #45e7ad}.users-hero>div:nth-child(2){position:relative;z-index:1}.users-hero span,.directory-top span{color:#20deef;font-size:10px;font-weight:850;letter-spacing:1.5px}.users-hero h2{margin:7px 0;font-size:27px}.users-hero p{margin:0;color:#9ab4c2}.users-hero>button{position:relative;z-index:1;margin-left:auto;border:0;border-radius:10px;background:#14d9eb;color:#032831;padding:12px 15px;font-weight:850;cursor:pointer;box-shadow:0 0 18px #0adeed75;transition:.2s}.users-hero>button:hover{transform:translateY(-3px);box-shadow:0 8px 27px #0adeed8d}.user-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.user-metrics article{display:flex;align-items:center;gap:10px;padding:14px;border:1px solid #1b4053;border-radius:13px;background:#0c1929;transition:.2s}.user-metrics article:hover{transform:translateY(-4px);border-color:#17ddea;box-shadow:0 0 17px #0bdfec44}.user-metrics i{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:#0d3846;color:#1de0ef;font-size:18px;font-style:normal}.user-metrics span{flex:1}.user-metrics small,.user-metrics b{display:block}.user-metrics small{color:#7594a8;font-size:9px;font-weight:800}.user-metrics b{font-size:17px;margin-top:4px}.user-metrics em{font-size:9px;color:#7795a9;font-style:normal}.green-text{color:#48e4ad!important}.users-directory{border:1px solid #1b4053;border-radius:17px;background:#0b1626;overflow:hidden}.directory-top{display:flex;justify-content:space-between;align-items:center;padding:19px 20px 13px}.directory-top h3{margin:6px 0 0;font-size:17px}.directory-tools{display:flex;gap:7px}.directory-tools label{border:1px solid #23465a;background:#081522;border-radius:8px;color:#7998ac;padding:8px}.directory-tools input{border:0;outline:0;background:transparent;color:#dceff4;font-size:11px;width:130px}.directory-tools button{border:1px solid #23465a;background:#0b1f2d;color:#92b7c6;border-radius:8px;padding:8px;font-size:10px;cursor:pointer}.directory-summary{border-top:1px solid #1a3348;border-bottom:1px solid #1a3348;padding:10px 20px;display:flex;justify-content:space-between;color:#7693a6;font-size:10px}.directory-summary b{color:#24e0f0}.user-table-label,.member-row{display:grid;grid-template-columns:2.15fr .85fr 1.35fr .85fr .8fr .25fr;align-items:center;padding:0 20px}.user-table-label{height:37px;color:#66889d;font-size:9px;font-weight:850;letter-spacing:.9px}.member-row{min-height:83px;border-top:1px solid #193248;transition:.2s}.member-row:hover{background:#0d2634;box-shadow:inset 3px 0 #16d9eb}.member-info{display:flex;align-items:center;gap:10px}.member-avatar{position:relative;width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#1deafa,#078ba6);color:#032931;font-size:12px;font-weight:900}.member-avatar i{position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;display:grid;place-items:center;background:#47e5ac;border:2px solid #0b1f2d;color:#083a2b;font-size:7px;font-style:normal}.member-info b,.member-info small{display:block}.member-info small{color:#7996aa;font-size:10px;margin-top:4px}.owner-role{border:1px solid #1a687a;background:#0c3240;color:#65e7f2;border-radius:15px;padding:5px 8px;font-size:10px}.access-level{color:#aec5cf;font-size:10px}.active-state{color:#55e8af;font-size:10px}.active-state i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ae7ac;box-shadow:0 0 8px #4ae7ac}.last-active{color:#8ba5b4;font-size:10px}.member-row>button{border:0;background:none;color:#75cbd7;font-size:15px;cursor:pointer}.users-bottom{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:16px}.users-bottom article{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #1a3f51;border-radius:14px;background:#0b1828}.users-bottom i{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#0e3644;color:#1ee0ef;font-style:normal}.users-bottom div{flex:1}.users-bottom b{font-size:11px}.users-bottom p{font-size:10px;color:#7896a9;margin:4px 0 0;line-height:1.4}.users-bottom button{border:0;background:none;color:#29e0f0;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}@media(max-width:900px){.editor-panel.step-2 #editorOptions{padding:14px}.editor-section-head>b{display:none}.stage-next{align-items:flex-start;gap:12px;flex-direction:column}.stage-next button{width:100%}.whitelist-workspace{grid-template-columns:1fr}.whitelist-metrics{grid-template-columns:repeat(2,1fr)}.key-toolbar{grid-template-columns:1fr}.user-metrics{grid-template-columns:repeat(2,1fr)}.users-hero{flex-wrap:wrap}.users-hero>button{margin-left:0}.user-table-label,.member-row{grid-template-columns:2fr 1fr .8fr}.user-table-label span:nth-child(3),.user-table-label span:nth-child(5),.member-row>div:nth-child(3),.member-row>div:nth-child(5){display:none}.users-bottom{grid-template-columns:1fr}}
        .setup-premium{max-width:1120px;margin:auto}.setup-top{padding:28px 30px;border:1px solid #1a5260;border-radius:19px;background:radial-gradient(circle at 85% 0,#0ce3f02b,transparent 35%),#0b1928;display:flex;justify-content:space-between;align-items:center}.setup-top span,.guide-copy>span{color:#16daef;font-size:10px;font-weight:800;letter-spacing:1.7px}.setup-top h2{font-size:28px;margin:8px 0}.setup-top p{color:#89a3b5;margin:0}.setup-progress{text-align:right}.setup-progress b{display:block;color:#1be0f1;font-size:25px}.setup-progress small{color:#758da0;font-size:9px;letter-spacing:1px}.setup-progress i{display:block;width:170px;height:6px;background:#152c3d;border-radius:8px;margin-top:8px;overflow:hidden}.setup-progress em{display:block;width:9%;height:100%;background:#13d9ec;box-shadow:0 0 12px #0edff0}.setup-roadmap{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:18px 0}.road-card{position:relative;overflow:hidden;min-height:207px;padding:22px;border:1px solid #1c354a;border-radius:17px;background:linear-gradient(150deg,#0e1d2e,#0a1424);transition:.25s}.road-card:hover{transform:translateY(-7px);border-color:#16d9ed;box-shadow:0 0 20px #0bdff259,0 18px 30px #0008}.road-number{position:absolute;right:18px;top:14px;color:#1d4352;font-size:31px;font-weight:900}.road-card>i{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:#103744;color:#19e0f1;font-style:normal;font-size:21px}.road-card h3{margin:18px 0 7px}.road-card p{font-size:12px;color:#849caf;line-height:1.5;min-height:37px}.road-card button{border:0;background:none;color:#28e0f1;font-weight:800;padding:0;cursor:pointer}.road-card button span{font-size:17px;margin-left:5px}.discord-guide{display:flex;align-items:center;gap:20px;border:1px solid #0ebbd0;border-radius:19px;background:linear-gradient(100deg,#0a2c38,#0d1828);box-shadow:0 0 26px #0addf13a;padding:23px}.guide-orb{width:65px;height:65px;border-radius:21px;display:grid;place-items:center;background:linear-gradient(135deg,#1ef1ff,#0685a2);color:#032831;font-size:30px;font-weight:900;box-shadow:0 0 24px #09ddee8a}.guide-copy{flex:1}.guide-copy h3{margin:6px 0;font-size:18px}.guide-copy p{color:#91aeba;font-size:12px;margin:0 0 12px}.guide-steps{display:flex;gap:9px}.guide-steps b{font-size:10px;color:#b6f4f9;background:#0a2531;border:1px solid #1c6978;border-radius:20px;padding:5px 8px}.guide-steps i{font-style:normal;color:#10dbea}.guide-steps em{font-style:normal;color:#2ce7f6}.guide-button{border:0;border-radius:11px;padding:13px 16px;white-space:nowrap;background:#12d8ec;color:#03262d;font-weight:850;cursor:pointer;box-shadow:0 0 17px #08d9eb63}.setup-tip{display:flex;gap:10px;align-items:center;margin-top:15px;padding:13px 16px;border:1px solid #1b3549;border-radius:12px;background:#0b1524;color:#829daf;font-size:11px}.setup-tip i{color:#18d9eb;font-style:normal;font-size:20px}.setup-tip b{color:#dcebf4}
        .settings-premium{max-width:1160px;margin:auto;animation:settingsReveal .45s ease}.settings-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:18px;padding:26px;border:1px solid #176174;border-radius:21px;background:radial-gradient(circle at 76% 0,#0be4f02e,transparent 31%),linear-gradient(110deg,#0b2935,#0c1626 66%);box-shadow:0 0 26px #0ce3ef2e}.settings-hero:after{content:"";position:absolute;right:-90px;top:-150px;width:310px;height:310px;border:1px solid #16dceb31;border-radius:50%;box-shadow:0 0 0 38px #16dceb0c,0 0 0 76px #16dceb08;animation:settingsOrbit 10s linear infinite}.settings-pulse{width:67px;height:67px;flex:none;border:1px solid #14dcec;border-radius:21px;display:grid;place-items:center;background:#0c3440;box-shadow:0 0 23px #0bdeed6e,inset 0 0 20px #0bdeed29;animation:floatBot 3s ease-in-out infinite}.settings-pulse i{font-style:normal;font-size:31px;color:#1ce4f4}.settings-hero>div:nth-child(2){z-index:1}.settings-hero span,.vault-head span,.console-title span{color:#1cdef0;font-size:10px;font-weight:850;letter-spacing:1.6px}.settings-hero h2{margin:7px 0;font-size:27px}.settings-hero p{margin:0;color:#9ab2c0}.settings-health{margin-left:auto;z-index:1;text-align:right}.settings-health b,.settings-health small{display:block}.settings-health b{color:#57edb7;font-size:11px}.settings-health b i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4de6aa;box-shadow:0 0 11px #4de6aa}.settings-health small{color:#7f9bae;font-size:10px;margin-top:6px}.setting-nav{display:flex;gap:6px;margin:15px 0}.setting-nav button{border:1px solid transparent;border-radius:8px;background:transparent;color:#7995a9;padding:8px 12px;font-size:11px;cursor:pointer}.setting-nav button.selected,.setting-nav button:hover{background:#0c2c39;color:#30e5f5;border-color:#126274;box-shadow:0 0 11px #0adcf037}.settings-overview{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.settings-identity{display:grid;gap:16px}.identity-card,.discord-connection,.api-vault,.security-console{border:1px solid #1b3d50;border-radius:16px;background:linear-gradient(145deg,#0d1b2b,#0b1525);padding:20px;transition:.25s}.identity-card:hover,.discord-connection:hover,.api-vault:hover,.security-console:hover{border-color:#18deef;box-shadow:0 0 22px #0bdeed39;transform:translateY(-3px)}.identity-card{display:flex;align-items:center;gap:13px}.identity-avatar{width:49px;height:49px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#20eafa,#068ea9);color:#032a32;font-weight:900}.identity-card span,.discord-connection small{color:#789bb1;font-size:9px;letter-spacing:1px}.identity-card h3{font-size:15px;margin:5px 0}.identity-card p{font-size:11px;color:#91aabd;margin:0 0 7px}.identity-card b{font-size:9px;color:#4ee2cc}.identity-card button{margin-left:auto;border:0;background:none;color:#22deef;font-size:10px;font-weight:800;cursor:pointer}.connection-top{display:flex;align-items:center;gap:10px}.connection-top>i{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#173c56;color:#6ecbf9;font-size:20px;font-style:normal}.connection-top span{flex:1}.connection-top b{display:block;margin-top:4px;font-size:12px}.connection-top em{font-style:normal;color:#50e9b3;font-size:9px}.discord-connection p{color:#90aabc;line-height:1.55;font-size:11px;margin:15px 0}.discord-connection button{border:1px solid #186274;background:#0a2834;color:#69e8f2;border-radius:8px;padding:9px 10px;font-size:10px;font-weight:800;cursor:pointer}.api-vault{grid-row:span 2;position:relative;overflow:hidden;background:radial-gradient(circle at 100% 0,#0ce4f02a,transparent 44%),#0c1727}.vault-head{display:flex;justify-content:space-between}.vault-head h3,.console-title h3{margin:6px 0;font-size:17px}.vault-head p,.console-title p{color:#849fb1;margin:0;font-size:11px;line-height:1.5}.vault-head>i{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:#0d3441;color:#1ce1f2;font-size:22px;font-style:normal}.api-display{display:flex;align-items:center;gap:7px;margin:24px 0 13px;border:1px solid #1d4f60;background:#07131f;border-radius:10px;padding:11px}.api-display code{flex:1;color:#42e6f4;font-size:11px;overflow-wrap:anywhere}.api-display button{border:0;border-radius:7px;background:#143543;color:#a5f4fa;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}.vault-actions{display:flex;align-items:center;gap:12px}.generate-api{border:0;border-radius:8px;background:#12d9ec;color:#032730;padding:10px 11px;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 0 17px #0ddbea69}.vault-actions small{color:#67879b;font-size:9px}.security-console{margin-top:16px;padding:22px}.console-title{display:flex;align-items:start;justify-content:space-between}.uptime{text-align:right}.uptime b,.uptime small{display:block}.uptime b{font-size:22px;color:#41e3b0}.uptime small{color:#7d98a9;font-size:10px}.live-wave{height:30px;margin:17px 0;display:flex;align-items:center;gap:4px;color:#48e7b4}.live-wave i{width:3px;background:#29dfaa;border-radius:5px;animation:wave 1.1s ease-in-out infinite}.live-wave i:nth-child(1){height:8px}.live-wave i:nth-child(2){height:20px;animation-delay:.15s}.live-wave i:nth-child(3){height:13px;animation-delay:.3s}.live-wave i:nth-child(4){height:25px;animation-delay:.45s}.live-wave i:nth-child(5){height:10px;animation-delay:.6s}.live-wave span{margin-left:6px;font-size:10px}.security-console .bot-grid{margin-top:0}.security-console .bot-grid div{background:#091522}.status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#45e8ae;box-shadow:0 0 8px #45e8ae;margin-right:4px}@keyframes settingsReveal{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes settingsOrbit{to{transform:rotate(360deg)}}@keyframes wave{50%{transform:scaleY(.35);opacity:.4}}
        .users-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.users-head h2,.settings-wrap>h2{margin:0 0 5px;font-size:22px}.users-head p,.settings-sub{margin:0;color:#8191a7}.user-table{grid-template-columns:2fr 1fr 1fr 1fr .5fr}.user-row{min-height:72px;display:grid;grid-template-columns:2fr 1fr 1fr 1fr .5fr;align-items:center;padding:0 20px;color:#b7c4d3}.user-avatar{display:inline-grid;place-items:center;width:31px;height:31px;margin-right:9px;border-radius:50%;background:#133447;color:#14d8ee;font-style:normal;font-size:10px;font-weight:800;vertical-align:middle}.user-row small{color:#718098;margin-left:44px}.role,.online{font-size:11px}.role{background:#172a48;color:#77baf6;padding:4px 8px;border-radius:20px}.online{color:#19cf92}.setup-wrap{padding:25px 0}.setup-hero{text-align:center;margin:0 0 28px}.setup-hero span{font-size:10px;letter-spacing:1.8px;color:#13d3ed;font-weight:800}.setup-hero h2{font-size:25px;margin:8px 0}.setup-hero p{margin:0;color:#7a8aa0}.setup-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:960px;margin:auto}.setup-steps article{min-height:220px;background:#0c1526;border:1px solid #1c2c44;border-radius:13px;padding:22px;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}.setup-steps article:hover{transform:scale(1.045);z-index:2;border-color:#13d8ef;box-shadow:0 0 13px #0ad8f291,0 0 35px #0ad8f247,0 15px 26px #0009}.setup-steps i{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:#0e3544;color:#12d8ef;font-style:normal;font-weight:800}.setup-steps h3{margin:17px 0 7px}.setup-steps p{color:#8190a7;font-size:12px;line-height:1.5;min-height:36px}.setup-steps button,.settings-cards button{border:0;background:none;color:#9eb7ff;font-weight:700;padding:0;cursor:pointer}.settings-wrap{max-width:980px;padding:0 5px}.settings-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}.settings-cards article,.bot-status{border:1px solid #282c38;border-radius:16px;background:#17181e;padding:20px;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}.settings-cards article:hover,.bot-status:hover{transform:scale(1.018);z-index:2;border-color:#13d8ef;box-shadow:0 0 13px #0ad8f278,0 0 34px #0ad8f23d,0 15px 26px #0009}.settings-cards article:nth-child(3){grid-column:1}.settings-cards h3,.bot-status h3{margin:0 0 12px;font-size:16px}.settings-cards p{margin:0 0 6px;color:#b4c6da}.settings-cards small{color:#95b8e4}.bot-status{margin-top:16px}.bot-title{display:flex;align-items:start;justify-content:space-between}.bot-title p{color:#a3b9d5;margin:0}.online-pill{border:1px solid #303644;border-radius:18px;padding:5px 12px;color:#91bdf4;font-size:11px;font-weight:500}.bot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:17px}.bot-grid div{border:1px solid #2b2e39;border-radius:13px;padding:12px;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.bot-grid div:hover{transform:scale(1.035);border-color:#25dff3;box-shadow:0 0 12px #12d5ed69}.bot-grid small{display:block;color:#95b8e4;margin-bottom:7px}.bot-grid b{display:block;font-size:12px}.toast-zone{position:fixed;right:22px;bottom:22px;z-index:100;display:flex;flex-direction:column;gap:10px}.toast{min-width:265px;padding:14px 17px;border-radius:10px;color:#effff7;background:#0f2e24;border:1px solid #1cd487;box-shadow:0 0 22px #16cd7c52;font-size:13px;animation:slideIn .25s ease}.toast.error{background:#32171b;border-color:#ed4652;box-shadow:0 0 22px #e6374952}@keyframes slideIn{from{opacity:0;transform:translateX(35px)}to{opacity:1;transform:none}}
        .integration-page{max-width:1060px;padding-top:12px}.link-hero{position:relative;overflow:hidden;text-align:center;padding:43px 20px 34px;border:1px solid #135d71;border-radius:25px;background:radial-gradient(circle at 50% 0,#087d994a,transparent 42%),linear-gradient(145deg,#092334,#081522 63%,#07101d);box-shadow:0 0 0 1px #10e0f020 inset,0 0 34px #07d9ef38}.link-mesh{position:absolute;inset:0;opacity:.24;background-image:linear-gradient(#16d7eb14 1px,transparent 1px),linear-gradient(90deg,#16d7eb14 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(to bottom,#000,transparent)}.link-icon{position:relative;z-index:1;width:72px;height:72px;display:inline-grid;place-items:center;border-radius:23px;font-weight:900;font-size:34px;vertical-align:middle}.discord-logo{background:linear-gradient(135deg,#516cff,#7584ff);color:#fff;box-shadow:0 0 25px #6977ff7a}.luarmen-logo{background:linear-gradient(135deg,#1ef0ff,#0395b3);color:#002b35;box-shadow:0 0 25px #09deef7a}.link-line{position:relative;z-index:1;display:inline-flex;vertical-align:middle;width:92px;align-items:center;justify-content:center;gap:5px}.link-line i{height:2px;width:30px;background:#1bd9e9;box-shadow:0 0 12px #0eeaf7}.link-line b{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#103848;color:#1ce8f5;font-size:10px;animation:pulseLink 1.8s infinite}.link-hero>span{position:relative;z-index:1;display:block;margin-top:22px;color:#2be4f3;letter-spacing:2px;font-weight:800;font-size:10px}.link-hero h2{position:relative;z-index:1;font-size:31px;margin:9px 0}.link-hero p{position:relative;z-index:1;max-width:620px;margin:0 auto;color:#9eb8c8;line-height:1.6}.security-row{position:relative;z-index:1;display:flex;justify-content:center;gap:9px;margin:19px 0}.security-row b{border:1px solid #1e5e70;background:#0a2a38;color:#91eaf2;border-radius:20px;padding:6px 10px;font-size:10px}.link-discord-btn{position:relative;z-index:1;border:0;border-radius:12px;background:linear-gradient(135deg,#16e2f5,#079ab9);color:#012931;font-weight:900;font-size:14px;padding:15px 21px;cursor:pointer;box-shadow:0 0 24px #0ce8f38f;transition:.2s}.link-discord-btn:hover{transform:translateY(-4px) scale(1.035);box-shadow:0 9px 32px #0ce8f5ad}.link-discord-btn i{font-style:normal;font-size:18px;margin-right:8px}.link-discord-btn strong{font-size:20px;margin-left:15px}.link-hero>small{position:relative;z-index:1;display:block;color:#65849b;margin-top:15px;font-size:10px}.link-features{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:15px}.link-features article{padding:17px;border:1px solid #1e4655;border-radius:15px;background:#0b1927;display:grid;grid-template-columns:35px 1fr;text-align:left;column-gap:10px;transition:.2s}.link-features article:hover{transform:translateY(-4px);border-color:#18ddf1;box-shadow:0 0 20px #0ddfec3c}.link-features i{grid-row:span 2;width:34px;height:34px;border-radius:10px;background:#103642;color:#19dfee;display:grid;place-items:center;font-style:normal}.link-features b{font-size:12px}.link-features span{font-size:10px;color:#718da3;margin-top:4px;line-height:1.35}@keyframes pulseLink{50%{transform:scale(1.18);box-shadow:0 0 16px #0be4f6}}
        .integration-page{max-width:1060px;margin:0 auto;padding:12px 5px}.integration-title{margin-bottom:24px}.integration-title>span{font-size:10px;letter-spacing:1.6px;color:#14d6ec;font-weight:800}.integration-title h2{font-size:25px;margin:7px 0}.integration-title p{color:#8cabc5;margin:0}.linked-account{min-height:188px;position:relative;display:flex;gap:18px;align-items:center;padding:28px;border:1px solid #13546a;border-radius:19px;background:linear-gradient(110deg,#062237,#071a2d);box-shadow:inset 0 0 30px #0bcbe216,0 0 26px #0bcbe21f}.linked-glow{width:59px;height:59px;border-radius:17px;display:grid;place-items:center;background:#0bd4e9;color:#032631;font-size:29px;box-shadow:0 0 22px #08d9ec9e}.linked-account>div:nth-child(2)>span{font-size:11px;color:#85bbd2;letter-spacing:.7px}.linked-account h3{font-size:16px;margin:9px 0 7px}.linked-account h3 small{font-size:11px;color:#55cbe1;font-weight:500}.linked-account p{color:#7396b3;font-size:12px;margin:0 0 13px}.linked-account button{border:1px solid #176477;background:#071521;color:#d9fbff;border-radius:8px;padding:9px 12px;font-weight:700;cursor:pointer}.linked-account button:hover{border-color:#0ce0f6;box-shadow:0 0 15px #08d9ec55}.connected{position:absolute;top:22px;right:24px;color:#39e9b0;font-size:10px;letter-spacing:1px}.integration-ready{margin-top:17px;display:flex;align-items:center;gap:13px;border:1px solid #176370;border-radius:14px;background:#082733;padding:17px}.integration-ready>div{width:32px;height:32px;border-radius:50%;background:#0bd8e9;color:#032831;display:grid;place-items:center;font-weight:900}.integration-ready span{flex:1}.integration-ready b,.integration-ready small{display:block}.integration-ready small{color:#87afbe;font-size:11px;margin-top:3px}.integration-ready button{border:0;border-radius:8px;background:#0cd1e5;color:#042a31;padding:10px 13px;font-weight:800;cursor:pointer}
        .discord-modal{backdrop-filter:blur(11px);background:radial-gradient(circle at 50% 0,#06334080,transparent 37%),#030914ed}.discord-setup-panel{position:relative;max-width:1050px;padding:25px;border:1px solid #1a4754;border-radius:24px;background:linear-gradient(145deg,#0d1a29 0%,#0b1220 47%,#091420 100%);box-shadow:0 0 0 1px #0bd6e21c inset,0 26px 80px #000a;animation:panelEnter .45s cubic-bezier(.2,.9,.25,1)}.discord-close{position:absolute;right:18px;top:17px;width:35px;height:35px;border:1px solid #294456;background:#0c1929;color:#88a5b8;border-radius:11px;font-size:22px;cursor:pointer;transition:.2s}.discord-close:hover{color:#fff;border-color:#11dff3;box-shadow:0 0 15px #0bdff266;transform:rotate(90deg)}.discord-step{padding:2px 0 20px;border:0;border-bottom:1px solid #1b3041;border-radius:0;background:transparent;display:flex;align-items:center;justify-content:space-between}.discord-step span{color:#1fe0f2;letter-spacing:1.7px}.discord-step h2{font-size:24px;margin:7px 0 0}.stepper{display:flex;align-items:center;gap:8px;margin-right:40px}.stepper b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#17263a;color:#7290a3;font-size:11px}.stepper b.current,.stepper b:first-child{background:#0dd3e8;color:#04262e;box-shadow:0 0 16px #0bdff291}.stepper i{width:35px;height:2px;background:#1d3749}.bot-hero{padding:29px 8px;display:flex;align-items:center;gap:22px}.bot-orbit{width:92px;height:92px;flex:none;border:1px solid #12ddeb;border-radius:50%;display:grid;place-items:center;position:relative;box-shadow:0 0 17px #0ad9ed85,inset 0 0 22px #0ad9ed2e;animation:floatBot 3s ease-in-out infinite}.bot-orbit:before,.bot-orbit:after{content:"";position:absolute;border:1px solid #0bd6e754;border-radius:50%;inset:-11px;animation:spin 7s linear infinite}.bot-orbit:after{inset:-21px;border-style:dashed;animation-direction:reverse;animation-duration:12s}.bot-core{width:61px;height:61px;border-radius:22px;background:linear-gradient(135deg,#1af0ff,#057a9a);display:grid;place-items:center;color:#002831;font-size:30px;font-weight:900;box-shadow:0 0 28px #0bdff2}.live-dot{color:#49eab1;font-size:10px;letter-spacing:1px}.bot-hero h1{font-size:28px;margin:6px 0}.bot-hero h1 em{font-style:normal;color:#1bdff3;text-shadow:0 0 15px #0bdff285}.bot-hero p{margin:0;color:#92aabd;max-width:590px;line-height:1.55}.hero-tags{display:flex;gap:8px;margin-top:13px}.hero-tags span{border:1px solid #1d4b58;background:#0b2530;color:#7de4ed;border-radius:20px;padding:5px 9px;font-size:10px}.refresh{margin-left:auto;background:#0e2231;border-color:#1b6573;color:#b8f7fb;transition:.2s}.refresh:hover{border-color:#12e3f5;box-shadow:0 0 17px #0be2f16b;transform:translateY(-2px)}.refresh.spinning{pointer-events:none}.refresh.spinning:first-letter{display:inline-block;animation:spin .5s linear infinite}.discord-warning{display:flex;align-items:center;gap:10px;border-color:#76601b;background:linear-gradient(90deg,#302711,#1d1a17);color:#e8c96b}.discord-warning>b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#d7a621;color:#1e1808}.discord-warning strong{color:#f3db8c;margin-right:7px}.choose-title{display:flex;gap:13px;align-items:center;margin:25px 4px 14px}.choose-title>span{font-size:29px;color:#135464;font-weight:800}.choose-title h3{margin:0}.choose-title p{margin:4px 0 0;color:#778fa4;font-size:12px}.server{height:118px;position:relative;transition:transform .2s,box-shadow .2s,border-color .2s}.server:hover{transform:translateY(-5px);border-color:#19dbef;box-shadow:0 10px 25px #0008,0 0 17px #0adcf04b}.server mark{position:absolute;right:12px;top:12px;background:#172c3c;color:#6b9dad;border-radius:20px;padding:4px 7px;font-size:9px}.server.selected mark{background:#0dd2e5;color:#03272f}.chosen-server{margin-top:18px;border-color:#1b5361;background:linear-gradient(100deg,#0b2731,#0e1725);display:grid;grid-template-columns:auto 1fr auto auto;gap:15px;align-items:center}.connection-icon{width:45px;height:45px;border-radius:13px;display:grid;place-items:center;background:#0dcfe4;color:#03252d;font-size:23px;box-shadow:0 0 18px #0cd8e075}.chosen-server>div:nth-child(2)>span{color:#11d8ed;font-size:9px;letter-spacing:1.2px;font-weight:800}.chosen-server h3{margin:4px 0}.chosen-server p{margin:0}.add-bot{transition:.2s}.add-bot:hover{transform:translateY(-3px) scale(1.025);box-shadow:0 0 26px #0ce1f7a3}.added{white-space:nowrap;transition:.2s}.added:hover{border-color:#16dfef;color:#bfffff;box-shadow:0 0 15px #0ce1f749}.next-setup{height:49px;margin-top:3px;transition:.25s}.next-setup span{margin-left:8px;font-size:18px}.next-setup:not(:disabled):hover{transform:translateY(-3px);box-shadow:0 10px 29px #0ccce580}.setup-help{margin-bottom:0}@keyframes panelEnter{from{opacity:0;transform:translateY(25px) scale(.98)}to{opacity:1;transform:none}}@keyframes floatBot{50%{transform:translateY(-7px)}}@keyframes spin{to{transform:rotate(360deg)}}
        .api-key{font:11px ui-monospace,SFMono-Regular,monospace!important;color:#18d8ec!important;overflow-wrap:anywhere}.api-actions{display:flex;gap:12px}.api-actions button{font-size:11px}.discord-modal{position:fixed;z-index:50;inset:0;background:#050914e8;overflow:auto;padding:18px}.discord-setup-panel{max-width:920px;margin:auto;color:#edf5fa}.discord-step,.discord-main,.chosen-server{background:#161820;border:1px solid #2c3140;border-radius:17px;padding:24px;margin-bottom:18px}.discord-step span{color:#16d8ed;font-size:12px;font-weight:800}.discord-step h2{margin:8px 0 0;font-size:21px}.discord-main-head{display:flex;justify-content:space-between;gap:20px}.discord-main h1{margin:0 0 10px;font-size:25px}.discord-main p{color:#a6bdd4;line-height:1.55;margin:0;max-width:620px}.discord-main small{display:block;color:#9bb3cc;margin-top:8px}.refresh{align-self:start;min-width:143px;border:1px solid #303744;border-radius:12px;padding:13px;background:#171923;color:#fff;font-weight:700;cursor:pointer}.discord-warning{background:#292215;border:1px solid #77580d;color:#ffe281;border-radius:12px;padding:13px;margin-top:16px;font-size:13px}.server-list{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.server{height:112px;text-align:left;display:flex;align-items:center;gap:12px;border:1px solid #303744;border-radius:15px;background:#151720;color:#fff;padding:17px;cursor:pointer}.server.selected{border-color:#12d8ef;box-shadow:0 0 16px #0ad8ef4b;background:#102631}.server i{width:44px;height:44px;border-radius:12px;background:#123b4a;display:grid;place-items:center;color:#19d8ef;font-style:normal;font-weight:800}.server b,.server small{display:block}.server small{color:#e8cf70;font-size:11px;margin-top:7px}.chosen-server{display:flex;justify-content:space-between;align-items:start}.chosen-server h3{margin:2px 0 8px}.chosen-server p{color:#a9c1d9;margin:0 0 17px}.added{padding:11px 14px;border:1px solid #333a49;background:#161923;color:#fff;border-radius:10px;font-weight:700;cursor:pointer}.add-bot,.next-setup{border:0;background:#0ccce5;color:#042a31;border-radius:12px;padding:15px 20px;font-weight:800;cursor:pointer;box-shadow:0 0 20px #0ccce563}.next-setup{width:100%;background:#116377;color:#a0d1d9;box-shadow:none}.next-setup:not(:disabled){background:#13d4ea;color:#03252b;box-shadow:0 0 20px #0ccce563}.setup-help{text-align:center;color:#a5b1c2;font-size:12px;margin:8px}
        .premium-generator{max-width:1250px;margin:auto}.generator-hero{display:flex;align-items:center;gap:18px;padding:27px;border:1px solid #126678;border-radius:21px;background:radial-gradient(circle at 12% 0,#0de2f344,transparent 31%),linear-gradient(105deg,#092936,#0c1828 64%);box-shadow:0 0 25px #0bd8ec36}.key-orb{width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#1bf0ff,#0786a2);display:grid;place-items:center;color:#032832;font-size:34px;box-shadow:0 0 27px #09deefa3;animation:floatBot 3s ease-in-out infinite}.generator-hero span,.gen-card-top span,.keys-title span{color:#20dff1;letter-spacing:1.5px;font-size:10px;font-weight:850}.generator-hero h2{font-size:27px;margin:7px 0}.generator-hero p{margin:0;color:#91adbb}.generator-status{margin-left:auto;text-align:right}.generator-status i{display:block;color:#43e6ad;font-style:normal;font-size:11px}.generator-status b,.generator-status small{display:block}.generator-status b{margin-top:5px}.generator-status small{color:#7795a9;font-size:11px;margin-top:3px}.generator-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin:16px 0}.generator-metrics article{display:flex;gap:12px;align-items:center;border:1px solid #1b3d4e;border-radius:13px;padding:14px;background:#0c1929;transition:.2s}.generator-metrics article:hover{transform:translateY(-4px);border-color:#14daef;box-shadow:0 0 18px #0bdff14c}.generator-metrics i{width:37px;height:37px;display:grid;place-items:center;border-radius:11px;background:#0c3743;color:#1be0f1;font-style:normal;font-size:19px}.generator-metrics small,.generator-metrics b{display:block}.generator-metrics small{color:#7190a4;font-size:9px;font-weight:800}.generator-metrics b{font-size:18px;margin-top:4px}.generator-workspace{display:grid;grid-template-columns:1fr 1.38fr;gap:16px}.premium-generator .generate-card,.premium-generator .keys-card{margin:0;border-color:#185669;box-shadow:none;background:#0c1727;padding:21px}.gen-card-top,.keys-title{display:flex;align-items:center;justify-content:space-between}.gen-card-top h3,.keys-title h3{margin:6px 0 0;font-size:17px;color:#ecf5fa;letter-spacing:0;font-family:inherit}.secure-label{font:9px Inter,sans-serif;color:#68dbc0;background:#0d2c2c;border:1px solid #1a5551;border-radius:20px;padding:6px 8px}.plan-choice{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:21px 0 14px}.plan-choice-btn{background:#0a1221;border:1px solid #243a51;border-radius:9px;padding:11px 7px;color:#dcecf3;text-align:left;cursor:pointer;transition:.2s}.plan-choice-btn b,.plan-choice-btn small{display:block}.plan-choice-btn small{font-size:10px;color:#7f9cb0;margin-top:4px}.plan-choice-btn:hover,.plan-choice-btn.selected{border-color:#14dbea;background:#0c3140;box-shadow:0 0 14px #0bdeed44}.premium-generator .generate-form{grid-template-columns:1fr 1fr;gap:10px}.premium-generator .generate-form button{grid-column:1/-1;height:44px;font-size:12px}.premium-generator .generate-form button span{font-size:18px;margin-right:8px}.gen-hint{color:#708ca3;font:10px Inter,sans-serif;letter-spacing:0;margin:12px 0 0}.keys-title button{border:1px solid #265466;background:#0b2531;color:#6fe7f1;border-radius:7px;padding:7px 9px;font-size:11px;cursor:pointer}.premium-generator .generated-header{margin:17px -21px 0;padding:13px 20px}.premium-generator .generated-empty{height:196px;padding:45px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center}.premium-generator .generated-empty i{font-style:normal;font-size:34px;color:#19748a}.premium-generator .generated-empty b{font:600 13px Inter,sans-serif;color:#c4d9e2;margin-top:9px}.premium-generator .generated-empty p{margin:5px 0 0}.premium-generator .generated-row{grid-template-columns:1.2fr .8fr 1fr 1fr 1.5fr .8fr;padding:12px 20px}.premium-generator .generated-row:hover{background:#0e2633}
        .terms-modal,.terms-viewer{position:fixed;z-index:90;inset:0;display:grid;place-items:center;padding:20px;background:#020814c9;backdrop-filter:blur(9px)}.terms-notice-card{width:min(580px,100%);padding:27px;border:1px solid #176174;border-radius:18px;background:linear-gradient(145deg,#0c2633,#091522);box-shadow:0 0 0 1px #0cdeed1c inset,0 25px 70px #000a;display:grid;grid-template-columns:auto 1fr;gap:17px;animation:panelEnter .4s ease}.terms-notice-icon{width:51px;height:51px;border-radius:16px;display:grid;place-items:center;background:#0dd7e7;color:#032831;font-size:24px;box-shadow:0 0 20px #0bdfed84}.terms-notice-card span,.terms-window header span{color:#21ddec;font-size:9px;letter-spacing:1.5px;font-weight:850}.terms-notice-card h2{font-size:20px;margin:6px 0}.terms-notice-card p{color:#9ab3c2;line-height:1.5;margin:0;font-size:12px}.terms-link{border:0;background:none;color:#2bdfef;font-size:11px;padding:0;margin-top:15px;cursor:pointer}.terms-link span{font-size:14px;letter-spacing:0}.terms-agree{grid-column:1/-1;height:42px;border:0;border-radius:9px;background:linear-gradient(135deg,#14dced,#078ba6);color:#032730;font-weight:900;cursor:pointer;box-shadow:0 0 18px #0bdfee6d}.terms-agree span{float:right;color:#06333a;font-size:15px;margin-right:10px}.terms-window{width:min(850px,100%);height:min(85vh,790px);display:flex;flex-direction:column;border:1px solid #176174;border-radius:18px;overflow:hidden;background:#0b1727;box-shadow:0 25px 80px #000b;animation:panelEnter .35s ease}.terms-window header{display:flex;justify-content:space-between;align-items:center;padding:17px 22px;border-bottom:1px solid #1c3d51;background:#0d2532}.terms-window header h2{margin:5px 0 0;font-size:19px}.terms-window header button{width:33px;height:33px;border:1px solid #285468;border-radius:8px;background:#0a1726;color:#8faebe;font-size:21px;cursor:pointer}.terms-scroll{flex:1;overflow:auto;padding:24px 28px;color:#aec3ce;line-height:1.6}.terms-document{max-width:740px;margin:auto}.terms-document h1{font-size:27px;color:#e7f8fb;margin:0 0 4px}.terms-document h2{font-size:15px;color:#31e0ee;margin:23px 0 8px}.terms-document p,.terms-document li{font-size:12px}.terms-document ul{padding-left:20px}.terms-window footer{display:flex;justify-content:space-between;align-items:center;padding:13px 22px;border-top:1px solid #1c3d51;color:#7693a5;font-size:10px}.terms-window footer button{border:0;border-radius:8px;background:#12d9ea;color:#032730;padding:10px 13px;font-size:11px;font-weight:900;cursor:pointer}.terms-window footer b{margin-left:8px;font-size:14px}
        .activation-overlay{position:fixed;z-index:70;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 43,#d2a9002b,transparent 30%),#030813ed;backdrop-filter:blur(11px)}.activation-card{width:min(480px,calc(100% - 40px));position:relative;text-align:center;padding:40px 31px;border:1px solid #e5c420;border-radius:24px;background:radial-gradient(circle at 50% 0,#e5bc1928,transparent 35%),linear-gradient(145deg,#242016,#111720);box-shadow:0 0 0 1px #ffe35a25 inset,0 0 42px #e5bd1b72,0 25px 80px #000a;animation:panelEnter .4s ease;overflow:hidden}.activation-card:after{content:"";position:absolute;inset:0;opacity:.24;background-image:linear-gradient(#f5d24612 1px,transparent 1px),linear-gradient(90deg,#f5d24612 1px,transparent 1px);background-size:25px 25px;mask-image:linear-gradient(to bottom,#000,transparent)}.activate-rings{height:126px;display:grid;place-items:center;position:relative;margin-bottom:17px}.activate-rings i{position:absolute;border:1px solid #f5d649;border-radius:50%;animation:spin 4s linear infinite}.activate-rings i:nth-child(1){width:76px;height:76px;border-style:dashed}.activate-rings i:nth-child(2){width:105px;height:105px;border-color:#f2c627;animation-direction:reverse;animation-duration:6s}.activate-rings i:nth-child(3){width:127px;height:127px;border-color:#ffe76d52;border-style:dotted;animation-duration:10s}.activate-rings b{position:relative;z-index:1;width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#ffeb69,#d79906);color:#2b2003;font-size:27px;box-shadow:0 0 27px #f0c223ab;animation:obfCore 1.25s ease-in-out infinite}.activation-card>span{position:relative;z-index:1;color:#f6d754;font-size:10px;font-weight:850;letter-spacing:1.7px}.activation-card h2{position:relative;z-index:1;font-size:25px;margin:8px 0}.activation-card p{position:relative;z-index:1;margin:0;color:#c0b896}.activation-track{position:relative;z-index:1;height:10px;border-radius:10px;background:#3a3420;margin:23px 0 8px;overflow:hidden}.activation-track i{display:block;width:0;height:100%;background:linear-gradient(90deg,#d79e07,#ffeb66,#e6c328);box-shadow:0 0 15px #f3d029;transition:width .15s linear}.activation-percent{position:relative;z-index:1;color:#ffe45a;font-size:18px;font-weight:900}.activation-steps{position:relative;z-index:1;display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:20px}.activation-steps b{font-size:9px;color:#a49d7d;border:1px solid #524a2b;background:#211e17;border-radius:15px;padding:5px 7px}.activation-steps b.on{color:#fee670;border-color:#9d8120;background:#352b11;box-shadow:0 0 11px #e7bd2c38}
        .studio-stage{display:none}.editor-panel.step-1 #editorCode,.editor-panel.step-2 #editorOptions{display:block}.editor-panel.step-1 .editor-progress span:nth-of-type(1),.editor-panel.step-2 .editor-progress span:nth-of-type(2),.editor-panel.step-3 .editor-progress span:nth-of-type(3){color:#5de8f3}.editor-panel.step-1 .editor-progress span:nth-of-type(1) i,.editor-panel.step-2 .editor-progress span:nth-of-type(2) i,.editor-panel.step-3 .editor-progress span:nth-of-type(3) i{background:#0ddaea;color:#032831;box-shadow:0 0 11px #0ddaea}.editor-panel.step-1 .editor-progress span:nth-of-type(1) i:after,.editor-panel.step-2 .editor-progress span:nth-of-type(2) i:after{content:'✓';font-size:10px}.editor-panel.step-1 .editor-progress span:nth-of-type(1) i,.editor-panel.step-2 .editor-progress span:nth-of-type(1) i{font-size:0}.editor-panel.step-2 #editorOptions{padding:18px 24px 22px;background:radial-gradient(circle at 100% 0,#0de4ef1d,transparent 30%),#091522}.editor-panel.step-2 .editor-section-head{height:auto;min-height:64px;padding:0 10px 14px;border-bottom:1px solid #1d3a4f}.editor-panel.step-2 .editor-section-head h3{font-size:18px}.editor-panel.step-2 .setting{position:relative;margin:8px 0;min-height:74px;padding:12px 14px;border:1px solid #1c344a;border-radius:12px;background:linear-gradient(100deg,#0c1b2b,#0a1423);box-shadow:inset 0 0 17px #00000018}.editor-panel.step-2 .setting:before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:3px;border-radius:0 4px 4px 0;background:#1d3a4e;transition:.2s}.editor-panel.step-2 .setting:hover{padding-left:17px;background:linear-gradient(100deg,#0c2d39,#0b1b2a);border-color:#1b6675;box-shadow:0 0 15px #0bdfee24}.editor-panel.step-2 .setting:hover:before{background:#15dfee;box-shadow:0 0 9px #15dfee}.editor-panel.step-2 .setting input:checked+.toggle{box-shadow:0 0 17px #00dbf1ba}.editor-panel.step-2 .setting span:last-child{flex:1}.editor-panel.step-2 .setting b{font-size:13px;letter-spacing:.05px}.editor-panel.step-2 .setting small{line-height:1.45}.stage-next{margin-top:16px;padding:14px 15px;border:1px solid #1d6673;border-radius:13px;background:linear-gradient(100deg,#0b2d37,#0b1a2a);display:flex;align-items:center;justify-content:space-between;box-shadow:0 0 18px #0bdfee28}.stage-next b,.stage-next small{display:block}.stage-next b{font-size:12px;color:#dcf9fb}.stage-next small{color:#7ea3b2;font-size:10px;margin-top:4px}.stage-next button{border:0;border-radius:9px;background:linear-gradient(135deg,#16ddea,#078ba5);color:#032831;padding:11px 14px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 0 17px #0bdeed65;transition:.2s}.stage-next button:hover{transform:translateY(-3px);box-shadow:0 8px 24px #0bdeed93}.stage-next button span{font-size:16px;margin-left:7px}.obfuscation-overlay{position:fixed;z-index:60;inset:0;background:radial-gradient(circle at 50% 45,#0ae1ef28,transparent 30%),#030914ed;display:grid;place-items:center;backdrop-filter:blur(11px)}.obfuscation-card{position:relative;width:min(520px,calc(100% - 40px));overflow:hidden;text-align:center;padding:43px 33px;border:1px solid #13dbe9;border-radius:24px;background:linear-gradient(145deg,#0b2936,#091322);box-shadow:0 0 0 1px #0fe4f024 inset,0 0 45px #0bdeed63,0 25px 80px #0009;animation:panelEnter .4s ease}.obfuscation-card:before{content:"";position:absolute;inset:0;opacity:.25;background-image:linear-gradient(#16d7eb14 1px,transparent 1px),linear-gradient(90deg,#16d7eb14 1px,transparent 1px);background-size:25px 25px;mask-image:linear-gradient(to bottom,#000,transparent)}.obf-rings{height:130px;position:relative;display:grid;place-items:center;margin-bottom:18px}.obf-rings i{position:absolute;border:1px solid #16e3f0;border-radius:50%;animation:spin 4s linear infinite}.obf-rings i:nth-child(1){width:78px;height:78px;border-style:dashed}.obf-rings i:nth-child(2){width:108px;height:108px;border-color:#19dc9d;animation-direction:reverse;animation-duration:7s}.obf-rings i:nth-child(3){width:132px;height:132px;border-color:#18dff14f;border-style:dotted;animation-duration:10s}.obf-rings b{width:57px;height:57px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#22efff,#0589a5);color:#032932;font-size:28px;box-shadow:0 0 27px #0ee5f0a0;z-index:1;animation:obfCore 1.2s ease-in-out infinite}.obfuscation-card>span{position:relative;color:#24e0f0;letter-spacing:1.7px;font-size:10px;font-weight:850}.obfuscation-card h2{position:relative;font-size:25px;margin:8px 0}.obfuscation-card p{position:relative;color:#96b2c1;margin:0}.obf-progress{position:relative;height:10px;border-radius:10px;background:#173243;margin:25px 0 10px;overflow:hidden}.obf-progress i{display:block;width:0%;height:100%;background:linear-gradient(90deg,#13d9e9,#4ce3af);box-shadow:0 0 15px #0be0ed;transition:width .2s linear}.obf-meta{position:relative;display:flex;justify-content:space-between;align-items:center;text-align:left}.obf-meta b{color:#52e9b4;font-size:17px}.obf-meta small{color:#708fa2;font-size:10px;max-width:290px}.obf-pills{position:relative;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:23px}.obf-pills b{border:1px solid #1b5766;background:#0a2732;color:#8debf3;border-radius:14px;padding:5px 7px;font-size:9px}@keyframes obfCore{50%{transform:scale(1.13);box-shadow:0 0 36px #0ee5f0}}
        .new-script-dialog{position:relative;width:min(570px,100%);padding:0;overflow:hidden;border-color:#17687a;border-radius:19px;background:linear-gradient(145deg,#0d2330,#0b1424);box-shadow:0 0 0 1px #0ce2ef1c inset,0 25px 70px #000a}.new-script-dialog:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.2;background-image:linear-gradient(#15ddec12 1px,transparent 1px),linear-gradient(90deg,#15ddec12 1px,transparent 1px);background-size:24px 24px;mask-image:linear-gradient(to bottom,#000,transparent)}.new-script-close{position:absolute;right:17px;top:15px;z-index:2;width:29px;height:29px;border:1px solid #255468;border-radius:8px;background:#0b1b2b;color:#7ca5b7;font-size:19px;cursor:pointer}.new-script-close:hover{color:#fff;border-color:#16ddec;box-shadow:0 0 12px #0be0ef66;transform:rotate(90deg)}.new-script-hero{position:relative;z-index:1;display:flex;align-items:center;gap:13px;padding:24px 25px 18px;border-bottom:1px solid #1c3a4e;background:radial-gradient(circle at 12% 0,#0de4ef2e,transparent 40%)}.new-script-orb{width:51px;height:51px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#22efff,#07839e);color:#032832;font-size:24px;box-shadow:0 0 21px #0bdeef8e}.new-script-hero span{color:#22deee;font-size:9px;font-weight:850;letter-spacing:1.4px}.new-script-hero h2{font-size:19px;margin:5px 0}.new-script-hero p{margin:0;color:#87a6b8;font-size:11px}.create-steps{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 25px}.create-steps b{display:flex;align-items:center;gap:5px;color:#748fa3;font-size:10px}.create-steps i{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#173145;color:#7f9eb0;font-style:normal;font-size:9px}.create-steps b.active{color:#57e9f3}.create-steps b.active i{background:#10dcea;color:#032831;box-shadow:0 0 11px #0bdfee}.create-steps em{width:35px;height:1px;background:#234054}.new-script-dialog>.field-label,.new-script-dialog>.name-input-wrap,.new-script-dialog>.template-title,.new-script-dialog>.template-grid,.new-script-dialog>.dialog-actions,.new-script-dialog>.dialog-security{position:relative;z-index:1;margin-left:25px;margin-right:25px}.new-script-dialog>.field-label{margin-top:3px;color:#7da0b2}.name-input-wrap{height:45px;display:flex;align-items:center;border:1px solid #1e5565;border-radius:10px;background:#07131f;overflow:hidden}.name-input-wrap:focus-within{border-color:#15dfee;box-shadow:0 0 15px #0bdfee4c}.name-input-wrap>i{width:40px;text-align:center;color:#1ce0f0;font-style:normal;font-size:19px}.name-input-wrap .field{border:0;background:transparent;height:100%;flex:1}.name-input-wrap span{margin-right:10px;color:#668698;border:1px solid #1e3d50;border-radius:10px;padding:3px 6px;font-size:9px}.template-title{display:flex;justify-content:space-between;margin-top:19px;color:#1bdeef;font-size:9px;font-weight:850;letter-spacing:1px}.template-title small{font-size:9px;color:#708da0;font-weight:500;letter-spacing:0}.template-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:9px}.template-grid button{padding:11px 8px;text-align:left;border:1px solid #203c52;border-radius:10px;background:#0a1727;color:#d8edf2;cursor:pointer;transition:.2s}.template-grid button:hover,.template-grid button.selected{border-color:#14ddec;background:#0b3040;box-shadow:0 0 13px #0bdeed43}.template-grid i{width:25px;height:25px;border-radius:8px;background:#123648;color:#1de0f0;display:grid;place-items:center;font-style:normal;margin-bottom:8px}.template-grid b,.template-grid small{display:block}.template-grid b{font-size:10px}.template-grid small{color:#7896a9;font-size:9px;margin-top:3px}.new-script-dialog .dialog-actions{margin-top:20px;margin-bottom:0}.new-script-dialog .cancel{height:39px;padding:0 15px;border-radius:8px;font-size:11px;cursor:pointer}.new-script-dialog .button{height:39px;font-size:11px}.new-script-dialog .button span{font-size:17px;float:right;margin-left:12px}.dialog-security{color:#6f91a4;font-size:9px;text-align:center;margin-top:13px!important;margin-bottom:19px!important}
        .editor-modal{background:radial-gradient(circle at 50% 0,#07576a40,transparent 40%),#030814ed;backdrop-filter:blur(9px);padding:20px}.editor-panel{max-width:1370px;margin:auto;min-height:calc(100vh - 40px);border:1px solid #176477;border-radius:20px;background:linear-gradient(145deg,#0c192a,#091322);box-shadow:0 0 0 1px #0ce1ef1d inset,0 30px 90px #000c;animation:panelEnter .45s cubic-bezier(.2,.9,.25,1)}.editor-top{height:83px;padding:0 25px;border-bottom-color:#1b374b;background:linear-gradient(90deg,#0c2634,#0c1727);gap:18px}.editor-brand{display:flex;align-items:center;gap:11px}.editor-file-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:#0dd9e9;color:#032832;font-size:19px;box-shadow:0 0 17px #0bdfee83}.editor-brand span{display:block;color:#23dfef;font-size:9px;font-weight:850;letter-spacing:1.4px}.editor-brand strong{display:block;font-size:15px;margin:4px 0}.editor-brand small{color:#7e9caf;font-size:10px}.editor-health{margin-left:auto;display:flex;align-items:center;gap:5px;color:#58e9b3;font-size:10px}.editor-health i{font-style:normal;font-size:9px}.editor-top-actions{display:flex;gap:7px}.editor-action{height:35px}.editor-action.preview{width:auto;padding:0 11px;background:#0d2d3b;color:#83e9f1;border:1px solid #1d6b7a;font-size:10px}.editor-action.save{background:#16c978;box-shadow:0 0 18px #15c87969}.editor-progress{height:47px;display:flex;justify-content:center;align-items:center;gap:9px;background:#0a1423;border-bottom:1px solid #193248}.editor-progress span{font-size:10px;color:#708ca1;display:flex;align-items:center;gap:5px}.editor-progress span i{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#152b3d;color:#83a1b5;font-style:normal;font-size:9px}.editor-progress span.active{color:#59e8f3}.editor-progress span.active i{background:#0ddaea;color:#032831;box-shadow:0 0 11px #0ddaea}.editor-progress em{width:39px;height:1px;background:#213a4c}.editor-options{padding:13px 25px 0}.editor-section-head{height:52px;display:flex;align-items:center;justify-content:space-between}.editor-section-head span{color:#19dceef0;font-size:9px;font-weight:850;letter-spacing:1.3px}.editor-section-head h3{margin:5px 0 0;font-size:15px}.editor-section-head>b{font-size:9px;color:#62e2c2;background:#0b302f;border:1px solid #1a6658;border-radius:17px;padding:6px 8px}.setting{min-height:66px;border-bottom-color:#1b3448;transition:.2s}.setting:hover{background:#0d2532;padding-left:11px;border-radius:9px}.setting b{font-size:12px}.setting small{font-size:10px}.toggle{width:46px;height:25px}.toggle:after{width:21px;height:21px}.setting input:checked+.toggle:after{left:22px}.code-area{padding:20px 25px 19px;background:#091422}.code-title{height:38px}.code-title>div:first-child span{display:block;color:#1fe0f0;font-size:9px;letter-spacing:1.2px;font-weight:850}.code-title>div:first-child b{display:block;font-size:14px;margin-top:4px}.code-tools{display:flex;gap:7px}.code-title button{padding:7px 9px}.editor-code-shell{position:relative;display:flex;min-height:207px;border:1px solid #1c5060;border-radius:11px;background:#060d18;overflow:hidden;box-shadow:inset 0 0 25px #0008}.code-gutter{width:39px;flex:none;padding:13px 0;background:#091522;border-right:1px solid #172d42;text-align:center;color:#3b5c71;font:11px/20px ui-monospace,monospace}.code-gutter span{display:block}.editor-code-shell textarea{height:207px;border:0;border-radius:0;flex:1;padding:13px 54px 29px 14px;background:transparent;color:#a9c5ed}.code-minimap{position:absolute;right:8px;top:11px;bottom:31px;width:31px;opacity:.55}.code-minimap i{display:block;height:3px;margin:5px 0;border-radius:5px;background:#2e7990}.code-minimap i:nth-child(2n){width:68%;background:#6086c5}.code-minimap i:nth-child(3n){width:88%;background:#43c6b0}.code-status{position:absolute;bottom:0;right:0;left:39px;height:25px;display:flex;justify-content:space-between;align-items:center;padding:0 10px;border-top:1px solid #13283a;background:#081421;color:#66889d;font-size:9px}.code-status i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#4ae4ad;box-shadow:0 0 7px #4ae4ad}.protect-footer{display:flex;align-items:center;justify-content:space-between;margin-top:13px}.protect-footer>div{display:flex;align-items:center;gap:8px}.protect-footer>div>i{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#0d3744;color:#1ce0f0;font-style:normal}.protect-footer b,.protect-footer small{display:block}.protect-footer b{font-size:11px}.protect-footer small{font-size:9px;color:#738fa2;margin-top:3px}.protect{width:auto;min-width:250px;height:43px;margin:0;background:linear-gradient(135deg,#13dcea,#058ca7);color:#032630;box-shadow:0 0 21px #0bdfe47a;transition:.2s}.protect:hover{transform:translateY(-3px) scale(1.015);background:#18e4f3;box-shadow:0 9px 28px #0bdfe49b}.protect span{float:right;font-size:17px;margin-left:13px}
        .profile-premium{max-width:1160px;margin:auto;animation:settingsReveal .45s ease}.profile-cover{position:relative;min-height:210px;overflow:hidden;display:flex;align-items:center;gap:20px;padding:41px 30px 25px;border:1px solid #176375;border-radius:22px;background:radial-gradient(circle at 75% 0,#0ce3f03b,transparent 34%),linear-gradient(120deg,#082937,#0b1728 69%);box-shadow:0 0 26px #0bdbef38}.cover-grid{position:absolute;inset:0;opacity:.22;background-image:linear-gradient(#18ddec12 1px,transparent 1px),linear-gradient(90deg,#18ddec12 1px,transparent 1px);background-size:26px 26px;mask-image:linear-gradient(to right,#000,transparent)}.profile-big-avatar{position:relative;z-index:1;width:91px;height:91px;border-radius:28px;display:grid;place-items:center;background:linear-gradient(135deg,#25edff,#06849f);color:#032730;font-size:29px;font-weight:900;box-shadow:0 0 30px #0be5f09e}.profile-big-avatar span{position:absolute;right:-5px;bottom:-4px;width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#3ce0a8;border:3px solid #0a2734;color:#073427;font-size:12px}.profile-intro{position:relative;z-index:1}.profile-intro>span,.profile-card-head span,.membership-card>span{font-size:10px;color:#27dfef;letter-spacing:1.5px;font-weight:850}.profile-intro h2{margin:7px 0;font-size:28px}.profile-intro p{margin:0;color:#9ab2c1}.creator-badges{display:flex;gap:7px;margin-top:14px}.creator-badges b{font-size:9px;border:1px solid #1b6271;background:#0b2b37;color:#8cedf5;border-radius:16px;padding:5px 8px}.profile-edit{position:relative;z-index:1;margin-left:auto;border:1px solid #19d7eb;background:#0b2c38;color:#74f0fa;border-radius:9px;padding:10px 13px;font-weight:800;cursor:pointer}.profile-since{position:absolute;right:28px;bottom:20px;color:#7290a3;font-size:9px;letter-spacing:1px}.profile-since b{display:block;color:#b9dce7;margin-top:4px;font-size:11px}.profile-stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.profile-stat-row article{display:flex;align-items:center;gap:11px;padding:14px;border:1px solid #1c4052;border-radius:13px;background:#0c1929;transition:.2s}.profile-stat-row article:hover{transform:translateY(-4px);border-color:#17dced;box-shadow:0 0 17px #0bdeed45}.profile-stat-row i{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:#103845;color:#20dfef;font-style:normal;font-size:18px}.profile-stat-row small,.profile-stat-row b{display:block}.profile-stat-row small{font-size:9px;color:#7796aa;font-weight:800}.profile-stat-row b{font-size:18px;margin-top:4px}.profile-stat-row .account-active{font-size:14px;color:#49e5ad}.profile-command-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}.profile-details-card,.membership-card,.profile-security,.profile-activity{border:1px solid #1b3f51;border-radius:16px;background:linear-gradient(145deg,#0d1a2b,#0a1524);padding:20px;transition:.25s}.profile-details-card:hover,.membership-card:hover,.profile-security:hover,.profile-activity:hover{border-color:#18deef;box-shadow:0 0 22px #0bdeed36}.profile-card-head{display:flex;justify-content:space-between;align-items:start}.profile-card-head h3{margin:6px 0 16px;font-size:17px}.profile-card-head>b{font-size:9px;color:#52e9b4;border:1px solid #22735b;border-radius:18px;padding:5px 7px}.profile-details-card label{display:block;font-size:9px;color:#7899ad;letter-spacing:1px;margin:10px 0}.profile-details-card input{width:100%;height:38px;margin-top:6px;border:1px solid #203d51;background:#07131f;border-radius:7px;color:#d9edf3;padding:0 10px}.save-profile{width:100%;margin-top:5px;border:0;border-radius:8px;background:#12d9eb;color:#032730;padding:11px;font-weight:850;cursor:pointer}.save-profile span{float:right;font-size:16px}.membership-card{background:radial-gradient(circle at 100% 0,#0ce4ef2b,transparent 40%),#0c1828}.membership-title{display:flex;align-items:center;gap:10px;margin:15px 0}.membership-title i{width:44px;height:44px;border-radius:13px;background:#103c48;color:#2ce4f3;display:grid;place-items:center;font-style:normal;font-size:21px}.membership-title h3{margin:0;font-size:18px}.membership-title p{margin:3px 0 0;color:#7c9aab;font-size:11px}.membership-title b{margin-left:auto;color:#48e4ad;font-size:9px}.membership-meter div{display:flex;justify-content:space-between;font-size:10px;color:#91abb9}.membership-meter i{display:block;height:7px;background:#183647;border-radius:9px;margin-top:7px;overflow:hidden}.membership-meter em{display:block;height:100%;width:77%;background:#13dce9;box-shadow:0 0 12px #0bdeed}.membership-card ul{padding:0;margin:16px 0;list-style:none;color:#a6bdc8;font-size:11px;line-height:2}.membership-card li:before{content:'✓';color:#43e5af;margin-right:7px}.membership-card button,.profile-security button,.profile-activity button{border:1px solid #196071;background:#0a2935;color:#6ee7f1;border-radius:8px;padding:9px 10px;font-size:10px;font-weight:800;cursor:pointer}.profile-security{grid-column:1/-1}.secure-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:#103743;color:#1de0f1;font-style:normal;font-size:19px}.security-check{display:flex;justify-content:space-between;border-top:1px solid #1a3043;padding:11px 0;color:#b7ced8;font-size:11px}.security-check span{color:#65e6b2}.security-check span i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#46e6ae;box-shadow:0 0 8px #46e6ae}.profile-activity{margin-top:16px}.profile-activity .profile-card-head button{background:none;border:0;color:#25dfef;padding:0}.activity-track{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:16px}.activity-track article{display:flex;gap:9px;position:relative;padding-right:5px}.activity-track article>i{width:27px;height:27px;flex:none;border-radius:9px;display:grid;place-items:center;background:#103844;color:#21e1f0;font-style:normal}.activity-track b,.activity-track small{display:block}.activity-track b{font-size:11px}.activity-track small{color:#7897aa;font-size:10px;line-height:1.4;margin-top:4px}.activity-track time{position:absolute;right:5px;top:-13px;color:#5d7c91;font-size:9px}@media(max-width:900px){.profile-command-grid{grid-template-columns:1fr}.profile-stat-row{grid-template-columns:repeat(2,1fr)}.activity-track{grid-template-columns:1fr}.profile-security{grid-column:auto}}
        .profile-page{max-width:1000px;margin:auto}.profile-banner{border:1px solid #0bbfd9;border-radius:15px;background:linear-gradient(105deg,#0c2633,#0d1627);box-shadow:0 0 25px #0bcce33c;padding:25px;display:flex;align-items:center;gap:17px}.profile-mark{width:62px;height:62px;border-radius:50%;background:#0bd3eb;color:#052230;display:grid;place-items:center;font-weight:900;font-size:18px}.profile-banner span,.generator-intro span{font-size:10px;letter-spacing:1.5px;color:#12d6ed;font-weight:800}.profile-banner h2{margin:5px 0;font-size:22px}.profile-banner p{color:#8aa1b8;margin:0}.profile-banner .button{margin-left:auto}.profile-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:17px;margin-top:18px}.profile-grid article{background:#0c1526;border:1px solid #1c2e46;border-radius:13px;padding:21px}.profile-grid h3{margin:0 0 18px}.profile-grid label{display:block;color:#8293a9;font-size:10px;letter-spacing:.6px;margin:12px 0}.profile-grid input{display:block;width:100%;height:37px;margin-top:6px;background:#080f1b;border:1px solid #263a54;border-radius:7px;color:#eaf3fa;padding:0 10px}.profile-grid p{color:#8494aa;line-height:1.6;font-size:12px}.pro-badge{color:#0de0f4;border:1px solid #0b8398;border-radius:15px;padding:5px 9px;font-size:10px}.outline-btn{border:1px solid #12cce7;background:transparent;color:#18d8f0;padding:9px 12px;border-radius:8px;cursor:pointer}.generator-page{padding-top:2px}.generator-intro h2{margin:7px 0;font:700 25px Georgia,serif;color:#1ad4e9}.generator-intro p{color:#8392a8;margin:0;font-size:12px}.cyan-line{height:1px;background:#1c5260;margin:31px 0;position:relative}.cyan-line:before{content:"";position:absolute;width:38px;height:5px;top:-2px;background:#16d9f0;box-shadow:0 0 12px #16d9f0}.generate-card,.keys-card{background:#0e0e1d;border:1px solid #10cce7;border-radius:15px;box-shadow:0 0 12px #0bd9ef99,0 0 29px #0bd9ef42;padding:27px;margin-bottom:26px;color:#22d9ed;font:700 12px Georgia,serif;letter-spacing:1.2px}.generate-form{display:grid;grid-template-columns:1fr 1fr 155px;gap:19px;margin-top:24px;align-items:end}.generate-form label{font-size:10px}.generate-form input,.generate-form select{display:block;width:100%;height:40px;margin-top:7px;background:#080a15;border:1px solid #22324a;border-radius:7px;color:#dce9f2;padding:0 12px}.generate-form button{height:40px;border:0;border-radius:8px;background:#10c9e3;color:#04262d;font-weight:800;cursor:pointer}.keys-card{min-height:285px}.generated-header{display:grid;grid-template-columns:1.2fr .8fr 1fr 1fr 1.5fr .8fr;color:#1595aa;border-top:1px solid #213046;margin:18px -27px 0;padding:14px 18px;font-size:10px}.generated-empty{text-align:center;color:#277787;font:30px sans-serif;padding:53px}.generated-empty p{font:12px Inter,sans-serif;color:#71869a}.generated-row{display:grid;grid-template-columns:1.2fr .8fr 1fr 1fr 1.5fr .8fr;color:#cde7ed;font:12px Inter,sans-serif;letter-spacing:0;padding:12px 18px;border-top:1px solid #1c2b40}.generated-row button,.script-actions button{background:transparent;border:0;color:#14d8ed;cursor:pointer;font-size:16px}.script-actions{position:absolute;right:12px;top:11px;display:flex;gap:4px}.script-actions button:last-child{color:#f06b77}.script-item{position:relative}.script-item h3{padding-right:75px}
        .plans-wrap,.redeem-wrap{min-height:calc(100vh - 54px);padding:22px 4px}.plans-intro{text-align:center;padding:24px 0 20px}.plans-intro>span,.redeem-copy>span{color:#e5bb0b;letter-spacing:2px;font-size:10px;font-weight:800}.plans-intro h2{margin:8px 0;font-size:27px}.plans-intro p{color:#7f8da2;margin:0}.pricing{display:flex;justify-content:center;gap:20px}.plan-card{width:320px;min-height:340px;border:1px solid #28354b;border-radius:13px;padding:24px;background:#0d1626;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}.plan-card:hover{transform:scale(1.045);z-index:2;border-color:#f0c819;box-shadow:0 0 14px #efc710a0,0 0 38px #efc71055,0 15px 28px #0009}.plan-card.pro{border-color:#d7af06;box-shadow:0 0 17px #e9bd104d,0 0 36px #e9bd1022}.plan-card.max{border-color:#12d6ec;box-shadow:0 0 17px #0bdaed4d,0 0 36px #0bdaed22}.plan-card.max .plan-label{color:#14dcef}.plan-card.max button{background:#10cfe5;color:#042831}.plan-label{font-size:10px;color:#8190a7;letter-spacing:1.2px}.plan-card.pro .plan-label{color:#e4ba12}.plan-card h3{font-size:22px;margin:10px 0}.price b{font-size:31px}.price span{color:#8492a7}.plan-card p,.plan-card li{color:#8391a6;font-size:12px}.plan-card ul{padding-left:18px;line-height:2}.plan-card button,.redeem-box button{border:0;border-radius:9px;height:42px;font-weight:750;cursor:pointer}.plan-card button{width:100%;color:#111;background:#d7ae08;margin-top:9px}.redeem-wrap{padding:0}.redeem-box{min-height:125px;border:1px solid #e1bc15;border-radius:20px;box-shadow:0 0 12px #f4ce0dcb,0 0 35px #eac2005c;padding:25px 31px;display:flex;align-items:center;gap:27px;background:linear-gradient(110deg,#121821,#151b27)}.redeem-key{width:66px;height:66px;border-radius:17px;display:grid;place-items:center;background:#231f12;border:1px solid #50401b;box-shadow:0 0 18px #e6ba2049;color:#ffc929;font-size:32px}.redeem-copy{min-width:300px}.redeem-copy h2{margin:9px 0 5px;font-size:20px}.redeem-copy p{margin:0;color:#8794a8;font-size:11px}.redeem-box input{height:46px;flex:1;min-width:150px;border:1px solid #4a4540;border-radius:10px;background:#161b24;color:#eee;padding:0 16px;font:13px ui-monospace,monospace;outline-color:#e3be12}.redeem-box button{width:110px;background:#d9ad04;color:#1a1400;box-shadow:0 0 14px #e6b80077}.unlock-title{text-align:center;color:#728197;font-size:11px;font-weight:800;letter-spacing:1.1px;margin:52px 0 27px}.benefits{display:grid;grid-template-columns:repeat(4,1fr);gap:19px}.benefits article{min-height:162px;border:1px solid #d9b008;border-radius:14px;background:#11151d;box-shadow:0 0 12px #e9c300bd,0 0 27px #e9c30055;padding:27px}.benefits i{display:grid;place-items:center;width:45px;height:45px;border-radius:10px;background:#2b2819;color:#ffbd30;font-style:normal;font-size:23px}.benefits h3{font-size:14px;margin:16px 0 8px}.benefits p{font-size:11px;color:#758298;margin:0}.page{max-width:none}
        .plans-intro>span,.redeem-copy>span{color:#20deef}.plan-card:hover{border-color:#19deef;box-shadow:0 0 14px #0bdfefa0,0 0 38px #0bdfef55,0 15px 28px #0009}.plan-card.pro{border-color:#14cfe4;box-shadow:0 0 17px #0bdaed4d,0 0 36px #0bdaed22}.plan-card.pro .plan-label{color:#17ddec}.plan-card button{background:#10cfe5;color:#042831}.redeem-box{border-color:#10d8ed;box-shadow:0 0 12px #0bdff0cb,0 0 35px #0bdff05c;background:linear-gradient(110deg,#0b2430,#101a26)}.redeem-key{background:#0c3540;border-color:#1d7180;box-shadow:0 0 18px #0be1ef69;color:#20e2f2}.redeem-box input{border-color:#1d5a68;background:#091724;outline-color:#19deef}.redeem-box button{background:#12d7ea;color:#032831;box-shadow:0 0 14px #0be0ef77}.benefits article{border-color:#12d7eb;background:#0c1824;box-shadow:0 0 12px #0bdff0bd,0 0 27px #0bdff055}.benefits i{background:#103a45;color:#20e1f1}.activation-overlay{background:radial-gradient(circle at 50% 43,#0be4f02b,transparent 30%),#030813ed}.activation-card{border-color:#13dbe9;background:radial-gradient(circle at 50% 0,#0de4ef28,transparent 35%),linear-gradient(145deg,#0b2936,#091722);box-shadow:0 0 0 1px #0fe4f025 inset,0 0 42px #0bdeed72,0 25px 80px #000a}.activation-card:after{background-image:linear-gradient(#16d7eb14 1px,transparent 1px),linear-gradient(90deg,#16d7eb14 1px,transparent 1px)}.activate-rings i{border-color:#16e3f0}.activate-rings i:nth-child(2){border-color:#18d8ec}.activate-rings i:nth-child(3){border-color:#18dff152}.activate-rings b{background:linear-gradient(135deg,#22efff,#0789a5);color:#032932;box-shadow:0 0 27px #0ee5f0ab}.activation-card>span{color:#24e0f0}.activation-card p{color:#9ab6c4}.activation-track{background:#173243}.activation-track i{background:linear-gradient(90deg,#13d9e9,#4ce3af,#18dff1);box-shadow:0 0 15px #0bdeed}.activation-percent{color:#3be7f4}.activation-steps b{color:#7897a8;border-color:#1b5766;background:#0a2732}.activation-steps b.on{color:#83eff7;border-color:#1a7889;background:#0b3340;box-shadow:0 0 11px #0bdeed38}.plans-action:hover{border-color:#19deef;background:#0b3340;color:#8ef4fb;box-shadow:0 0 15px #0bdeed52}.plans-action:hover .quick-icon{background:#124554;color:#27e1f1}
        @media(max-width:900px){.settings-overview{grid-template-columns:1fr}.api-vault{grid-row:auto}.settings-hero{flex-wrap:wrap}.settings-health{margin-left:0;text-align:left}.dash-grid,.dashboard-lower{grid-template-columns:1fr}.generator-workspace{grid-template-columns:1fr}.generator-hero{flex-wrap:wrap}.generator-status{margin-left:0;text-align:left}.setup-roadmap{grid-template-columns:1fr}.discord-guide{flex-wrap:wrap}.guide-button{width:100%}.pricing{flex-wrap:wrap}.quick-actions .quick-pill:nth-child(2),.quick-actions .quick-pill:nth-child(4){display:none}.benefits{grid-template-columns:repeat(2,1fr)}.redeem-box{flex-wrap:wrap}} @media(max-width:720px){.quick-actions{display:none}aside{width:62px}.brand{padding:0 20px}.brand div, .nav span:not(.ico),.profile .who,.logout{display:none}nav{padding:21px 9px}.nav{justify-content:center;padding:0}.dot{display:none}.profile{padding:0;justify-content:center}main{margin-left:62px;width:calc(100% - 62px)}.page{padding:16px}.top{padding:0 16px}.toolbar{flex-wrap:wrap}.input{min-width:150px}.table-head{grid-template-columns:1fr 1fr}.table-head>*:nth-child(n+3){display:none}}
      `}</style>

      {/* ============ HTML STRUCTURE ============ */}
      <div className="app">
        <aside>
          <div className="brand"><span className="shield"></span><div><strong>Luarmen</strong><small>Script Protection</small></div></div>
          <nav>
            {visibleNavItems.map((item, index) => {
              const prevItem = index > 0 ? visibleNavItems[index - 1] : null;
              const showCaption = item.section && (!prevItem || prevItem.section !== item.section);
              return (
                <React.Fragment key={item.id}>
                  {showCaption && <span className="nav-caption">{item.section}</span>}
                  <button
                    className={`nav ${activePage === item.id ? "active" : ""}`}
                    onClick={() => showPage(item.id)}
                  >
                    <span className="ico">{item.icon}</span>
                    <span>{item.label}</span>
                    {activePage === item.id && <i className="dot"></i>}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
          <div className="profile">
            <div className="avatar">{username.charAt(0).toUpperCase()}</div>
            <div className="who"><b>{username}</b><span>{userPlan?.plan || "Free"} Plan</span></div>
            <span className="logout" onClick={() => { localStorage.removeItem("luarmen_user"); window.location.href = "/"; }}>↪</span>
          </div>
        </aside>

        <main>
          <header className="top">
            <h1 id="pageTitle">{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h1>
            <div className="quick-actions">
              <div className="quick-pill plan-status">
                <span className="plan-orb">⚿</span>
                <span><b>{userPlan?.plan || "Free"}</b><small><i></i> {stats.total_scripts} / 250 obfs</small></span>
                <em>ACTIVE</em>
              </div>
              <button className="quick-pill redeem-action" onClick={() => showPage("redeem")}>
                <span className="quick-icon">⚿</span><span>Redeem</span><i>→</i>
              </button>
              <button className="quick-pill plans-action" onClick={() => showPage("plans")}>
                <span className="quick-icon">♔</span><span>Plans</span>
              </button>
              <button className="quick-pill discord-action" type="button" onClick={openDiscordSetup}>
                <span className="quick-icon">◉</span><span>Discord</span><b className="online-mini"></b>
              </button>
            </div>
          </header>

          <div className="page">
            {/* DASHBOARD */}
            <section id="dashboard" className={activePage === "dashboard" ? "view" : "view hidden"}>
              <div className="stats">
                <article className="stat stat-protected"><div><span>Protected Scripts</span><b>{stats.total_scripts}</b></div><i>♢</i></article>
                <article className="stat stat-active"><div><span>Active Keys</span><b>{stats.active_keys}</b></div><i>⚿</i></article>
                <article className="stat stat-total"><div><span>Total Keys</span><b>{stats.total_keys}</b></div><i>♧</i></article>
                <article className="stat stat-executions"><div><span>Total Executions</span><b>{stats.total_downloads}</b></div><i>ϟ</i></article>
              </div>

              <div className="dash-grid">
                <article className="dash-chart">
                  <div className="dash-card-title"><div><span>ANALYTICS</span><h3>Execution activity</h3></div><button>Last 7 days⌄</button></div>
                  <div className="chart-legend"><b><i></i> Executions</b><strong>{stats.total_downloads} <small>this week</small></strong></div>
                  <div className="line-chart">
                    <div className="chart-grid"></div>
                    <svg viewBox="0 0 680 175" preserveAspectRatio="none">
                      <defs><linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#12dff2" stopOpacity=".28"/><stop offset="1" stopColor="#12dff2" stopOpacity="0"/></linearGradient></defs>
                      <path d="M0 155 L90 148 L180 151 L270 138 L360 148 L450 142 L540 151 L680 143 L680 175 L0 175Z" fill="url(#dashFill)"/>
                      <path className="chart-line" d="M0 155 L90 148 L180 151 L270 138 L360 148 L450 142 L540 151 L680 143"/>
                    </svg>
                    <div className="chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                  </div>
                </article>

                <article className="security-score">
                  <div className="dash-card-title"><div><span>SECURITY</span><h3>Protection score</h3></div><b className="live-state">● LIVE</b></div>
                  <div className="score-wheel perfect-score">
                    <span className="score-spark s1">✦</span>
                    <span className="score-spark s2">✧</span>
                    <span className="score-spark s3">✦</span>
                    <div><b>100</b><small>/100</small><em>PERFECT</em></div>
                  </div>
                  <p>Perfect protection coverage</p>
                  <div className="score-points"><span>✓ Heartbeat active</span><span>✓ V4 loader enabled</span></div>
                </article>
              </div>

              <div className="dashboard-lower">
                <article className="activity-feed">
                  <div className="dash-card-title"><div><span>RECENT ACTIVITY</span><h3>Workspace timeline</h3></div><button onClick={() => showPage("setup")}>View setup →</button></div>
                  <div className="activity-empty"><i>✦</i><div><b>Your workspace is ready</b><p>Create a script or connect Discord to start seeing live activity.</p></div></div>
                </article>
                <article className="quick-start">
                  <span>QUICK START</span><h3>Ready to secure a script?</h3><p>Create your first protected Lua script in less than a minute.</p>
                  <button onClick={openNew}>＋ Create protected script</button>
                </article>
              </div>

              <div className="card dash-scripts">
                <div className="card-head dash-head">
                  <div><div className="title"><span className="script-doc">♧</span>Your Scripts</div><div className="subtitle">Manage and configure your protected scripts</div></div>
                  <button className="button" onClick={openNew}><span className="plus">＋</span>New Script</button>
                </div>
                <div id="dashScriptList" className="dash-script-grid">
                  {scripts.length === 0 ? (
                    <div className="dash-empty"><div className="document">♧</div><h2>No scripts yet</h2><p>Create your first script to get started with protection.</p></div>
                  ) : (
                    scripts.map((script) => (
                      <div key={script.id} className="script-item">
                        <div className="script-actions">
                          <button title="Copy loader" onClick={() => copyScript(script)}>⧉</button>
                          <button title="Edit script" onClick={() => { setEditingScriptId(script.id); setEditingScriptCode(script.source_code || "-- Your Lua script here..."); setEditingScriptName(script.script_name); setShowEditor(true); setEditorStep(1); }}>⚙</button>
                          <button title="Delete script" onClick={() => deleteScript(script.id)}>🗑</button>
                        </div>
                        <h3>{script.script_name}</h3>
                        <p>Protected script · Created just now</p>
                        <span className="tag">{script.enabled ? "Active" : "Disabled"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* SCRIPTS */}
            <section id="scripts" className={activePage === "scripts" ? "view" : "view hidden"}>
              <div className="scripts-premium">
                <div className="scripts-hero">
                  <div className="script-hero-orb">♧</div>
                  <div><span>LUARMEN SCRIPT VAULT</span><h2>Protected scripts</h2><p>Create, configure, and deploy secure Lua scripts from one powerful workspace.</p></div>
                  <div className="scripts-hero-actions"><button className="secondary-script-btn" onClick={() => showPage("setup")}>⌘ Setup guide</button><button className="create-script-btn" onClick={openNew}>＋ &nbsp; New script</button></div>
                </div>
                <div className="script-metrics">
                  <article><i>♧</i><span><small>PROTECTED SCRIPTS</small><b>{scripts.length}</b></span><em>All protected</em></article>
                  <article><i>♢</i><span><small>PROTECTION STATUS</small><b>Secure</b></span><em className="script-green">✓ Healthy</em></article>
                  <article><i>⚿</i><span><small>ACTIVE ACCESS KEYS</small><b>{stats.active_keys}</b></span><em>Whitelist enabled</em></article>
                  <article><i>◷</i><span><small>LAST DEPLOYMENT</small><b>—</b></span><em>Ready to deploy</em></article>
                </div>
                <div className="script-vault">
                  <div className="script-vault-top"><div><span>YOUR SCRIPT LIBRARY</span><h3>Secure script workspace</h3><p>Every script is protected with Luarmen’s access-control and obfuscation layer.</p></div><div className="script-tools"><label>⌕ <input placeholder="Search scripts..."/></label><button>Sort: Newest ▾</button><button onClick={openNew}>＋ Create</button></div></div>
                  <div className="script-library-bar"><span><i></i> Live protection enabled</span><span>Scripts are encrypted before deployment</span></div>
                  <div id="scriptList" className="script-grid">
                    {scripts.length === 0 ? (
                      <div className="script-empty-premium">
                        <div className="empty-script-orb">♧<i>✓</i></div>
                        <h2>Your vault is ready</h2>
                        <p>Create your first protected Lua script and Luarmen will handle the security layer.</p>
                        <button onClick={openNew}>＋ &nbsp; Create your first script</button>
                        <small>Includes encrypted protection, heartbeat security, and access controls.</small>
                      </div>
                    ) : (
                      scripts.map((script) => (
                        <div key={script.id} className="script-item">
                          <div className="script-actions">
                            <button title="Copy loader" onClick={() => copyScript(script)}>⧉</button>
                            <button title="Edit script" onClick={() => { setEditingScriptId(script.id); setEditingScriptCode(script.source_code || "-- Your Lua script here..."); setEditingScriptName(script.script_name); setShowEditor(true); setEditorStep(1); }}>⚙</button>
                            <button title="Delete script" onClick={() => deleteScript(script.id)}>🗑</button>
                          </div>
                          <h3>{script.script_name}</h3>
                          <p>Protected script · Created just now</p>
                          <span className="tag">{script.enabled ? "Active" : "Disabled"}</span>
                          {script.keyless_mode && <span className="tag" style={{ background: "#0b3a3b", borderColor: "#176966", color: "#65e9c7" }}>Keyless</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="script-help">
                  <article><i>1</i><div><b>Add your Lua code</b><span>Paste your script in the secure editor.</span></div></article>
                  <article><i>2</i><div><b>Choose protection</b><span>Configure heartbeat, loader, and verification.</span></div></article>
                  <article><i>3</i><div><b>Deploy with confidence</b><span>Generate loaders and whitelist access.</span></div></article>
                </div>
              </div>
            </section>

            {/* WHITELIST */}
            <section id="whitelist" className={activePage === "whitelist" ? "view" : "view hidden"}>
              <div className="whitelist-premium">
                <div className="whitelist-hero">
                  <div className="key-hero-orb">⚿</div>
                  <div><span>LUARMEN ACCESS CONTROL</span><h2>Whitelist key manager</h2><p>Create secure user access keys and control exactly who can run your protected scripts.</p></div>
                  <div className="whitelist-status"><i>●</i><b>Protection active</b><small>Access layer online</small></div>
                </div>
                <div className="whitelist-metrics">
                  <article><i>⚿</i><span><small>ACTIVE KEYS</small><b>{whitelistKeys.length}</b></span><em>Live access</em></article>
                  <article><i>♧</i><span><small>AUTHORIZED USERS</small><b>{whitelistKeys.length}</b></span><em>Workspace-wide</em></article>
                  <article><i>◷</i><span><small>EXPIRING SOON</small><b>0</b></span><em>Next 7 days</em></article>
                  <article><i>♢</i><span><small>SECURITY LAYER</small><b>Enabled</b></span><em className="white-green">✓ Secure</em></article>
                </div>
                <div className="whitelist-workspace">
                  <div className="key-create-card">
                    <div className="key-create-title"><div><span>CREATE USER ACCESS</span><h3>Generate a whitelist key</h3><p>Bind a protected script to a Roblox username in seconds.</p></div><b>◈ ENCRYPTED</b></div>
                    <div className="whitelist-steps"><span><i>1</i>Select script</span><span><i>2</i>Enter username</span><span><i>3</i>Generate secure key</span></div>
                    <div className="toolbar key-toolbar">
                      <label><small>PROTECTED SCRIPT</small>
                        <select id="scriptSelect" className="select" ref={scriptSelectRef}>
                          <option>Select script...</option>
                          {scripts.map(s => <option key={s.id}>{s.script_name}</option>)}
                        </select>
                      </label>
                      <label><small>ROBLOX USERNAME</small>
                        <input className="input" placeholder="Enter Roblox username..." ref={whitelistInputRef} />
                      </label>
                      <button className="button" onClick={generateWhitelistKey}><span className="plus">＋</span>Generate Key</button>
                    </div>
                    <div className="key-notice"><i>✦</i> Keys are instantly active and remain protected by Luarmen access validation.</div>
                  </div>
                  <div className="key-tips">
                    <span>ACCESS SECURITY</span><h3>Whitelist with confidence</h3>
                    <article><i>✓</i><div><b>Username-bound access</b><p>Keys are associated with the Roblox username you specify.</p></div></article>
                    <article><i>✓</i><div><b>Instant validation</b><p>Luarmen validates access before your script runs.</p></div></article>
                    <button onClick={() => showPage("setup")}>View access guide →</button>
                  </div>
                </div>
                <div className="whitelist-vault">
                  <div className="vault-title"><div><span>KEY VAULT</span><h3>Generated whitelist keys</h3></div><div><button>⌕ Search</button><button>Filter ▾</button></div></div>
                  <div className="key-table-wrap">
                    <div className="table-head whitelist-table"><span>⚿ &nbsp; LICENSE KEY</span><span>SCRIPT</span><span>♧ &nbsp; USERNAME</span><span>◉ &nbsp; EXPIRES</span><span>STATUS</span><span>ACTIONS</span></div>
                    <div id="keyBody" className="empty premium-empty">
                      <div className="empty-symbol">⚿</div>
                      <b>No whitelist keys yet</b><span>Create your first secure user-access key above.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* USERS */}
            <section id="users" className={activePage === "users" ? "view" : "view hidden"}>
              <div className="users-premium">
                <div className="users-hero">
                  <div className="users-orb"><i>♧</i><span></span></div>
                  <div><span>LUARMEN ACCESS DIRECTORY</span><h2>People &amp; permissions</h2><p>Manage everyone who can access protected scripts, keys, and your Luarmen workspace.</p></div>
                  <button onClick={() => showToast("User invite link created", "success")}>＋ &nbsp;Invite a user</button>
                </div>
                <div className="user-metrics">
                  <article><i>♧</i><span><small>WORKSPACE MEMBERS</small><b>{users.length + 1}</b></span><em>+1 owner</em></article>
                  <article><i>◉</i><span><small>ACTIVE TODAY</small><b>1</b></span><em className="green-text">● Online</em></article>
                  <article><i>⚿</i><span><small>KEY ACCESS</small><b>0</b></span><em>Managed</em></article>
                  <article><i>♢</i><span><small>SECURITY STATUS</small><b>Secure</b></span><em className="green-text">✓ Protected</em></article>
                </div>
                <div className="users-directory">
                  <div className="directory-top"><div><span>MEMBER DIRECTORY</span><h3>Workspace members</h3></div><div className="directory-tools"><label>⌕ <input placeholder="Search members..."/></label><button>Filter ▾</button><button>⋮</button></div></div>
                  <div className="directory-summary"><span><b>{users.length + 1}</b> member in this workspace</span><span>Roles and permissions are synced in real time</span></div>
                  <div className="user-table-pro">
                    <div className="user-table-label"><span>MEMBER</span><span>ROLE</span><span>ACCESS LEVEL</span><span>STATUS</span><span>LAST ACTIVE</span><span></span></div>
                    <article className="member-row">
                      <div className="member-info"><div className="member-avatar">LD<i>✓</i></div><span><b>Luarmen Developer</b><small>{user.email || "developer@luarmen.gg"}</small></span></div>
                      <div><b className="owner-role">✦ Owner</b></div>
                      <div><span className="access-level">Full workspace access</span></div>
                      <div><b className="active-state"><i></i> Active</b></div>
                      <div><span className="last-active">Just now</span></div>
                      <button onClick={() => showToast("Member controls opened", "success")}>•••</button>
                    </article>
                    {users.map((u) => (
                      <article key={u.id} className="member-row">
                        <div className="member-info"><div className="member-avatar">{u.username.charAt(0).toUpperCase()}<i>✓</i></div><span><b>{u.username}</b><small>{u.email}</small></span></div>
                        <div><b className="owner-role">{u.plan}</b></div>
                        <div><span className="access-level">{u.blacklisted ? "Blacklisted" : "Active"}</span></div>
                        <div><b className="active-state"><i></i> {u.blacklisted ? "Inactive" : "Active"}</b></div>
                        <div><span className="last-active">{new Date(u.created_at).toLocaleDateString()}</span></div>
                        <button onClick={() => showToast("Member controls opened", "success")}>•••</button>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="users-bottom">
                  <article><i>✦</i><div><b>Invite trusted collaborators</b><p>Send secure access links and control member permissions as your workspace grows.</p></div><button onClick={() => showToast("User invite link created", "success")}>Create invite →</button></article>
                  <article><i>◈</i><div><b>Permission-first access</b><p>Every workspace action is protected by role-based access controls.</p></div><button onClick={() => showPage("settings")}>Review security →</button></article>
                </div>
              </div>
            </section>

            {/* SETUP */}
            <section id="setup" className={activePage === "setup" ? "view" : "view hidden"}>
              <div className="setup-premium">
                <div className="setup-top">
                  <div><span>LUARMEN ONBOARDING</span><h2>Build your protected workspace</h2><p>Complete these quick steps to launch secure scripts and Discord access.</p></div>
                  <div className="setup-progress"><b>{scripts.length > 0 ? "33%" : "0%"}</b><small>WORKSPACE SETUP</small><i><em style={{ width: scripts.length > 0 ? "33%" : "9%" }}></em></i></div>
                </div>
                <div className="setup-roadmap">
                  <article className="road-card"><div className="road-number">01</div><i>⌘</i><h3>Create a script</h3><p>Add Lua code and choose protection settings.</p><button onClick={openNew}>Create script <span>→</span></button></article>
                  <article className="road-card"><div className="road-number">02</div><i>⚿</i><h3>Generate access</h3><p>Whitelist the users allowed to run it.</p><button onClick={() => showPage("whitelist")}>Open whitelist <span>→</span></button></article>
                  <article className="road-card"><div className="road-number">03</div><i>◉</i><h3>Link Discord</h3><p>Connect Luarmen Bot to automate access panels.</p><button onClick={openDiscordSetup}>Link Discord <span>→</span></button></article>
                </div>
                <div className="discord-guide">
                  <div className="guide-orb">L</div>
                  <div className="guide-copy"><span>DISCORD QUICK GUIDE</span><h3>Link Discord in under a minute</h3><p>Connect your account first, choose a server, then invite Luarmen Bot with the required permissions.</p><div className="guide-steps"><b><i>1</i> Click <em>Link Discord</em></b><b><i>2</i> Approve your account</b><b><i>3</i> Add Luarmen Bot</b></div></div>
                  <button className="guide-button" onClick={openDiscordSetup}>Start Discord setup&nbsp; →</button>
                </div>
                <div className="setup-tip"><i>✦</i><span><b>Need help?</b> Your dashboard saves setup progress automatically. You can return here whenever you need.</span></div>
              </div>
            </section>

            {/* SETTINGS */}
            <section id="settings" className={activePage === "settings" ? "view" : "view hidden"}>
              <div className="settings-premium">
                <div className="settings-hero">
                  <div className="settings-pulse"><i>⚙</i></div>
                  <div><span>LUARMEN CONTROL CENTER</span><h2>Workspace settings</h2><p>Manage identity, API access, Discord automation, and real-time platform health.</p></div>
                  <div className="settings-health"><b><i></i> All systems operational</b><small>Last sync · just now</small></div>
                </div>
                <div className="setting-nav"><button className="selected">Overview</button><button>Security</button><button>Integrations</button><button>Advanced</button></div>
                <div className="settings-overview">
                  <div className="settings-identity">
                    <article className="identity-card">
                      <div className="identity-avatar">LD</div>
                      <div><span>WORKSPACE OWNER</span><h3>{username}</h3><p>{user.email || "user@email.com"}</p><b>✦ Premium workspace</b></div>
                      <button onClick={() => showPage("profile")}>Manage profile →</button>
                    </article>
                    <article className="discord-connection">
                      <div className="connection-top"><i>◉</i><span><small>DISCORD INTEGRATION</small><b>{discordConnected ? "Connected & secure" : "Not connected"}</b></span><em className={discordConnected ? "● ONLINE" : "● OFFLINE"}></em></div>
                      <p>Luarmen is linked to <strong>{discordConnected ? discordUsername : "No Discord"}</strong> and ready to manage protected panels.</p>
                      <button onClick={openDiscordSetup}>Manage Discord connection <span>→</span></button>
                    </article>
                  </div>
                  <div className="api-vault">
                    <div className="vault-head"><div><span>API ACCESS VAULT</span><h3>Your private Luarmen API key</h3><p>Use this key to connect approved services to your workspace.</p></div><i>⚿</i></div>
                    <div className="api-display"><code>{apiKeyValue}</code><button onClick={copyApiKey}>⧉ Copy</button></div>
                    <div className="vault-actions"><button className="generate-api" onClick={generateApiKey}>✦ Generate new API key</button><small>Keys are only shown in this workspace. Keep them private.</small></div>
                  </div>
                </div>
                <div className="security-console">
                  <div className="console-title"><div><span>LIVE PLATFORM TELEMETRY</span><h3>Luarmen service health</h3><p>Production worker, Discord gateway, and access layer status in real time.</p></div><div className="uptime"><b>99.99%</b><small>30-day uptime</small></div></div>
                  <div className="live-wave"><i></i><i></i><i></i><i></i><i></i><span>Live signal</span></div>
                  <div className="bot-grid">
                    <div><small>Discord gateway</small><b><i className="status-dot"></i> Connected</b></div>
                    <div><small>Worker lease</small><b><i className="status-dot"></i> Active</b></div>
                    <div><small>Last heartbeat</small><b>Just now</b></div>
                    <div><small>Worker version</small><b>luarmen-bot-worker-v2</b></div>
                    <div><small>Command schema</small><b>luarmen-production-auth-v1</b></div>
                    <div><small>Panel schema</small><b>luarmen-panel-v1</b></div>
                    <div><small>Bundle build</small><b>2026-07-29T03:00:00Z</b></div>
                    <div><small>Discord state</small><b><i className="status-dot"></i> Ready</b></div>
                    <div><small>Schema match</small><b><i className="status-dot"></i> Verified</b></div>
                  </div>
                </div>
              </div>
            </section>

            {/* DISCORD INTEGRATION */}
            <section id="discordIntegration" className={activePage === "discordIntegration" ? "view" : "view hidden"}>
              <div className="integration-page">
                <div className="link-hero">
                  <div className="link-mesh"></div>
                  <div className="link-icon discord-logo">◉</div>
                  <div className="link-line"><i></i><b>✦</b><i></i></div>
                  <div className="link-icon luarmen-logo">L</div>
                  <span>LUARMEN · STEP 1 OF 3</span>
                  <h2>Link your Discord account</h2>
                  <p>Securely connect Discord to unlock bot installation, automated key panels, and buyer access management.</p>
                  <div className="security-row"><b>✓ Secure OAuth</b><b>◈ No password required</b><b>⚡ Instant connection</b></div>
                  <button className="link-discord-btn" onClick={beginBotSetup}><i>◉</i> Link Discord &amp; continue <strong>→</strong></button>
                  <small>By continuing, you authorise Luarmen to access only the servers you manage.</small>
                </div>
                <div className="link-features">
                  <article><i>⌘</i><b>Server panels</b><span>Publish protected Luarmen panels directly to Discord.</span></article>
                  <article><i>⚿</i><b>Buyer access</b><span>Keep your key and role access organised automatically.</span></article>
                  <article><i>♢</i><b>Private by design</b><span>Your account data is never shared with other servers.</span></article>
                </div>
              </div>
            </section>

            {/* PROFILE */}
            <section id="profile" className={activePage === "profile" ? "view" : "view hidden"}>
              <div className="profile-premium">
                <div className="profile-cover">
                  <div className="cover-grid"></div>
                  <div className="profile-big-avatar">{username.charAt(0).toUpperCase()}<span>✓</span></div>
                  <div className="profile-intro">
                    <span>LUARMEN CREATOR PROFILE</span>
                    <h2>{username}</h2>
                    <p>{user.email || "user@email.com"}</p>
                    <div className="creator-badges"><b>✦ Pro member</b><b>{discordConnected ? "◉ Discord linked" : "◉ Discord not linked"}</b><b>♢ Verified creator</b></div>
                  </div>
                  <button className="profile-edit" onClick={() => showToast("Profile editor opened", "success")}>✎ &nbsp; Edit profile</button>
                  <div className="profile-since">MEMBER SINCE <b>2026</b></div>
                </div>
                <div className="profile-stat-row">
                  <article><i>♧</i><span><small>PROTECTED SCRIPTS</small><b>{scripts.length}</b></span></article>
                  <article><i>⚿</i><span><small>KEYS GENERATED</small><b>{whitelistKeys.length + subKeys.length}</b></span></article>
                  <article><i>ϟ</i><span><small>TOTAL EXECUTIONS</small><b>{stats.total_downloads}</b></span></article>
                  <article><i>◷</i><span><small>ACCOUNT STATUS</small><b className="account-active">Active</b></span></article>
                </div>
                <div className="profile-command-grid">
                  <article className="profile-details-card">
                    <div className="profile-card-head"><div><span>IDENTITY</span><h3>Account details</h3></div><b>✓ VERIFIED</b></div>
                    <label>DISPLAY NAME<input value={username} /></label>
                    <label>EMAIL ADDRESS<input value={user.email || "user@email.com"} /></label>
                    <label>PUBLIC HANDLE<input value={"@" + username} /></label>
                    <button className="save-profile" onClick={() => showToast("Profile changes saved", "success")}>Save profile changes <span>→</span></button>
                  </article>
                  <article className="membership-card">
                    <span>YOUR MEMBERSHIP</span>
                    <div className="membership-title"><i>♔</i><div><h3>{userPlan?.plan || "Free"}</h3><p>Full protection toolkit</p></div><b>ACTIVE</b></div>
                    <div className="membership-meter"><div><span>Plan period</span><b>{userPlan?.daysRemaining !== null ? userPlan?.daysRemaining + " days remaining" : "∞"}</b></div><i><em style={{ width: "77%" }}></em></i></div>
                    <ul><li>Unlimited protected scripts</li><li>Advanced V4 protection</li><li>Priority Discord support</li></ul>
                    <button onClick={() => showPage("plans")}>Manage membership &nbsp;→</button>
                  </article>
                  <article className="profile-security">
                    <div className="profile-card-head"><div><span>ACCOUNT SECURITY</span><h3>Security center</h3></div><i className="secure-icon">♢</i></div>
                    <div className="security-check"><b>Two-step verification</b><span><i></i> Enabled</span></div>
                    <div className="security-check"><b>Discord account</b><span><i></i> {discordConnected ? "Connected" : "Not connected"}</span></div>
                    <div className="security-check"><b>API access</b><span>Manage in settings →</span></div>
                    <button onClick={() => showPage("settings")}>Open security settings</button>
                  </article>
                </div>
                <div className="profile-activity">
                  <div className="profile-card-head"><div><span>CREATOR ACTIVITY</span><h3>Your Luarmen journey</h3></div><button onClick={() => showPage("setup")}>View setup guide →</button></div>
                  <div className="activity-track">
                    <article><i>✓</i><div><b>Workspace created</b><small>Your Luarmen protection workspace is ready.</small></div><time>Today</time></article>
                    <article><i>◉</i><div><b>Discord ready to connect</b><small>Link Discord to unlock automated panels.</small></div><time>Next step</time></article>
                    <article><i>⚿</i><div><b>Generate your first key</b><small>Create subscription or script access keys.</small></div><time>Recommended</time></article>
                  </div>
                </div>
              </div>
            </section>

            {/* GENERATE */}
            <section id="generate" className={activePage === "generate" ? "view" : "view hidden"}>
              <div className="generator-page premium-generator">
                <div className="generator-hero">
                  <div className="key-orb">⚿</div>
                  <div><span>LUARMEN ACCESS CONTROL</span><h2>Subscription key generator</h2><p>Create secure, time-limited keys for Basic, Pro, and Max access.</p></div>
                  <div className="generator-status"><i>●</i><b>System online</b><small>Key service ready</small></div>
                </div>
                <div className="generator-metrics">
                  <article><i>⚿</i><span><small>KEYS GENERATED</small><b>{subKeys.length}</b></span></article>
                  <article><i>◉</i><span><small>ACTIVE KEYS</small><b>{subKeys.filter(k => k.is_active).length}</b></span></article>
                  <article><i>◷</i><span><small>DEFAULT DURATION</small><b>30 days</b></span></article>
                </div>
                <div className="generator-workspace">
                  <div className="generate-card">
                    <div className="gen-card-top"><div><span>NEW SUBSCRIPTION KEY</span><h3>Configure key access</h3></div><b className="secure-label">◈ CRYPTOGRAPHICALLY RANDOM</b></div>
                    <div className="plan-choice">
                      <button className="plan-choice-btn selected" data-plan="Basic" onClick={() => setGenPlan("Basic")}><b>Basic</b><small>$1 · 30 days</small></button>
                      <button className="plan-choice-btn" data-plan="Pro" onClick={() => setGenPlan("Pro")}><b>Pro</b><small>$3 · 30 days</small></button>
                      <button className="plan-choice-btn" data-plan="Max" onClick={() => setGenPlan("Max")}><b>Max</b><small>$5 · 30 days</small></button>
                    </div>
                    <div className="generate-form">
                      <label>SUBSCRIPTION PLAN
                        <select id="genPlan" value={genPlan} onChange={(e) => setGenPlan(e.target.value)}>
                          <option>Basic</option><option>Pro</option><option>Max</option>
                        </select>
                      </label>
                      <label>DURATION (DAYS)
                        <input id="genDays" type="number" value={genDays} min="1" onChange={(e) => setGenDays(parseInt(e.target.value) || 30)} />
                      </label>
                      <button onClick={() => generateSubKey(genPlan, genDays)} disabled={generating}>
                        {generating ? "⏳" : "⚿  Generate secure key"}
                      </button>
                    </div>
                    <p className="gen-hint">Keys are generated locally and can be copied immediately after creation.</p>
                  </div>
                  <div className="keys-card">
                    <div className="keys-title"><div><span>KEY VAULT</span><h3>All generated keys</h3></div><button onClick={() => showToast("Key vault refreshed", "success")}>⟳ Refresh</button></div>
                    <div className="generated-header"><span>KEY</span><span>PLAN</span><span>DURATION</span><span>STATUS</span><span>REDEEMED BY</span><span>ACTIONS</span></div>
                    <div id="generatedKeys" className="generated-empty">
                      <i>⬡</i><b>No subscription keys yet</b>
                      <p>Configure an access plan above to generate your first secure key.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PLANS */}
            <section id="plans" className={activePage === "plans" ? "view" : "view hidden"}>
              <div className="plans-wrap">
                <div className="plans-intro"><span>LUARMEN PLANS</span><h2>Protect more. Unlock everything.</h2><p>Choose the plan that fits your scripts and protection needs.</p></div>
                <div className="pricing">
                  <article className="plan-card basic">
                    <div className="plan-label">STARTER</div>
                    <h3>Basic</h3>
                    <div className="price"><b>$1</b><span>/ 30 days</span></div>
                    <p>Simple, reliable script protection.</p>
                    <ul><li>Up to 250 obfuscations</li><li>Script protection</li><li>Dashboard access</li></ul>
                    <button onClick={() => showPage("redeem")}>Get Basic</button>
                  </article>
                  <article className="plan-card pro">
                    <div className="plan-label">MOST POPULAR</div>
                    <h3>Pro</h3>
                    <div className="price"><b>$3</b><span>/ 30 days</span></div>
                    <p>Full protection for serious creators.</p>
                    <ul><li>Unlimited protected scripts</li><li>Advanced protection</li><li>Unlimited whitelist keys</li><li>Priority support</li></ul>
                    <button onClick={() => showPage("redeem")}>Choose Pro</button>
                  </article>
                  <article className="plan-card max">
                    <div className="plan-label">COMPLETE ACCESS</div>
                    <h3>Max</h3>
                    <div className="price"><b>$5</b><span>one-time · 30 days</span></div>
                    <p>Everything Luarmen has to offer.</p>
                    <ul><li>All Pro features</li><li>Max security configuration</li><li>Priority support</li><li>One-time purchase</li></ul>
                    <button onClick={() => showPage("redeem")}>Get Max</button>
                  </article>
                </div>
              </div>
            </section>

            {/* REDEEM */}
            <section id="redeem" className={activePage === "redeem" ? "view" : "view hidden"}>
              <div className="redeem-wrap">
                <div className="redeem-box">
                  <div className="redeem-key">⚿</div>
                  <div className="redeem-copy"><span>LUARMEN</span><h2>Redeem a subscription key</h2><p>Enter your PRO key to instantly unlock premium features.</p></div>
                  <input id="redeemInput" placeholder="⚿  BASIC-XXXX-XXXX-XXXX" value={redeemKey} onChange={(e) => setRedeemKey(e.target.value)} />
                  <button onClick={redeemPlan}>Redeem</button>
                </div>
                <div className="unlock-title">WHAT YOU UNLOCK</div>
                <div className="benefits">
                  <article><i>ϟ</i><h3>Unlimited Scripts</h3><p>No cap on protected scripts in your account</p></article>
                  <article><i>♢</i><h3>Advanced Protection</h3><p>Full obfuscation and heartbeat security</p></article>
                  <article><i>⚿</i><h3>Whitelist Keys</h3><p>Generate unlimited license keys</p></article>
                  <article><i>✦</i><h3>Priority Support</h3><p>Dedicated help and fast response times</p></article>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ============ MODALS ============ */}
      {/* New Script Modal */}
      {showModal && (
        <div className="modal">
          <form className="dialog new-script-dialog" onSubmit={(e) => { e.preventDefault(); openNew(); }}>
            {/* We use openNew to show the modal; but we want to handle submission properly */}
            <button type="button" className="new-script-close" onClick={closeNew}>×</button>
            <div className="new-script-hero">
              <div className="new-script-orb">♧</div>
              <div><span>LUARMEN SCRIPT VAULT</span><h2>Create a protected script</h2><p>Start a secure Lua workspace in seconds.</p></div>
            </div>
            <div className="create-steps"><b className="active"><i>1</i>Name</b><em></em><b><i>2</i>Code</b><em></em><b><i>3</i>Protect</b></div>
            <label className="field-label" htmlFor="newName">SCRIPT NAME</label>
            <div className="name-input-wrap"><i>♧</i><input className="field" id="newName" placeholder="e.g. My Awesome Script" required autoFocus value={newScriptName} onChange={(e) => setNewScriptName(e.target.value)} /><span>Required</span></div>
            <div className="template-title"><span>STARTER TEMPLATE</span><small>Choose a starting point (optional)</small></div>
            <div className="template-grid">
              <button type="button" className={selectedTemplate === "blank" ? "selected" : ""} onClick={() => selectTemplate("blank")}><i>＋</i><b>Blank script</b><small>Start from scratch</small></button>
              <button type="button" className={selectedTemplate === "hello" ? "selected" : ""} onClick={() => selectTemplate("hello")}><i>‹›</i><b>Hello world</b><small>Simple Lua example</small></button>
              <button type="button" className={selectedTemplate === "module" ? "selected" : ""} onClick={() => selectTemplate("module")}><i>◈</i><b>Module</b><small>Reusable structure</small></button>
            </div>
            <div className="dialog-actions">
              <button type="button" className="cancel" onClick={closeNew}>Cancel</button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  if (!newScriptName.trim()) {
                    showToast("Please enter a script name", "error");
                    return;
                  }
                  setPendingScriptName(newScriptName);
                  const code = luaCodeRef.current?.value || "-- Your Lua script here...";
                  setPendingScriptCode(code);
                  setEditingScriptCode(code);
                  setEditingScriptName(newScriptName);
                  closeNew();
                  setShowEditor(true);
                  setEditorStep(1);
                }}
              >
                Create secure workspace <span>→</span>
              </button>
            </div>
            <p className="dialog-security">◈ Your source stays private until you choose to protect it.</p>
          </form>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="editor-modal">
          <div className={`editor-panel step-${editorStep}`}>
            <header className="editor-top">
              <div className="editor-brand"><div className="editor-file-icon">♧</div><div><span>LUARMEN SCRIPT STUDIO</span><strong id="editorName">{editingScriptName || "New Script"}</strong><small>Protected workspace · Unsaved changes</small></div></div>
              <div className="editor-health"><i>●</i><span>Protection ready</span></div>
              <div className="editor-top-actions">
                <button className="editor-action preview" onClick={() => showToast("Loader preview ready", "success")}>⌘ Preview</button>
                <button className="editor-action save" title="Start protection" onClick={nextStudioStep}>✓</button>
                <button className="editor-action close" title="Close editor" onClick={cancelEditor}>×</button>
              </div>
            </header>
            <div className="editor-progress">
              <span className={editorStep >= 1 ? "active" : ""}><i>{editorStep >= 2 ? "✓" : "1"}</i> Configure</span><em></em>
              <span className={editorStep >= 2 ? "active" : ""}><i>{editorStep >= 3 ? "✓" : "2"}</i> Add code</span><em></em>
              <span className={editorStep >= 3 ? "active" : ""}><i>3</i> Protect</span>
            </div>
            <div id="editorOptions" className={`editor-options studio-stage ${editorStep === 2 ? "" : "hidden"}`}>
              <div className="editor-section-head"><div><span>SECURITY CONFIGURATION</span><h3>Customize your protection layer</h3></div><b>◈ RECOMMENDED SETTINGS APPLIED</b></div>
              {[
                { id: "ffa", label: "Free for All Mode", desc: "Allows anyone to execute your script. Can be toggled off at any time." },
                { id: "silent", label: "Silent Mode", desc: "Disables Luarmen console outputs. Not recommended." },
                { id: "heartbeat", label: "Heartbeat", desc: "Heartbeating makes your script more secure. Recommended.", default: true },
                { id: "lightning", label: "Lightning Mode", desc: "Removes some inline security checks to make your script run faster.", default: true },
                { id: "v4", label: "Prefer V4 Loader", desc: "Encrypts the file in http traffic & local cache.", default: true },
                { id: "verified", label: "Verified Script", desc: "Adds a Verified Badge to your script to show it is safe." },
              ].map((toggle) => (
                <label className="setting" key={toggle.id}>
                  <input type="checkbox" checked={editorToggles[toggle.id as keyof typeof editorToggles]} onChange={() => setEditorToggles({ ...editorToggles, [toggle.id]: !editorToggles[toggle.id as keyof typeof editorToggles] })} />
                  <span className="toggle"></span>
                  <span><b>{toggle.id === "lightning" && <em>ϟ</em>}{toggle.id === "v4" && <em>♢</em>}{toggle.id === "verified" && <em className="green">♧</em>}{toggle.label}</b><small>{toggle.desc}</small></span>
                </label>
              ))}
              <div className="stage-next"><div><b>Configuration ready</b><small>Review settings before creating the secure build.</small></div><button onClick={nextStudioStep}>Continue to protect <span>→</span></button></div>
            </div>
            <div id="editorCode" className={`code-area studio-stage ${editorStep === 1 || editorStep === 3 ? "" : "hidden"}`}>
              <div className="code-title"><div><span>‹› &nbsp; LUA SOURCE</span><b>Script code editor</b></div><div className="code-tools"><button onClick={() => showToast("Code formatted", "success")}>✦ Format</button><button onClick={() => showToast("Loader preview ready", "success")}>Show Loader</button></div></div>
              <div className="editor-code-shell">
                <div className="code-gutter"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span></div>
                <textarea ref={luaCodeRef} spellCheck="false" placeholder="-- Paste your Lua script here..." value={editingScriptCode} onChange={(e) => setEditingScriptCode(e.target.value)} />
                <div className="code-minimap"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
                <div className="code-status"><span><i></i> Lua syntax ready</span><span>UTF-8 · Protected editor</span></div>
              </div>
              <div className="protect-footer"><div><i>♢</i><span><b>Ready to protect</b><small>Luarmen will obfuscate and secure this script.</small></span></div><button className="protect code-continue" onClick={nextStudioStep}>Continue to configuration <span>→</span></button></div>
            </div>
          </div>
        </div>
      )}

      {/* Obfuscation Overlay */}
      {showObfuscation && (
        <div className="obfuscation-overlay">
          <div className="obfuscation-card">
            <div className="obf-rings"><i></i><i></i><i></i><b>♢</b></div>
            <span>LUARMEN PROTECTION ENGINE</span>
            <h2>Obfuscating your script</h2>
            <p>{obfStatus}</p>
            <div className="obf-progress"><i style={{ width: obfPercent + "%" }}></i></div>
            <div className="obf-meta"><b>{obfPercent}%</b><small>Keep this window open while Luarmen builds your protected loader.</small></div>
            <div className="obf-pills"><b>◈ Encrypting source</b><b>⚿ Binding access layer</b><b>ϟ Optimizing loader</b></div>
          </div>
        </div>
      )}

      {/* Activation Overlay */}
      {showActivation && (
        <div className="activation-overlay">
          <div className="activation-card">
            <div className="activate-rings"><i></i><i></i><i></i><b>⚿</b></div>
            <span>LUARMEN SUBSCRIPTION</span>
            <h2>Activating your key</h2>
            <p>Verifying subscription access…</p>
            <div className="activation-track"><i style={{ width: activationPercent + "%" }}></i></div>
            <div className="activation-percent">{activationPercent}%</div>
            <div className="activation-steps"><b className="on">✓ Key verified</b><b className={activationStep2 ? "on" : ""}>◷ Applying plan</b><b className={activationStep3 ? "on" : ""}>◷ Unlocking features</b></div>
          </div>
        </div>
      )}

      {/* Terms Notice */}
      {showTermsNotice && (
        <div className="terms-modal">
          <div className="terms-notice-card">
            <div className="terms-notice-icon">⚖</div>
            <div><span>LUARMEN · POLICY UPDATE</span><h2>Terms of Service Updated</h2><p>Our Terms of Service have been updated. Please review the changes and accept to continue using Luarmen.</p><button className="terms-link" onClick={openTerms}>Read the Terms of Service <span>→</span></button></div>
            <button className="terms-agree" onClick={agreeTerms}>I agree to the Terms of Service <span>✓</span></button>
          </div>
        </div>
      )}

      {/* Terms Viewer */}
      {showTermsViewer && (
        <div className="terms-viewer">
          <div className="terms-window">
            <header><div><span>LUARMEN LEGAL</span><h2>Terms of Service</h2></div><button onClick={closeTerms}>×</button></header>
            <div className="terms-scroll">
              <article className="terms-document">
                <h1>Luarmen Terms of Service</h1>
                <p><strong>Effective Date:</strong> August 2, 2026</p>
                <h2>1. Agreement</h2>
                <p>These Terms of Service ("Terms") govern your access to and use of Luarmen ("Luarmen," "we," "our," or "us"). By creating an account, accessing, or using any part of the platform, you agree to comply with these Terms.</p>
                <p>If you do not agree with these Terms, you must not use the Service.</p>
                <h2>2. About Luarmen</h2>
                <p>Luarmen provides tools designed to help software developers protect, distribute, and manage their Lua/Luau projects. Depending on your subscription, the platform may include:</p>
                <ul><li>Script obfuscation</li><li>Secure script hosting</li><li>Subscription and license management</li><li>Developer dashboard</li><li>Future tools, integrations, and platform features</li></ul>
                <p>We may add, modify, suspend, or remove features at any time without prior notice.</p>
                <h2>3. Eligibility and Accounts</h2>
                <p>To access certain features, you must create an account. You agree to provide accurate registration information, keep your login credentials confidential, maintain the security of your account, and notify us promptly if you suspect unauthorized access. You are responsible for all activity performed through your account until you notify us of a security issue.</p>
                <h2>4. Subscriptions</h2>
                <p>Certain features require an active paid subscription. Subscription plans may differ in available features, usage limits, storage capacity, hosting limits, or other benefits.</p>
                <p>Unless expressly stated otherwise, subscription fees are charged in advance; payments are non-refundable; benefits end when the subscription expires; and expired accounts may automatically revert to the free plan. Luarmen may change subscription pricing or available plans in the future. Changes will not affect an already active billing period unless required by law.</p>
                <h2>5. License Keys</h2>
                <p>License keys issued by Luarmen remain our property until redeemed. Unless otherwise specified, keys may only be redeemed once, cannot be transferred after redemption, and may be revoked if lost or shared. Keys obtained through fraud or unauthorized distribution are invalid.</p>
                <h2>6. Ownership of Content</h2>
                <p>You retain ownership of the scripts and source code that you submit. By uploading content, you grant Luarmen only the permissions necessary to process scripts for obfuscation, host files you choose to publish, deliver hosted content to authorized users, and operate and maintain the platform. Luarmen does not claim ownership of your intellectual property.</p>
                <h2>7. Acceptable Use</h2>
                <p>You agree not to use Luarmen in any manner that violates applicable laws; infringes another person's intellectual property; attempts to gain unauthorized access to systems or accounts; interferes with platform availability or security; uploads malware, spyware, ransomware, credential stealers, or similar malicious software; distributes content intended to damage users or third-party services; circumvents platform restrictions or security measures; or uses automated systems to overload or abuse the Service without permission.</p>
                <p>We reserve the right to investigate suspected misuse and take appropriate action.</p>
                <h2>8. Enforcement</h2>
                <p>If we reasonably believe that your account has violated these Terms, we may, without prior notice, remove hosted content; suspend platform access; disable subscriptions or license keys; permanently terminate accounts; and cooperate with legal authorities where required. Repeated or serious violations may result in permanent removal from the platform.</p>
                <h2>9. Availability</h2>
                <p>Luarmen is provided on an "as available" and "as is" basis. Although we strive for reliable service, we cannot guarantee continuous uptime, error-free operation, compatibility with every environment, or permanent availability of every feature. Maintenance, outages, updates, or third-party failures may temporarily affect the Service.</p>
                <h2>10. Limitation of Liability</h2>
                <p>To the maximum extent permitted by applicable law, Luarmen and its owners, operators, employees, and affiliates shall not be liable for any indirect, incidental, special, punitive, or consequential damages arising from your use of the Service, including lost profits, lost business opportunities, data loss, service interruptions, corrupted files, security incidents, and third-party actions.</p>
                <p>If Luarmen is found liable for any claim, our total liability shall not exceed the amount you paid to Luarmen during the twelve (12) months immediately preceding the event giving rise to the claim.</p>
                <h2>11. No Warranties</h2>
                <p>The Service is provided without warranties of any kind, whether express, implied, or statutory. We make no guarantees regarding fitness for a particular purpose, merchantability, security against every possible threat, continuous operation, or the accuracy or reliability of results. You use the Service entirely at your own risk.</p>
                <h2>12. Indemnification</h2>
                <p>You agree to defend, indemnify, and hold harmless Luarmen and its owners, employees, contractors, and affiliates from any claims, liabilities, damages, losses, costs, or legal expenses resulting from your use of the Service, your violation of these Terms, your infringement of another person's rights, or your unlawful conduct.</p>
                <h2>13. Privacy</h2>
                <p>We collect only information reasonably necessary to provide and improve the Service. Information may include email address, account details, IP address, device and browser information, license activity, usage statistics, and hosting information. We do not sell your personal information.</p>
                <p>Certain information may be processed by trusted service providers such as hosting providers, payment processors, authentication providers, and analytics services.</p>
                <h2>14. Changes</h2>
                <p>We may revise these Terms from time to time. When significant changes are made, we will update the Effective Date displayed at the top of this document. Your continued use of Luarmen after updated Terms become effective constitutes acceptance of those revisions.</p>
                <h2>15. Governing Law</h2>
                <p>These Terms are governed by the laws applicable in the jurisdiction in which Luarmen operates. Any dispute arising from these Terms should first be addressed through good-faith discussions. If no resolution is reached, disputes shall be submitted to the courts having appropriate jurisdiction.</p>
                <h2>16. Severability</h2>
                <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect. Any unenforceable provision shall be interpreted to reflect its original purpose as closely as permitted by law.</p>
                <h2>17. Contact</h2>
                <p>Questions regarding these Terms or the Service may be submitted through Luarmen's official support channels.</p>
                <p>By accessing or using Luarmen, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
              </article>
            </div>
            <footer><span>Effective Date: August 2, 2026</span><button onClick={agreeTerms}>I agree to the Terms of Service <b>✓</b></button></footer>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastVisible && (
        <div className="toast-zone">
          <div className={`toast ${toastType === "error" ? "error" : ""}`}>
            {toastType === "error" ? "✕  " : "✓  "}{toastMsg}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
