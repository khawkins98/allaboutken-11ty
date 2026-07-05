# Citation and DOI workflow

How posts on this site get a durable, citable identifier and get linked into the researcher-discovery ecosystem — without institutional affiliation. Background and rationale: [issue #98](https://github.com/khawkins98/allaboutken-11ty/issues/98).

## Why

allaboutken.com is the canonical source for the writing, but posts here have no persistent identifier and no presence in the tools people actually use to find and cite independent research. The goal is to fix that for select pieces (starting with the CADI framework), so the work can be tracked, circulated, and cited — and so this site's own citations get more rigorous by example.

## Accounts

- **Zenodo**: user `khawkins98` — primary DOI source. CERN-backed, DataCite-registered, free, no peer review required, no institutional affiliation required.
- **ORCID**: [0009-0009-6728-2237](https://orcid.org/0009-0009-6728-2237) — the canonical researcher identity. Zenodo deposits link to this at submission time, so the work also appears on the ORCID record.
- **ResearchGate**: [Ken-Hawkins-2](https://www.researchgate.net/profile/Ken-Hawkins-2) — secondary. Keep it cross-linked once a DOI exists; not the primary deposit target.

## Where the LaTeX source lives

`latex/` at the repo root, one subdirectory per piece being adapted (e.g. `latex/cadi-framework/`). See `latex/README.md` for build instructions (Overleaf or a local TeX install — no LaTeX toolchain is assumed to exist in this repo's normal dev environment).

Each subdirectory is a standalone paper adaptation of a published post: restructured with an abstract and paper-style sections, not a raw copy of the site markdown. The post itself stays the canonical, human-readable version; the LaTeX version exists to produce a citable PDF.

## Workflow

1. **Pick a post.** Prioritize pieces with real original framing and reference lists — they read as papers with the least rework. The CADI framework post is the pilot.
2. **Adapt to LaTeX** in `latex/<piece-name>/main.tex`. Keep the author block consistent: name, "Independent Researcher," ORCID link.
3. **Build the PDF** (Overleaf or local `pdflatex`/`latexmk`). Check it renders cleanly before depositing.
4. **Deposit on Zenodo** under user `khawkins98`:
   - Upload the PDF (and optionally the `.tex` source).
   - Link ORCID `0009-0009-6728-2237` as the author identifier during submission.
   - Use metadata that matches the paper: title, abstract, keywords, publication date.
5. **Cross-link the DOI**:
   - Back into the original post on allaboutken.com (e.g. a note or citation block).
   - On the ORCID profile (Zenodo deposits linked at step 4 should sync automatically, but confirm).
   - On the ResearchGate profile, if the piece is uploaded there too.
6. **Repeat** for other candidate posts (DRR pieces, emulation notes) once the pilot is validated.

## What "done" looks like for the pilot

- `latex/cadi-framework/main.tex` compiles to a clean PDF.
- That PDF is deposited on Zenodo with a minted DOI, linked to ORCID `0009-0009-6728-2237`.
- The DOI is referenced back from the live CADI post.

Everything past LaTeX-source-in-this-repo (the actual Zenodo upload, ORCID linking, cross-posting) is manual work done outside this repo's build — there's nothing here to automate yet.

## Compiling: staying manual for now

Building `.tex` -> PDF is a manual, occasional step (Overleaf, or local `pdflatex`/`latexmk` per `latex/README.md`), not wired into `yarn build`. At the current volume — a couple of proof-of-concept files, one pilot paper — a compile pipeline would be more machinery than the problem needs.

**If this scales** (papers become a recurring habit rather than an occasional pilot), the realistic next step is [Tectonic](https://tectonic-typesetting.github.io/): a single self-contained binary, drop-in `pdflatex` replacement, fetches missing packages automatically, no TeX Live install required. At that point it's a small addition — `brew install tectonic` plus a `yarn compile:latex` script that shells out to it, same pattern this repo already uses for Sass/Eleventy — and could even run in CI to produce PDFs as build artifacts.

Ruled out for this use case: pure-JS/WASM LaTeX engines (e.g. `latex.js`, SwiftLaTeX). They either only parse a subset of LaTeX (too risky for packages already in use like `hyperref`/`enumitem`) or are built for interactive browser editors, not a build-script invocation. Not worth the integration cost when Overleaf and, later, Tectonic cover the real need.
