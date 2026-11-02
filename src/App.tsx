import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  ExternalLink,
  FileJson,
  Heart,
  Info,
  Landmark,
  ListChecks,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UsersRound,
  Vote,
  X,
} from "lucide-react";
import { sampleBallot } from "./data/sample-ballot";
import { parseBallot, rankCandidates } from "./lib/ballot";
import type { Answers, Ballot, Candidate, CandidateMatch } from "./lib/ballot";

type Page = "ballot" | "priorities" | "matches";
type Dialog = "import" | "method" | "candidate" | null;
const choices = [
  "Strongly disagree",
  "Somewhat disagree",
  "Neutral",
  "Somewhat agree",
  "Strongly agree",
];
const contestIcons = [Landmark, UsersRound, BookOpen];

function Avatar({
  candidate,
  size = "normal",
}: {
  candidate: Candidate;
  size?: "normal" | "small" | "large";
}) {
  const palette = ["#d9effc", "#e5f7c2", "#bde5fa"];
  const colorIndex =
    [...candidate.id].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % palette.length;
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: palette[colorIndex], color: "#315e7a" }}
    >
      {candidate.initials}
    </span>
  );
}

function App() {
  const [ballot, setBallot] = useState<Ballot>(sampleBallot);
  const [answers, setAnswers] = useState<Answers>({});
  const [page, setPage] = useState<Page>("ballot");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeContest, setActiveContest] = useState(
    sampleBallot.contests[0].id,
  );
  const [candidateDetail, setCandidateDetail] = useState<Candidate | null>(
    null,
  );
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const answered = Object.keys(answers).length;
  const totalCandidates = ballot.contests.reduce(
    (sum, contest) => sum + contest.candidates.length,
    0,
  );
  const currentQuestion = ballot.questions[questionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const matches = rankCandidates(ballot, answers, activeContest);
  const selectedContest = ballot.contests.find(
    (contest) => contest.id === activeContest,
  )!;
  const electionDate = new Date(
    `${ballot.electionDate}T12:00:00`,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function navigate(next: Page) {
    setPage(next);
    setMobileMenu(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openCandidate(candidate: Candidate) {
    setCandidateDetail(candidate);
    setDialog("candidate");
  }
  function answerQuestion(value: number) {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        value,
        weight: previous[currentQuestion.id]?.weight ?? 1,
      },
    }));
  }
  function toggleWeight() {
    if (!currentAnswer) return;
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        ...previous[currentQuestion.id],
        weight: currentAnswer.weight === 2 ? 1 : 2,
      },
    }));
  }
  function advance() {
    if (questionIndex < ballot.questions.length - 1)
      setQuestionIndex(questionIndex + 1);
    else navigate("matches");
  }
  function skipQuestion() {
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[currentQuestion.id];
      return next;
    });
    advance();
  }
  function download(data: unknown, filename: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function importBallot() {
    try {
      const imported = parseBallot(importText);
      setBallot(imported);
      setAnswers({});
      setQuestionIndex(0);
      setActiveContest(imported.contests[0].id);
      setDialog(null);
      navigate("ballot");
      setImportText("");
      setImportError("");
      setNotice("Ballot imported. Answers cleared.");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Could not read this ballot. Check the JSON format.",
      );
    }
  }
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1000000) {
      setImportError("Choose a JSON file smaller than 1 MB.");
      return;
    }
    try {
      setImportText(await file.text());
      setImportError("");
    } catch {
      setImportError("We could not read that file. Try selecting it again.");
    }
    event.target.value = "";
  }
  function resetAnswers() {
    setAnswers({});
    setQuestionIndex(0);
    setNotice("Answers cleared.");
    navigate("priorities");
  }
  function restoreSample() {
    setBallot(sampleBallot);
    setAnswers({});
    setQuestionIndex(0);
    setActiveContest(sampleBallot.contests[0].id);
    navigate("ballot");
    setNotice("Sample ballot restored.");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("ballot");
          }}
        >
          <span className="brand-mark">
            <Vote size={24} strokeWidth={1.8} />
          </span>
          ballotwise<span className="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "ballot", label: "Ballot", icon: ClipboardCheck },
              {
                id: "priorities",
                label: "Priorities",
                icon: SlidersHorizontal,
              },
              { id: "matches", label: "Matches", icon: UsersRound },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === "matches" && answered > 0 ? (
                <span className="nav-count">{ballot.contests.length}</span>
              ) : (
                <ChevronRight className="nav-chevron" size={15} />
              )}
            </button>
          ))}
        </nav>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={22} />
          </button>

          <button
            className="icon-button header-help"
            aria-label="Scoring and privacy"
            onClick={() => setDialog("method")}
          >
            <CircleHelp size={18} />
          </button>
        </header>
        <main id="main-content" ref={mainRef}>
          {notice && (
            <div className="notice" role="status">
              <Check size={17} />
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === "ballot" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Ballot</h1>
                </div>
                <div className="heading-actions">
                  <button
                    className="button button-dark"
                    onClick={() => navigate("priorities")}
                  >
                    {answered ? "Continue" : "Answer questions"}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="button button-white import-top"
                    onClick={() => {
                      setImportError("");
                      setDialog("import");
                    }}
                  >
                    <Upload size={16} /> Import
                  </button>
                </div>
              </div>
              <section className="ballot-section">
                <div className="section-title-row">
                  <h2>{ballot.title}</h2>
                  <span className="pill demo-pill">
                    {ballot.isDemo ? (
                      <>
                        <span /> SAMPLE BALLOT
                      </>
                    ) : (
                      <>
                        <FileJson size={12} /> IMPORTED BALLOT
                      </>
                    )}
                  </span>
                </div>
                <div className="election-bar">
                  <span className="election-icon">
                    <MapPin size={20} />
                  </span>
                  <div>
                    <strong>{ballot.location}</strong>
                    <span>{electionDate}</span>
                  </div>
                  <button
                    onClick={() => {
                      setImportError("");
                      setDialog("import");
                    }}
                  >
                    Change ballot
                    <ChevronDown size={15} />
                  </button>
                </div>
                <div className="ballot-toolbar">
                  <div className="ballot-tabs">
                    <span className="selected">
                      Contests <b>{ballot.contests.length}</b>
                    </span>
                    <span className="ballot-candidate-total">
                      {totalCandidates} candidates
                    </span>
                  </div>
                  <label className="search-box">
                    <Search size={16} />
                    <input
                      aria-label="Search contests or candidates"
                      placeholder="Search ballot"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    {search && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>
                </div>
                <div className="contest-grid">
                  {ballot.contests
                    .filter((contest) =>
                      `${contest.title} ${contest.candidates.map((candidate) => candidate.name).join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((contest, index) => {
                      const Icon = contestIcons[index % 3];
                      return (
                        <article className="contest-card" key={contest.id}>
                          <div className="contest-card-top">
                            <span
                              className={`contest-icon contest-color-${index % 3}`}
                            >
                              <Icon size={21} />
                            </span>
                            <span className="seat-label">
                              {contest.seats}{" "}
                              {contest.seats === 1 ? "seat" : "seats"} open
                            </span>
                          </div>
                          <h3>{contest.title}</h3>
                          <p>{contest.description}</p>
                          <div className="candidate-stack">
                            {contest.candidates.slice(0, 4).map((candidate) => (
                              <Avatar
                                key={candidate.id}
                                candidate={candidate}
                                size="small"
                              />
                            ))}
                            <span>{contest.candidates.length} candidates</span>
                          </div>
                          <button
                            className="contest-action"
                            onClick={() => {
                              setActiveContest(contest.id);
                              navigate("matches");
                            }}
                          >
                            View candidates
                            <ArrowUpRight size={17} />
                          </button>
                        </article>
                      );
                    })}
                </div>
                {ballot.contests.filter((contest) =>
                  `${contest.title} ${contest.candidates.map((candidate) => candidate.name).join(" ")}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                ).length === 0 && (
                  <div className="empty-state">
                    <Search size={26} />
                    <h3>No races found</h3>
                    <p>Try another candidate name or contest.</p>
                    <button
                      className="text-button"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </button>
                  </div>
                )}
                <p className="sample-disclaimer">
                  <Info size={14} />
                  {ballot.isDemo
                    ? "Fictional candidates and positions."
                    : "Positions supplied in your imported ballot."}
                </p>
              </section>
            </>
          )}
          {page === "priorities" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Priorities</h1>
                </div>
                <button
                  className="button button-white"
                  onClick={() => setDialog("method")}
                >
                  <Scale size={16} /> Scoring
                </button>
              </div>
              <div className="question-layout">
                <section className="question-card">
                  <div className="question-progress">
                    <span>Questionnaire</span>
                    <span>
                      Question {questionIndex + 1}{" "}
                      <span className="muted">
                        of {ballot.questions.length}
                      </span>
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      style={{
                        width: `${((questionIndex + 1) / ballot.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="question-content" key={currentQuestion.id}>
                    <span className="pill question-topic">
                      <SlidersHorizontal size={13} />
                      {currentQuestion.topic}
                    </span>
                    <h2>{currentQuestion.title}</h2>
                    <details className="question-context">
                      <summary>Context</summary>
                      <p className="question-explanation">
                        {currentQuestion.description}
                      </p>
                    </details>
                    <fieldset className="answer-choices">
                      <legend>How much do you agree?</legend>
                      {choices.map((label, index) => (
                        <label
                          key={label}
                          className={`answer-choice ${currentAnswer?.value === index - 2 ? "is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            value={index - 2}
                            checked={currentAnswer?.value === index - 2}
                            onChange={() => answerQuestion(index - 2)}
                          />
                          <span className="radio-indicator">
                            {currentAnswer?.value === index - 2 && <span />}
                          </span>
                          <span>{label}</span>
                          <span className="choice-symbol" aria-hidden="true">
                            {index < 2 ? "−" : index === 2 ? "·" : "+"}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <button
                      className={`importance-button ${currentAnswer?.weight === 2 ? "important" : ""}`}
                      aria-pressed={currentAnswer?.weight === 2}
                      disabled={!currentAnswer}
                      onClick={toggleWeight}
                    >
                      <Heart
                        size={17}
                        fill={
                          currentAnswer?.weight === 2 ? "currentColor" : "none"
                        }
                      />
                      <span>Weight this issue ×2</span>
                      <span className="importance-check">
                        {currentAnswer?.weight === 2 && <Check size={12} />}
                      </span>
                    </button>
                    <div className="question-controls">
                      <button
                        className="back-button"
                        disabled={questionIndex === 0}
                        onClick={() => setQuestionIndex(questionIndex - 1)}
                      >
                        <ArrowLeft size={16} />
                        Back
                      </button>
                      <button className="skip-button" onClick={skipQuestion}>
                        Skip
                      </button>
                      <button
                        className="button button-dark"
                        disabled={!currentAnswer}
                        onClick={advance}
                      >
                        {questionIndex === ballot.questions.length - 1
                          ? "View matches"
                          : "Next question"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              <div className="question-footer">
                <span>
                  {answered} / {ballot.questions.length} answered
                </span>
                <button
                  className="text-button"
                  onClick={() => navigate("matches")}
                >
                  Preview matches
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
          {page === "matches" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>{answered ? "Matches" : "Candidates"}</h1>
                </div>
                <button
                  className="button button-white"
                  onClick={() => navigate("priorities")}
                >
                  <SlidersHorizontal size={16} />
                  {answered ? "Edit answers" : "Answer questions"}
                </button>
              </div>
              <div className="results-meta">
                <span>
                  {answered} / {ballot.questions.length} answered
                </span>
                {ballot.isDemo && (
                  <span className="pill demo-pill">Fictional sample</span>
                )}
              </div>
              <div className="results-layout">
                <section className="results-main">
                  <div
                    className="race-tabs"
                    role="tablist"
                    aria-label="Choose a race"
                  >
                    {ballot.contests.map((contest) => (
                      <button
                        role="tab"
                        aria-selected={activeContest === contest.id}
                        key={contest.id}
                        className={activeContest === contest.id ? "active" : ""}
                        onClick={() => setActiveContest(contest.id)}
                      >
                        {contest.title}
                      </button>
                    ))}
                  </div>
                  <div className="result-heading">
                    <div>
                      <h2>{selectedContest.title}</h2>
                      <span>
                        {selectedContest.candidates.length} candidates{" "}
                        <span>·</span> {selectedContest.seats}{" "}
                        {selectedContest.seats === 1 ? "seat" : "seats"} open
                      </span>
                    </div>
                    {answered > 0 && (
                      <span className="sort-label">
                        <ListChecks size={15} /> By alignment
                      </span>
                    )}
                  </div>
                  <div className="candidate-results">
                    {matches.map((match, index) => {
                      const rank =
                        match.score === null
                          ? null
                          : matches.findIndex(
                              (other) => other.score === match.score,
                            ) + 1;
                      const tied =
                        match.score !== null &&
                        matches.filter((other) => other.score === match.score)
                          .length > 1;
                      return (
                        <article
                          className={`match-card ${index === 0 && match.score !== null ? "leading" : ""}`}
                          key={match.candidate.id}
                        >
                          <div className="match-main">
                            <span className="rank-number">{rank ?? "—"}</span>
                            <Avatar candidate={match.candidate} />
                            <div className="candidate-identity">
                              <h3>
                                <button
                                  onClick={() => openCandidate(match.candidate)}
                                >
                                  {match.candidate.name}
                                </button>
                              </h3>
                              <p>{match.candidate.party}</p>
                            </div>
                            <div
                              className={`match-score ${match.score === null ? "unknown-score" : ""}`}
                            >
                              <strong>
                                {match.score === null ? "—" : `${match.score}%`}
                              </strong>
                              <span>
                                {match.score === null
                                  ? match.answeredCount > 0
                                    ? "No known positions"
                                    : "Answer to compare"
                                  : tied
                                    ? "alignment · tied"
                                    : "alignment"}
                              </span>
                            </div>
                          </div>

                          <div className="match-card-bottom">
                            <span
                              className={
                                match.coverage < 100
                                  ? "coverage limited"
                                  : "coverage"
                              }
                            >
                              <span />
                              {match.comparedCount} of {match.answeredCount}{" "}
                              positions compared
                              {match.coverage < 100 && match.answeredCount > 0
                                ? " · Limited data"
                                : ""}
                            </span>
                            <button
                              onClick={() => openCandidate(match.candidate)}
                            >
                              View comparison
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                          {match.score !== null && match.comparedCount < 3 && (
                            <p className="sparse-warning">
                              Limited sample: fewer than 3 positions compared.
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
              <div className="bottom-promise">
                {answered > 0 && (
                  <button className="reset-button" onClick={resetAnswers}>
                    <RotateCcw size={14} />
                    Clear answers
                  </button>
                )}
                <button
                  onClick={() =>
                    download(
                      {
                        ballot: {
                          id: ballot.id,
                          title: ballot.title,
                          isDemo: ballot.isDemo,
                        },
                        answers,
                        results: ballot.contests.map((contest) => ({
                          contest: contest.title,
                          candidates: rankCandidates(
                            ballot,
                            answers,
                            contest.id,
                          ).map((match) => ({
                            name: match.candidate.name,
                            alignment: match.score,
                            coverage: match.coverage,
                            comparedPositions: match.comparedCount,
                          })),
                        })),
                      },
                      "ballotwise-comparison.json",
                    )
                  }
                >
                  <ArrowDownToLine size={14} /> Export comparison
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      {dialog && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <Modal dialog={dialog} close={() => setDialog(null)}>
            {dialog === "import" && (
              <>
                <span className="modal-icon">
                  <Upload size={24} />
                </span>
                <h2>Import ballot</h2>
                <p>Importing replaces your ballot and clears your answers.</p>
                <button
                  className="upload-area"
                  onClick={() => fileInput.current?.click()}
                >
                  <FileJson size={26} />
                  <strong>Choose a ballot JSON file</strong>
                  <span>Up to 1 MB · processed in your browser</span>
                  <Plus size={18} />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  className="visually-hidden"
                  onChange={readFile}
                />
                <label className="import-label" htmlFor="ballot-json">
                  Or paste your ballot JSON
                </label>
                <textarea
                  id="ballot-json"
                  spellCheck={false}
                  value={importText}
                  onChange={(event) => {
                    setImportText(event.target.value);
                    setImportError("");
                  }}
                  placeholder={
                    '{\n  "title": "Your election",\n  "contests": [...],\n  "questions": [...]\n}'
                  }
                />
                {importError && (
                  <p role="alert" className="error-message">
                    <Info size={16} />
                    {importError}
                  </p>
                )}
                <div className="import-help">
                  <Info size={16} />
                  <span>
                    <button
                      onClick={() =>
                        download(sampleBallot, "ballotwise-sample.json")
                      }
                    >
                      Download the sample JSON
                    </button>
                    . JSON only; PDFs and photos are not supported.
                  </span>
                </div>
                <div className="modal-actions">
                  <button
                    className="text-button"
                    onClick={() => {
                      restoreSample();
                      setDialog(null);
                    }}
                  >
                    Use sample ballot
                  </button>
                  <button
                    className="button button-dark"
                    disabled={!importText.trim()}
                    onClick={importBallot}
                  >
                    Import ballot
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {dialog === "method" && (
              <>
                <span className="modal-icon">
                  <Scale size={25} />
                </span>
                <h2>Scoring</h2>
                <p>
                  Alignment = 100 × (1 − weighted average position distance ÷
                  4). Positions range from −2 to +2. Weighted issues count
                  twice.
                </p>
                <p>
                  Skipped answers and unknown positions are excluded. Coverage
                  shows how much candidate data supports a score. Tied scores
                  share a rank.
                </p>
                <h3 className="detail-heading method-privacy-heading">
                  Privacy
                </h3>
                <p>
                  Answers remain in this tab. Refreshing clears them and any
                  imported ballot.
                </p>
                <p className="method-disclaimer">
                  Scores compare issue positions, not overall candidate
                  suitability. Sample candidates are fictional; imported
                  positions are not independently verified.
                </p>
                <button
                  className="button button-dark full-width"
                  onClick={() => setDialog(null)}
                >
                  Close
                </button>
              </>
            )}
            {dialog === "candidate" && candidateDetail && (
              <CandidateDialog
                ballot={ballot}
                answers={answers}
                candidate={candidateDetail}
              />
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}

function Modal({
  children,
  close,
  dialog,
}: {
  children: React.ReactNode;
  close: () => void;
  dialog: Dialog;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), textarea, [tabindex="0"]',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === modalRef.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={
        dialog === "import"
          ? "Import a ballot"
          : dialog === "method"
            ? "How matching works"
            : "Candidate comparison"
      }
      className={`modal ${dialog === "candidate" ? "candidate-modal" : ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        className="modal-close icon-button"
        aria-label="Close dialog"
        onClick={close}
      >
        <X size={21} />
      </button>
      {children}
    </div>
  );
}

function CandidateDialog({
  ballot,
  answers,
  candidate,
}: {
  ballot: Ballot;
  answers: Answers;
  candidate: Candidate;
}) {
  const contest = ballot.contests.find((item) =>
    item.candidates.some((person) => person.id === candidate.id),
  )!;
  const match: CandidateMatch = rankCandidates(
    ballot,
    answers,
    contest.id,
  ).find((item) => item.candidate.id === candidate.id)!;
  const questions = ballot.questions.filter((question) =>
    question.contestIds.includes(contest.id),
  );
  return (
    <>
      <div className="candidate-modal-header">
        <Avatar candidate={candidate} size="large" />
        <div>
          <div className="eyebrow">{contest.title}</div>
          <h2>{candidate.name}</h2>
          <p>{candidate.party}</p>
        </div>
      </div>
      <p>{candidate.bio}</p>
      {ballot.isDemo && (
        <div className="candidate-demo-label">
          <Sparkles size={14} /> Fictional candidate · demonstration data
        </div>
      )}
      <div className="candidate-detail-stats">
        <div>
          <strong>{match.score === null ? "—" : `${match.score}%`}</strong>
          <span>issue alignment</span>
        </div>
        <div>
          <strong>{match.coverage}%</strong>
          <span>weighted data coverage</span>
        </div>
        <div>
          <strong>{match.comparedCount}</strong>
          <span>positions compared</span>
        </div>
      </div>
      <h3 className="detail-heading">Positions</h3>
      <p className="detail-caption">Agreement scale: −2 to +2.</p>
      <div className="comparison-list">
        {questions.map((question) => {
          const answer = answers[question.id];
          const position = candidate.positions[question.id];
          const known = position !== undefined && position !== null;
          return (
            <div className="comparison-row" key={question.id}>
              <div>
                <strong>{question.topic}</strong>
                <p>{question.title}</p>
              </div>
              <div className="comparison-positions">
                <span>
                  You{" "}
                  <b>{answer ? choices[answer.value + 2] : "Not answered"}</b>
                  {answer?.weight === 2 && <Heart size={12} />}
                </span>
                <span>
                  {candidate.name.split(" ")[0]}{" "}
                  <b>
                    {known ? choices[position + 2] : "No documented position"}
                  </b>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="detail-heading">Position sources</h3>
      {candidate.sources.length ? (
        <div className="source-links">
          {candidate.sources.map((source, index) => (
            <a
              key={`${source.url}-${index}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.label}
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      ) : (
        <p className="source-empty">
          {ballot.isDemo
            ? "Fictional sample; no sources."
            : "No sources supplied."}
        </p>
      )}
    </>
  );
}

export default App;
