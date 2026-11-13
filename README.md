# Antonio Rosati — portfolio (v2)

A card-based personal site in a dark/light studio palette with a crimson accent. Static HTML, CSS and JavaScript, prepared for GitHub Pages at https://antoniorosati24.github.io. A clean deploy copy lives in `/workspace/portfolio-deploy/` (not yet pushed).

Type is **Plus Jakarta Sans** (headings and body, a geometric sans) and **JetBrains Mono** (overlines, pills and meta), both SIL Open Font License, self-hosted as variable WOFF2 in `fonts/` (latin, plus a latin-ext cut of Plus Jakarta Sans). Licences sit beside the font files.

The site has a near-black dark theme and a matching off-white light theme, sharing the same crimson accent. The visitor’s system preference (`prefers-color-scheme`) is the default; a control in the navigation cycles system → light → dark and remembers a manual choice in `localStorage` (`ar-theme`).

The three information cards on the home portrait can be dragged (mouse, touch or pen; arrow keys when focused). Their places are remembered for the tab, and a small “Reset cards” control returns them. A field of small neon mouse pointers lives in document space across the whole page. They are drawn on a fixed canvas stacked above every card, image and section, and below only the navigation and the lightbox, so they scroll with the content and new ones come into view from below. They are scattered across the full width — including the centre, over the content — and unlabelled, each wandering in a small home zone, give the pointer room, fade only slightly over images and type, and never capture clicks. Now and then one will hover and click a heading or card, drag-select a short span of text, blink a caret as if typing, nudge a card, or meet another cursor; some travel to a key phrase and draw a hand-drawn crimson underline or a soft highlight that stays with the text. A cursor that's working grows tiny stick arms and legs (a walk cycle while it moves, and job-specific gestures) and a small hat for the task — a yellow hard hat, a graduation cap, or headphones — with no labels. On a desktop mouse, three of them trail the visitor's pointer as a loose escort (never on top of it) and are dragged along with a scroll, then catch up; touch devices get no escort and a lighter field. One rAF loop, paused while the tab is hidden. Preferring reduced motion removes the canvas and shows the underlines already drawn; it also disables Lenis, GSAP, the short first-visit loader, and page transitions, and shows the Lyceum tour as a simple stacked list. Motion uses **GSAP 3.12.7** with **ScrollTrigger**, and **Lenis** 1.1.18, vendored in `vendor/`.

Content is drawn from the career profile at `/home/box/shared/career-profile/career_profile.md`. Facts have not been invented. The Masmec thesis and earlier jobs are not mentioned. No English level is stated. The Audi prototype is described as generated in full from a prompt, not as hand-written code, and no award is claimed. Lyceum does not name a specific provider or model tested end-to-end.

## Preview locally

```bash
cd portfolio-v2
python3 -m http.server 8080
```

Then open http://localhost:8080/. Do not open the files via `file://` — fonts and some scripts expect a server.

## GitHub Pages

The live origin is **https://antoniorosati24.github.io** (user site, repo `antoniorosati24/antoniorosati24.github.io`, served from the root). Open Graph and Twitter image URLs, canonical and `og:url` links, `sitemap.xml` and the `Sitemap:` line in `robots.txt` all use that origin.

A clean deploy copy — no `preview/`, no working-folder paths — is at `/workspace/portfolio-deploy/`, as a git repository on `main`. Do not push from this machine unless you have been asked to.

The Open Graph image is `assets/og.jpg` (1200×630), generated from the home hero. Replace it the same way if the hero later changes, and keep the absolute URL in the HTML.

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
| `assets/og.jpg` | Open Graph share image | 1200×630 |
| `assets/favicon.svg` | Favicon | — |
| `assets/favicon.png` | Fallback favicon | 128×128 |

Each of the Lyceum and Audi stills, and the portrait, also has a dark-theme companion: the same filename under `assets/lyceum/dark/`, `assets/audi/dark/`, and `assets/dark/portrait.jpg`. When you replace a light file, replace its dark counterpart as well, at the same size. The site follows the visitor’s system theme (`prefers-color-scheme`) by default. A small control in the navigation cycles system → light → dark and remembers a manual choice in `localStorage` (`ar-theme`); clearing the choice returns to the system.

## Contact

The public site lists email ([rosati.antonio2001@gmail.com](mailto:rosati.antonio2001@gmail.com)), [LinkedIn](https://www.linkedin.com/in/antros) and [GitHub](https://github.com/antoniorosati24). There is no telephone number on the site.


## Pages

- `index.html` — hero with a tinted portrait, flagship and project cards, contact
- `lyceum.html` — case study and scroll/click app tour
- `audi.html` — case study: level switcher, scroll tour, demo video, phone views (`js/audi.js`)
- `about.html` — about, and a list of what I work with
- `404.html` — GitHub Pages 404

The first version of the site, left untouched, lives in `/workspace/portfolio/`.
