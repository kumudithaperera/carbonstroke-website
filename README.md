# CarbonStroke Website

Marketing site for **CarbonStroke** — *Your On-Call Partner for Digital Design.*
A single-page, fully responsive static website built from the approved design.

## Tech

- Plain **HTML / CSS / JavaScript** — no build step, no dependencies.
- Google Fonts: **Fraunces** (headings) + **Inter** (body).
- Vanilla JS for the mobile menu, scroll-reveal animations, and the contact form.

## Structure

```
.
├── index.html            # the whole page
├── css/styles.css        # all styles (responsive + reduced-motion)
├── js/main.js            # menu, scroll reveal, mailto form
├── assets/
│   ├── img/hero.jpg      # optimized hero background
│   ├── icons/            # service icons
│   └── logo/             # SVG (black/white) + PNG logo marks
├── design-source/        # original PDF design + raw exported assets
├── .nojekyll             # tell GitHub Pages to serve files as-is
└── README.md
```

## Contact form

The form does not use a backend. On submit it builds a **`mailto:`** link to
`carbonstroke@gmail.com`, pre-filling the visitor's name, email, chosen service,
and project details, and opens the visitor's email client.

To switch to a hosted form service later (e.g. Formspree), replace the submit
handler in `js/main.js`.

## Portfolio images

The six "Our Work" tiles use themed CSS gradients as placeholders (the design's
project photos weren't part of the asset export). Drop real images into
`assets/img/portfolio/` and swap the `.work-thumb--n` backgrounds in
`css/styles.css` when available.

## Run locally

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repo on GitHub and push this folder (see below).
2. In the repo: **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**.
4. Save. Your site publishes at `https://<username>.github.io/<repo>/`.

```bash
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

---
© CarbonStroke. All rights reserved.
