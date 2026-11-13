# Antonio Rosati — portfolio

Personal site at [antoniorosati24.github.io](https://antoniorosati24.github.io). Static HTML, CSS and JavaScript, served from this repository’s root on GitHub Pages.

Type is **Cormorant Garamond** (display — titles and the name, in italic) and **Figtree** (body and the navigation), both SIL Open Font License, self-hosted as variable WOFF2 in `fonts/`.

A field of small mouse pointers wanders slowly across the paper, behind the type, as a picture of agents at work. They are unlabelled, spread across the viewport, and they never capture clicks. Preferring reduced motion hides them, and also disables Lenis, GSAP and page transitions, and shows the Lyceum tour as a simple stacked list. Motion uses **GSAP 3.12.7** with **ScrollTrigger**, and **Lenis** 1.1.18, vendored in `vendor/`.

## Preview locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/. Do not open the files via `file://` — fonts and some scripts expect a server.

## Replacing placeholders

Every image below is a labelled schematic, not a real screenshot, and not a claim about what the interface looks like. Keep the same filenames and the site will pick them up. Recommended size is noted; a similar aspect ratio is enough.

### Lyceum

| File | Role | Suggested size |
| --- | --- | --- |
| `assets/lyceum/hero.png` | Home page hero still | 2400×1600 |
| `assets/lyceum/cover.png` | Work-grid cover (portrait) | 1600×2000 |
| `assets/lyceum/01-home.png` | Tour step 1, Home | 1920×1200 |
| `assets/lyceum/02-transcription.png` | Tour step 2, Transcription | 1920×1200 |
| `assets/lyceum/03-master-note.png` | Tour step 3, Master Note | 1920×1200 |
| `assets/lyceum/04-export.png` | Tour step 4, Export | 1920×1200 |
| `assets/lyceum/05-providers.png` | Tour step 5, Providers | 1920×1200 |
| `assets/lyceum/06-assistant.png` | Tour step 6, Assistant | 1920×1200 |
| `assets/lyceum/demo-poster.png` | Poster for the screen recording | 1920×1080 |
| `assets/lyceum/demo.mp4` | Screen recording (optional, 30–60s). *Not included.* The page currently shows the poster and a “coming soon” caption. When you add this file, put `data-demo="assets/lyceum/demo.mp4"` on the figure in `lyceum.html` — the script then swaps the poster for a video player. WebM is also fine if you change that filename. | — |

Tour images sit inside a stylised Mac window on the page. They work best as captures of the **app content** (without macOS chrome), at around 16:10. If a screenshot already includes the window frame, say so and the HTML frame can be dropped.

### Audi Vorsprung Club

Real captures of the prototype (headless Chromium, 1440×900 at 2×; phones 390×844 at 3×), saved as WebP, plus the demo video re-encoded to H.264 without audio (`demo.mp4`, ~2.6 MB, poster `demo-poster.webp`). The prototype is dark-native, so these files have no `dark/` companions; the page shows them in a dark window in both themes. The prototype HTML itself and its embedded Audi fonts/icons are **not** published — only screenshots and the video.

| File | Role |
| --- | --- |
| `assets/audi/cover.webp` | Work-grid cover (phone, Explorer) |
| `assets/audi/hero.webp` | Page hero (desktop dashboard, Explorer) |
| `assets/audi/level-0-guest.webp` … `level-4-pioneer.webp` | Level switcher, one status card per level |
| `assets/audi/level-1-technik.webp` | Explorer at 8,000 pt, symbol complete |
| `assets/audi/demo-panel.webp`, `rewards.webp`, `service.webp`, `qr-event.webp`, `direct.webp` | Scroll tour |
| `assets/audi/m-status.webp`, `m-pioneer.webp`, `m-qr.webp` | Phone views |
| `assets/audi/demo.mp4`, `demo-poster.webp` | Screen recording |

### Portrait and site images

| File | Role | Suggested size |
| --- | --- | --- |
| `assets/portrait.jpg` | About page portrait (`assets/portrait.png` is a copy) | 1600×2000 |
| `assets/og.jpg` | Open Graph share image (1200×630). If you replace the home hero, regenerate this and keep the absolute URL `https://antoniorosati24.github.io/assets/og.jpg` in the HTML. | 1200×630 |
| `assets/favicon.svg` | Favicon | — |
| `assets/favicon.png` | Fallback favicon | 128×128 |

Each of the Lyceum and Audi stills, and the portrait, also has a dark-theme companion: the same filename under `assets/lyceum/dark/`, `assets/audi/dark/`, and `assets/dark/portrait.jpg`. When you replace a light file, replace its dark counterpart as well, at the same size. The site follows the visitor’s system theme (`prefers-color-scheme`) by default. A small control in the navigation cycles system → light → dark and remembers a manual choice in `localStorage` (`ar-theme`); clearing the choice returns to the system.

## Contact

The public site lists email ([rosati.antonio2001@gmail.com](mailto:rosati.antonio2001@gmail.com)), [LinkedIn](https://www.linkedin.com/in/antros) and [GitHub](https://github.com/antoniorosati24). There is no telephone number on the site.

## Pages

- `index.html` — hero and work grid
- `lyceum.html` — case study and scroll/click app tour
- `audi.html` — case study: level switcher, scroll tour, demo video, phone views (`js/audi.js`)
- `about.html` — short about
- `404.html` — GitHub Pages 404
