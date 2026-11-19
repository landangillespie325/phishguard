import { analyzeUrls, type UrlFinding } from './urlAnalyzer';

export type Finding = { label: string; detail: string; weight: number; evidence: string[] };
export type Scan = {
  score: number;
  level: 'Low' | 'Elevated' | 'High';
  findings: Finding[];
  urls: string[];
  urlFindings: UrlFinding[];
};

function matchEvidence(message: string, expression: RegExp): string[] {
  const global = new RegExp(expression.source, expression.flags.includes('g') ? expression.flags : expression.flags + 'g');
  return [...message.matchAll(global)].slice(0, 8).map(match => match[0]);
}

export function scanMessage(message: string): Scan {
  const findings: Finding[] = [];
  const add = (label: string, detail: string, weight: number, evidence: string[]) => {
    if (evidence.length) findings.push({ label, detail, weight, evidence });
  };
  const patterns = {
    urgency: /\b(?:urgent|immediately|within 24 hours|act now|final warning|last chance|suspend(?:ed)?|expires? today)\b/i,
    credentials: /\b(?:password|passcode|verification code|one.time code|otp|login credentials|sign.in details)\b/i,
    payment: /\b(?:gift card|wire transfer|crypto(?:currency)?|bitcoin|send money|payment required|invoice attached)\b/i,
    action: /\b(?:click (?:here|below|the link)|verify (?:your|the) account|confirm your identity|unlock your account)\b/i,
  };
  add('Urgency or pressure', 'Pushes the reader to act quickly before checking the message.', 20, matchEvidence(message, patterns.urgency));
  add('Sensitive account information', 'References passwords, access codes, or account credentials.', 25, matchEvidence(message, patterns.credentials));
  add('Payment request', 'Mentions a financial action that deserves independent verification.', 15, matchEvidence(message, patterns.payment));
  add('Account-action request', 'Requests a link click or account verification.', 20, matchEvidence(message, patterns.action));

  const urlFindings = analyzeUrls(message);
  const urls = urlFindings.map(u => u.raw);
  if (urls.length) findings.push({label:'Embedded link', detail:`${urls.length} URL(s) detected. Links have not been opened or verified.`, weight:10, evidence:urls});
  const risky = urlFindings.filter(u => u.riskLevel !== 'low');
  if (risky.length) findings.push({label:'URL structure warning',detail:`${risky.length} link(s) contain structural features worth checking. This is not a reputation verdict.`,weight:Math.min(25, risky.length * 15), evidence:risky.map(u => u.raw)});

  const score = Math.min(100, findings.reduce((n, f) => n + f.weight, 0));
  const level = score >= 55 ? 'High' : score >= 25 ? 'Elevated' : 'Low';
  return { score, level, findings, urls, urlFindings };
}
