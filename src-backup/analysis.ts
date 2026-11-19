export type Finding = { label: string; detail: string; weight: number };
export type Scan = { score: number; level: 'Low' | 'Elevated' | 'High'; findings: Finding[]; urls: string[] };
export function scanMessage(message: string): Scan {
  const findings: Finding[] = [];
  const add = (label: string, detail: string, weight: number) => findings.push({ label, detail, weight });
  const urls = [...new Set(message.match(/https?:\/\/[^\s<>"']+/gi) || [])].slice(0, 20);
  if (/\b(urgent|immediately|within 24 hours|act now|final warning|last chance|suspend(ed)?|expires? today)\b/i.test(message)) add('Urgency or pressure', 'Pushes the reader to act quickly before checking the message.', 20);
  if (/\b(password|passcode|verification code|one.time code|otp|login credentials|sign.in details)\b/i.test(message)) add('Sensitive account information', 'References passwords, access codes, or account credentials.', 25);
  if (/\b(gift card|wire transfer|crypto(?:currency)?|bitcoin|send money|payment required|invoice attached)\b/i.test(message)) add('Payment request', 'Mentions a financial action that deserves independent verification.', 15);
  if (/\b(click (here|below|the link)|verify (your|the) account|confirm your identity|unlock your account)\b/i.test(message)) add('Account-action request', 'Requests a link click or account verification.', 20);
  if (urls.length > 0) add('Embedded link', `${urls.length} URL(s) detected. Do not open directly from an unverified message.`, 10);
  if (urls.some(u => /xn--|@|\b\d{1,3}(?:\.\d{1,3}){3}\b/i.test(u))) add('Unusual URL structure', 'A link contains an IP address, user-info separator, or punycode.', 25);
  if (/(?:https?:\/\/)?(?:[^\s/]+\.)?(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly)\//i.test(message)) add('Shortened URL', 'A shortened link can conceal the eventual destination.', 15);
  const score = Math.min(100, findings.reduce((n, f) => n + f.weight, 0));
  const level = score >= 55 ? 'High' : score >= 25 ? 'Elevated' : 'Low';
  return { score, level, findings, urls };
}
