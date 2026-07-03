# LBTI

**Laboratory Behaviour Type Indicator · 实验室行为类型指标**

Live site: https://sthsci.github.io/academic_personality/

LBTI is a fictional research-work-style test for people who live around biological experiments,
materials characterisation, computational bioinformatics and theoretical biophysics. It turns
answers into a deterministic 15-dimensional profile, then explains the result with real
mathematical visualisations: distances, PCA, clustering, entropy and bootstrap stability.

It is an interactive toy for reflection and amusement. It is not a scientific, clinical,
psychological or employment assessment.

## Highlights

- 36 five-point questions in English, Simplified Chinese and Traditional Chinese.
- Concrete examples from gels, flow cytometry, fluorescence microscopy, SEM, sequencing,
  bioinformatics, simulations and mathematical modelling.
- 21 fictional research archetypes with deterministic scoring and authored result prose.
- ML Lab with plain-language explanations, Python mini-tutorials and student learning resources.
- Result visualisations, share-card PNG export and an optional shared public cohort atlas.
- Static frontend, no account, no analytics and no uploaded raw answers.

## Privacy

Answers and settings stay in the browser. Share cards never include raw answers. The delete
controls on the Result and Privacy pages erase local LBTI data.

The cohort atlas is opt-in and uses Supabase as the shared public database. Uploaded records contain
only derived dimension scores, archetype codes and loose context. They do not contain names, emails,
institutions, free text or raw answers.

## Development

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5173/academic_personality/
```

Quality gates:

```bash
npm run check      # content validation + lint + typecheck + unit tests
npm run test:e2e   # Playwright desktop/mobile journey tests
npm run build      # production build + SPA fallback
```

## Deployment

The repository includes a GitHub Pages workflow at `.github/workflows/deploy.yml`.

Push to `main`, then in GitHub set **Settings -> Pages -> Source** to **GitHub Actions**. The
workflow validates content, lints, type-checks, runs unit and e2e tests, builds with the repository
base path and deploys `dist/`.

## Notes

- PCA, k-means, hierarchical clustering, distances, entropy and bootstrap resampling are computed
  in the browser.
- Archetypes, weights, prototype vectors and interpretations are original fiction.
- No p-values, diagnostic claims, accuracy claims or validation claims are made.
- The visual design is intentionally soft, textured and atmospheric while staying keyboard and
  screen-reader accessible.

## Licence

MIT. The archetype texts and question set are original fiction created for this project.
