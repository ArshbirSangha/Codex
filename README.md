# Ballotwise

Ballotwise compares a user’s policy preferences with candidate positions supplied in structured ballot data. Candidates are ranked within each race using a weighted alignment score.

The default dataset is fictional. It contains ten candidates across three contests. The questionnaire contains eight statements. No sample candidate represents a real person.

## Local setup

Install Node.js 22.12 or newer. The application was tested with Node.js 24.

From the project directory, run:

```sh
npm ci
npm run dev
```

Open the address printed in the terminal, normally http://localhost:5173.

To check the application and generate a production build:

```sh
npm test
npm run build
```

The build is written to `dist/`. Run `npm run preview` to serve it locally.

The interface uses React with TypeScript. Vite handles development and production builds. The application does not require a backend.

## Scoring

Responses use a five-point agreement scale from −2 to +2. Zero represents a neutral response. Skipped questions are excluded.

Each response has a default weight of 1. Selecting “Weight this issue ×2” changes its weight to 2.

For each comparable position:

```text
alignment = 100 × (1 − |user response − candidate position| ÷ 4)
```

The candidate’s final score is the weighted average of these values, rounded to a percentage. Equal scores receive the same rank.

Missing candidate positions are excluded rather than treated as neutral. Coverage measures the proportion of answered issue weight supported by known candidate positions. A candidate receives no score when no comparison is possible.

A high score with low coverage has limited supporting data. The score measures policy alignment. It does not assess a candidate’s qualifications or predict performance in office.

Select “Export comparison” to download a JSON report containing your responses and the calculated results. Coverage is included for each candidate. This report cannot be imported as a ballot.

## Custom ballots

Select “Import” and upload a prepared JSON file, or paste its contents into the dialog. The dialog provides a downloadable sample.

The sample dataset is available in `src/data/sample-ballot.ts`. Validation rules are implemented in `src/lib/ballot.ts`.

The following example is a valid ballot. Its contents are fictional.

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
          "color": "#bde5fa",
          "bio": "Fictional candidate.",
          "positions": {
            "housing": 2
          },
          "sources": []
        },
        {
          "id": "avery-lane",
          "name": "Avery Lane",
          "party": "Nonpartisan",
          "initials": "AL",
          "color": "#e5f7c2",
          "bio": "Fictional candidate.",
          "positions": {
            "housing": -1
          },
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
      "description": "Consider the effect on housing supply and neighborhood density.",
      "lowLabel": "Keep current density rules",
      "highLabel": "Allow more apartments",
      "contestIds": [
        "mayor"
      ]
    }
  ]
}
```

Every field shown above is required. A top-level `description` field is optional.

IDs must be unique within their category. Question references must identify existing contests. Each contest must have at least one associated question.

Candidate position keys must identify questions relevant to that candidate’s contest. Position values must be integers from −2 through +2. Use `null` or omit the position when it is unknown.

Dates must use `YYYY-MM-DD`. Candidate colors must use six-digit hexadecimal notation. The interface applies its own avatar palette.

For real election data, set `isDemo` to `false`. Candidate positions must be researched before import. Source entries use this format:

```json
{
  "label": "Candidate policy statement",
  "url": "https://example.org/policy"
}
```

Source URLs must use HTTP or HTTPS. Empty source lists are permitted but do not establish that a position has been verified.

The input limit is 1 MB. A ballot may contain up to 40 contests and 500 candidates in total. The questionnaire limit is 200 questions.

## Scope

The application accepts prepared JSON. It does not extract ballot information from PDFs or photographs.

Questions and candidate positions must already be included in the imported dataset. The application does not discover candidates or independently verify their positions. Source links are provided for inspection; their contents are not checked automatically.

The fictional dataset demonstrates the comparison method. It should not be used to make an actual voting decision.

## Data handling

Responses remain in browser memory. Imported ballots are also held locally and are cleared when the page reloads.

Importing a replacement ballot clears existing responses. Sessions are not saved automatically.

An exported comparison contains the user’s opinions. Anyone receiving that file can read those responses.
