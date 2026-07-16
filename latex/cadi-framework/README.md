# `cadi-framework`

Paper-form adaptation of the CADI framework post, prepared for Zenodo deposit and DOI minting.

## Purpose

`main.tex` is the pilot artifact for the citation workflow described in `../../docs/CITATION_WORKFLOW.md`. It restructures the source post into an abstracted, sectioned paper format that can be deposited as a citable PDF.

Source post:

- https://www.allaboutken.com/posts/20260609-iterative-pattern-framework/

## Inputs and outputs

- **Input source:** `main.tex`
- **Output artifact:** `main.pdf` (local build) or Overleaf-generated PDF download
- **Expected usage:** Zenodo pilot deposit after the checks below pass

## Document structure

`main.tex` is organized as:

1. Metadata block (`\title`, `\author`, ORCID link, `\date`)
2. Abstract
3. Main argument sections (problem, framework, case study, limits, related work, conclusion)
4. Manual references list

## Build commands

### Overleaf

1. Create a new blank project.
2. Upload `main.tex`.
3. Compile with `main.tex` as the main file.

### Local

From this directory:

```bash
pdflatex main.tex
```

Or with `latexmk`:

```bash
latexmk -pdf main.tex
```

Run a second pass if cross-references or link targets are unresolved.

## Metadata consistency requirements

Before deposit, keep metadata aligned across:

- `main.tex`
- Zenodo submission form
- canonical post metadata on allaboutken.com (title/date context)

Check specifically:

1. Title text matches the intended deposited work.
2. Author is `Ken Hawkins` with `Independent Researcher`.
3. ORCID is `0009-0009-6728-2237` and linked correctly.
4. Publication date in Zenodo matches the intended citation date for this artifact.

## Pre-deposit checklist (Zenodo)

1. `main.pdf` compiles cleanly and opens without rendering issues.
2. Title/author/ORCID/date are consistent with the metadata requirements above.
3. References and links are present and readable.
4. Upload PDF to Zenodo (optionally include source `.tex`).
5. Confirm ORCID linkage during submission.
6. After DOI is minted, back-link the DOI into the source post and profile surfaces per `../../docs/CITATION_WORKFLOW.md`.
