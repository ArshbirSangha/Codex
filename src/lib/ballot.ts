export interface Source {
  label: string;
  url: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  initials: string;
  color: string;
  bio: string;
  positions: Record<string, number | null>;
  sources: Source[];
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  seats: number;
  candidates: Candidate[];
}

export interface Question {
  id: string;
  topic: string;
  title: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  contestIds: string[];
}

export interface Ballot {
  id: string;
  title: string;
  location: string;
  electionDate: string;
  description?: string;
  isDemo: boolean;
  contests: Contest[];
  questions: Question[];
}

export type Answers = Record<string, { value: number; weight: number }>;

export interface CandidateMatch {
  candidate: Candidate;
  score: number | null;
  /** Percentage of the weight of relevant answers with known candidate positions. */
  coverage: number;
  answeredCount: number;
  comparedCount: number;
  breakdown: Array<{
    question: Question;
    answer: number;
    position: number | null;
    weight: number;
    /** Per-question alignment, as a percentage from 0 to 100. */
    alignment: number | null;
  }>;
}

const hasOwn = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

const isScaleValue = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= -2 &&
  value <= 2;

/** Compare only questions answered by the user that apply to this particular contest. */
export function rankCandidates(
  ballot: Ballot,
  answers: Answers,
  contestId: string,
): CandidateMatch[] {
  const contest = ballot.contests.find((item) => item.id === contestId);
  if (!contest) return [];

  const answeredQuestions = ballot.questions.filter((question) => {
    if (
      !question.contestIds.includes(contestId) ||
      !hasOwn(answers, question.id)
    )
      return false;
    const answer = answers[question.id];
    return (
      answer &&
      isScaleValue(answer.value) &&
      (answer.weight === 1 || answer.weight === 2)
    );
  });
  const totalWeight = answeredQuestions.reduce(
    (sum, question) => sum + answers[question.id].weight,
    0,
  );

  return contest.candidates
    .map((candidate): CandidateMatch => {
      let comparableWeight = 0;
      let alignmentTotal = 0;
      let comparedCount = 0;

      const breakdown = answeredQuestions.map((question) => {
        const { value: answer, weight } = answers[question.id];
        const rawPosition = hasOwn(candidate.positions, question.id)
          ? candidate.positions[question.id]
          : null;
        const position = isScaleValue(rawPosition) ? rawPosition : null;
        const alignment =
          position === null
            ? null
            : (1 - Math.abs(answer - position) / 4) * 100;
        if (alignment !== null) {
          comparableWeight += weight;
          alignmentTotal += alignment * weight;
          comparedCount += 1;
        }
        return { question, answer, position, weight, alignment };
      });

      return {
        candidate,
        score: comparableWeight
          ? Math.round(alignmentTotal / comparableWeight)
          : null,
        coverage: totalWeight
          ? Math.round((comparableWeight / totalWeight) * 100)
          : 0,
        answeredCount: answeredQuestions.length,
        comparedCount,
        breakdown,
      };
    })
    .sort((a, b) => {
      if (a.score === null && b.score !== null) return 1;
      if (a.score !== null && b.score === null) return -1;
      if (a.score !== b.score) return (b.score ?? 0) - (a.score ?? 0);
      return a.candidate.name.localeCompare(b.candidate.name, "en", {
        sensitivity: "base",
      });
    });
}

const MAX_INPUT_LENGTH = 1_000_000;
const FORBIDDEN_IDS = new Set(["__proto__", "prototype", "constructor"]);

function invalid(message: string): never {
  throw new Error(message);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function string(
  value: unknown,
  path: string,
  maxLength = 500,
  allowEmpty = false,
): string {
  if (typeof value !== "string") invalid(`${path} must be text.`);
  const cleaned = value.trim();
  if (!allowEmpty && !cleaned) invalid(`${path} cannot be empty.`);
  if (cleaned.length > maxLength)
    invalid(`${path} must be ${maxLength} characters or fewer.`);
  return cleaned;
}

function id(value: unknown, path: string): string {
  const result = string(value, path, 80);
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result) ||
    FORBIDDEN_IDS.has(result)
  ) {
    invalid(
      `${path} must start with a letter or number and contain only letters, numbers, hyphens, or underscores.`,
    );
  }
  return result;
}

function array(
  value: unknown,
  path: string,
  maxLength: number,
  minLength = 0,
): unknown[] {
  if (!Array.isArray(value)) invalid(`${path} must be a list.`);
  if (value.length < minLength)
    invalid(
      `${path} must contain at least ${minLength} item${minLength === 1 ? "" : "s"}.`,
    );
  if (value.length > maxLength)
    invalid(`${path} must contain no more than ${maxLength} items.`);
  return value;
}

function unique(value: string, seen: Set<string>, path: string): void {
  if (seen.has(value))
    invalid(`${path} has a duplicate ID: "${value}". Each ID must be unique.`);
  seen.add(value);
}

function source(value: unknown, path: string): Source {
  const data = object(value, path);
  const label = string(data.label, `${path} label`, 200);
  const url = string(data.url, `${path} URL`, 2_000);
  try {
    const parsed = new URL(url);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      invalid(
        `${path} URL must be an HTTP or HTTPS link without embedded credentials.`,
      );
    }
  } catch {
    invalid(
      `${path} URL must be an HTTP or HTTPS link without embedded credentials.`,
    );
  }
  return { label, url };
}

/**
 * Read a portable ballot JSON file. This only validates supplied data: it does not
 * verify claims about candidates or fetch sources. Unknown fields are discarded.
 */
export function parseBallot(input: string): Ballot {
  if (typeof input !== "string" || !input.trim())
    invalid("Choose a nonempty ballot JSON file.");
  if (input.length > MAX_INPUT_LENGTH)
    invalid("The ballot file is too large. Use a JSON file smaller than 1 MB.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    invalid("This file is not valid JSON. Check the formatting and try again.");
  }
  const data = object(parsed, "The ballot");
  const ballotId = id(data.id, "Ballot ID");
  const title = string(data.title, "Ballot title", 200);
  const location = string(data.location, "Ballot location", 200);
  const electionDate = string(data.electionDate, "Election date", 10);
  const date = new Date(`${electionDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(electionDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== electionDate
  ) {
    invalid("Election date must be a real calendar date in YYYY-MM-DD format.");
  }
  if (typeof data.isDemo !== "boolean")
    invalid("The ballot must include isDemo as true or false.");
  const description =
    data.description === undefined
      ? undefined
      : string(data.description, "Ballot description", 5_000, true);
  const contestIds = new Set<string>();
  const candidateIds = new Set<string>();
  let totalCandidates = 0;

  const contests = array(data.contests, "Contests", 40, 1).map(
    (value, index): Contest => {
      const path = `Contest ${index + 1}`;
      const item = object(value, path);
      const contestId = id(item.id, `${path} ID`);
      unique(contestId, contestIds, path);
      const candidates = array(
        item.candidates,
        `${path} candidates`,
        50,
        1,
      ).map((candidateValue, candidateIndex): Candidate => {
        totalCandidates += 1;
        if (totalCandidates > 500)
          invalid("A ballot can contain no more than 500 candidates in total.");
        const candidatePath = `${path}, candidate ${candidateIndex + 1}`;
        const candidate = object(candidateValue, candidatePath);
        const candidateId = id(candidate.id, `${candidatePath} ID`);
        unique(candidateId, candidateIds, candidatePath);
        const color = string(candidate.color, `${candidatePath} color`, 7);
        if (!/^#[a-fA-F0-9]{6}$/.test(color))
          invalid(
            `${candidatePath} color must be a six-digit hex color, such as #4f6b52.`,
          );
        const rawPositions = object(
          candidate.positions,
          `${candidatePath} positions`,
        );
        if (Object.keys(rawPositions).length > 200)
          invalid(`${candidatePath} can contain no more than 200 positions.`);
        const positions: Record<string, number | null> = {};
        for (const [questionId, position] of Object.entries(rawPositions)) {
          id(questionId, `${candidatePath} position question ID`);
          if (position !== null && !isScaleValue(position)) {
            invalid(
              `${candidatePath} position "${questionId}" must be -2, -1, 0, 1, 2, or null for unknown.`,
            );
          }
          positions[questionId] = position as number | null;
        }
        return {
          id: candidateId,
          name: string(candidate.name, `${candidatePath} name`, 200),
          party: string(candidate.party, `${candidatePath} party`, 100),
          initials: string(candidate.initials, `${candidatePath} initials`, 5),
          color,
          bio: string(candidate.bio, `${candidatePath} biography`, 5_000, true),
          positions,
          sources: array(candidate.sources, `${candidatePath} sources`, 30).map(
            (entry, sourceIndex) =>
              source(entry, `${candidatePath}, source ${sourceIndex + 1}`),
          ),
        };
      });
      const seats = item.seats;
      if (
        typeof seats !== "number" ||
        !Number.isInteger(seats) ||
        seats < 1 ||
        seats > candidates.length
      ) {
        invalid(
          `${path} seats must be a whole number between 1 and its number of candidates.`,
        );
      }
      return {
        id: contestId,
        title: string(item.title, `${path} title`, 200),
        description: string(
          item.description,
          `${path} description`,
          5_000,
          true,
        ),
        seats,
        candidates,
      };
    },
  );

  const questionIds = new Set<string>();
  const questions = array(data.questions, "Questions", 200, 1).map(
    (value, index): Question => {
      const path = `Question ${index + 1}`;
      const item = object(value, path);
      const questionId = id(item.id, `${path} ID`);
      unique(questionId, questionIds, path);
      const referencedContests = new Set<string>();
      const questionContests = array(
        item.contestIds,
        `${path} contest IDs`,
        40,
        1,
      ).map((entry) => {
        const contestId = id(entry, `${path} contest ID`);
        if (!contestIds.has(contestId))
          invalid(`${path} refers to an unknown contest: "${contestId}".`);
        if (referencedContests.has(contestId))
          invalid(`${path} lists the contest "${contestId}" more than once.`);
        referencedContests.add(contestId);
        return contestId;
      });
      return {
        id: questionId,
        topic: string(item.topic, `${path} topic`, 100),
        title: string(item.title, `${path} title`, 500),
        description: string(
          item.description,
          `${path} description`,
          5_000,
          true,
        ),
        lowLabel: string(item.lowLabel, `${path} low label`, 200),
        highLabel: string(item.highLabel, `${path} high label`, 200),
        contestIds: questionContests,
      };
    },
  );

  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  );
  for (const contest of contests) {
    if (
      !questions.some((question) => question.contestIds.includes(contest.id))
    ) {
      invalid(`Contest "${contest.title}" must have at least one question.`);
    }
    for (const candidate of contest.candidates) {
      for (const questionId of Object.keys(candidate.positions)) {
        const question = questionsById.get(questionId);
        if (!question)
          invalid(
            `Candidate "${candidate.name}" has a position for unknown question "${questionId}".`,
          );
        if (!question.contestIds.includes(contest.id)) {
          invalid(
            `Candidate "${candidate.name}" has a position for "${questionId}", which does not apply to their contest.`,
          );
        }
      }
    }
  }

  return {
    id: ballotId,
    title,
    location,
    electionDate,
    ...(description === undefined ? {} : { description }),
    isDemo: data.isDemo,
    contests,
    questions,
  };
}
