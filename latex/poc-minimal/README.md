# `poc-minimal`

Minimal LaTeX proof-of-concept used to verify the citation toolchain before working on a full paper adaptation.

## Purpose

This artifact checks that the core Zenodo-bound PDF pipeline works end to end:

- article-class LaTeX document compiles cleanly
- author block includes affiliation and ORCID link
- title, abstract, sections, and references render as expected

If this file compiles and opens cleanly, the same toolchain is considered ready for `../cadi-framework/main.tex`.

## Inputs and outputs

- **Input source:** `minimal.tex`
- **Output artifact:** `minimal.pdf` (local build) or Overleaf-generated PDF download
- **Expected usage:** toolchain check only, not for deposit

## Build commands

### Overleaf

1. Create a new blank project.
2. Upload `minimal.tex`.
3. Compile with `minimal.tex` as the main file.

### Local

From this directory:

```bash
pdflatex minimal.tex
```

Or with `latexmk`:

```bash
latexmk -pdf minimal.tex
```

## Success criteria

Treat the toolchain check as successful when all of the following are true:

1. Compilation finishes without fatal errors.
2. `minimal.pdf` opens and renders the title, `Ken Hawkins`, `Independent Researcher`, ORCID `0009-0009-6728-2237`, abstract, and section headings from `minimal.tex`.
3. Hyperlinks are clickable in the generated PDF.
4. Output is suitable to proceed to the full pilot document in `../cadi-framework/`.
