# Ladon Davis — portfolio

Source for the portfolio of Ladon Davis, Software Engineer — AI Applications, Seattle. The sentence the site is built around: **I build systems that grade their own work.**

A static site on Astro 6 and Tailwind 4, styled as a dark developer workspace: a file explorer on the left and an observability pane on the right, with editor-style pages between them.

## The one rule

No fact without its date. Every statement on the site comes from a claims ledger kept in a private repo, where each claim carries its receipt and a status. A claim stated in the present tense is one the ledger marks live. A claim with a number carries its date or its method in the same sentence. Nothing on the site is a live metric unless it says when it was fetched. A number with no date next to it is a defect.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

Node 24 (package.json asks for 22.12 or newer).

## Deploy

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages at https://viceatlas.github.io. It runs on every push to `main` and on manual dispatch. It also runs at 11:17 UTC every day, so anything fetched at build time is never more than a day old. The repo's Pages source must be set to GitHub Actions once:

```sh
gh api --method POST repos/viceatlas/viceatlas.github.io/pages -f build_type=workflow
```

`site` in `astro.config.mjs` must equal the deployed URL; the canonical and Open Graph URLs are derived from it. `public/resume.pdf` is placed by hand before a deploy; the site links it, the build does not create it.

## Where things live

```
public/             favicon, robots.txt, og/og-home.png, images
src/layouts/        Workspace.astro: chrome, meta tags, the build-time UTC stamp
src/components/     PhysicalCard, SectionHeader, TerminalBlock, TagChip, PointerButton, ...
src/pages/          one .astro file per route
```
