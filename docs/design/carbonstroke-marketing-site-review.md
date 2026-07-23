# Design Review — CarbonStroke marketing site

> Reviewed 2026-07-23 · commit `8dd6347` · full audit
> **Status: all 5 Blockers fixed and re-verified 2026-07-23** (carried M1 and M2 with them — see [Remediation](#remediation)). Majors M3–M10, all Minors and all Polish remain open.
> Canon: `ux-flow/flow-canon.md`, `principle-map.md`, `modern-ux.md`, `gates.md`, `ui-craft/ui-canon.md` (canon-version 2026-07)
> No `docs/design/whiteboard-setup.md` exists, so the default Docs home is used.

## Scope

**Surface.** The whole single-page site (`index.html`, `css/styles.css`, `js/main.js`) — seven treated-as-screens: header/nav (+ mobile menu), hero, services, about/stats, portfolio, contact form, footer.

**Outcome the visitor hires it for.** "Decide whether this studio can do my job, then start a conversation with low commitment." Not "read a brochure." Every step is judged against reaching the contact form with enough confidence to fill it in.

**Mental model / bias risk.** The Aesthetic-Usability Effect is the live distortion here: the hero is genuinely beautiful and the type pairing is confident, which buys the site forgiveness it hasn't earned in its interaction layer. The audit deliberately separates *looks resolved* from *works*. The second bias is the author's own — this is a designer's portfolio site, so polish gets attention and plumbing (form feedback, failure modes) does not. The findings bear that out.

**Evidence.** Rendered UI first: Chromium at 1920×720, 1600×800, 1440×900, 1280×720, 1024×700, 820×1000, 768×700, 390×844, 320×700 and 256×800; screenshots plus scripted probes for composited pixel contrast, real-keyboard tab order, target geometry, reflow, reduced-motion computed styles, form submission behaviour, JS-disabled rendering, and throttled load timing. Source read second.

---

## Summary

The visual layer is the strongest thing here and it is genuinely good: one confident type pairing, a restrained cream/ink/orange palette, a hero that earns its full-bleed treatment, and a spacing rhythm that mostly holds. The hero headline clears contrast against the photograph at every viewport tested (6.3:1–6.7:1 worst-case sampling), reflow survives 256px, `prefers-reduced-motion` is genuinely wired up rather than decorative, and the counter animation degrades correctly without JS. That is more accessibility care than most marketing sites of this size get.

The problems are all in the interaction layer, and they cluster in two places. First, **the page has bet its entire content on JavaScript succeeding**: `.reveal` ships at `opacity: 0` and is only ever un-hidden by script, so a failed `main.js` leaves six service cards, the About copy, four stat cards, six portfolio cards and the whole contact form invisible-but-focusable — verified, not theorised. Second, **the contact form — the single conversion event the site exists for — has no working evaluation loop**: the focus indicator is invisible (1.15:1), an invalid email address is silently accepted into the `mailto:`, the error message names fields that may not be in error, and error and success are rendered in the same orange text in the same place, so a visitor cannot tell whether their message went anywhere. The site is excellent at getting someone to the form and unreliable from that point on, which is exactly backwards.

Below that sit an information-architecture crack — three different, mutually inconsistent lists of what CarbonStroke sells — and a performance cost of 6.8s LCP on Slow 4G from an unoptimised hero image.

**5 Blockers · 10 Majors · 12 Minors · 7 Polish.**

---

## Findings

### Blocker — all fixed

*Findings are kept as written at audit time; see [Remediation](#remediation) for what changed and the re-verified numbers.*

**B1 — All below-the-fold content is invisible if `main.js` fails.** *(hero → contact)*
`.reveal { opacity: 0 }` (`css/styles.css:415`) is only cleared by the IntersectionObserver in `js/main.js:38-51`. The `else` branch covers *browsers without* IntersectionObserver, but nothing covers the far likelier case: the script 404s, is blocked, or throws earlier. Verified with JS disabled — the page renders as four floating section headings over empty voids, while all 6 service cards, the About copy, 4 stat cards, 6 portfolio links and the entire contact form remain in the DOM: focusable, tabbable, and announced by screen readers, but not visible. That is a total break of the Gulf of Evaluation (Norman: bridge both gulfs) and puts invisible interactive controls in the tab order (WCAG 2.4.7).
**Fix:** invert the default. Add `<script>document.documentElement.classList.add('js')</script>` in `<head>`, then scope the hidden state: `.js .reveal { opacity: 0; transform: translateY(22px); }`. Content ships visible; the animation is the enhancement.

**B2 — The form's focus indicator is effectively invisible.** *(contact)* — hard gate: Focus / Non-text contrast
`css/styles.css:384-390` sets `outline: none` on input, select and textarea and substitutes `box-shadow: 0 0 0 3px rgba(229,132,60,.15)`. That composites to `#FBEDE2` — **1.15:1** against the white field and **1.04:1** against the `#f4f4f5` form panel. The accompanying border change to `#e5843c` measures **2.73:1**. Both are under the 3:1 floor, so a keyboard user genuinely cannot see which of the four controls they are in. WCAG 2.4.7 + 1.4.11.
**Fix:** `:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }` — ink on white is 15.7:1. Keep the orange ring underneath as the brand layer, not as the indicator.

**B3 — Three text colours fail 4.5:1.** *(portfolio, contact)* — hard gate: Text contrast

| Element | Colour on background | Measured | Needs |
|---|---|---|---|
| `.work-cat` category label (12.8px/600) | `#d76f2a` on `#f4f4f5` | **3.08:1** | 4.5:1 |
| `.form-note` message (14.7px/500) | `#d76f2a` on `#ffffff` | **3.39:1** | 4.5:1 |
| Input/textarea placeholder | `#a7a49e` on `#ffffff` | **2.49:1** | 4.5:1 |

None qualify as large text. WCAG 1.4.3.
**Fix:** darken `--orange-2` to `#a8511a` (4.6:1 on `#f4f4f5`) for text use, keeping `#d76f2a` for fills; take placeholders to `#6d6d72` (5.15:1) — and see M10, since placeholders shouldn't be carrying the field's only hint anyway.

**B4 — The form error names fields that may not be in error, and points at nothing.** *(contact)* — hard gate: Keyboard / errors named with a fix
`js/main.js:137-140` emits one message — *"Please add your name and email so we can reach you."* — for both failure branches. Fill in the name, leave the email blank, and the site tells you to add a name you already added. No `aria-invalid` is set (verified: 0 elements), no field-level message is rendered, no border changes, and focus stays on the submit button, so a keyboard or screen-reader user is told something is wrong and given no route to the field. WCAG 3.3.1 requires the item in error to be identified; Nielsen #9 requires a precise problem statement; Cooper: never make users feel stupid.
**Fix:** validate per field, render the message under the offending field, set `aria-invalid="true"` + `aria-describedby`, and move focus to the first invalid control. "Add an email address so we can reply" beats naming both fields.

**B5 — Field and secondary-button boundaries fail 3:1.** *(contact, portfolio, hero)* — hard gate: Non-text contrast
The `#dcd8d1` input border measures **1.42:1** against the white field and **1.35:1** against the `#f4f4f5` panel it sits on — nothing in that stack reaches 3:1, so the boundary of every text input is below the perceivability floor. `.btn-outline`'s `rgba(35,35,35,.35)` border composites to **≈2.1:1**, and since the fill is near-white on near-white, that border is the only thing identifying "View Our Work" and "View Full Portfolio on Behance" as controls. WCAG 1.4.11.
**Fix:** take the field border to `#9a958c` (3.1:1 on white) and `.btn-outline`'s to `rgba(35,35,35,.55)` (≈3.2:1). Both remain visually quiet at those values.

### Major

**M1 — An invalid email address is silently accepted.** *(contact)*
The form carries `novalidate` (`index.html:219`) and `js/main.js:137` checks only for emptiness. Verified: submitting `totally not an email` produces *"Opening your email app…"* and builds a `mailto:` whose reply address is unusable — the lead is captured and unreachable, and the visitor believes they made contact. Postel's Law is about being liberal in what you *accept* and conservative in what you *emit*; this is liberal in both directions.
**Fix:** keep `novalidate` (so you own the messaging) but gate on `emailInput.checkValidity()`, and normalise whitespace/case rather than rejecting formatting variance.

**M2 — Error and success are visually identical.** *(contact)*
Both outcomes write to `#form-note`, in the same `--orange-2`, at the same weight, in the same position (`css/styles.css:391`). "Please add your name and email" and "Opening your email app…" are indistinguishable at a glance — the one thing a user needs from that element is *which of the two happened*. Law of Similarity (same encoding must mean same thing); Nielsen #1.
**Fix:** two states with distinct colour **and** a leading icon and different weight — never colour alone (WCAG 1.4.1): a red-ink error with an alert glyph, a green-ink confirmation with a check.

**M3 — The flow has no ending.** *(contact)*
The peak of this site is the moment someone decides to hire you, and the flow's last designed frame is a handoff to an external mail client — after which the form still holds the typed content, the button stays live, and nothing confirms anything. If the mail client doesn't open, the fallback text is a raw address the user must now copy manually. Peak-End Rule: experiences are judged by their ending, and this one is a shrug. Zeigarnik: the task never registers as complete.
**Fix:** design a real success state — replace the form body with a confirmation panel ("Your email app should be open. If it isn't, write to carbonstroke@gmail.com" + a copy-to-clipboard control), and treat the pre-filled draft as the peak by showing what was sent.

**M4 — Three different, contradictory answers to "what does CarbonStroke sell?"** *(services, contact, footer)*

| Services section | Footer "Services" | Form select |
|---|---|---|
| UI/UX Design | UI/UX Design | UI/UX Design |
| Graphic Design | Graphic Design | Graphic Design |
| Personal Branding | Personal Branding | Personal Branding |
| Social Media Posts | Social Media Posts | Social Media Posts |
| Video Editing | Video Editing | Video Editing |
| Consulting | — | Consulting |
| — | **Web Design** | — |
| — | — | **Brand Identity**, **General Chat** |

A visitor who reads "Web Design" in the footer and then can't find it in the enquiry dropdown concludes the site is stale or the service was dropped. Nielsen #4 (same word means the same thing everywhere); Mental Model (the user's model is built from what you showed them first).
**Fix:** one source of truth. Pick the canonical six or seven, use them verbatim in all three places, and if "Brand Identity" and "Personal Branding" are genuinely different offerings, say so in the Services section rather than only in the dropdown.

**M5 — Nine footer links, one destination.** *(footer)*
Every entry under "Services" and "Company" points at `#services`, `#about`, `#portfolio` or `#contact` — so clicking "Video Editing" lands you on the section heading "Our Services", not on video editing. Norman: mapping — the control should resemble the thing it controls. Krug: the page you land on must be named what you clicked.
**Fix:** either give each service a real anchor (`#svc-video`) and `scroll-margin-top`, or stop pretending they're navigation and render the list as plain text.

**M6 — Two primary CTAs compete in the same viewport.** *(header + hero)*
"Get Started" (header) and "Start Your Project" (hero) are both `.btn-dark`, both visible simultaneously above the fold, and both go to `#contact` — two different names for one action, at identical visual weight. Von Restorff only works when exactly one thing is distinct; Refactoring UI is explicit that a screen gets one primary action. It also breaks Nielsen #4.
**Fix:** demote the header CTA to `.btn-outline` (or make it text-only until the hero scrolls out), and use one label everywhere. "Start Your Project" is the stronger of the two — it names the outcome, not the mechanic.

**M7 — 6.8s LCP on Slow 4G.** *(hero, portfolio)* — hard gate: Loading coverage
Measured at 390×844: FCP 632ms but **LCP 6,788ms** (unthrottled: 412ms / 412ms). `hero.jpg` is 438 KB at 2200×1298 natural, served unmodified to a 390px viewport, with no `srcset`, no `fetchpriority="high"` and no preload. The six portfolio images (626 KB) are declared as CSS `background-image`s, so they are fetched with the stylesheet and **cannot** be lazy-loaded no matter how far below the fold they are. Total payload 1.25 MB over 24 requests. The text is readable at 632ms so this isn't a blank-screen failure, but the hero — the thing the whole page is built around — arrives seven seconds late on a normal mobile connection. Rams: environmentally friendly means respecting bandwidth.
**Fix:** export `hero.jpg` at 1440w and 800w AVIF/WebP with `srcset` + `fetchpriority="high"` (should land under 90 KB); convert the six `.work-thumb` divs to real `<img loading="lazy" decoding="async">` elements inside the card, which fixes the payload *and* gives the images alt text.

**M8 — The mobile menu can't be dismissed except by the toggle.** *(header)*
Verified at 390px: Escape does not close it, clicking outside does not close it, and focus is not moved into the menu when it opens (it stays on the toggle). The only exit is finding the same 42px button again. Nielsen #3: every unwanted state needs a clearly marked exit.
**Fix:** add `keydown` on Escape and a document click handler, move focus to the first menu link on open and return it to the toggle on close.

**M9 — No "you are here" on a site made entirely of in-page anchors.** *(header)*
Every navigation target is a fragment on this one page, yet the nav never reflects which section is in view, and there is no visited/active treatment. Krug's second navigation question — *where am I* — is unanswered for the whole scroll. Compounded by the sticky header being present at all times, which makes its silence more conspicuous.
**Fix:** an IntersectionObserver on the four sections setting `aria-current="true"` on the matching nav link, styled with an underline or ink-weight shift (not colour alone).

**M10 — Required and optional fields are indistinguishable until you submit.** *(contact)*
`name` and `email` carry `required`; `service` and `details` do not. Nothing on screen says so — the labels are identical in treatment, and the only feedback arrives after a failed submit. WCAG 3.3.2 Labels or Instructions; Nielsen #5 (prevention beats a good error message).
**Fix:** mark the two required fields, or — better, since only two of four are optional — label the optional ones "Project details (optional)" and drop the asterisks entirely.

### Minor

**N1 — Below 720px there is no navigation landmark.** The mobile menu is a `<div id="mobile-menu">` (`index.html:49`) sitting outside `<nav aria-label="Primary">`, and the real `<nav>` is `display: none` at that width. Screen-reader users on mobile lose landmark navigation entirely. **Fix:** make `#mobile-menu` a `<nav aria-label="Primary">`, or move it inside the existing one.

**N2 — Six links leave the site with no warning.** All portfolio cards use `target="_blank"` with no visual or announced indication. Jakob's Law: the convention is an external-link glyph. **Fix:** append an arrow icon and a visually-hidden "(opens in a new tab)".

**N3 — Footer targets are 18px tall on touch.** Measured 18px high with a 36.6px centre-to-centre gap — that *passes* WCAG 2.5.8 via the spacing exception, but sits well under the 44pt (HIG) / 48dp (M3) platform floor from `gates.md`, and the footer is fully exposed on mobile. **Fix:** `display: block; padding: 8px 0;` on `.footer-col a` — 34px, and 44px if the list gap absorbs it.

**N4 — One hover animation escapes reduced-motion.** `.work-thumb`'s 250ms `translateY(-4px)` still runs under `prefers-reduced-motion: reduce` (verified: `transitionProperty: transform, box-shadow`). `.service-card` is covered only by accident, because `.reveal` on the same element zeroes its transition. **Fix:** add `.work-thumb, .card { transition: none }` and neutralise both hover transforms in the existing media block.

**N5 — Decorative hero image carries a descriptive alt.** `alt="Layered mountain valley illustration in warm and slate tones"` (`index.html:60`) on a `position: absolute` background makes screen-reader users listen to scenery before the H1. **Fix:** `alt=""`.

**N6 — Portfolio thumbnails read as six unrelated things.** `background-position: center` on a 168px-tall box crops the "MOTORS" wordmark and the "Project Eve" title mid-glyph, and the set swings between white, saturated yellow and pale blue with no shared treatment. Law of Similarity (same-role items need consistent encoding); Prägnanz (the eye wants a resolvable form). **Fix:** re-crop to a consistent 16:10 focal point and apply a single subtle tint or consistent inner border across all six.

**N7 — Portfolio row bottoms don't align.** The first card's title wraps to two lines while its row-mates run to one, so the grid's baseline breaks. **Fix:** `min-height` on `.work-card h3` sized to two lines, or shorten the title.

**N8 — Reduced-motion preference is read once.** `js/main.js:55` captures `matchMedia(...).matches` at load; toggling the OS setting mid-session has no effect on the counters. **Fix:** `mq.addEventListener('change', …)`.

**N9 — The service select's label and default fight each other.** "Services Needed" (plural) sits on a single-select, and the default option "General Chat" isn't a service at all — it's the opt-out, pre-selected. That makes the low-intent path the path of least resistance on a lead form. Hick's Law argues for a recommended default; this is the opposite of one. **Fix:** relabel "What do you need?" and default to the most common real service, or use an unselected prompt.

**N10 — Errors are announced through a polite status channel.** `role="status" aria-live="polite"` (`index.html:254`) is right for the success message and wrong for the failure — an error the user must act on should be `role="alert"`. **Fix:** split the two messages into separate live regions with the appropriate politeness.

**N11 — The hamburger's accessible name never updates.** `aria-label="Open menu"` is static; only `aria-expanded` flips. State is announced, so this is not a failure, but the name is wrong half the time. **Fix:** swap the label alongside `aria-expanded`.

**N12 — No skip link.** Five focusable elements sit ahead of the content on every anchor jump. Not a 2.4.1 failure on a single-page site, but cheap to fix and standard. **Fix:** a visually-hidden `Skip to content` link targeting `<main>`.

### Polish

**P1 — Spacing sits off the implied 4/8 scale.** `13px`/`9px` button padding, `34px` nav gap, `22px` hero-sub margin, `30px` hero-actions, `26px` scroll-cue offset, `7px` label margin, `11px` footer list gap, and a section rhythm of 44/52/72/88. Refactoring UI: pick a fixed scale and never reach outside it. **Fix:** define `--space-1…8` (4/8/12/16/24/32/48/64) and round each value to its nearest step.

**P2 — Four radii, one near-miss.** 10px (buttons, inputs), 13px (`.service-icon`), 14px (`--radius`), 20px (`--radius-lg`). A 13px icon inside a 14px card is the mismatched-concentric-radii tell — nested corners should share a centre. **Fix:** collapse to `--radius-sm: 10px / --radius: 14px / --radius-lg: 20px` and set the icon to `--radius-sm`.

**P3 — Thirteen distinct raw hex values live outside the token block.** `#4a4a4f`, `#4d4a45`, `#35353a` (×2), `#c9c7c4`, `#d7d5d2`, `#b8b6b3`, `#9a9895`, `#a7a49e`, `#dcd8d1`, `#000`, and `#fff` at nine call sites — plus `%23787680` and `%23e5843c` hard-coded inside the two data-URI SVGs, where they can never track a token change. Several are near-duplicates of existing tokens (`#4d4a45` vs `--muted`, `#35353a` vs `--ink`). Meanwhile four declared tokens are never referenced: `--cream-2`, `--muted-2`, `--peach`, `--shadow-lg`. M3/shadcn norm: no hex in components. **Fix:** promote the live values to named roles (`--text-secondary`, `--border-input`, `--on-dark-muted`), delete the four dead ones, and use `currentColor` in the inline SVGs.

**P4 — No dark mode.** `prefers-color-scheme` appears nowhere. `gates.md` and the modern canon treat dark as a first-class parallel deliverable, designed in pairs from the start — retrofitting it onto eleven loose hex values later is the expensive path. **Fix:** define the light/dark pair for each role now, while the palette is still small.

**P5 — Service icons ship as 186px PNGs for a 52px slot** despite SVG sources sitting in `design-source/Icons/`. **Fix:** use the SVGs.

**P6 — `.check-list` circle at 2.73:1.** Below 3:1, though 1.4.11 doesn't strictly bite because the adjacent text carries the meaning. Still reads as washed out. **Fix:** `--orange` at `#c96a22` for strokes.

**P7 — README drift.** It documents Inter; the site loads Fira Sans (`b56d404`/`ba83e8e`). **Fix:** update the README.

---

## Screen × state inventory

`✓` designed · `~` partial · `✗` missing · `–` not applicable

| Screen | Empty | Loading | Error | Success |
|---|---|---|---|---|
| Header / nav | – | – | – | – (no active-section state → **M9**) |
| Mobile menu | – | – | – | ~ open/closed styled; no dismissal states (**M8**) |
| Hero | – | ✗ 438 KB image has no placeholder or skeleton (**M7**) | ✗ if `hero.jpg` 404s, the alt string renders over the absolute-positioned layer (**N5**) | – |
| Services | – | ✗ invisible without JS (**B1**) | – | – |
| About / stats | – | ~ counters flash the static value → `0` → count up | – | ✓ counters land on the true figure; correct static fallback without JS |
| Portfolio | ✗ no zero-content state (hardcoded 6) | ✗ 626 KB of CSS backgrounds, unlazyable (**M7**) | ✗ a 404'd thumbnail renders as an empty grey box | – |
| Contact form | ✓ placeholders present (but see **B3**, **M10**) | ✗ none — submit is synchronous, button never reflects work | ~ one generic message for two cases, wrong field named (**B4**) | ✗ ambiguous handoff text, same styling as the error (**M2**, **M3**) |
| Footer | – | – | – | – |

**Both gulfs, per screen.** Execution is bridged everywhere except the mobile menu (no exit) and the required/optional distinction on the form. Evaluation is bridged in the hero, services, about and portfolio — and broken in three places: the contact form (error vs success indistinguishable, no completion signal), the nav (no location feedback), and catastrophically across the whole page when JS fails.

---

## Hard gates

Every row from `ux-flow/references/gates.md` gets a verdict.

### Accessibility

| Gate | Threshold | Verdict | Evidence |
|---|---|---|---|
| Text contrast | ≥4.5:1 (≥3:1 large) | **FAIL** | `.work-cat` 3.08:1, `.form-note` 3.39:1, placeholder 2.49:1 → **B3**. All other pairs pass: body 15.7:1, `--muted` on `#f4f4f5` 4.68:1, nav 8.12:1, stat-label 8.39:1, footer link 7.00:1, footer-bottom 4.92:1. Hero text over the photograph sampled at 8 viewport sizes: 6.31:1–6.69:1 worst-case — **pass**. |
| Non-text contrast | ≥3:1 icons, borders, focus | **FAIL** | Focus ring 1.15:1 → **B2**; input border 1.42:1, `.btn-outline` border ≈2.1:1 → **B5**; check circle 2.73:1 → **P6**. Select chevron passes at 4.47:1. |
| Target size | ≥24×24 px; 44pt/48dp touch | **PASS (WCAG) / partial (platform)** | Nothing is under 24×24 with intersecting neighbours. Desktop nav links (18×57) and footer links (18px) pass 2.5.8 via the spacing exception (82.6px and 36.6px centre gaps). Mobile menu items measure 45.6px and the CTA 44.4px — above the touch floor. Footer links stay 18px on touch → **N3**. |
| Focus | Visible, not obscured | **FAIL (visible) / PASS (obscured)** | Form controls have `outline: none` with a 1.15:1 substitute → **B2**. Links and buttons keep the UA ring. 30 real keyboard tabs after an anchor jump found nothing obscured by the 69px sticky header — `scroll-padding-top: 84px` does its job. |
| Colour alone | Never the only carrier | **FAIL** | Form error vs success differ only by text string and share one colour → **M2**. Elsewhere fine: `.check-list` pairs its orange ring with a check glyph, `.work-cat` colour is decorative not semantic. |
| Reflow | 200% zoom, 320px width | **PASS** | No horizontal scroll and zero clipped elements at 640px (=200%), 320px (=400%) or 256px. Verified that `overflow-x: hidden` is not masking anything — element right-edges stay inside `clientWidth` at all three. |
| Keyboard | Operable; errors named with a fix | **FAIL** | Everything is reachable and operable, and Escape/outside-click don't dismiss the mobile menu (**M8**). The error text exists but misidentifies the field and sets no `aria-invalid` → **B4**. |
| Redundant entry | Never re-ask known information | **PASS** | Single-step flow; nothing is asked twice. (The email field duplicates what the user's mail client already knows, but that's a handoff artefact, not a re-ask within the process.) |

### Performance and motion

| Gate | Threshold | Verdict | Evidence |
|---|---|---|---|
| Interaction responsiveness | INP < 200ms p75 | **PASS** | No blocking work on any handler; menu toggle, reveal and submit are all trivial. Field measurement not available — see Not reviewed. |
| System response | <400ms or covered | **PASS** | The only action with latency is the `mailto:` handoff, which is instant and OS-owned. |
| AI first token | <800ms when streaming | **N/A** | No AI surface. |
| Motion | 150–300ms, meaningful, honours reduced-motion | **PASS (with one gap)** | All transitions land in 150–250ms; `scroll-behavior`, `.reveal`, `.scroll-cue`, `digitFlip` and `.btn:hover` are all neutralised under `reduce`, and the JS counter respects it too. `.work-thumb`'s hover transform is the one escapee → **N4**. |
| Loading coverage | No bare spinner past 1s; honest loading state | **FAIL** | LCP 6,788ms on Slow 4G with no placeholder, skeleton or progressive treatment behind a 438 KB hero → **M7**. |

---

## Principle coverage

Every law from `principle-map.md` whose trigger is present, with evidence and verdict.

| Principle | Verdict | Evidence | Fix |
|---|---|---|---|
| Aesthetic-Usability Effect | ⚠️ Masking | The hero and type pairing are strong enough to buy forgiveness for an interaction layer with 5 hard-gate failures — the exact failure mode the law warns about. | Treat polish as settled; spend the next cycle entirely on **B1–B5**. |
| Choice Overload | ✅ Pass | Six services, six projects, four form fields, three nav items — all curated, nothing dumped. | — |
| Chunking | ✅ Pass | Services in 3×2, stats in 2×2, footer in three named columns, form in labelled rows. | — |
| Cognitive Bias | ⚠️ Flag | The pre-selected "General Chat" default nudges every visitor toward the lowest-intent path — against the site's own goal, so not a dark pattern, but not neutral either. Ethics check: passes; a visitor shown this loop would consent. | **N9** — default to a real service or an unselected prompt. |
| Cognitive Load | ✅ Pass | Scan order is clean; nothing must be held in mind between sections. | — |
| Doherty Threshold | ❌ Fail | 6.8s LCP on Slow 4G, no perceived-performance cover. | **M7**. |
| Fitts's Law | ⚠️ Partial | Hero CTAs are large and centred; the header CTA is 110×42. Footer links are 18px tall on touch. | **N3**. |
| Flow | ✅ Pass | No challenge/skill mismatch — the task is "read, then type four fields." | — |
| Goal-Gradient Effect | ➖ N/A | Single-step form; no multi-step progress to show. | — |
| Hick's Law | ✅ Pass | Choice counts are small and the recommended path (dark CTA) is marked — though marked *twice*, see Von Restorff. | — |
| Jakob's Law | ⚠️ Partial | Conventions honoured: logo top-left, nav top-right, sticky header, hamburger below 720px. Broken: external links carry no new-tab signal; nav has no active state. | **N2**, **M9**. |
| Law of Common Region | ✅ Pass | Cards, the form panel and stat tiles all use shared backgrounds and boundaries to bind their contents. | — |
| Law of Proximity | ⚠️ Partial | Good throughout except the ≤460px footer, where the 26px group gap barely exceeds the 11px item gap, so "Services / Company / Connect" stop reading as separate groups. | Raise the mobile footer group gap to 40px. |
| Law of Prägnanz | ⚠️ Partial | Portfolio thumbnails crop mid-wordmark, so several resolve to no clear form. | **N6**. |
| Law of Similarity | ❌ Fail | Two visually identical `.btn-dark` primaries for one action (**M6**); error and success rendered identically (**M2**); the six thumbnails share no visual treatment (**N6**). | As cited. |
| Law of Uniform Connectedness | ✅ Pass | `.work-thumb` + `.work-cat` + `<h3>` are wrapped in one `<a>` and read as one unit. | — |
| Mental Model | ❌ Fail | Three conflicting service lists (**M4**); footer service links that don't go to the service (**M5**). The user's model of what you sell is built from whichever list they read first, and the site then contradicts it. | **M4**, **M5**. |
| Miller's Law | ✅ Pass | No group exceeds six items. | — |
| Occam's Razor | ⚠️ Partial | Lean overall, but `.scroll-cue` duplicates both the "Services" nav link and the hero's own downward pull, and four declared tokens (`--cream-2`, `--muted-2`, `--peach`, `--shadow-lg`) are never referenced. | Drop the scroll cue; prune the four dead tokens. |
| Paradox of the Active User | ✅ Pass | No onboarding, no gate — a visitor can act (scroll, click, type) immediately. | — |
| Pareto Principle | ⚠️ Flag | The 20% that carries this site's value is the contact form, and it is the least-finished surface on the page. | Prioritise **B2–B5**, **M1–M3** over any new section. |
| Parkinson's Law | ✅ Pass | Four fields, two required, no artificial length. | — |
| Peak-End Rule | ❌ Fail | The peak (hero) is designed with real care; the ending (submit → handoff) is not designed at all. | **M3**. |
| Postel's Law | ❌ Fail | Accepts an invalid email and emits it into a `mailto:` — liberal in both directions. | **M1**. |
| Selective Attention | ✅ Pass | Nothing critical is styled like promotion; the CTAs read as controls, not banners. | — |
| Serial Position Effect | ✅ Pass | Nav puts "Services" first and the CTA last; the form's primary action is last; footer contact details close the list. | — |
| Tesler's Law | ⚠️ Partial | The mailto approach pushes irreducible complexity onto the visitor: they must own a configured mail client, and they compose the final send themselves. | Move to a hosted form endpoint (Formspree/Netlify) so the system absorbs it; keep `mailto:` as the fallback. |
| Von Restorff Effect | ❌ Fail | Two identical dark CTAs above the fold, so neither is *the* distinct one. | **M6**. |
| Working Memory | ✅ Pass | Nothing must be carried across screens; the form is one view and preserves input on error. | — |
| Zeigarnik Effect | ❌ Fail | A submitted form leaves no completion signal, so the task never closes — and the form still holds the text, implying it didn't send. | **M3**. |

**Not applicable — trigger absent:** *Goal-Gradient Effect* (no multi-step task or progress to display). The entire **AI-product sweep** from `modern-ux.md` (trust quartet, modality fit, streaming states, agentic transparency, probabilistic-output controls, escape hatches from open input) is out of scope — this surface contains no AI-mediated interaction of any kind. `token-drift`'s visual-law subset is covered under P1–P4 rather than as a separate scan.

---

## Not reviewed

- **Screen-reader pass.** No VoiceOver or NVDA run. Roles, names and live-region behaviour were inspected in the DOM and computed styles, but announcement order and quality are unverified.
- **Real-device touch testing.** Target sizes are measured geometry, not thumb testing; no physical iOS/Android device was used.
- **Field INP.** The responsiveness gate is judged from handler inspection, not RUM data — no analytics are installed.
- **Design-source fidelity.** `design-source/CarbonStroke Website.pdf` was not compared against the build; this audit judges the shipped UI on its own terms, not against the approved comp.
- **Behance destinations.** The six external project pages are outside this surface and were not opened or evaluated.
- **Windows/Firefox/Safari rendering.** All measurements are Chromium on macOS. `backdrop-filter` on the header and `.btn-outline` degrades differently in Firefox and is worth a spot-check.
- **Copy quality.** Microcopy is flagged only where it causes a usability defect (B4, M6, N9). A full rewrite against the UX-writing canon is `copy-craft`'s job, not this one.

---

## Remediation

Applied and re-verified 2026-07-23 against the same probe suite.

| # | Change | Files | Re-verified |
|---|---|---|---|
| **B1** | Inline `<script>` in `<head>` sets `html.js`; `.reveal` hidden state scoped to `.js .reveal` (including inside the reduced-motion block, which would otherwise have lost the specificity contest). | `index.html`, `styles.css` | JS disabled → **0 of 16** `.reveal` elements hidden (was 16 of 16). With JS, below-fold reveal still starts at `opacity: 0` and animates to `1` on scroll — the enhancement is intact. |
| **B2** | Removed `outline: none` from the field focus rule. Added one page-wide `:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px }`, overridden to white inside `.site-footer` and `.stat-card`. The orange ring stays as decoration. | `styles.css` | All four form controls **15.72:1**; nav link 14.49:1; footer link (white) 14.16:1. Was 1.15:1. |
| **B3** | `--orange-2` → `#a8511a` (both its uses were text). Placeholder → `var(--muted)`. | `styles.css` | `.work-cat` **4.95:1** (was 3.08); placeholder **5.15:1** (was 2.49); `.form-note` now uses the semantic error/success tokens at 5.95:1 / 5.93:1 (was 3.39). |
| **B4** | Per-field `<p class="field-error">` slots; `setFieldError()` maintains `aria-invalid` + `aria-describedby`; focus moves to the first invalid control; errors clear on `input`; summary line no longer names fields that are fine. | `index.html`, `main.js` | Name filled + email blank → only `#email` gets `aria-invalid="true"`, its own message, and focus. Fixing the field clears the state immediately. |
| **B5** | New `--field-line: #8f8a82` for input borders; `.btn-outline` border alpha `.35` → `.55`. | `styles.css` | Field borders **3.43:1** on white / **3.12:1** on the panel (was 1.42 / 1.35); `.btn-outline` **3.54:1** (was 2.09). |

**Two Majors came along**, because both sat inside code B4 rewrote and leaving them would have meant writing new code around a known defect:

- **M1** — the new validator calls `emailEl.checkValidity()`, so `not-an-email` is now caught with *"That email address doesn't look right — check it for a typo."* instead of being written into the `mailto:`.
- **M2** — `.form-note` gained `is-error` / `is-success` modifiers with distinct colour **and** a distinct icon, so failure and success no longer render identically. This satisfies WCAG 1.4.1 (never colour alone).

**Regression sweep clean:** no horizontal scroll and zero clipped elements at 1440 / 640 / 320 / 256px; under `prefers-reduced-motion: reduce` every `.reveal` resolves to `opacity: 1`.

**Deliberately still open:** **M3** — there is still no real success state. The flow's ending is now correctly *styled* as success, but it remains a message rather than a designed completion: the form still holds the typed content, the button stays live, and nothing confirms the mail client actually opened. That is a design decision, not a bug fix, so it was left for you.

## Recommended order

1. ~~**B1**~~ — done.
2. ~~**B2 → B5**~~, ~~M1~~, ~~M2~~ — done. **M3** and **M10** remain to finish the contact form as a whole.
3. **M4, M5, M6, M9** — information architecture and CTA hierarchy.
4. **M7** — image pipeline.
5. **M8, N1–N12** — the rest of the interaction and semantics layer.
6. **P1–P7** — tokenise, then design the dark pair before the palette grows further.
