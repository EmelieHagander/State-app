# Mobile Responsiveness Audit — state-app

> **Status:** Architecture decision required before implementation work can begin.  
> **Scope:** Mobile strategy assessment for a Tauri-based desktop application.

---

## 1. Important Context: This Is a Desktop App

State-app is built with **Tauri** — a Rust-powered framework that packages a web frontend into a **native desktop application** (macOS, Windows, Linux).

Evidence:
- `src-tauri/` directory present at repo root
- `vite.config.ts` configured for Tauri integration
- Application window is a native OS window, not a browser tab

This is fundamentally different from aigentforge-insight-hub (a web SaaS app). The mobile strategy is therefore a **product/architecture decision**, not purely a CSS task.

---

## 2. Three Paths to Mobile Support

### Path A — Mobile Web Browser (Recommended if urgency is high)

**What it means:** Deploy the web frontend (the React/Vite part) separately as a standard web app, reachable at a URL in a mobile browser.

**Effort:** Medium  
- The web frontend is already in `src/`
- Needs a separate deployment (Vercel, Netlify, etc.)
- Mobile CSS fixes applied to `src/` — similar work to aigentforge-insight-hub
- Tauri desktop app continues to work unchanged

**Pros:** Fastest path. No native SDK required. Works on any phone with a browser.  
**Cons:** User has two separate surfaces (desktop app + web URL). No native device features (camera, notifications, etc.).

---

### Path B — Native Mobile via Tauri 2.x Mobile (Recommended for best mobile UX)

**What it means:** Use Tauri's official mobile target support (added in Tauri 2.0) to compile a native iOS and Android app from the same codebase.

**Effort:** High  
- Upgrade to Tauri 2.x if not already there
- Run `tauri android init` and `tauri ios init`
- Configure mobile permissions (file access, notifications, etc.) in `tauri.conf.json`
- Apply responsive CSS fixes to `src/` (same as Path A)
- Set up mobile build pipelines (Xcode for iOS, Android Studio for Android)
- Submit to App Store / Google Play

**Pros:** True native app experience. Access to device APIs.  
**Cons:** Significant infrastructure investment. App store review processes. Separate deployment pipeline.

---

### Path C — Responsive Desktop App Only (Status Quo)

**What it means:** The app remains desktop-only. No mobile support is added. The web views may be made responsive for small desktop windows but phones are not targeted.

**Effort:** None  

**Pros:** No development cost. No architectural change.  
**Cons:** Users cannot use the app on phones.

---

## 3. Current Web Frontend — Mobile Readiness Assessment

If Path A or B is chosen, these are the CSS/component issues to address in `src/`:

### Components reviewed

| File | Mobile State | Key Issues |
|---|---|---|
| `src/components/Home.tsx` | Unknown | Needs review — 14.9 KB suggests complex layout |
| `src/components/Manage.tsx` | Unknown | Needs review — project management UI likely has tables/grids |
| `src/components/ProjectView.tsx` | Unknown | Needs review — detail views often lack mobile layout |
| `src/components/StateChecklist.tsx` | Unknown | Checklists are generally mobile-friendly |
| `src/components/StatusBadge.tsx` | Likely OK | Simple badge component |

### Known starting points (positive)

- Tailwind CSS present → mobile-first utility classes available
- shadcn/ui components → accessible, touch-friendly base
- Viewport meta present in `index.html`

### Likely issues (to be verified per path chosen)

- Fixed layout dimensions that work in a desktop window may not work at 375 px
- Tauri's default window constraints may need to be removed for mobile web deployment
- No responsive navigation detected (no hamburger menu or bottom nav)
- `state-viewer.html` (standalone HTML file) would need separate mobile treatment

---

## 4. Recommendation

**Decide on Path A, B, or C before writing any mobile CSS.**

The mobile CSS changes needed are near-identical for Path A and B. The difference is deployment and native integration. Deciding first prevents rework.

**Suggested decision criteria:**

| Criteria | Choose |
|---|---|
| Need mobile access within 1–2 weeks | Path A |
| Want a native app in the App Store | Path B |
| Users are primarily on desktop | Path C |
| Team has iOS/Android experience | Path B |
| Team is web-only | Path A |

---

## 5. Next Steps (After Decision)

**If Path A:**
1. Set up web deployment (Vercel/Netlify recommended — Vite build is already configured)
2. Open issues for each component listed in §3
3. Apply mobile fixes following `aigentforge-insight-hub/docs/mobile-best-practices.md`
4. Test at 375 px, 390 px, 430 px

**If Path B:**
1. Evaluate current Tauri version and plan upgrade to 2.x if needed
2. `tauri android init` + `tauri ios init`
3. Apply same mobile CSS fixes as Path A
4. Configure mobile build CI/CD
5. Internal TestFlight / Play Store internal testing

**If Path C:**
1. No action required
2. Document decision in repo CLAUDE.md for future reference

---

*Generated by mobile responsiveness audit · state-app · May 2026*
