# latex/

Source for pieces from allaboutken.com being adapted into citable, LaTeX-formatted documents for deposit on [Zenodo](https://zenodo.org) (user `khawkins98`), cross-linked to [ORCID 0009-0009-6728-2237](https://orcid.org/0009-0009-6728-2237). Background and workflow: `docs/CITATION_WORKFLOW.md`.

## Contents

- `poc-minimal/` — smallest possible document to verify the LaTeX toolchain (Overleaf or a local install) before investing time in a full paper. Build this first.
- `cadi-framework/` — the pilot: an adaptation of the [CADI framework post](https://www.allaboutken.com/posts/20260609-iterative-pattern-framework/) into paper form, structured for Zenodo deposit.

## Building

No LaTeX distribution is assumed to be installed in this repo's dev environment. Two options:

1. **Overleaf** (recommended, zero local setup): create a new project, upload the `.tex` file, compile.
2. **Local**: install a TeX distribution (e.g. MacTeX, or `brew install --cask basictex` for a lighter footprint), then from the relevant subdirectory:
   ```bash
   pdflatex main.tex
   ```
   Run twice if references/citations don't resolve on the first pass.

These files are not wired into the Eleventy build — they're a separate, manually-built artifact track for the citation workflow.
