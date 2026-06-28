import { useState, useEffect, useRef, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000/api';
const STORAGE_KEY = 'prepai-history';
const SESSION_Q_COUNT = 15;
const PER_Q_SECONDS = 60;

// ─── API Helper ───────────────────────────────────────────────────────────────
const apiCall = async (path, options = {}) => {
  const token = localStorage.getItem('prepai-token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  return res.json();
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ─── Hardcoded question bank (fallback if backend offline) ────────────────────
const localQuestions = [
  { id:'t0', type:'Technical', topic:'JavaScript', difficulty:'Easy', question:'Which keyword declares a block-scoped variable?', options:['var','let','static','global'], answer:'let' },
  { id:'t1', type:'Technical', topic:'React', difficulty:'Medium', question:'Which hook runs side effects in a function component?', options:['useMemo','useEffect','useRef','useReducer'], answer:'useEffect' },
  { id:'t2', type:'Technical', topic:'HTML', difficulty:'Easy', question:'Which element is used for the largest heading?', options:['h6','heading','h1','head'], answer:'h1' },
  { id:'t3', type:'Technical', topic:'CSS', difficulty:'Easy', question:'Which CSS property controls space inside an element border?', options:['margin','padding','gap','outline'], answer:'padding' },
  { id:'t4', type:'Technical', topic:'Node.js', difficulty:'Medium', question:'Which module system does Node.js use with require?', options:['CommonJS','AMD','SystemJS','BabelJS'], answer:'CommonJS' },
  { id:'t5', type:'Technical', topic:'Database', difficulty:'Easy', question:'Which SQL command reads records from a table?', options:['INSERT','SELECT','UPDATE','DROP'], answer:'SELECT' },
  { id:'t6', type:'Technical', topic:'Git', difficulty:'Medium', question:'Which command creates a new branch and switches to it?', options:['git branch -d','git checkout -b','git push -u','git merge'], answer:'git checkout -b' },
  { id:'t7', type:'Technical', topic:'API', difficulty:'Easy', question:'Which HTTP method creates a new resource?', options:['GET','POST','HEAD','OPTIONS'], answer:'POST' },
  { id:'t8', type:'Technical', topic:'Security', difficulty:'Medium', question:'What is the main purpose of hashing a password?', options:['Compress it','Store it safely','Make it faster','Translate it'], answer:'Store it safely' },
  { id:'t9', type:'Technical', topic:'System Design', difficulty:'Hard', question:'Which component decouples producers and consumers?', options:['Message queue','CSS grid','Browser cookie','HTML form'], answer:'Message queue' },
  { id:'t10', type:'Technical', topic:'JavaScript', difficulty:'Easy', question:'What does === check in JavaScript?', options:['Value only','Type only','Value and type','Neither'], answer:'Value and type' },
  { id:'t11', type:'Technical', topic:'React', difficulty:'Medium', question:'What is the purpose of keys in React lists?', options:['Style items','Uniquely identify elements','Sort elements','Add handlers'], answer:'Uniquely identify elements' },
  { id:'t12', type:'Technical', topic:'Core Concepts', difficulty:'Hard', question:'Which tool is commonly used to bundle modern frontend apps?', options:['Webpack','MySQL','Postman only','Figma'], answer:'Webpack' },
  { id:'h0', type:'HR', topic:'Teamwork', difficulty:'Medium', question:'A teammate disagrees with your approach. How do you handle it?', options:['Ignore them','Escalate immediately','Discuss 1:1 to understand their view','Agree to avoid conflict'], answer:'Discuss 1:1 to understand their view' },
  { id:'h1', type:'HR', topic:'Conflict', difficulty:'Medium', question:'Your manager gives feedback you disagree with. Best response?', options:['Dismiss it','Stay silent','Listen then share your view respectfully','Complain to colleagues'], answer:'Listen then share your view respectfully' },
  { id:'h2', type:'HR', topic:'Ownership', difficulty:'Medium', question:'You discover a critical bug you caused. What do you do first?', options:['Wait to see if noticed','Blame testing team','Inform the team and fix immediately','Deny involvement'], answer:'Inform the team and fix immediately' },
  { id:'h3', type:'HR', topic:'Time Management', difficulty:'Medium', question:'Two deadlines on the same day. How do you prioritize?', options:['Work on easier task','Ask for extensions on both','Assess impact and communicate proactively','Pick one randomly'], answer:'Assess impact and communicate proactively' },
  { id:'h4', type:'HR', topic:'Communication', difficulty:'Hard', question:'A stakeholder keeps changing requirements. How do you handle this?', options:['Refuse changes','Silently implement every change','Document changes and discuss timeline impact','Ignore them'], answer:'Document changes and discuss timeline impact' },
  { id:'h5', type:'HR', topic:'Growth', difficulty:'Easy', question:'How do you approach constructive criticism?', options:['Get defensive','Use it to improve','Agree but change nothing','Seek second opinion always'], answer:'Use it to improve' },
  { id:'h6', type:'HR', topic:'Leadership', difficulty:'Medium', question:'A junior teammate is struggling but not asking for help. What do you do?', options:['Let them figure it out','Report to manager','Proactively offer help','Reassign their tasks'], answer:'Proactively offer help' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0B1437; --bg2: #0E1842; --bg3: #111D4A; --bg4: #162154;
    --border: rgba(255,255,255,0.08); --border2: rgba(255,255,255,0.14);
    --text: #E8F0FF; --text2: #8FA8D8; --text3: #5A7AB8;
    --green: #00D48A; --amber: #F59E0B; --red: #EF4444;
    --purple: #8B5CF6; --blue: #2451B7; --accent: #00F5A0;
    --radius: 10px;
  }
  [data-theme="light"] {
    --bg: #F0F4FF; --bg2: #E4ECFF; --bg3: #D8E4FF; --bg4: #CCd6FF;
    --border: rgba(0,0,0,0.1); --border2: rgba(0,0,0,0.16);
    --text: #0B1437; --text2: #2451B7; --text3: #5A7AB8;
  }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
  .app { min-height: 100vh; background: var(--bg); }
  .screen { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }

  /* Topbar */
  .topbar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 20px; height: 52px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .brand { font-size: 14px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  .topbar-center { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; }
  .timer-val { font-size: 22px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .timer-val.urgent { color: var(--amber); animation: urgentPulse 1s ease-in-out infinite; }
  .timer-val.ended { color: var(--red); }
  @keyframes urgentPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .timer-label { font-size: 10px; color: var(--text3); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .live-badge { background: rgba(0,245,160,0.1); border: 1px solid rgba(0,245,160,0.3); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; color: var(--accent); display: flex; align-items: center; gap: 5px; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s infinite; }
  .icon-btn { background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 6px 10px; color: var(--text2); cursor: pointer; font-size: 13px; transition: background 0.2s; white-space: nowrap; }
  .icon-btn:hover { background: var(--bg4); }

  /* Progress bars */
  .progress-wrap { height: 4px; background: var(--bg3); position: relative; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--purple)); transition: width 0.4s ease; }
  .progress-label { position: absolute; right: 12px; top: 6px; font-size: 11px; color: var(--text3); font-variant-numeric: tabular-nums; }
  .q-timer-bar { height: 3px; background: var(--bg3); }
  .q-timer-fill { height: 100%; background: var(--green); transition: width 0.25s linear; }
  .q-timer-fill.warn { background: var(--amber); }
  .q-timer-fill.danger { background: var(--red); }

  /* Layout */
  .body { display: flex; flex: 1; overflow: hidden; }
  .left-panel { width: 210px; min-width: 190px; background: var(--bg2); border-right: 1px solid var(--border); padding: 14px 12px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
  .main-panel { flex: 1; padding: 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
  .right-panel { width: 230px; min-width: 210px; background: var(--bg2); border-left: 1px solid var(--border); padding: 14px 12px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

  /* Panel label */
  .panel-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--text3); text-transform: uppercase; margin-bottom: 8px; }

  /* Stats */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .stat-box { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px; text-align: center; }
  .stat-val { font-size: 19px; font-weight: 700; }
  .stat-lbl { font-size: 10px; color: var(--text3); margin-top: 1px; }

  /* Topic breakdown */
  .topic-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
  .topic-name { font-size: 11px; color: var(--text2); width: 72px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .topic-bar { flex: 1; height: 5px; background: var(--bg4); border-radius: 4px; overflow: hidden; }
  .topic-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .topic-pct { font-size: 10px; color: var(--text3); width: 28px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Difficulty chips */
  .diff-chip { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; background: var(--bg4); color: var(--text3); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
  .diff-chip.Easy.active { background: rgba(0,212,138,0.2); color: var(--green); border-color: var(--green); }
  .diff-chip.Medium.active { background: rgba(245,158,11,0.2); color: var(--amber); border-color: var(--amber); }
  .diff-chip.Hard.active { background: rgba(239,68,68,0.2); color: var(--red); border-color: var(--red); }
  .filter-chip { padding: 3px 8px; border-radius: 20px; border: 1px solid var(--border2); background: transparent; color: var(--text2); font-size: 11px; cursor: pointer; transition: all 0.2s; }
  .filter-chip.active { background: var(--accent); color: #0B1437; border-color: var(--accent); font-weight: 600; }
  .filter-row { display: flex; gap: 4px; flex-wrap: wrap; }

  /* Per-Q time history */
  .time-history { display: flex; flex-direction: column; gap: 3px; }
  .time-row { display: flex; align-items: center; gap: 6px; }
  .time-qnum { font-size: 10px; color: var(--text3); width: 22px; }
  .time-bar-wrap { flex: 1; height: 5px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
  .time-bar-fill { height: 100%; border-radius: 3px; }
  .time-val { font-size: 10px; color: var(--text3); width: 28px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Q Card */
  .q-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
  .q-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .q-num { font-size: 11px; font-weight: 600; color: var(--text3); }
  .q-badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .q-badge.Technical { background: rgba(36,81,183,0.25); color: #7BAAFF; }
  .q-badge.HR { background: rgba(245,158,11,0.2); color: var(--amber); }
  .q-badge.MCQ { background: rgba(139,92,246,0.2); color: var(--purple); }
  .q-badge.Easy { background: rgba(0,212,138,0.15); color: var(--green); }
  .q-badge.Medium { background: rgba(245,158,11,0.15); color: var(--amber); }
  .q-badge.Hard { background: rgba(239,68,68,0.15); color: var(--red); }
  .q-topic { font-size: 11px; color: var(--text3); background: var(--bg3); padding: 2px 8px; border-radius: 4px; }
  .q-text { font-size: 15px; font-weight: 500; line-height: 1.55; color: var(--text); }
  .diff-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; margin-left: auto; }

  /* Options */
  .options-wrap { display: flex; flex-direction: column; gap: 8px; }
  .option-btn { background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 12px 16px; text-align: left; color: var(--text); font-size: 14px; cursor: pointer; transition: all 0.18s; width: 100%; display: flex; align-items: center; justify-content: space-between; }
  .option-btn:hover:not(:disabled) { background: var(--bg4); border-color: rgba(255,255,255,0.25); }
  .option-btn.selected { border-color: var(--accent); background: rgba(0,245,160,0.08); }
  .option-btn.correct { border-color: var(--green); background: rgba(0,212,138,0.15); color: var(--green); font-weight: 600; }
  .option-btn.wrong { border-color: var(--red); background: rgba(239,68,68,0.12); color: var(--red); }
  .option-btn:disabled { cursor: default; }
  .option-indicator { font-size: 13px; }

  /* Feedback */
  .feedback-box { padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; }
  .feedback-box.correct { background: rgba(0,212,138,0.12); border: 1px solid rgba(0,212,138,0.3); color: var(--green); }
  .feedback-box.wrong { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--red); }

  /* Action row */
  .action-row { display: flex; gap: 8px; }
  .btn { padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s; }
  .btn-skip { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); }
  .btn-skip:hover { background: var(--bg4); }
  .btn-bookmark { background: var(--bg3); border: 1px solid var(--border2); color: var(--amber); font-size: 15px; padding: 10px 13px; }
  .btn-bookmark.bookmarked { background: rgba(245,158,11,0.15); border-color: var(--amber); }
  .btn-voice { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); padding: 10px 13px; font-size: 15px; transition: all 0.2s; }
  .btn-voice.listening { background: rgba(239,68,68,0.15); border-color: var(--red); color: var(--red); animation: voicePulse 1s infinite; }
  @keyframes voicePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .btn-submit { background: var(--accent); color: #0B1437; flex: 1; }
  .btn-submit:hover:not(:disabled) { opacity: 0.9; }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* AI Coach */
  .ai-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s infinite; }
  .ai-title { font-size: 12px; font-weight: 600; color: var(--accent); }
  .ai-box { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .ai-text { font-size: 12px; color: var(--text2); line-height: 1.6; min-height: 60px; }
  .ai-loading { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
  .ai-dot-loading { width: 5px; height: 5px; border-radius: 50%; background: var(--text3); animation: dotBounce 1.2s infinite; }
  .ai-dot-loading:nth-child(2) { animation-delay: 0.2s; }
  .ai-dot-loading:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dotBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
  .hint-bullet { display: flex; gap: 7px; align-items: flex-start; margin-bottom: 6px; }
  .hint-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; }
  .hint-txt { font-size: 12px; color: var(--text2); line-height: 1.5; }
  .keyword-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
  .kw { padding: 2px 7px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); border-radius: 20px; font-size: 11px; color: var(--purple); }
  .conf-meter { text-align: center; background: var(--bg3); border-radius: 8px; padding: 10px; }
  .conf-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .conf-val { font-size: 28px; font-weight: 700; color: var(--accent); }
  .conf-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

  /* Voice transcript */
  .voice-box { background: var(--bg3); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--text2); margin-top: 4px; min-height: 36px; }
  .voice-label { font-size: 10px; color: var(--red); font-weight: 600; margin-bottom: 3px; letter-spacing: 0.05em; }

  /* Summary */
  .summary-panel { max-width: 600px; margin: 30px auto; background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .summary-header { padding: 24px 28px 0; }
  .summary-header p { font-size: 12px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
  .summary-header h2 { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .summary-score { text-align: center; padding: 20px; }
  .summary-score span { font-size: 60px; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .summary-score p { font-size: 13px; color: var(--text3); margin-top: 2px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); }
  .summary-item { background: var(--bg2); padding: 12px; text-align: center; }
  .summary-item strong { display: block; font-size: 18px; font-weight: 700; }
  .summary-item span { font-size: 11px; color: var(--text3); }
  .summary-topic-section { padding: 16px 28px; border-top: 1px solid var(--border); }
  .summary-topic-section h3 { font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 12px; }
  .summary-topic-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .summary-topic-name { font-size: 12px; color: var(--text2); width: 90px; flex-shrink: 0; }
  .summary-topic-bar { flex: 1; height: 6px; background: var(--bg3); border-radius: 4px; overflow: hidden; }
  .summary-topic-fill { height: 100%; border-radius: 4px; }
  .summary-topic-pct { font-size: 12px; font-weight: 600; width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
  .summary-actions { padding: 16px 28px; display: flex; gap: 10px; }
  .btn-primary { background: var(--accent); color: #0B1437; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; }
  .btn-secondary { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-secondary:hover { background: var(--bg4); }

  /* Review */
  .review-panel { max-width: 700px; margin: 0 auto; padding: 20px; }
  .review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .review-header h2 { font-size: 18px; font-weight: 700; }
  .review-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .review-tab { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border2); background: transparent; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s; }
  .review-tab.active { background: var(--accent); color: #0B1437; border-color: var(--accent); font-weight: 600; }
  .review-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
  .review-q { font-size: 14px; font-weight: 500; margin-bottom: 10px; }
  .review-options { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .review-opt { padding: 8px 12px; border-radius: 6px; font-size: 12px; background: var(--bg3); border: 1px solid var(--border); }
  .review-opt.user-correct { background: rgba(0,212,138,0.15); border-color: var(--green); color: var(--green); font-weight: 600; }
  .review-opt.user-wrong { background: rgba(239,68,68,0.1); border-color: var(--red); color: var(--red); }
  .review-opt.correct-ans { background: rgba(0,212,138,0.1); border-color: rgba(0,212,138,0.4); }
  .review-skipped { font-size: 12px; color: var(--amber); margin-top: 6px; }
  .review-time { font-size: 11px; color: var(--text3); margin-top: 6px; }

  /* History */
  .history-panel { max-width: 640px; margin: 0 auto; padding: 20px; }
  .history-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .history-header h2 { font-size: 18px; font-weight: 700; }
  .history-empty { text-align: center; padding: 48px 20px; color: var(--text3); }
  .history-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
  .history-date { font-size: 11px; color: var(--text3); }
  .history-score { font-size: 22px; font-weight: 700; }
  .history-score.high { color: var(--green); }
  .history-score.mid { color: var(--amber); }
  .history-score.low { color: var(--red); }
  .history-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .history-clear { background: transparent; border: 1px solid rgba(239,68,68,0.4); color: var(--red); padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; }

  /* Leaderboard */
  .leaderboard-panel { max-width: 560px; margin: 0 auto; padding: 20px; }
  .lb-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .lb-header h2 { font-size: 18px; font-weight: 700; }
  .lb-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .lb-row:last-child { border-bottom: none; }
  .lb-row:hover { background: var(--bg3); }
  .lb-rank { font-size: 15px; font-weight: 700; width: 28px; text-align: center; }
  .lb-name { flex: 1; font-size: 13px; font-weight: 500; }
  .lb-score { font-size: 16px; font-weight: 700; }
  .lb-meta { font-size: 11px; color: var(--text3); margin-top: 1px; }
  .lb-empty { text-align: center; padding: 40px; color: var(--text3); font-size: 13px; }

  /* Setup */
  .setup-panel { max-width: 500px; margin: 50px auto; padding: 0 20px; }
  .setup-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 30px; }
  .setup-card h2 { font-size: 21px; font-weight: 700; margin-bottom: 5px; }
  .setup-card p { font-size: 13px; color: var(--text3); margin-bottom: 22px; }
  .setup-section { margin-bottom: 18px; }
  .setup-label { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border2); background: var(--bg3); color: var(--text2); font-size: 13px; cursor: pointer; transition: all 0.18s; }
  .chip.active { background: var(--accent); color: #0B1437; border-color: var(--accent); font-weight: 600; }
  .setup-info { font-size: 13px; color: var(--text3); background: var(--bg3); padding: 10px 14px; border-radius: 8px; line-height: 1.6; }
  .setup-start { width: 100%; padding: 13px; background: var(--accent); color: #0B1437; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
  .setup-start:hover { opacity: 0.9; }
  .loading-overlay { display: flex; align-items: center; justify-content: center; flex: 1; font-size: 14px; color: var(--text3); gap: 8px; }
`;

// ─── AI Coach hook ────────────────────────────────────────────────────────────
function useAICoach(question, feedback) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const fetchHint = useCallback(async (q, fb) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true); setHint('');
    const prompt = fb
      ? `Interview question: "${q.question}". The user answered ${fb.isCorrect ? 'correctly' : 'incorrectly'}. Correct answer: "${q.answer || fb.correctAnswer}". Give 2-3 bullet points explaining why this is correct and a key concept to remember. Be concise and encouraging.`
      : `Interview question: "${q.question}" (${q.type}, ${q.topic}, ${q.difficulty}). Give 2-3 bullet-point hints without revealing the answer. Focus on how to think about it.`;
    try {
      const data = await apiCall('/ai/hint', {
        method: 'POST',
        body: JSON.stringify({ question: q, feedback: fb || null }),
        signal: abortRef.current.signal,
      });
      setHint(data.hint || 'Think carefully and use process of elimination.');
    } catch (e) {
      if (e.name !== 'AbortError') setHint('Analyze each option carefully and eliminate the unlikely ones first.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (question) fetchHint(question, feedback);
  }, [question?.id, feedback]);

  return { hint, loading };
}

// ─── Difficulty auto-adjust logic ─────────────────────────────────────────────
function getNextDifficulty(currentDiff, isCorrect, streak) {
  const order = ['Easy', 'Medium', 'Hard'];
  const idx = order.indexOf(currentDiff);
  if (isCorrect && streak >= 2 && idx < 2) return order[idx + 1];
  if (!isCorrect && idx > 0) return order[idx - 1];
  return currentDiff;
}

// ─── Voice Input hook ─────────────────────────────────────────────────────────
function useVoice(options, onMatch) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recogRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser. Try Chrome.'); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('').toLowerCase();
      setTranscript(text);
      const matched = options.find(opt => text.includes(opt.toLowerCase().substring(0, 5)));
      if (matched && e.results[0].isFinal) onMatch(matched);
    };
    r.start();
    recogRef.current = r;
  }, [options, onMatch]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = () => listening ? stop() : start();
  return { listening, transcript, toggle };
}

// ─── Session Hook ─────────────────────────────────────────────────────────────
function useSession(config) {
  const isActive = config !== null;
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [qSecondsLeft, setQSecondsLeft] = useState(PER_Q_SECONDS);
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [qTimeUsed, setQTimeUsed] = useState([]); // ✅ per-question time tracking
  const [streak, setStreak] = useState(0);          // ✅ for difficulty auto-adjust
  const [currentDiff, setCurrentDiff] = useState('Medium'); // ✅ adaptive difficulty
  const startTimeRef = useRef(Date.now());
  const qStartRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive) return;
    const load = async () => {
      setLoadingQ(true);
      try {
        const data = await apiCall('/sessions/start', {
          method: 'POST',
          body: JSON.stringify({
            count: SESSION_Q_COUNT,
            type: config.categories.includes('All') ? undefined : config.categories[0],
            difficulty: config.difficulties.includes('All') ? undefined : config.difficulties[0],
          }),
        });
        if (data.success && data.questions?.length) {
          setQuestions(data.questions.map(q => ({ ...q, id: q._id, answer: null })));
          setSessionId(data.sessionId);
        } else {
          throw new Error('No questions from backend');
        }
      } catch {
        // Fallback to local questions
        const filtered = localQuestions.filter(q => {
          const catOk = config.categories.includes('All') || config.categories.includes(q.type);
          const diffOk = config.difficulties.includes('All') || config.difficulties.includes(q.difficulty);
          return catOk && diffOk;
        });
        const pool = shuffle(filtered.length >= SESSION_Q_COUNT ? filtered : localQuestions);
        setQuestions(pool.slice(0, SESSION_Q_COUNT));
      }
      setLoadingQ(false);
      setQIndex(0); setSelected(''); setFeedback(null);
      setAnswered(0); setSkipped(0); setCorrect(0);
      setIsFinished(false); setHistory([]); setAnswers([]);
      setBookmarks([]); setQTimeUsed([]); setStreak(0);
      startTimeRef.current = Date.now();
      qStartRef.current = Date.now();
    };
    load();
  }, [isActive, config]);

  const q = questions[qIndex];
  const totalQ = questions.length;

  // Per-question countdown
  useEffect(() => {
    if (isFinished || feedback || !q) return;
    setQSecondsLeft(PER_Q_SECONDS);
    qStartRef.current = Date.now();
    const endTime = Date.now() + PER_Q_SECONDS * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setQSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        const timeUsed = PER_Q_SECONDS;
        setQTimeUsed(t => [...t, { qIndex, timeUsed, result: 'timeout' }]);
        setSkipped(s => s + 1);
        setAnswers(a => [...a, { questionId: q._id || q.id, selectedOption: null }]);
        setHistory(h => [...h, { qId: q.id, question: q, userAnswer: null, skipped: true, timeUsed }]);
        if (qIndex >= totalQ - 1) setIsFinished(true);
        else { setQIndex(i => i + 1); setSelected(''); setFeedback(null); }
      }
    }, 250);
    return () => clearInterval(id);
  }, [qIndex, isFinished, feedback, q]);

  const skip = () => {
    if (isFinished || !q) return;
    const timeUsed = Math.round((Date.now() - qStartRef.current) / 1000);
    setQTimeUsed(t => [...t, { qIndex, timeUsed, result: 'skipped' }]);
    setSkipped(s => s + 1); setStreak(0);
    setAnswers(a => [...a, { questionId: q._id || q.id, selectedOption: null }]);
    setHistory(h => [...h, { qId: q.id, question: q, userAnswer: null, skipped: true, timeUsed }]);
    if (qIndex >= totalQ - 1) { setIsFinished(true); return; }
    setQIndex(i => i + 1); setSelected(''); setFeedback(null);
  };

  const submit = async () => {
    if (isFinished || !q) return;
    if (feedback) {
      if (qIndex >= totalQ - 1) { setIsFinished(true); return; }
      setQIndex(i => i + 1); setSelected(''); setFeedback(null); return;
    }
    const timeUsed = Math.round((Date.now() - qStartRef.current) / 1000);

    // Check answer — try backend first, fallback to local
    let isCorrect = false;
    let correctAnswer = q.answer;
    try {
      const data = await apiCall('/questions/check', {
        method: 'POST',
        body: JSON.stringify({ questionId: q._id || q.id, selectedOption: selected }),
      });
      isCorrect = data.isCorrect;
      correctAnswer = data.correctAnswer;
      setQuestions(qs => qs.map((item, i) => i === qIndex ? { ...item, answer: correctAnswer } : item));
    } catch {
      // Fallback local check
      isCorrect = selected === q.answer;
      correctAnswer = q.answer;
    }

    setAnswered(a => a + 1);
    if (isCorrect) {
      setCorrect(c => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      // ✅ Difficulty auto-adjust
      setCurrentDiff(d => getNextDifficulty(d, true, newStreak));
    } else {
      setStreak(0);
      setCurrentDiff(d => getNextDifficulty(d, false, 0));
    }

    const fb = { isCorrect, message: isCorrect ? `✓ Correct!` : `✗ Incorrect. Correct: ${correctAnswer}`, correctAnswer };
    setFeedback(fb);
    setQTimeUsed(t => [...t, { qIndex, timeUsed, result: isCorrect ? 'correct' : 'wrong' }]);
    setAnswers(a => [...a, { questionId: q._id || q.id, selectedOption: selected }]);
    setHistory(h => [...h, { qId: q.id, question: { ...q, answer: correctAnswer }, userAnswer: selected, skipped: false, isCorrect, timeUsed }]);
  };

  const submitToBackend = useCallback(async (finalAnswers, _correct, _skipped) => {
    if (!sessionId) return;
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await apiCall(`/sessions/${sessionId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: finalAnswers, timeTaken, status: 'completed' }),
      });
    } catch {}
  }, [sessionId]);

  const toggleBookmark = (id) => setBookmarks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id]);

  // ✅ Topic-wise score breakdown
  const topicStats = history.reduce((acc, item) => {
    if (item.skipped) return acc;
    const t = item.question.topic;
    if (!acc[t]) acc[t] = { correct: 0, total: 0 };
    acc[t].total++;
    if (item.isCorrect) acc[t].correct++;
    return acc;
  }, {});

  return {
    questions, q, qIndex, totalQ, selected, setSelected,
    feedback, answered, skipped, correct, isFinished,
    qSecondsLeft, bookmarks, toggleBookmark, history, answers,
    loadingQ, sessionId, submitToBackend, qTimeUsed, topicStats,
    currentDiff, streak,
    wrong: Math.max(0, answered - correct),
    score: totalQ === 0 ? 0 : Math.round((correct / totalQ) * 100),
    avgScore: answered === 0 ? 0 : Math.round((correct / answered) * 100),
    remaining: Math.max(0, totalQ - qIndex - 1),
    progress: isFinished ? 100 : totalQ === 0 ? 0 : ((qIndex + 1) / totalQ) * 100,
    skip, submit,
  };
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ qSecondsLeft, onTheme, onHistory, onLeaderboard, theme, user, onLogout }) {
  const pct = qSecondsLeft / PER_Q_SECONDS;
  const cls = pct <= 0.15 ? 'timer-val ended' : pct <= 0.33 ? 'timer-val urgent' : 'timer-val';
  return (
    <div className="topbar">
      <div className="brand"><div className="brand-dot" />PrepAI</div>
      <div className="topbar-center">
        <div className={cls}>{formatTime(qSecondsLeft)}</div>
        <div className="timer-label">time remaining</div>
      </div>
      <div className="topbar-right">
        <div className="live-badge"><div className="live-dot" />LIVE</div>
        <button className="icon-btn" onClick={onHistory}>📊 History</button>
        <button className="icon-btn" onClick={onLeaderboard}>🏆 Board</button>
        <button className="icon-btn" onClick={onTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        {user && <button className="icon-btn" onClick={onLogout} style={{ color: 'var(--red)' }}>✕ {user.name?.split(' ')[0] || 'Logout'}</button>}
      </div>
    </div>
  );
}

function QTimerBar({ secondsLeft }) {
  const pct = (secondsLeft / PER_Q_SECONDS) * 100;
  const cls = pct <= 15 ? 'q-timer-fill danger' : pct <= 35 ? 'q-timer-fill warn' : 'q-timer-fill';
  return <div className="q-timer-bar"><div className={cls} style={{ width: `${pct}%` }} /></div>;
}

function ProgressBar({ progress, qIndex, totalQ }) {
  return (
    <div className="progress-wrap">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
      <div className="progress-label">Q {qIndex + 1} / {totalQ}</div>
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel({ answered, skipped, avgScore, remaining, categories, difficulties, onCategory, onDifficulty, topicStats, qTimeUsed, currentDiff, streak }) {
  const cats = ['All', 'Technical', 'HR'];
  const diffs = ['All', 'Easy', 'Medium', 'Hard'];
  const topicEntries = Object.entries(topicStats);

  return (
    <div className="left-panel">
      <div>
        <div className="panel-label">Session Stats</div>
        <div className="stat-grid">
          <div className="stat-box"><div className="stat-val" style={{ color: 'var(--green)' }}>{answered}</div><div className="stat-lbl">Answered</div></div>
          <div className="stat-box"><div className="stat-val" style={{ color: 'var(--amber)' }}>{skipped}</div><div className="stat-lbl">Skipped</div></div>
          <div className="stat-box"><div className="stat-val">{avgScore}%</div><div className="stat-lbl">Avg Score</div></div>
          <div className="stat-box"><div className="stat-val" style={{ color: 'var(--purple)' }}>{remaining}</div><div className="stat-lbl">Left</div></div>
        </div>
      </div>

      {/* ✅ Adaptive difficulty indicator */}
      <div>
        <div className="panel-label">Adaptive Difficulty</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Easy','Medium','Hard'].map(d => (
            <span key={d} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: currentDiff === d ? (d === 'Easy' ? 'rgba(0,212,138,0.2)' : d === 'Medium' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)') : 'var(--bg4)',
              color: currentDiff === d ? (d === 'Easy' ? 'var(--green)' : d === 'Medium' ? 'var(--amber)' : 'var(--red)') : 'var(--text3)',
              border: `1px solid ${currentDiff === d ? (d === 'Easy' ? 'var(--green)' : d === 'Medium' ? 'var(--amber)' : 'var(--red)') : 'var(--border)'}`,
            }}>{d}</span>
          ))}
        </div>
        {streak >= 2 && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 5 }}>🔥 {streak} streak!</div>}
      </div>

      {/* ✅ Topic-wise breakdown */}
      {topicEntries.length > 0 && (
        <div>
          <div className="panel-label">Topic Score</div>
          {topicEntries.map(([topic, stat]) => {
            const pct = Math.round((stat.correct / stat.total) * 100);
            const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
            return (
              <div className="topic-row" key={topic}>
                <span className="topic-name">{topic}</span>
                <div className="topic-bar"><div className="topic-fill" style={{ width: `${pct}%`, background: color }} /></div>
                <span className="topic-pct" style={{ color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Per-question time history */}
      {qTimeUsed.length > 0 && (
        <div>
          <div className="panel-label">Time per Question</div>
          <div className="time-history">
            {qTimeUsed.slice(-8).map((t, i) => {
              const pct = Math.round((t.timeUsed / PER_Q_SECONDS) * 100);
              const color = t.result === 'correct' ? 'var(--green)' : t.result === 'wrong' ? 'var(--red)' : 'var(--amber)';
              return (
                <div className="time-row" key={i}>
                  <span className="time-qnum">Q{t.qIndex + 1}</span>
                  <div className="time-bar-wrap"><div className="time-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                  <span className="time-val">{t.timeUsed}s</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="panel-label">Category</div>
        <div className="filter-row">
          {cats.map(c => <button key={c} className={`filter-chip ${categories.includes(c) ? 'active' : ''}`} onClick={() => onCategory(c)}>{c}</button>)}
        </div>
      </div>
      <div>
        <div className="panel-label">Difficulty</div>
        <div className="filter-row">
          {diffs.map(d => <button key={d} className={`diff-chip ${d} ${difficulties.includes(d) ? 'active' : ''}`} onClick={() => onDifficulty(d)}>{d}</button>)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
function MainPanel({ session }) {
  const { q, qIndex, selected, setSelected, feedback, qSecondsLeft, bookmarks, toggleBookmark, skip, submit } = session;

  // ✅ Voice input
  const { listening, transcript, toggle: toggleVoice } = useVoice(
    q?.options || [],
    (matched) => !feedback && setSelected(matched)
  );

  if (!q) return <div className="loading-overlay">⏳ Loading questions...</div>;

  return (
    <div className="main-panel">
      <div className="q-card">
        <div className="q-meta">
          <span className="q-num">Question {qIndex + 1}</span>
          <span className={`q-badge ${q.type}`}>{q.type}</span>
          <span className="q-topic">{q.topic}</span>
          <span className={`q-badge ${q.difficulty}`}>{q.difficulty}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: qSecondsLeft <= 10 ? 'var(--red)' : 'var(--text3)', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{qSecondsLeft}s</span>
        </div>
        <div className="q-text">{q.question}</div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Choose one option</span>
        <span>{selected ? '1' : '0'} / 1 selected</span>
      </div>

      <div className="options-wrap">
        {q.options.map(opt => {
          const isSel = selected === opt;
          const isCorrect = feedback && opt === feedback.correctAnswer;
          const isWrong = feedback && isSel && opt !== feedback.correctAnswer;
          return (
            <button
              key={opt}
              className={`option-btn ${isSel ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => !feedback && setSelected(opt)}
              disabled={!!feedback}
            >
              <span>{opt}</span>
              {isCorrect && <span className="option-indicator">✓</span>}
              {isWrong && <span className="option-indicator">✗</span>}
            </button>
          );
        })}
      </div>

      {feedback && <div className={`feedback-box ${feedback.isCorrect ? 'correct' : 'wrong'}`}>{feedback.message}</div>}

      {/* ✅ Voice transcript display */}
      {(listening || transcript) && (
        <div className="voice-box">
          <div className="voice-label">🎤 LISTENING...</div>
          {transcript || 'Say your answer...'}
        </div>
      )}

      <div className="action-row">
        <button className="btn btn-skip" onClick={skip}>Skip</button>
        <button className={`btn btn-voice ${listening ? 'listening' : ''}`} onClick={toggleVoice} title="Voice input">🎤</button>
        <button className={`btn btn-bookmark ${bookmarks.includes(q.id) ? 'bookmarked' : ''}`} onClick={() => toggleBookmark(q.id)}>
          {bookmarks.includes(q.id) ? '★' : '☆'}
        </button>
        <button className="btn btn-submit" onClick={submit} disabled={!selected && !feedback}>
          {feedback ? 'Next →' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}

// ─── Right Panel (AI Coach) ───────────────────────────────────────────────────
function RightPanel({ question, feedback, streak }) {
  const { hint, loading } = useAICoach(question, feedback);
  const score = feedback ? (feedback.isCorrect ? 85 : 42) : 74;
  const trend = feedback ? (feedback.isCorrect ? 'up ↑' : 'down ↓') : 'stable';
  const bullets = hint.split('\n').filter(Boolean);

  return (
    <div className="right-panel">
      <div>
        <div className="ai-header"><div className="ai-dot" /><div className="ai-title">AI Coach — Live</div></div>
        <div className="ai-box">
          {loading ? (
            <div className="ai-loading"><div className="ai-dot-loading" /><div className="ai-dot-loading" /><div className="ai-dot-loading" /></div>
          ) : bullets.length > 1 ? (
            bullets.map((b, i) => (
              <div className="hint-bullet" key={i}>
                <div className="hint-dot" />
                <span className="hint-txt">{b.replace(/^[-•*]\s*/, '')}</span>
              </div>
            ))
          ) : (
            <div className="ai-text">{hint || 'Think through each option methodically.'}</div>
          )}
        </div>
        {question && (
          <div className="keyword-row">
            <span className="kw">{question.type}</span>
            <span className="kw">{question.topic}</span>
            <span className="kw">{question.difficulty}</span>
          </div>
        )}
      </div>
      <div className="conf-meter">
        <div className="conf-lbl">AI confidence score</div>
        <div className="conf-val">{score} <span style={{ fontSize: 14, color: 'var(--text3)' }}>/ 100</span></div>
        <div className="conf-sub">Trending {trend}</div>
      </div>
      {streak >= 2 && (
        <div style={{ background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--accent)', textAlign: 'center' }}>
          🔥 {streak}-question streak! Keep going!
        </div>
      )}
    </div>
  );
}

// ─── Summary Screen ───────────────────────────────────────────────────────────
function SummaryScreen({ session, onRestart, onReview, onBookmarkReview }) {
  const { totalQ, answered, skipped, correct, wrong, score, answers, submitToBackend, topicStats, bookmarks } = session;

  useEffect(() => {
    submitToBackend(answers, correct, skipped);
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      prev.unshift({ date: new Date().toISOString(), score, totalQ, correct, wrong, skipped });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(0, 20)));
    } catch {}
  }, []);

  const topicEntries = Object.entries(topicStats);

  return (
    <div className="summary-panel">
      <div className="summary-header"><p>Session Complete</p><h2>Your Interview Result</h2></div>
      <div className="summary-score">
        <span>{score}%</span>
        <p>Final Score — {score >= 70 ? '🎉 Great performance!' : score >= 40 ? '📈 Good effort, keep practicing!' : '📚 More practice needed'}</p>
      </div>
      <div className="summary-grid">
        <div className="summary-item"><strong>{totalQ}</strong><span>Total Qs</span></div>
        <div className="summary-item"><strong style={{ color: 'var(--green)' }}>{correct}</strong><span>Correct</span></div>
        <div className="summary-item"><strong style={{ color: 'var(--red)' }}>{wrong}</strong><span>Wrong</span></div>
        <div className="summary-item"><strong>{answered}</strong><span>Answered</span></div>
        <div className="summary-item"><strong style={{ color: 'var(--amber)' }}>{skipped}</strong><span>Skipped</span></div>
        <div className="summary-item"><strong style={{ color: score >= 70 ? 'var(--green)' : 'var(--red)' }}>{score >= 70 ? '👍' : '📚'}</strong><span>{score >= 70 ? 'Great job!' : 'Keep going'}</span></div>
      </div>

      {/* ✅ Topic-wise score breakdown */}
      {topicEntries.length > 0 && (
        <div className="summary-topic-section">
          <h3>Topic-wise Breakdown</h3>
          {topicEntries.map(([topic, stat]) => {
            const pct = Math.round((stat.correct / stat.total) * 100);
            const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
            return (
              <div className="summary-topic-row" key={topic}>
                <span className="summary-topic-name">{topic}</span>
                <div className="summary-topic-bar"><div className="summary-topic-fill" style={{ width: `${pct}%`, background: color }} /></div>
                <span className="summary-topic-pct" style={{ color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="summary-actions">
        <button className="btn-secondary" onClick={onReview}>📋 Review All</button>
        {bookmarks.length > 0 && <button className="btn-secondary" onClick={onBookmarkReview}>★ Review Bookmarks ({bookmarks.length})</button>}
        <button className="btn-primary" onClick={onRestart}>▶ New Session</button>
      </div>
    </div>
  );
}

// ─── Review Screen ────────────────────────────────────────────────────────────
function ReviewScreen({ history, bookmarks, onBack, defaultTab = 'all' }) {
  const [tab, setTab] = useState(defaultTab); // 'all' | 'wrong' | 'bookmarked'

  const filtered = history.filter(item => {
    if (tab === 'wrong') return !item.isCorrect && !item.skipped;
    if (tab === 'bookmarked') return bookmarks.includes(item.qId);
    return true;
  });

  return (
    <div className="review-panel">
      <div className="review-header">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2>Question Review</h2>
      </div>
      <div className="review-tabs">
        {[['all', `All (${history.length})`], ['wrong', `Wrong (${history.filter(i => !i.isCorrect && !i.skipped).length})`], ['bookmarked', `Bookmarked (${history.filter(i => bookmarks.includes(i.qId)).length})`]].map(([key, label]) => (
          <button key={key} className={`review-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No questions in this filter.</div>}
      {filtered.map((item, i) => (
        <div className="review-card" key={i}>
          <div className="q-meta">
            <span className="q-num">Q{history.indexOf(item) + 1}</span>
            <span className={`q-badge ${item.question.type}`}>{item.question.type}</span>
            <span className={`q-badge ${item.question.difficulty}`}>{item.question.difficulty}</span>
            <span className="q-topic">{item.question.topic}</span>
            {bookmarks.includes(item.qId) && <span style={{ color: 'var(--amber)', fontSize: 13 }}>★</span>}
            {item.skipped && <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: 11, fontWeight: 600 }}>SKIPPED</span>}
            {!item.skipped && (item.isCorrect
              ? <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 13 }}>✓</span>
              : <span style={{ marginLeft: 'auto', color: 'var(--red)', fontSize: 13 }}>✗</span>)}
          </div>
          <div className="review-q">{item.question.question}</div>
          {!item.skipped && (
            <div className="review-options">
              {item.question.options.map(opt => {
                const isUserAns = item.userAnswer === opt;
                const isCorrectAns = item.question.answer === opt;
                let cls = 'review-opt';
                if (isCorrectAns && isUserAns) cls += ' user-correct';
                else if (isUserAns && !isCorrectAns) cls += ' user-wrong';
                else if (isCorrectAns) cls += ' correct-ans';
                return <div key={opt} className={cls}>{opt}{isCorrectAns && !isUserAns ? ' ✓' : ''}</div>;
              })}
            </div>
          )}
          {item.skipped && <div className="review-skipped">⚠ Time ran out or skipped.</div>}
          {item.timeUsed && <div className="review-time">⏱ Time used: {item.timeUsed}s</div>}
        </div>
      ))}
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
function HistoryScreen({ onBack }) {
  const [records, setRecords] = useState([]);
  useEffect(() => { try { setRecords(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch {} }, []);
  const clear = () => { localStorage.removeItem(STORAGE_KEY); setRecords([]); };
  const avg = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;
  const best = records.length ? Math.max(...records.map(r => r.score)) : 0;
  return (
    <div className="history-panel">
      <div className="history-header">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2>Session History</h2>
        {records.length > 0 && <button className="history-clear" onClick={clear}>Clear All</button>}
      </div>
      {records.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-box"><div className="stat-val" style={{ color: 'var(--accent)' }}>{records.length}</div><div className="stat-lbl">Sessions</div></div>
          <div className="stat-box"><div className="stat-val" style={{ color: 'var(--green)' }}>{best}%</div><div className="stat-lbl">Best Score</div></div>
          <div className="stat-box" style={{ gridColumn: 'span 2' }}><div className="stat-val">{avg}%</div><div className="stat-lbl">Average Score</div></div>
        </div>
      )}
      {records.length === 0 ? (
        <div className="history-empty">No sessions yet. Complete a session to see history here.</div>
      ) : records.map((r, i) => {
        const d = new Date(r.date);
        const cls = r.score >= 70 ? 'high' : r.score >= 40 ? 'mid' : 'low';
        return (
          <div className="history-card" key={i}>
            <div>
              <div className="history-date">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="history-meta">{r.totalQ} questions · {r.correct} correct · {r.skipped} skipped</div>
            </div>
            <div className={`history-score ${cls}`}>{r.score}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard Screen ───────────────────────────────────────────────────────
function LeaderboardScreen({ onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiCall('/sessions/leaderboard');
        if (res.success && res.leaderboard?.length) {
          setData(res.leaderboard);
        } else {
          // Fallback: local history-based leaderboard
          const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          setData(local.slice(0, 10).map((r, i) => ({
            rank: i + 1, user: 'You', score: r.score,
            correct: r.correct, total: r.totalQ, date: r.date,
          })));
        }
      } catch {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        setData(local.slice(0, 10).map((r, i) => ({
          rank: i + 1, user: 'You', score: r.score,
          correct: r.correct, total: r.totalQ, date: r.date,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const rankEmoji = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
  const scoreColor = (s) => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="leaderboard-panel">
      <div className="lb-header">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2>🏆 Leaderboard</h2>
      </div>
      {loading ? (
        <div className="loading-overlay">Loading scores...</div>
      ) : data.length === 0 ? (
        <div className="lb-card"><div className="lb-empty">No scores yet. Complete a session to appear here!</div></div>
      ) : (
        <div className="lb-card">
          {data.map((entry, i) => (
            <div className="lb-row" key={i}>
              <div className="lb-rank">{rankEmoji(entry.rank || i + 1)}</div>
              <div style={{ flex: 1 }}>
                <div className="lb-name">{entry.user}</div>
                <div className="lb-meta">{entry.correct}/{entry.total} correct{entry.date ? ` · ${new Date(entry.date).toLocaleDateString()}` : ''}</div>
              </div>
              <div className="lb-score" style={{ color: scoreColor(entry.score) }}>{entry.score}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [cats, setCats] = useState(['All']);
  const [diffs, setDiffs] = useState(['All']);
  const toggleCat = (c) => { if (c === 'All') { setCats(['All']); return; } const n = cats.filter(x => x !== 'All'); const u = n.includes(c) ? n.filter(x => x !== c) : [...n, c]; setCats(u.length ? u : ['All']); };
  const toggleDiff = (d) => { if (d === 'All') { setDiffs(['All']); return; } const n = diffs.filter(x => x !== 'All'); const u = n.includes(d) ? n.filter(x => x !== d) : [...n, d]; setDiffs(u.length ? u : ['All']); };
  return (
    <div className="setup-panel">
      <div className="setup-card">
        <h2>🎯 Start Interview Session</h2>
        <p>Configure your practice session and get AI-powered coaching.</p>
        <div className="setup-section">
          <div className="setup-label">Question Category</div>
          <div className="chip-row">{['All','Technical','HR'].map(c => <button key={c} className={`chip ${cats.includes(c)?'active':''}`} onClick={() => toggleCat(c)}>{c}</button>)}</div>
        </div>
        <div className="setup-section">
          <div className="setup-label">Difficulty Level</div>
          <div className="chip-row">{['All','Easy','Medium','Hard'].map(d => <button key={d} className={`chip ${diffs.includes(d)?'active':''}`} onClick={() => toggleDiff(d)}>{d}</button>)}</div>
        </div>
        <div className="setup-section">
          <div className="setup-info">📋 {SESSION_Q_COUNT} questions · ⏱ {PER_Q_SECONDS}s per question · 🤖 AI coaching · 🎤 Voice input · 🔥 Adaptive difficulty</div>
        </div>
        <button className="setup-start" onClick={() => onStart({ categories: cats, difficulties: diffs })}>Start Session →</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('setup'); // setup | session | summary | review | history | leaderboard
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [difficulties, setDifficulties] = useState(['All']);
  const [reviewTab, setReviewTab] = useState('all');
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('prepai-token');
    return token ? { name: 'User' } : null;
  });

  // ✅ Hook always called unconditionally
  const session = useSession(config);

  const handleStart = (cfg) => { setConfig(cfg); setCategories(cfg.categories); setDifficulties(cfg.difficulties); setView('session'); };
  const handleRestart = () => { setConfig(null); setView('setup'); };
  const handleLogout = () => { localStorage.removeItem('prepai-token'); setUser(null); setConfig(null); setView('setup'); };

  const onCategory = (c) => { const f = categories.filter(x => x !== 'All'); const n = c === 'All' ? ['All'] : f.includes(c) ? (f.filter(x => x !== c).length ? f.filter(x => x !== c) : ['All']) : [...f, c]; setCategories(n); };
  const onDifficulty = (d) => { const f = difficulties.filter(x => x !== 'All'); const n = d === 'All' ? ['All'] : f.includes(d) ? (f.filter(x => x !== d).length ? f.filter(x => x !== d) : ['All']) : [...f, d]; setDifficulties(n); };

  // Auto-transition to summary
  useEffect(() => { if (session.isFinished && view === 'session') setView('summary'); }, [session.isFinished, view]);

  return (
    <div className="app" data-theme={theme}>
      <style>{css}</style>
      {view === 'setup' && <SetupScreen onStart={handleStart} />}
      {view === 'history' && <HistoryScreen onBack={() => setView('setup')} />}
      {view === 'leaderboard' && <LeaderboardScreen onBack={() => setView('setup')} />}
      {view === 'review' && <ReviewScreen history={session.history} bookmarks={session.bookmarks} onBack={() => setView('summary')} defaultTab={reviewTab} />}
      {view === 'summary' && (
        <SummaryScreen
          session={session}
          onRestart={handleRestart}
          onReview={() => { setReviewTab('all'); setView('review'); }}
          onBookmarkReview={() => { setReviewTab('bookmarked'); setView('review'); }}
        />
      )}
      {view === 'session' && (
        <div className="screen">
          <TopBar qSecondsLeft={session.qSecondsLeft} theme={theme} onTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onHistory={() => setView('history')} onLeaderboard={() => setView('leaderboard')} user={user} onLogout={handleLogout} />
          <QTimerBar secondsLeft={session.qSecondsLeft} />
          <ProgressBar progress={session.progress} qIndex={session.qIndex} totalQ={session.totalQ} />
          {session.loadingQ ? (
            <div className="loading-overlay">⏳ Fetching questions from server...</div>
          ) : (
            <div className="body">
              <LeftPanel
                answered={session.answered} skipped={session.skipped}
                avgScore={session.avgScore} remaining={session.remaining}
                categories={categories} difficulties={difficulties}
                onCategory={onCategory} onDifficulty={onDifficulty}
                topicStats={session.topicStats} qTimeUsed={session.qTimeUsed}
                currentDiff={session.currentDiff} streak={session.streak}
              />
              <MainPanel session={session} />
              <RightPanel question={session.q} feedback={session.feedback} streak={session.streak} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}