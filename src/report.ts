import type { Scan } from './analysis';

export function buildReport(message: string, scan: Scan, explanation: string, source: string): string {
  const sections = [
    '# PhishGuard security assessment',
    `Generated: ${new Date().toLocaleString()}`,
    `Heuristic risk indicator: ${scan.level} concern (${scan.score}/100)` ,
    'This score is a rule-based indicator, NOT a probability that the message is phishing.',
    '',
    '## Detected indicators',
    ...(scan.findings.length ? scan.findings.map(f => `- ${f.label}: ${f.detail}\n  Evidence: ${f.evidence.join(' | ')}`) : ['- No predefined indicators matched. This does not establish safety.']),
    '',
    '## URL structure checks (offline; not reputation checks)',
    ...(scan.urlFindings.length ? scan.urlFindings.flatMap(u => [`- ${u.hostname} (${u.riskLevel})`, `  URL: ${u.raw}`, `  Indicators: ${u.indicators.join('; ') || 'No structural warnings detected'}`]) : ['- No explicit URLs detected']),
    '',
    '## AI explanation',
    explanation || 'Not requested',
    `Inference source: ${source || 'No AI inference run'}`,
    '',
    '## Recommended verification',
    'Do not open unverified links, submit credentials, or send codes. Independently navigate to the official site/app or contact the organization using a trusted phone number.',
    '',
    '## Message analyzed',
    message,
    '',
    'NOTICE: This report may contain private message data. Store and share it carefully. Automated analysis cannot establish that a message is safe or malicious.'
  ];
  return sections.join('\n');
}

export function downloadReport(message: string, scan: Scan, explanation: string, source: string): void {
  const content = buildReport(message, scan, explanation, source);
  const objectUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `phishguard-report-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
