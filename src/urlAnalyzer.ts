/** Offline-only URL inspection. Never fetches, resolves, or visits a URL. */
export type UrlRisk = 'low' | 'review' | 'high';
export type UrlFinding = {
  raw: string;
  hostname: string;
  indicators: string[];
  riskLevel: UrlRisk;
};

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly', 'tiny.cc', 'ow.ly', 'buff.ly', 'rebrand.ly']);
const ACCOUNT_WORDS = /(?:login|signin|sign-in|secure|verify|account|billing|support|update|password|wallet)/i;
const COMMON_TLDS = /\.(?:com|org|net|edu|gov|io|co|app|bank)$/i;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function extractUrls(text: string): string[] {
  // Require an explicit http(s) scheme or www. to reduce false positives.
  const candidates = text.match(/(?:https?:\/\/|www\.)[^\s<>"'`]+/gi) ?? [];
  return [...new Set(candidates.map(v => v.replace(/[),.;!?\]}]+$/g, '')))].filter(Boolean).slice(0, 25);
}

export function analyzeUrls(text: string): UrlFinding[] {
  return extractUrls(text).map(raw => {
    const indicators: string[] = [];
    let hostname = 'Invalid or unparseable URL';
    try {
      const parsed = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
      hostname = parsed.hostname.toLowerCase();
      if (parsed.protocol === 'http:') indicators.push('Unencrypted HTTP link');
      if (parsed.username || parsed.password || raw.includes('@')) indicators.push('URL contains user-info or @ character');
      if (IPV4.test(hostname) || (hostname.startsWith('[') && hostname.endsWith(']'))) indicators.push('Uses an IP address instead of a named domain');
      if (hostname.includes('xn--')) indicators.push('Internationalized (punycode) hostname: inspect carefully');
      if (SHORTENERS.has(hostname) || [...SHORTENERS].some(short => hostname.endsWith(`.${short}`))) indicators.push('URL shortener hides the final destination');
      if (hostname.split('.').length >= 5) indicators.push('Unusually many subdomains');
      const labels = hostname.split('.');
      if (labels.length >= 3 && ACCOUNT_WORDS.test(labels.slice(0, -2).join('.'))) indicators.push('Account/security wording appears in a subdomain');
      // Detect constructions like paypal.com.attacker.example, not claims about ownership.
      if (/(?:\.(?:com|org|net|gov|edu))\./i.test(hostname)) indicators.push('A familiar-looking domain suffix appears inside a longer hostname');
      if (parsed.port && !['80', '443'].includes(parsed.port)) indicators.push('Uses a nonstandard URL port');
      if (parsed.search.length > 180) indicators.push('Unusually long URL query string');
      if (!COMMON_TLDS.test(hostname) && hostname.split('.').length < 2 && !IPV4.test(hostname)) indicators.push('Hostname is not a normal public domain');
    } catch {
      indicators.push('URL cannot be parsed reliably');
    }
    const severe = indicators.some(s => /IP address|user-info|punycode|longer hostname|cannot be parsed/i.test(s));
    const riskLevel: UrlRisk = severe || indicators.length >= 3 ? 'high' : indicators.length ? 'review' : 'low';
    return { raw, hostname, indicators, riskLevel };
  });
}
