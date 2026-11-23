# CarbonStroke Website

Marketing site for **CarbonStroke** — *Your On-Call Partner for Digital Design.*
A fully responsive static website built from the Doop designs (Landing A and
the case study frames on the "CarbonStroke website" canvas).

## Tech

- Plain **HTML / CSS / JavaScript** — no build step, no dependencies.
- Google Fonts: **Geist** (headings) + **Figtree** (body).
- Vanilla JS for the mobile menu, scroll-reveal animations, and the contact form.
- Header and footer markup is repeated in every page; change it in all of them.

## Structure

```
.
├── index.html            # homepage: studio, apps, client work, contact
├── work/                 # client case studies (corner-store, eve, ceylinco-vip,
│                         #   wave-creations, yez-packaging)
├── apps/                 # app case studies (morsel, ossie) and the Ossie
│                         #   app page with placeholder legal pages (ossie/)
├── css/styles.css        # site styles (responsive + reduced-motion)
├── css/ossie.css         # Ossie app page: site layout, Ossie UI mockups
├── js/main.js            # menu, scroll reveal, mailto form
├── assets/
│   ├── img/hero.jpg      # optimized hero background
│   ├── img/apps/         # Morsel and Ossie icons and screens
│   ├── img/work/         # case study images (served locally; the CSP allows only 'self')
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
