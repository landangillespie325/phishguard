import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, ShieldAlert, ScanSearch, LockKeyhole, Cloud, AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, CircleHelp, Fingerprint } from 'lucide-react';
import { configured, explainThreat, type PrivacyMode } from './firebase';
import { scanMessage, type Scan } from './analysis';
import './style.css';

const example = `URGENT: Your account will be suspended within 24 hours. Verify your account immediately at https://secure-account-verify.example/login and enter your password and verification code to avoid losing access.`;
function App() {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<PrivacyMode>('local');
  const [scan, setScan] = useState<Scan | null>(null);
  const [ai, setAi] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function runScan() {
    if (!message.trim()) return;
    setScan(scanMessage(message)); setAi(''); setSource(''); setError('');
  }
  async function runAi() {
    if (!message.trim() || busy) return;
    setBusy(true); setError(''); setAi(''); setSource('');
    const current = scanMessage(message);
    setScan(current);
    try {
      const output = await explainThreat(message, current.findings.map(f => f.label), mode);
      setAi(output.explanation); setSource(output.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Check Firebase, App Check, and device capabilities.');
    } finally { setBusy(false); }
  }
  const reset = () => { setMessage(''); setScan(null); setAi(''); setSource(''); setError(''); };
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><ShieldCheck size={22}/></div><span>Phish<span className="accent">Guard</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav active"><ScanSearch size={18}/> Message analyzer</div>
      <div className="side-label mt">PRIVACY FIRST</div>
      <div className="side-note"><LockKeyhole size={19}/><span>Messages stay in this browser during rule-based scanning. AI transmission depends on your selected mode.</span></div>
      <div className="side-bottom">#BuildHybridAI 2026<br/><span>Hackathon prototype · v0.1</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="breadcrumb">Workspace</span><span className="slash"> / </span>Message analyzer</div><span className="top-tag"><ShieldCheck size={14}/> Privacy-aware</span></header>
      <div className="content">
        <div className="eyebrow"><span className="dot"/> PRIVATE AI THREAT ANALYSIS</div>
        <h1>Analyze suspicious<br/><span className="accent">messages with confidence.</span></h1>
        <p className="intro">Spot phishing warning signs, understand social engineering tactics, and learn what to do next — with on-device AI whenever available.</p>
        <div className="workspace">
          <section className="panel form-panel">
            <div className="panel-title"><div className="section-icon"><ScanSearch size={20}/></div><div><h2>Message scanner</h2><p>Paste a suspicious email or text message below.</p></div></div>
            <div className="textarea-label"><label htmlFor="message">MESSAGE CONTENT</label><span>{message.length.toLocaleString()} characters</span></div>
            <textarea id="message" maxLength={12000} value={message} onChange={e => {setMessage(e.target.value);setScan(null);setAi('');setError('')}} placeholder="Paste a suspicious email, SMS, or message here..."/>
            <div className="helper"><CircleHelp size={15}/> Don't include passwords, security codes, or highly sensitive personal data.</div>
            <div className="settings"><div className="settings-title"><Fingerprint size={17}/> AI privacy mode</div>
              <label className={'option '+(mode==='local'?'selected':'')}><input type="radio" checked={mode==='local'} onChange={()=>setMode('local')}/><LockKeyhole size={17}/><span><strong>On-device only</strong><small>No message content sent to cloud AI. Requires supported Chrome and downloaded model.</small></span></label>
              <label className={'option '+(mode==='cloud'?'selected':'')}><input type="radio" checked={mode==='cloud'} onChange={()=>setMode('cloud')}/><Cloud size={17}/><span><strong>Cloud AI (opt-in)</strong><small>Your message is sent to Firebase AI Logic's cloud model for analysis.</small></span></label>
            </div>
            <div className="actions"><button className="primary" disabled={!message.trim() || busy} onClick={runScan}>Scan message <ArrowRight size={17}/></button><button className="secondary" disabled={!message.trim()||busy} onClick={runAi}>{busy?'Analyzing...':'Explain with AI'}</button><button title="Reset" aria-label="Reset" className="iconbtn" onClick={reset}><RotateCcw size={17}/></button></div>
            <button className="sample" onClick={()=>{setMessage(example);setScan(null);setAi('');setError('')}}>Try a sample phishing message <ArrowRight size={14}/></button>
          </section>
          <section className="panel results-panel">
            <div className="result-head"><div><div className="small-label">ANALYSIS REPORT</div><h2>Security assessment</h2></div><ShieldCheck size={23} className="muted"/></div>
            {!scan ? <div className="empty"><div className="empty-icon"><ShieldCheck size={39}/></div><h3>Ready to analyze</h3><p>Paste a message and run a scan to review potential phishing warning signs.</p></div> : <div className="report">
              <div className={'risk '+scan.level.toLowerCase()}><div><div className="small-label">HEURISTIC RISK INDICATOR</div><strong>{scan.level} concern</strong><p>Rule-based score: {scan.score}/100</p></div><div className="score">{scan.score}<span>/100</span></div></div>
              <div className="score-track"><div style={{width:`${scan.score}%`}}/></div>
              <div className="findings-head"><h3>Detected indicators</h3><span>{scan.findings.length} found</span></div>
              {scan.findings.length ? scan.findings.map((f,i)=><div className="finding" key={i}><AlertTriangle size={17}/><div><strong>{f.label}</strong><p>{f.detail}</p></div></div>) : <div className="clear"><CheckCircle2 size={18}/> No predefined indicators matched. This does not establish that the message is safe.</div>}
              <div className="safe-actions"><strong>Recommended next steps</strong><p>Do not click unknown links or share codes. Verify through a trusted, independently found website or phone number.</p></div>
            </div>}
            {(ai || error || busy) && <div className="ai-report"><div className="ai-head"><Fingerprint size={17}/> AI explanation {source && <span>{source==='ON_DEVICE'?'On-device':'Cloud'}</span>}</div>{busy?<p>Generating a security explanation...</p>:error?<p className="error">{error}</p>:<p>{ai}</p>}</div>}
            <div className="disclaimer"><ShieldAlert size={16}/> Analysis is advisory and cannot guarantee a message's safety or maliciousness.</div>
          </section>
        </div>
        <div className="footer"><span>{configured?'Firebase configured':'Firebase setup required for AI features'} · Local heuristic scanning ready</span><span>PhishGuard · Built for safer decisions</span></div>
      </div>
    </main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
