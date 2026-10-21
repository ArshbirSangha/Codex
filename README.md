# Ballotwise

A browser app that turns structured ballot information into opinion questions and ranks candidates by how closely their documented positions match your answers. Compare each race, adjust which issues matter most, and inspect the reasoning behind a match.

The included Riverbend City election is entirely fictional: **3 contests, 10 candidates, and 8 opinion questions**. All sample names, biographies, and positions are demonstration content.

## Run locally

Use **Node.js 22.12 or newer**; Node.js 24 was tested.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

```sh
npm run build   # Type-check and create a production build in dist/
npm test        # Run ranking and import-validation tests
npm run preview # Serve the production build locally
```

Built with React, TypeScript, and Vite. There is no backend or database.

## How comparisons work

Answer each statement on a five-point scale from **−2 (strongly disagree)** to **2 (strongly agree)**, with 0 representing a neutral opinion. You can skip questions and mark an answer as more important, giving it weight 2 instead of 1.

For each answered question relevant to a race, alignment is `100 × (1 − |your answer − candidate position| / 4)`. A candidate's score is the weighted average of comparable answers, rounded to a percentage. Equal scores share a rank.

An unknown or omitted candidate position is excluded from the score. **Coverage** is the percentage of your answered issue weight for which that candidate has a known position. No comparable positions means no score. A high score with low coverage has less supporting information; scores do not assess experience, character, or ability to deliver.

Use **Export comparison** on the results screen to download your answers, rankings, and coverage as JSON. This comparison export is a report, not an importable ballot file.

## Import a ballot

Choose **Import a ballot**, then upload or paste a JSON file. Download the sample JSON from the import dialog for a complete template. The same data lives in [`src/data/sample-ballot.ts`](src/data/sample-ballot.ts); type definitions and validation are in [`src/lib/ballot.ts`](src/lib/ballot.ts).

Here is a minimal valid ballot. Every person, place, and position in this example is fictional.

```json
{
  "id": "example-2026",
  "title": "Example City Election",
  "location": "Example City",
  "electionDate": "2026-11-03",
  "isDemo": true,
  "contests": [
    {
      "id": "mayor",
      "title": "Mayor",
      "description": "Leads city government.",
      "seats": 1,
      "candidates": [
        {
          "id": "rowan-ellis",
          "name": "Rowan Ellis",
          "party": "Nonpartisan",
          "initials": "RE",
          "color": "#55735b",
          "bio": "A fictional candidate for this example.",
          "positions": { "housing": 2 },
          "sources": []
        },
        {
          "id": "avery-lane",
          "name": "Avery Lane",
          "party": "Nonpartisan",
          "initials": "AL",
          "color": "#85709c",
          "bio": "Another fictional candidate for this example.",
          "positions": { "housing": -1 },
          "sources": []
        }
      ]
    }
  ],
  "questions": [
    {
      "id": "housing",
      "topic": "Housing",
      "title": "The city should allow more apartments near transit.",
      "description": "Consider housing supply, neighborhood density, and public services.",
      "lowLabel": "Keep current density rules",
      "highLabel": "Allow more apartments",
      "contestIds": ["mayor"]
    }
  ]
}
```

All shown fields are required; a top-level `description` is optional. IDs must be unique within contests, candidates, and questions respectively. Each question references existing contests, and each contest needs a question. Candidate position keys reference questions relevant to their contest. Values must be integer −2, −1, 0, 1, or 2; use `null` or omit a key when a position is unknown. Colors use six-digit hex notation. Dates use `YYYY-MM-DD`.

For a real ballot, set `isDemo` to `false` and supply carefully researched candidate positions. A source is `{ "label": "Source title", "url": "https://…" }` using a complete HTTP(S) URL; empty source lists are allowed and displayed as unavailable. No real sources are claimed by the fictional samples. Imports are limited to 1 MB, 40 contests, 500 total candidates, and 200 questions.

## Scope and data

The app imports prepared JSON. It does not automatically extract a ballot from a PDF or image, discover candidates, research their positions, or fact-check linked sources. Prepare and verify that information before importing it.

Answers and imported ballots stay in browser memory and clear when the page reloads. Importing another ballot resets your answers. There is no account, server-side storage, or saved session; export a comparison if you want to keep it. An exported comparison includes your opinions, so share that file intentionally.
