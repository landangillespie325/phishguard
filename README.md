# PhishGuard — Private AI Security Analyzer

Hackathon MVP for Google's #BuildHybridAI 2026. An educational phishing-warning-sign analyzer built with React, Firebase AI Logic, and Gemini Nano (Chrome desktop on-device inference).

## What works

- Paste a suspicious email or SMS; run a local rule-based indicator scan, even before Firebase is configured.
- See matched warning signs, an **illustrative heuristic score**, and safe next steps.
- Select **On-device only** for Firebase AI Logic `ONLY_ON_DEVICE` mode (never auto-falls back to cloud) or manually opt into `ONLY_IN_CLOUD` mode.
- Trigger `initializeDeviceModel()` from a user click before `generateContent()`; display `inferenceSource` when returned.

**Limitations:** Rule-based findings do not verify sender identity, link destinations, or phishing verdicts. This does NOT connect to email inboxes, open links, query live threat feeds, or store scanned messages. AI can make mistakes. The UI is not a finished security product.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and populate your **Firebase web app config** from Firebase Console > Project settings. The Firebase web config is not a server secret. Never commit sensitive tokens.
3. Firebase Console: create a new project, register a **Web app**, go to **AI Services > AI Logic** and enable **Gemini Developer API**.
4. Firebase Console: Security > App Check, ensure AI Logic is **enforced**. For local testing, set `VITE_USE_APPCHECK_DEBUG=true` only in `.env.local`, start app, copy printed debug token from browser console, and add it under App Check > Manage debug tokens. NEVER publish a debug token. For production, configure a real App Check provider and replace the development-only setup in `src/firebase.ts`.
5. On Chrome desktop v139+, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart Chrome, visit developer console and run `await LanguageModel.availability()`; if downloadable, run `await LanguageModel.create()` to start download. Check compatibility and available disk space.
6. Run `npm run dev` and open localhost link. Click **Scan message** for rule-only detection or **Explain with AI** to invoke Firebase AI Logic.
7. For production deployment, implement a production App Check provider and test hostname/allowed domains before offering cloud AI publicly.

## Architecture

- `src/analysis.ts`: deterministic pattern matching, entirely in browser.
- `src/firebase.ts`: Firebase init, App Check debug setup, Firebase AI Logic model, strict inference mode.
- `src/main.tsx`: React UI and actions. The UI never silently sends content to a cloud model.

## Test cases

- Suspicious: `Urgent! Verify your password and code at https://example.invalid now or account suspended within 24 hours.` Should show multiple warning signs.
- Benign: `Our team meeting moved to 3pm. See you tomorrow.` Should show no predefined warning signs, not claim the message is safe.
- AI mode with unsupported Chrome: on-device-only request should error, not silently send message to cloud.
- AI cloud mode: requires explicit selection, valid Firebase configuration, authorized App Check and accessible backend.

## Hackathon next steps

- Verify `npm run build` after dependency install.
- Add safe, synthetic sample suite and unit tests.
- Add stronger URL parsing (Unicode homographs, domains), safe explanations, and AI consistency tests.
- Configure production App Check, Firebase Hosting, and a public tester-friendly demo.
- Provide demo video under 3 minutes, public repository, open-source license, project description, and testing instructions.

Official docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
