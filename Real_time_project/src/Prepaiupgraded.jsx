import { useState, useEffect, useRef, useCallback } from "react";

// ─── Question Data ───────────────────────────────────────────────────────────
const technicalQuestions = [
  { topic: 'JavaScript', prompt: 'Which keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'static', 'global'], answer: 'let', difficulty: 'Easy' },
  { topic: 'React', prompt: 'Which hook is used to run side effects in a React function component?', options: ['useMemo', 'useEffect', 'useRef', 'useReducer'], answer: 'useEffect', difficulty: 'Medium' },
  { topic: 'HTML', prompt: 'Which element is used for the largest heading in HTML?', options: ['h6', 'heading', 'h1', 'head'], answer: 'h1', difficulty: 'Easy' },
  { topic: 'CSS', prompt: 'Which CSS property controls the space inside an element border?', options: ['margin', 'padding', 'gap', 'outline'], answer: 'padding', difficulty: 'Easy' },
  { topic: 'Node.js', prompt: 'Which module system does Node.js commonly use with require?', options: ['CommonJS', 'AMD', 'SystemJS', 'BabelJS'], answer: 'CommonJS', difficulty: 'Medium' },
  { topic: 'Database', prompt: 'Which SQL command is used to read records from a table?', options: ['INSERT', 'SELECT', 'UPDATE', 'DROP'], answer: 'SELECT', difficulty: 'Easy' },
  { topic: 'Git', prompt: 'Which command creates a new local Git branch and switches to it?', options: ['git branch -d', 'git checkout -b', 'git push -u', 'git merge'], answer: 'git checkout -b', difficulty: 'Medium' },
  { topic: 'API', prompt: 'Which HTTP method is usually used to create a new resource?', options: ['GET', 'POST', 'HEAD', 'OPTIONS'], answer: 'POST', difficulty: 'Easy' },
  { topic: 'Security', prompt: 'What is the main purpose of hashing a password?', options: ['To compress it', 'To store it safely', 'To make it faster', 'To translate it'], answer: 'To store it safely', difficulty: 'Medium' },
  { topic: 'System Design', prompt: 'Which component is commonly used to decouple producers and consumers?', options: ['Message queue', 'CSS grid', 'Browser cookie', 'HTML form'], answer: 'Message queue', difficulty: 'Hard' },
  { topic: 'JavaScript', prompt: 'What does the "===" operator check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Neither'], answer: 'Value and type', difficulty: 'Easy' },
  { topic: 'React', prompt: 'Which hook replaces lifecycle methods like componentDidMount?', options: ['useState', 'useEffect', 'useContext', 'useMemo'], answer: 'useEffect', difficulty: 'Medium' },
  { topic: 'CSS', prompt: 'Which CSS value makes an element take the full available width?', options: ['inline', 'block', 'inline-block', 'flex'], answer: 'block', difficulty: 'Easy' },
  { topic: 'Database', prompt: 'What does ACID stand for in databases?', options: ['Atomicity Consistency Isolation Durability', 'Async Concurrent Indexed Data', 'Access Control Index Design', 'Auto Cache Insert Delete'], answer: 'Atomicity Consistency Isolation Durability', difficulty: 'Hard' },
  { topic: 'Git', prompt: 'Which git command stages all changed files?', options: ['git commit -m', 'git add .', 'git push', 'git pull'], answer: 'git add .', difficulty: 'Easy' },
];

const hrQuestions = [
  { topic: 'Communication', prompt: 'What is the best first step when you do not understand a task?', options: ['Guess and continue', 'Ask clarifying questions', 'Ignore the task', 'Blame the team'], answer: 'Ask clarifying questions', difficulty: 'Easy' },
  { topic: 'Teamwork', prompt: 'How should you respond when a teammate disagrees with your solution?', options: ['Listen and discuss tradeoffs', 'End the conversation', 'Reject all feedback', 'Escalate immediately'], answer: 'Listen and discuss tradeoffs', difficulty: 'Medium' },
  { topic: 'Ownership', prompt: 'What shows strong ownership at work?', options: ['Waiting for reminders', 'Hiding blockers', 'Following through on commitments', 'Avoiding updates'], answer: 'Following through on commitments', difficulty: 'Easy' },
  { topic: 'Adaptability', prompt: 'What is a healthy response to changing project requirements?', options: ['Refuse all changes', 'Clarify impact and adjust plan', 'Stop communicating', 'Delete previous work'], answer: 'Clarify impact and adjust plan', difficulty: 'Medium' },
  { topic: 'Conflict', prompt: 'What should you focus on during workplace conflict?', options: ['Winning the argument', 'Understanding the problem', 'Personal criticism', 'Avoiding all discussion'], answer: 'Understanding the problem', difficulty: 'Medium' },
  { topic: 'Leadership', prompt: 'What is a useful behavior for an entry-level leader?', options: ['Share context clearly', 'Keep decisions secret', 'Avoid responsibility', 'Interrupt often'], answer: 'Share context clearly', difficulty: 'Hard' },
  { topic: 'Communication', prompt: 'How do you handle receiving praise?', options: ['Acknowledge it and credit collaborators', 'Dismiss everyone else', 'Boast excessively', 'Ignore the team'], answer: 'Acknowledge it and credit collaborators', difficulty: 'Easy' },
  { topic: 'Teamwork', prompt: 'What is a good way to onboard to a new team?', options: ['Read docs, ask questions, and observe workflow', 'Change everything immediately', 'Avoid teammates', 'Skip setup steps'], answer: 'Read docs, ask questions, and observe workflow', difficulty: 'Medium' },
  { topic: 'Conflict', prompt: 'How should you communicate blockers?', options: ['Early, clearly, with what you tried', 'Only after the deadline', 'Never mention them', 'Send blame first'], answer: 'Early, clearly, with what you tried', difficulty: 'Easy' },
  { topic: 'Leadership', prompt: 'How do you show initiative?', options: ['Spot a need and propose action', 'Wait for every instruction', 'Avoid responsibility', 'Only criticize'], answer: 'Spot a need and propose action', difficulty: 'Hard' },
];

const questionSeed = [
  ...technicalQuestions.map((q, i) => ({ id: `tech-${i}`, type: 'Technical', ...q })),
  ...hrQuestions.map((q, i) => ({ id: `hr-${i}`, type: 'HR', ...q })),
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const STORAGE_KEY = 'prepai-history';
const SESSION_Q_COUNT = 10;
const PER_Q_SECONDS = 60;

// ─── Styles ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0B1437; --bg2: #0E1842; --bg3: #111D4A; --bg4: #162154;
    --border: rgba(255,255,255,0.08); --border2: rgba(255,255,255,0.14);
    --text: #E8F0FF; --text2: #8FA8D8; --text3: #5A7AB8;
    --green: #00D48A; --amber: #F59E0B; --red: #EF4444;
    --purple: #8B5CF6; --blue: #2451B7; --accent: #00F5A0;
    --radius: 10px; --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  [data-theme="light"] {
    --bg: #F0F4FF; --bg2: #E4ECFF; --bg3: #D8E4FF; --bg4: #CCd6FF;
    --border: rgba(0,0,0,0.1); --border2: rgba(0,0,0,0.16);
    --text: #0B1437; --text2: #2451B7; --text3: #5A7AB8;
  }

  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }

  /* ── App Shell ── */
  .app { min-height: 100vh; background: var(--bg); }
  .screen { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }

  /* ── Topbar ── */
  .topbar {
    background: var(--bg2); border-bottom: 1px solid var(--border);
    padding: 0 20px; height: 52px; display: flex; align-items: center;
    justify-content: space-between; position: sticky; top: 0; z-index: 10;
  }
  .brand { font-size: 14px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .timer-block { text-align: center; }
  .timer-val { font-size: 18px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .timer-val.urgent { color: var(--amber); animation: urgentPulse 1s ease-in-out infinite; }
  .timer-val.ended { color: var(--red); }
  @keyframes urgentPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .timer-label { font-size: 10px; color: var(--text3); }
  .live-badge {
    background: rgba(0,245,160,0.1); border: 1px solid rgba(0,245,160,0.3);
    border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600;
    color: var(--accent); display: flex; align-items: center; gap: 5px;
  }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s infinite; }
  .icon-btn {
    background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px;
    padding: 6px 10px; color: var(--text2); cursor: pointer; font-size: 16px;
    transition: background 0.2s;
  }
  .icon-btn:hover { background: var(--bg4); }

  /* ── Progress ── */
  .progress-wrap { height: 4px; background: var(--bg3); position: relative; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--purple)); transition: width 0.4s ease; }
  .progress-label { position: absolute; right: 12px; top: 6px; font-size: 11px; color: var(--text3); font-variant-numeric: tabular-nums; }

  /* ── Q-timer bar ── */
  .q-timer-bar { height: 3px; background: var(--bg3); }
  .q-timer-fill { height: 100%; background: var(--green); transition: width 0.25s linear; }
  .q-timer-fill.warn { background: var(--amber); }
  .q-timer-fill.danger { background: var(--red); }

  /* ── Body layout ── */
  .body { display: flex; gap: 0; flex: 1; overflow: hidden; }

  /* ── Left Panel ── */
  .left-panel { width: 200px; min-width: 180px; background: var(--bg2); border-right: 1px solid var(--border); padding: 16px 12px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
  .panel-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: var(--text3); text-transform: uppercase; margin-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat-box { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px; text-align: center; }
  .stat-val { font-size: 20px; font-weight: 700; }
  .stat-lbl { font-size: 10px; color: var(--text3); margin-top: 2px; }
  .skill-row { display: flex; align-items: center; gap: 6px; }
  .skill-name { font-size: 11px; color: var(--text2); width: 70px; flex-shrink: 0; }
  .skill-bar { flex: 1; height: 4px; background: var(--bg4); border-radius: 4px; overflow: hidden; }
  .skill-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .skill-pct { font-size: 11px; color: var(--text3); width: 28px; text-align: right; }

  /* ── Category Filter ── */
  .filter-row { display: flex; gap: 4px; flex-wrap: wrap; }
  .filter-chip {
    padding: 3px 8px; border-radius: 20px; border: 1px solid var(--border2);
    background: transparent; color: var(--text2); font-size: 11px; cursor: pointer; transition: all 0.2s;
  }
  .filter-chip.active { background: var(--accent); color: #0B1437; border-color: var(--accent); font-weight: 600; }
  .diff-chip {
    padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;
    background: var(--bg4); color: var(--text3); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
  }
  .diff-chip.Easy.active { background: rgba(0,212,138,0.2); color: var(--green); border-color: var(--green); }
  .diff-chip.Medium.active { background: rgba(245,158,11,0.2); color: var(--amber); border-color: var(--amber); }
  .diff-chip.Hard.active { background: rgba(239,68,68,0.2); color: var(--red); border-color: var(--red); }

  /* ── Main Panel ── */
  .main-panel { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }

  /* ── Q Card ── */
  .q-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
  .q-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .q-num { font-size: 11px; font-weight: 600; color: var(--text3); }
  .q-badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .q-badge.Technical { background: rgba(36,81,183,0.25); color: #7BAAFF; }
  .q-badge.HR { background: rgba(245,158,11,0.2); color: var(--amber); }
  .q-badge.Easy { background: rgba(0,212,138,0.15); color: var(--green); }
  .q-badge.Medium { background: rgba(245,158,11,0.15); color: var(--amber); }
  .q-badge.Hard { background: rgba(239,68,68,0.15); color: var(--red); }
  .q-topic { font-size: 11px; color: var(--text3); background: var(--bg3); padding: 2px 8px; border-radius: 4px; }
  .q-text { font-size: 16px; font-weight: 500; line-height: 1.5; color: var(--text); }

  /* ── Q-timer countdown ── */
  .q-countdown { display: flex; align-items: center; gap: 8px; }
  .q-countdown-val { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .q-countdown-lbl { font-size: 11px; color: var(--text3); }

  /* ── Options ── */
  .options-wrap { display: flex; flex-direction: column; gap: 8px; }
  .option-btn {
    background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px;
    padding: 12px 16px; text-align: left; color: var(--text); font-size: 14px;
    cursor: pointer; transition: all 0.18s; width: 100%;
  }
  .option-btn:hover:not(:disabled) { background: var(--bg4); border-color: rgba(255,255,255,0.25); }
  .option-btn.selected { border-color: var(--accent); background: rgba(0,245,160,0.08); }
  .option-btn.correct { border-color: var(--green); background: rgba(0,212,138,0.15); color: var(--green); font-weight: 600; }
  .option-btn.wrong { border-color: var(--red); background: rgba(239,68,68,0.12); color: var(--red); }
  .option-btn:disabled { cursor: default; }

  /* ── Feedback ── */
  .feedback-box { padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; }
  .feedback-box.correct { background: rgba(0,212,138,0.12); border: 1px solid rgba(0,212,138,0.3); color: var(--green); }
  .feedback-box.wrong { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--red); }

  /* ── Actions ── */
  .action-row { display: flex; gap: 10px; }
  .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s; }
  .btn-skip { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); }
  .btn-skip:hover { background: var(--bg4); }
  .btn-bookmark { background: var(--bg3); border: 1px solid var(--border2); color: var(--amber); font-size: 16px; padding: 10px 14px; }
  .btn-bookmark.bookmarked { background: rgba(245,158,11,0.15); border-color: var(--amber); }
  .btn-submit { background: var(--accent); color: #0B1437; flex: 1; }
  .btn-submit:hover:not(:disabled) { opacity: 0.9; }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Right Panel ── */
  .right-panel { width: 220px; min-width: 200px; background: var(--bg2); border-left: 1px solid var(--border); padding: 16px 12px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
  .ai-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.2s infinite; }
  .ai-title { font-size: 12px; font-weight: 600; color: var(--accent); }
  .ai-box { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .ai-text { font-size: 13px; color: var(--text2); line-height: 1.6; min-height: 60px; }
  .ai-loading { display: flex; gap: 4px; align-items: center; }
  .ai-dot-loading { width: 5px; height: 5px; border-radius: 50%; background: var(--text3); animation: dotBounce 1.2s infinite; }
  .ai-dot-loading:nth-child(2) { animation-delay: 0.2s; }
  .ai-dot-loading:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dotBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
  .hint-row { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; }
  .hint-bullet { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); margin-top: 6px; flex-shrink: 0; }
  .hint-txt { font-size: 12px; color: var(--text2); line-height: 1.5; }
  .keyword-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 10px; }
  .kw { padding: 2px 7px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); border-radius: 20px; font-size: 11px; color: var(--purple); }
  .conf-meter { text-align: center; background: var(--bg3); border-radius: 8px; padding: 12px; }
  .conf-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .conf-val { font-size: 32px; font-weight: 700; color: var(--accent); }
  .conf-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

  /* ── Summary ── */
  .summary-panel { max-width: 560px; margin: 40px auto; background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .summary-header { padding: 28px 28px 0; }
  .summary-header p { font-size: 13px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
  .summary-header h2 { font-size: 24px; font-weight: 700; margin-top: 4px; }
  .summary-score { text-align: center; padding: 24px; }
  .summary-score span { font-size: 64px; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .summary-score p { font-size: 14px; color: var(--text3); margin-top: 4px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); }
  .summary-item { background: var(--bg2); padding: 14px; text-align: center; }
  .summary-item strong { display: block; font-size: 20px; font-weight: 700; }
  .summary-item span { font-size: 11px; color: var(--text3); }
  .summary-actions { padding: 20px 28px; display: flex; gap: 10px; }
  .btn-primary { background: var(--accent); color: #0B1437; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; }
  .btn-secondary { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-secondary:hover { background: var(--bg4); }

  /* ── Review Screen ── */
  .review-panel { max-width: 680px; margin: 0 auto; padding: 24px 20px; }
  .review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .review-header h2 { font-size: 20px; font-weight: 700; }
  .review-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 10px; }
  .review-card .q-meta { margin-bottom: 8px; }
  .review-q { font-size: 15px; font-weight: 500; margin-bottom: 10px; }
  .review-options { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .review-opt { padding: 8px 12px; border-radius: 6px; font-size: 13px; background: var(--bg3); border: 1px solid var(--border); }
  .review-opt.user-correct { background: rgba(0,212,138,0.15); border-color: var(--green); color: var(--green); font-weight: 600; }
  .review-opt.user-wrong { background: rgba(239,68,68,0.1); border-color: var(--red); color: var(--red); }
  .review-opt.correct-ans { background: rgba(0,212,138,0.1); border-color: rgba(0,212,138,0.4); }
  .review-skipped { font-size: 13px; color: var(--amber); margin-top: 8px; }
  .review-ai { margin-top: 10px; font-size: 13px; color: var(--text2); background: var(--bg3); border-radius: 6px; padding: 10px; line-height: 1.5; }

  /* ── History Screen ── */
  .history-panel { max-width: 600px; margin: 0 auto; padding: 24px 20px; }
  .history-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .history-header h2 { font-size: 20px; font-weight: 700; }
  .history-empty { text-align: center; padding: 48px 20px; color: var(--text3); }
  .history-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
  .history-date { font-size: 12px; color: var(--text3); }
  .history-score { font-size: 24px; font-weight: 700; }
  .history-score.high { color: var(--green); }
  .history-score.mid { color: var(--amber); }
  .history-score.low { color: var(--red); }
  .history-meta { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .history-clear { background: transparent; border: 1px solid rgba(239,68,68,0.4); color: var(--red); padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; }
  .history-clear:hover { background: rgba(239,68,68,0.1); }

  /* ── Setup Screen ── */
  .setup-panel { max-width: 480px; margin: 60px auto; padding: 0 20px; }
  .setup-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 32px; }
  .setup-card h2 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .setup-card p { font-size: 14px; color: var(--text3); margin-bottom: 24px; }
  .setup-section { margin-bottom: 20px; }
  .setup-label { font-size: 12px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip {
    padding: 7px 14px; border-radius: 20px; border: 1px solid var(--border2);
    background: var(--bg3); color: var(--text2); font-size: 13px; cursor: pointer; transition: all 0.18s;
  }
  .chip.active { background: var(--accent); color: #0B1437; border-color: var(--accent); font-weight: 600; }
  .setup-start { width: 100%; padding: 14px; background: var(--accent); color: #0B1437; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
  .setup-start:hover { opacity: 0.9; }
`;

// ─── AI Coach hook ────────────────────────────────────────────────────────────
function useAICoach(question, feedback) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const fetchHint = useCallback(async (q, fb) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setHint('');
    const prompt = fb
      ? `Interview question: "${q.question}". The user answered ${fb.isCorrect ? 'correctly' : 'incorrectly'}. Correct answer: "${q.answer}". Give a 2-sentence explanation of why this is correct and a key concept to remember. Be concise and encouraging.`
      : `Interview question: "${q.question}" (${q.type}, ${q.topic}, ${q.difficulty}). Give a 2-sentence coaching hint without revealing the answer. Focus on how to think about it.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: abortRef.current.signal
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || 'Think carefully and use process of elimination.';
      setHint(text);
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

// ─── Session Hook ─────────────────────────────────────────────────────────────
function useSession(config) {
  const filtered = questionSeed.filter(q => {
    const catOk = config.categories.includes('All') || config.categories.includes(q.type);
    const diffOk = config.difficulties.includes('All') || config.difficulties.includes(q.difficulty);
    return catOk && diffOk;
  });
  const pool = shuffle(filtered.length >= SESSION_Q_COUNT ? filtered : questionSeed);
  const [questions] = useState(() => pool.slice(0, SESSION_Q_COUNT));
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

  const q = questions[qIndex];
  const totalQ = questions.length;

  // Per-question countdown
  useEffect(() => {
    if (isFinished || feedback) return;
    setQSecondsLeft(PER_Q_SECONDS);
    const endTime = Date.now() + PER_Q_SECONDS * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setQSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        // auto-skip on timeout
        setSkipped(s => s + 1);
        setHistory(h => [...h, { qId: q.id, question: q, userAnswer: null, skipped: true }]);
        if (qIndex >= totalQ - 1) setIsFinished(true);
        else { setQIndex(i => i + 1); setSelected(''); setFeedback(null); }
      }
    }, 250);
    return () => clearInterval(id);
  }, [qIndex, isFinished, feedback]);

  const skip = () => {
    if (isFinished) return;
    setSkipped(s => s + 1);
    setHistory(h => [...h, { qId: q.id, question: q, userAnswer: null, skipped: true }]);
    if (qIndex >= totalQ - 1) { setIsFinished(true); return; }
    setQIndex(i => i + 1); setSelected(''); setFeedback(null);
  };

  const submit = () => {
    if (isFinished) return;
    if (feedback) {
      if (qIndex >= totalQ - 1) { setIsFinished(true); return; }
      setQIndex(i => i + 1); setSelected(''); setFeedback(null); return;
    }
    const isCorrect = selected === q.answer;
    setAnswered(a => a + 1);
    if (isCorrect) setCorrect(c => c + 1);
    const fb = { isCorrect, message: isCorrect ? '✓ Correct! Nice work.' : `✗ Incorrect. Correct: ${q.answer}` };
    setFeedback(fb);
    setHistory(h => [...h, { qId: q.id, question: q, userAnswer: selected, skipped: false, isCorrect, aiExplanation: '' }]);
  };

  const toggleBookmark = (id) => {
    setBookmarks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id]);
  };

  return {
    questions, q, qIndex, totalQ, selected, setSelected,
    feedback, answered, skipped, correct, isFinished,
    qSecondsLeft, bookmarks, toggleBookmark, history,
    wrong: Math.max(0, answered - correct),
    score: totalQ === 0 ? 0 : Math.round((correct / totalQ) * 100),
    avgScore: answered === 0 ? 0 : Math.round((correct / answered) * 100),
    remaining: Math.max(0, totalQ - qIndex - 1),
    progress: isFinished ? 100 : ((qIndex + 1) / totalQ) * 100,
    skip, submit
  };
}

// ─── Components ───────────────────────────────────────────────────────────────
function TopBar({ qSecondsLeft, onTheme, onHistory, theme }) {
  const pct = qSecondsLeft / PER_Q_SECONDS;
  const cls = pct <= 0.15 ? 'timer-val ended' : pct <= 0.33 ? 'timer-val urgent' : 'timer-val';
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-dot" />
        PrepAI
      </div>
      <div className="topbar-right">
        <div className="timer-block">
          <div className={cls}>{formatTime(qSecondsLeft)}</div>
          <div className="timer-label">per question</div>
        </div>
        <div className="live-badge"><div className="live-dot" />LIVE</div>
        <button className="icon-btn" onClick={onHistory} title="History">📊</button>
        <button className="icon-btn" onClick={onTheme} title="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
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

function LeftPanel({ answered, skipped, avgScore, remaining, categories, difficulties, onCategory, onDifficulty }) {
  const cats = ['All', 'Technical', 'HR'];
  const diffs = ['All', 'Easy', 'Medium', 'Hard'];
  return (
    <div className="left-panel">
      <div>
        <div className="panel-label">Session Stats</div>
        <div className="stat-grid">
          <div className="stat-box"><div className="stat-val" style={{ color: '#00D48A' }}>{answered}</div><div className="stat-lbl">Answered</div></div>
          <div className="stat-box"><div className="stat-val" style={{ color: '#F59E0B' }}>{skipped}</div><div className="stat-lbl">Skipped</div></div>
          <div className="stat-box"><div className="stat-val">{avgScore}%</div><div className="stat-lbl">Avg Score</div></div>
          <div className="stat-box"><div className="stat-val" style={{ color: '#8B5CF6' }}>{remaining}</div><div className="stat-lbl">Left</div></div>
        </div>
      </div>
      <div>
        <div className="panel-label">Category</div>
        <div className="filter-row">
          {cats.map(c => (
            <button key={c} className={`filter-chip ${categories.includes(c) ? 'active' : ''}`} onClick={() => onCategory(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="panel-label">Difficulty</div>
        <div className="filter-row">
          {diffs.map(d => (
            <button key={d} className={`diff-chip ${d} ${difficulties.includes(d) ? 'active' : ''}`} onClick={() => onDifficulty(d)}>{d}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainPanel({ session }) {
  const { q, qIndex, selected, setSelected, feedback, qSecondsLeft, bookmarks, toggleBookmark, skip, submit } = session;
  return (
    <div className="main-panel">
      <div className="q-card">
        <div className="q-meta">
          <span className="q-num">Q{qIndex + 1}</span>
          <span className={`q-badge ${q.type}`}>{q.type}</span>
          <span className={`q-badge ${q.difficulty}`}>{q.difficulty}</span>
          <span className="q-topic">{q.topic}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: qSecondsLeft <= 10 ? '#EF4444' : '#5A7AB8', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
            {qSecondsLeft}s
          </span>
        </div>
        <div className="q-text">{q.question}</div>
      </div>

      <div className="options-wrap">
        {q.options.map(opt => {
          const isSel = selected === opt;
          const isCorrect = feedback && opt === q.answer;
          const isWrong = feedback && isSel && opt !== q.answer;
          return (
            <button
              key={opt}
              className={`option-btn ${isSel ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => !feedback && setSelected(opt)}
              disabled={!!feedback}
            >{opt}</button>
          );
        })}
      </div>

      {feedback && (
        <div className={`feedback-box ${feedback.isCorrect ? 'correct' : 'wrong'}`}>{feedback.message}</div>
      )}

      <div className="action-row">
        <button className="btn btn-skip" onClick={skip}>Skip</button>
        <button
          className={`btn btn-bookmark ${bookmarks.includes(q.id) ? 'bookmarked' : ''}`}
          onClick={() => toggleBookmark(q.id)}
          title="Bookmark"
        >{bookmarks.includes(q.id) ? '★' : '☆'}</button>
        <button className="btn btn-submit" onClick={submit} disabled={!selected && !feedback}>
          {feedback ? 'Next →' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

function RightPanel({ question, feedback }) {
  const { hint, loading } = useAICoach(question, feedback);
  const score = feedback ? (feedback.isCorrect ? 85 : 42) : 74;
  const trend = feedback ? (feedback.isCorrect ? 'up ↑' : 'down ↓') : 'stable';
  return (
    <div className="right-panel">
      <div>
        <div className="ai-header">
          <div className="ai-dot" />
          <div className="ai-title">AI Coach — Live</div>
        </div>
        <div className="ai-box">
          {loading ? (
            <div className="ai-loading">
              <div className="ai-dot-loading" /><div className="ai-dot-loading" /><div className="ai-dot-loading" />
            </div>
          ) : (
            <div className="ai-text">{hint || 'Think through each option methodically.'}</div>
          )}
        </div>
        <div className="keyword-row">
          <div className="kw">{question.type}</div>
          <div className="kw">{question.topic}</div>
          <div className="kw">{question.difficulty}</div>
        </div>
      </div>
      <div className="conf-meter">
        <div className="conf-lbl">AI Confidence Score</div>
        <div className="conf-val">{score}</div>
        <div className="conf-sub">Trending {trend}</div>
      </div>
    </div>
  );
}

function SummaryScreen({ session, onRestart, onReview }) {
  const { questions, totalQ, answered, skipped, correct, wrong, score } = session;
  const saveHistory = () => {
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      prev.unshift({ date: new Date().toISOString(), score, totalQ, correct, wrong, skipped });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(0, 20)));
    } catch {}
  };
  useEffect(() => { saveHistory(); }, []);

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <p>Session Complete</p>
        <h2>Your Interview Result</h2>
      </div>
      <div className="summary-score">
        <span>{score}%</span>
        <p>Final Score</p>
      </div>
      <div className="summary-grid">
        <div className="summary-item"><strong>{totalQ}</strong><span>Total Qs</span></div>
        <div className="summary-item"><strong style={{ color: '#00D48A' }}>{correct}</strong><span>Correct</span></div>
        <div className="summary-item"><strong style={{ color: '#EF4444' }}>{wrong}</strong><span>Wrong</span></div>
        <div className="summary-item"><strong>{answered}</strong><span>Answered</span></div>
        <div className="summary-item"><strong style={{ color: '#F59E0B' }}>{skipped}</strong><span>Skipped</span></div>
        <div className="summary-item"><strong style={{ color: score >= 70 ? '#00D48A' : '#EF4444' }}>{score >= 70 ? '👍' : '📚'}</strong><span>{score >= 70 ? 'Great job!' : 'Keep going'}</span></div>
      </div>
      <div className="summary-actions">
        <button className="btn-secondary" onClick={onReview}>📋 Review</button>
        <button className="btn-primary" onClick={onRestart}>▶ New Session</button>
      </div>
    </div>
  );
}

function ReviewScreen({ history, onBack }) {
  return (
    <div className="review-panel">
      <div className="review-header">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2>Question Review</h2>
      </div>
      {history.map((item, i) => (
        <div className="review-card" key={i}>
          <div className="q-meta">
            <span className="q-num">Q{i + 1}</span>
            <span className={`q-badge ${item.question.type}`}>{item.question.type}</span>
            <span className={`q-badge ${item.question.difficulty}`}>{item.question.difficulty}</span>
            <span className="q-topic">{item.question.topic}</span>
            {item.skipped && <span style={{ marginLeft: 'auto', color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>SKIPPED</span>}
            {!item.skipped && (item.isCorrect
              ? <span style={{ marginLeft: 'auto', color: '#00D48A', fontSize: 13 }}>✓</span>
              : <span style={{ marginLeft: 'auto', color: '#EF4444', fontSize: 13 }}>✗</span>)}
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
          {item.skipped && <div className="review-skipped">⚠ Time ran out or question was skipped.</div>}
        </div>
      ))}
    </div>
  );
}

function HistoryScreen({ onBack }) {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    try { setRecords(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch {}
  }, []);
  const clear = () => { localStorage.removeItem(STORAGE_KEY); setRecords([]); };
  return (
    <div className="history-panel">
      <div className="history-header">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2>Session History</h2>
        {records.length > 0 && <button className="history-clear" onClick={clear}>Clear All</button>}
      </div>
      {records.length === 0 ? (
        <div className="history-empty">No sessions yet. Complete a session to see history here.</div>
      ) : records.map((r, i) => {
        const d = new Date(r.date);
        const scoreClass = r.score >= 70 ? 'high' : r.score >= 40 ? 'mid' : 'low';
        return (
          <div className="history-card" key={i}>
            <div>
              <div className="history-date">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="history-meta">{r.totalQ} questions · {r.correct} correct · {r.skipped} skipped</div>
            </div>
            <div>
              <div className={`history-score ${scoreClass}`}>{r.score}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SetupScreen({ onStart }) {
  const [cats, setCats] = useState(['All']);
  const [diffs, setDiffs] = useState(['All']);
  const toggleCat = (c) => {
    if (c === 'All') { setCats(['All']); return; }
    const next = cats.filter(x => x !== 'All');
    setCats(next.includes(c) ? next.filter(x => x !== c) || ['All'] : [...next, c]);
  };
  const toggleDiff = (d) => {
    if (d === 'All') { setDiffs(['All']); return; }
    const next = diffs.filter(x => x !== 'All');
    setDiffs(next.includes(d) ? next.filter(x => x !== d) || ['All'] : [...next, d]);
  };
  return (
    <div className="setup-panel">
      <div className="setup-card">
        <h2>🎯 Start Interview Session</h2>
        <p>Configure your practice session and get AI-powered coaching.</p>
        <div className="setup-section">
          <div className="setup-label">Question Category</div>
          <div className="chip-row">
            {['All', 'Technical', 'HR'].map(c => (
              <button key={c} className={`chip ${cats.includes(c) ? 'active' : ''}`} onClick={() => toggleCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="setup-section">
          <div className="setup-label">Difficulty Level</div>
          <div className="chip-row">
            {['All', 'Easy', 'Medium', 'Hard'].map(d => (
              <button key={d} className={`chip ${diffs.includes(d) ? 'active' : ''}`} onClick={() => toggleDiff(d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="setup-section">
          <div style={{ fontSize: 13, color: 'var(--text3)', background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.6 }}>
            📋 {SESSION_Q_COUNT} questions · ⏱ {PER_Q_SECONDS}s per question · 🤖 Live AI coaching
          </div>
        </div>
        <button className="setup-start" onClick={() => onStart({ categories: cats, difficulties: diffs })}>
          Start Session →
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('setup'); // setup | session | summary | review | history
  const [config, setConfig] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [categories, setCategories] = useState(['All']);
  const [difficulties, setDifficulties] = useState(['All']);
  const [savedHistory, setSavedHistory] = useState([]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleStart = (cfg) => {
    setConfig(cfg);
    setCategories(cfg.categories);
    setDifficulties(cfg.difficulties);
    setView('session');
    setSessionKey(k => k + 1);
  };

  const session = config ? useSession(config) : null;

  const handleRestart = () => setView('setup');
  const handleReview = () => setView('review');

  // Update live filters
  const onCategory = (c) => {
    let next;
    if (c === 'All') { next = ['All']; }
    else { const f = categories.filter(x => x !== 'All'); next = f.includes(c) ? f.filter(x => x !== c) : [...f, c]; if (!next.length) next = ['All']; }
    setCategories(next);
  };
  const onDifficulty = (d) => {
    let next;
    if (d === 'All') { next = ['All']; }
    else { const f = difficulties.filter(x => x !== 'All'); next = f.includes(d) ? f.filter(x => x !== d) : [...f, d]; if (!next.length) next = ['All']; }
    setDifficulties(next);
  };

  return (
    <div className="app" data-theme={theme}>
      <style>{css}</style>
      {view === 'setup' && <SetupScreen onStart={handleStart} />}
      {view === 'history' && <HistoryScreen onBack={() => setView('setup')} />}
      {view === 'review' && session && <ReviewScreen history={session.history} onBack={() => setView('summary')} />}
      {view === 'summary' && session && (
        <SummaryScreen session={session} onRestart={handleRestart} onReview={handleReview} />
      )}
      {view === 'session' && session && (
        <>
          {session.isFinished && !view.startsWith('summary') ? (
            (() => { setTimeout(() => setView('summary'), 0); return null; })()
          ) : null}
          <div className="screen">
            <TopBar
              qSecondsLeft={session.qSecondsLeft}
              theme={theme}
              onTheme={toggleTheme}
              onHistory={() => setView('history')}
            />
            <QTimerBar secondsLeft={session.qSecondsLeft} />
            <ProgressBar progress={session.progress} qIndex={session.qIndex} totalQ={session.totalQ} />
            {session.isFinished ? (
              (() => { setView('summary'); return null; })()
            ) : (
              <div className="body">
                <LeftPanel
                  answered={session.answered}
                  skipped={session.skipped}
                  avgScore={session.avgScore}
                  remaining={session.remaining}
                  categories={categories}
                  difficulties={difficulties}
                  onCategory={onCategory}
                  onDifficulty={onDifficulty}
                />
                <MainPanel session={session} />
                <RightPanel question={session.q} feedback={session.feedback} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}