import { describe, expect, it } from "vitest";
import { sampleBallot } from "../data/sample-ballot";
import { parseBallot, rankCandidates, type Ballot } from "./ballot";

function fixture(): Ballot {
  return {
    id: "example",
    title: "Example election",
    location: "Example City",
    electionDate: "2026-11-03",
    isDemo: true,
    contests: [
      {
        id: "mayor",
        title: "Mayor",
        description: "One seat",
        seats: 1,
        candidates: [
          {
            id: "alpha",
            name: "Alex Adams",
            party: "Nonpartisan",
            initials: "AA",
            color: "#556677",
            bio: "",
            positions: { housing: 2, transit: -2 },
            sources: [],
          },
          {
            id: "beta",
            name: "Blair Baker",
            party: "Nonpartisan",
            initials: "BB",
            color: "#556677",
            bio: "",
            positions: { housing: -2, transit: 2 },
            sources: [],
          },
          {
            id: "casey",
            name: "Casey Clark",
            party: "Nonpartisan",
            initials: "CC",
            color: "#556677",
            bio: "",
            positions: { housing: null },
            sources: [],
          },
        ],
      },
      {
        id: "school-board",
        title: "School board",
        description: "One seat",
        seats: 1,
        candidates: [
          {
            id: "drew",
            name: "Drew Davis",
            party: "Nonpartisan",
            initials: "DD",
            color: "#556677",
            bio: "",
            positions: { schools: 2 },
            sources: [],
          },
        ],
      },
    ],
    questions: [
      {
        id: "housing",
        topic: "Housing",
        title: "Allow more homes.",
        description: "",
        lowLabel: "Disagree",
        highLabel: "Agree",
        contestIds: ["mayor"],
      },
      {
        id: "transit",
        topic: "Transit",
        title: "Expand transit.",
        description: "",
        lowLabel: "Disagree",
        highLabel: "Agree",
        contestIds: ["mayor"],
      },
      {
        id: "schools",
        topic: "Schools",
        title: "Expand school programs.",
        description: "",
        lowLabel: "Disagree",
        highLabel: "Agree",
        contestIds: ["school-board"],
      },
    ],
  };
}

function parseModified(modify: (ballot: Ballot) => void): Ballot {
  const ballot = fixture();
  modify(ballot);
  return parseBallot(JSON.stringify(ballot));
}

describe("rankCandidates", () => {
  it("calculates weighted distance on the five-point opinion scale", () => {
    const results = rankCandidates(
      fixture(),
      {
        housing: { value: 2, weight: 2 },
        transit: { value: 2, weight: 1 },
      },
      "mayor",
    );
    expect(
      results.map(({ candidate, score }) => [candidate.id, score]),
    ).toEqual([
      ["alpha", 67],
      ["beta", 33],
      ["casey", null],
    ]);
    expect(results[0]).toMatchObject({
      coverage: 100,
      answeredCount: 2,
      comparedCount: 2,
    });
    expect(results[0].breakdown.map(({ alignment }) => alignment)).toEqual([
      100, 0,
    ]);
  });

  it("weights coverage without treating a missing position as disagreement", () => {
    const ballot = fixture();
    ballot.contests[0].candidates[0].positions.transit = null;
    const [result] = rankCandidates(
      ballot,
      {
        housing: { value: 2, weight: 2 },
        transit: { value: -2, weight: 1 },
      },
      "mayor",
    );
    expect(result.candidate.id).toBe("alpha");
    expect(result).toMatchObject({
      score: 100,
      coverage: 67,
      answeredCount: 2,
      comparedCount: 1,
    });
    expect(result.breakdown[1]).toMatchObject({
      position: null,
      alignment: null,
      answer: -2,
    });
  });

  it("includes neutral answers and neutral positions in comparisons", () => {
    const ballot = fixture();
    ballot.contests[0].candidates[0].positions.housing = 0;
    const [result] = rankCandidates(
      ballot,
      { housing: { value: 0, weight: 1 } },
      "mayor",
    );
    expect(result).toMatchObject({
      score: 100,
      coverage: 100,
      answeredCount: 1,
      comparedCount: 1,
    });
  });

  it("scopes answers to each contest and excludes unanswered questions", () => {
    const results = rankCandidates(
      fixture(),
      {
        housing: { value: 2, weight: 1 },
        schools: { value: -2, weight: 2 },
      },
      "mayor",
    );
    expect(results[0]).toMatchObject({
      score: 100,
      answeredCount: 1,
      comparedCount: 1,
    });
    expect(results[0].breakdown.map(({ question }) => question.id)).toEqual([
      "housing",
    ]);
    expect(
      rankCandidates(
        fixture(),
        { schools: { value: -2, weight: 2 } },
        "school-board",
      )[0].score,
    ).toBe(0);
  });

  it("distinguishes a zero match from no comparable information", () => {
    const results = rankCandidates(
      fixture(),
      { housing: { value: 2, weight: 1 } },
      "mayor",
    );
    expect(results[1]).toMatchObject({
      score: 0,
      coverage: 100,
      comparedCount: 1,
    });
    expect(results[2]).toMatchObject({
      score: null,
      coverage: 0,
      comparedCount: 0,
    });
  });

  it("returns no score without answers, and sorts equal scores by name", () => {
    const ballot = fixture();
    ballot.contests[0].candidates.reverse();
    const empty = rankCandidates(ballot, {}, "mayor");
    expect(empty.map(({ candidate }) => candidate.name)).toEqual([
      "Alex Adams",
      "Blair Baker",
      "Casey Clark",
    ]);
    expect(
      empty.every(
        ({ score, coverage, answeredCount }) =>
          score === null && coverage === 0 && answeredCount === 0,
      ),
    ).toBe(true);
    const tied = rankCandidates(
      ballot,
      { housing: { value: 0, weight: 1 } },
      "mayor",
    );
    expect(tied.map(({ candidate }) => candidate.id)).toEqual([
      "alpha",
      "beta",
      "casey",
    ]);
    expect(tied.map(({ score }) => score)).toEqual([50, 50, null]);
  });

  it("ignores malformed answers and unknown contest IDs safely", () => {
    const results = rankCandidates(
      fixture(),
      {
        housing: { value: 99, weight: 1 },
        transit: { value: 2, weight: -1 },
        schools: { value: 2, weight: 2 },
      },
      "mayor",
    );
    expect(
      results.every(
        ({ score, answeredCount }) => score === null && answeredCount === 0,
      ),
    ).toBe(true);
    expect(rankCandidates(fixture(), {}, "missing")).toEqual([]);
  });

  it("does not mutate candidate order, ballot data, or answers", () => {
    const ballot = fixture();
    const answers = { housing: { value: 2, weight: 2 } };
    const originalBallot = JSON.stringify(ballot);
    const originalAnswers = JSON.stringify(answers);
    rankCandidates(ballot, answers, "mayor");
    expect(JSON.stringify(ballot)).toBe(originalBallot);
    expect(JSON.stringify(answers)).toBe(originalAnswers);
  });
});

describe("parseBallot", () => {
  it("round-trips the fictional sample without changing its data", () => {
    expect(parseBallot(JSON.stringify(sampleBallot))).toEqual(sampleBallot);
    expect(sampleBallot.isDemo).toBe(true);
    expect(sampleBallot.contests).toHaveLength(3);
    expect(sampleBallot.questions).toHaveLength(8);
  });

  it("accepts HTTP and HTTPS sources and unknown positions", () => {
    const ballot = parseModified((data) => {
      data.contests[0].candidates[0].sources = [
        {
          label: "Published position",
          url: "https://example.org/position?q=homes",
        },
        { label: "Archive", url: "http://example.org/archive" },
      ];
      data.contests[0].candidates[0].positions.housing = null;
    });
    expect(ballot.contests[0].candidates[0].sources).toHaveLength(2);
    expect(ballot.contests[0].candidates[0].positions.housing).toBeNull();
  });

  it("reports malformed and empty JSON clearly", () => {
    expect(() => parseBallot("{")).toThrow(/not valid JSON/i);
    expect(() => parseBallot("  ")).toThrow(/nonempty/i);
    expect(() => parseBallot("[]")).toThrow(/must be an object/i);
  });

  it("rejects oversized input before parsing it", () => {
    expect(() => parseBallot(" ".repeat(1_000_001) + "{}")).toThrow(
      /too large/i,
    );
  });

  it.each(["2026-02-29", "2026-13-01", "2026-11-31", "11/03/2026", "tomorrow"])(
    "rejects invalid calendar date %s",
    (date) => {
      expect(() =>
        parseModified((ballot) => {
          ballot.electionDate = date;
        }),
      ).toThrow(/date/i);
    },
  );

  it("accepts a valid leap-day date", () => {
    expect(
      parseModified((ballot) => {
        ballot.electionDate = "2028-02-29";
      }).electionDate,
    ).toBe("2028-02-29");
  });

  it("requires actual text, a demo flag, and a usable candidate color", () => {
    expect(() =>
      parseModified((ballot) => {
        ballot.title = "";
      }),
    ).toThrow(/title cannot be empty/i);
    expect(() =>
      parseBallot(JSON.stringify({ ...fixture(), isDemo: "false" })),
    ).toThrow(/isDemo/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].candidates[0].color = "red";
      }),
    ).toThrow(/hex color/i);
  });

  it("rejects duplicate IDs within their data types", () => {
    expect(() =>
      parseModified((ballot) => {
        ballot.questions[1].id = "housing";
      }),
    ).toThrow(/duplicate ID/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[1].id = "mayor";
      }),
    ).toThrow(/duplicate ID/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[1].candidates[0].id = "alpha";
      }),
    ).toThrow(/duplicate ID/i);
  });

  it.each([-3, 3, 0.5, "1", false])(
    "rejects malformed candidate position %s",
    (value) => {
      const ballot = fixture();
      const parsed = JSON.parse(JSON.stringify(ballot));
      parsed.contests[0].candidates[0].positions.housing = value;
      expect(() => parseBallot(JSON.stringify(parsed))).toThrow(
        /must be -2, -1, 0, 1, 2, or null/i,
      );
    },
  );

  it("rejects unknown questions, unknown contests, and cross-contest positions", () => {
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].candidates[0].positions.unknown = 1;
      }),
    ).toThrow(/unknown question/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.questions[0].contestIds = ["missing"];
      }),
    ).toThrow(/unknown contest/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].candidates[0].positions.schools = 1;
      }),
    ).toThrow(/does not apply to their contest/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.questions[0].contestIds = ["mayor", "mayor"];
      }),
    ).toThrow(/more than once/i);
  });

  it("rejects invalid seat counts, empty contests, and excessive list lengths", () => {
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].seats = 0;
      }),
    ).toThrow(/seats must be/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].seats = 4;
      }),
    ).toThrow(/seats must be/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.contests = [];
      }),
    ).toThrow(/at least 1/i);
    expect(() =>
      parseModified((ballot) => {
        ballot.questions = Array(201).fill(ballot.questions[0]);
      }),
    ).toThrow(/no more than 200/i);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/secret",
    "ftp://example.org/file",
    "//example.org/source",
    "https://user:password@example.org",
  ])("rejects unsafe source URL %s", (url) => {
    expect(() =>
      parseModified((ballot) => {
        ballot.contests[0].candidates[0].sources = [{ label: "Source", url }];
      }),
    ).toThrow(/HTTP or HTTPS/i);
  });

  it("discards extra fields and rejects dangerous position keys", () => {
    const ballot = JSON.parse(JSON.stringify(fixture()));
    ballot.internalToken = "unused";
    Object.defineProperty(ballot, "__proto__", {
      value: { polluted: true },
      enumerable: true,
    });
    const parsed = parseBallot(JSON.stringify(ballot));
    expect(parsed).not.toHaveProperty("internalToken");
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(
      false,
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    ballot.contests[0].candidates[0].positions = JSON.parse('{"__proto__":2}');
    expect(() => parseBallot(JSON.stringify(ballot))).toThrow(
      /position question ID/i,
    );
  });
});
