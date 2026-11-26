# Build files

`index.html` in the repo root is generated. To change the page structure, edit
`index.tpl.html` here and run:

    python3 build_site.py

It fills the template from `pubs.json` (every publication parsed from the CV),
`cites.json` (citations per year) and the QR codes in `assets/qr/`, then writes
`../index.html`.

Small wording or styling tweaks can be made directly in `index.html` and
`assets/styles.css` — but if you later rerun the build, mirror them in the
template first, or they will be overwritten.

The weekly GitHub Action (`.github/workflows/update-stats.yml`) edits
`index.html` in place and never runs this build, so the two do not collide.
