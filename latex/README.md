# latex/

Source for pieces from allaboutken.com being adapted into citable, LaTeX-formatted documents for deposit on [Zenodo](https://zenodo.org) (user `khawkins98`), cross-linked to [ORCID 0009-0009-6728-2237](https://orcid.org/0009-0009-6728-2237). See the shared [citation and DOI workflow](../docs/CITATION_WORKFLOW.md) for the end-to-end process.

## Contents

- [`poc-minimal/`](poc-minimal/README.md) — smallest possible document to verify the LaTeX toolchain (Overleaf or a local install) before investing time in a full paper. Build this first.
- [`cadi-framework/`](cadi-framework/README.md) — the pilot: an adaptation of the [CADI framework post](https://www.allaboutken.com/posts/20260609-iterative-pattern-framework/) into paper form, structured for Zenodo deposit.

## Building

No LaTeX distribution is assumed to be installed in this repo's dev environment. Two options:

1. **Overleaf** (recommended, zero local setup): create a new project, upload the `.tex` file, compile.
2. **Local**: install a TeX distribution (e.g. MacTeX, or `brew install --cask basictex` for a lighter footprint), then from the relevant subdirectory (use that artifact's main `.tex` filename, such as `minimal.tex` or `main.tex`):
   ```bash
   pdflatex <artifact-file>.tex
   ```
   Run twice if references/citations don't resolve on the first pass.

These files are not wired into the Eleventy build — they're a separate, manually-built artifact track for the citation workflow.

## Guidance split

- [`docs/CITATION_WORKFLOW.md`](../docs/CITATION_WORKFLOW.md) covers the end-to-end process (selection, deposit, DOI cross-linking).
- The [`poc-minimal` README](poc-minimal/README.md) and [`cadi-framework` README](cadi-framework/README.md) cover document-specific sources, compile details, expected outputs, metadata checks, and readiness criteria.
