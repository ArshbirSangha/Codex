import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileJson,
  Fingerprint,
  Heart,
  Info,
  Landmark,
  Leaf,
  ListChecks,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
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

function BallotIllustration() {
  return (
    <div className="ballot-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✦</span>
      <div className="art-leaf leaf-one" />
      <div className="art-leaf leaf-two" />
      <div className="illustrated-paper">
        <div className="paper-top">
          <span className="paper-logo">
            <Vote size={17} />
          </span>
          <span>YOUR BALLOT</span>
          <span className="paper-dot" />
        </div>
        <div className="paper-heading">
          A little clarity.
          <br />A lot of possibility.
        </div>
        <div className="paper-line long" />
        <div className="paper-line short" />
        {[0, 1, 2].map((i) => (
          <div className="paper-choice" key={i}>
            <span
              className={i === 1 ? "paper-checkbox selected" : "paper-checkbox"}
            >
              {i === 1 && <Check size={17} strokeWidth={3} />}
            </span>
            <div>
              <div className="paper-line" />
              <div className="paper-line small" />
            </div>
          </div>
        ))}
        <div className="paper-footer">MAKE YOUR MARK.</div>
      </div>
      <div className="art-badge">
        <span>
          <CheckCheck size={19} />
        </span>
        <div>
          Your values.
          <br />
          <strong>Your voice.</strong>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  candidate,
  size = "normal",
}: {
  candidate: Candidate;
  size?: "normal" | "small" | "large";
}) {
  const color = /^#[0-9a-fA-F]{6}$/.test(candidate.color) ? candidate.color : "#e4e9df";
  const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  const brightness = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114;
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: color, color: brightness < 155 ? "#ffffff" : "#263a34" }}
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
  const progress = Math.round((answered / ballot.questions.length) * 100);
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
      setNotice("Your ballot is ready. Previous answers have been cleared.");
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
    setNotice("Your answers have been cleared.");
    navigate("priorities");
  }
  function restoreSample() {
    setBallot(sampleBallot);
    setAnswers({});
    setQuestionIndex(0);
    setActiveContest(sampleBallot.contests[0].id);
    navigate("ballot");
    setNotice("The fictional sample ballot has been restored.");
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
        <div className="sidebar-section-label">YOUR VOTING COMPANION</div>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "ballot", label: "My ballot", icon: ClipboardCheck },
              {
                id: "priorities",
                label: "My priorities",
                icon: SlidersHorizontal,
              },
              { id: "matches", label: "My matches", icon: UsersRound },
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
        <div className="sidebar-note">
          <span className="note-icon">
            <Sparkles size={19} />
          </span>
          <h3>
            A little reflection.
            <br />A more confident vote.
          </h3>
          <p>
            You bring your values.
            <br />
            We help connect the dots.
          </p>
          <button
            onClick={() => {
              setQuestionIndex(0);
              navigate("priorities");
            }}
          >
            Find my matches <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="independent-label">
            <span />
            Independent. Always.
          </div>
          <button onClick={() => setDialog("method")}>
            <CircleHelp size={17} /> About Ballotwise <ArrowUpRight size={14} />
          </button>
          <p>Made for a more informed you.</p>
        </div>
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
          <span className="topbar-tagline">
            A little clarity for your next big decision.
          </span>
          <div className="topbar-actions">
            <button className="how-button" onClick={() => setDialog("method")}>
              <CircleHelp size={16} />
              <span>How it works</span>
            </button>
            <span className="topbar-divider" />
            <div className="private-label">
              <ShieldCheck size={16} />
              <span>Private by design</span>
            </div>
          </div>
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
                  <div className="eyebrow">YOUR VOICE. YOUR VOTE.</div>
                  <h1>
                    Good decisions start here<span>.</span>
                  </h1>
                  <p>
                    Get to know your ballot. Find where you stand. Vote with
                    confidence.
                  </p>
                </div>
                <button
                  className="button button-white import-top"
                  onClick={() => {
                    setImportError("");
                    setDialog("import");
                  }}
                >
                  <Upload size={16} /> Import a ballot
                </button>
              </div>
              <section className="hero-card">
                <div className="hero-copy">
                  <span className="pill hero-pill">
                    <span />A VOTE THAT FEELS LIKE YOU
                  </span>
                  <h2>
                    Your ballot.
                    <br />
                    Your values.
                    <br />
                    <span>A clearer choice.</span>
                  </h2>
                  <p>
                    A few thoughtful questions can bring your ballot into focus.
                    See which candidates align with what matters to you.
                  </p>
                  <button
                    className="button button-dark"
                    onClick={() => {
                      setQuestionIndex(0);
                      navigate("priorities");
                    }}
                  >
                    {answered ? "Continue my questions" : "Discover my matches"}
                    <ArrowRight size={17} />
                  </button>
                  <span className="hero-meta">
                    <Clock3 size={13} /> About 3 minutes <span>·</span> No
                    sign-up needed
                  </span>
                </div>
                <BallotIllustration />
              </section>
              <section
                className="journey-grid"
                aria-label="How Ballotwise works"
              >
                <div>
                  <span className="step-icon sage">
                    <ClipboardCheck size={20} />
                  </span>
                  <div>
                    <h3>
                      <span>01</span> Explore your ballot
                    </h3>
                    <p>The people and decisions on your ballot.</p>
                  </div>
                </div>
                <div>
                  <span className="step-icon sand">
                    <SlidersHorizontal size={20} />
                  </span>
                  <div>
                    <h3>
                      <span>02</span> Share your priorities
                    </h3>
                    <p>A few questions. The issues you care about.</p>
                  </div>
                </div>
                <div>
                  <span className="step-icon lavender">
                    <UsersRound size={20} />
                  </span>
                  <div>
                    <h3>
                      <span>03</span> Find your alignment
                    </h3>
                    <p>Compare candidates, on your terms.</p>
                  </div>
                </div>
              </section>
              <section className="ballot-section">
                <div className="section-title-row">
                  <div>
                    <h2>A closer look at your ballot</h2>
                    <p>Get familiar with the choices ahead.</p>
                  </div>
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
                    <span>
                      {ballot.title} <span className="dot-separator">·</span>{" "}
                      {electionDate}
                    </span>
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
                      {totalCandidates} candidates to explore
                    </span>
                  </div>
                  <label className="search-box">
                    <Search size={16} />
                    <input
                      aria-label="Search contests or candidates"
                      placeholder="Find a race or candidate"
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
                            Explore this race
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
                {ballot.isDemo ? (
                  <p className="sample-disclaimer">
                    <Info size={14} />
                    <span>
                      A little practice before the real thing. This sample uses
                      fictional candidates and positions.{" "}
                      <button onClick={() => setDialog("import")}>
                        Bring your own ballot <ArrowUpRight size={12} />
                      </button>
                    </span>
                  </p>
                ) : (
                  <p className="sample-disclaimer">
                    <Info size={14} />
                    <span>
                      Imported ballot data is supplied by you. Check candidate
                      position sources before relying on a match.
                    </span>
                  </p>
                )}
              </section>
              <div className="bottom-promise">
                <span>
                  <Fingerprint size={18} /> Your opinions stay in this tab.
                </span>
                <span>No parties to please. Just your priorities.</span>
                <Leaf size={16} />
              </div>
            </>
          )}
          {page === "priorities" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    A FEW QUESTIONS. A LITTLE CLARITY.
                  </div>
                  <h1>
                    What matters to you<span>?</span>
                  </h1>
                  <p>
                    No right answers. No labels. Just your perspective on the
                    issues.
                  </p>
                </div>
                <button
                  className="button button-white"
                  onClick={() => setDialog("method")}
                >
                  <Scale size={16} /> How we match
                </button>
              </div>
              <div className="question-layout">
                <section className="question-card">
                  <div className="question-progress">
                    <span>YOUR PRIORITIES</span>
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
                    <p className="question-explanation">
                      {currentQuestion.description}
                    </p>
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
                          <span className="choice-symbol">
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
                      <span>This issue is especially important to me</span>
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
                        Skip this question
                      </button>
                      <button
                        className="button button-dark"
                        disabled={!currentAnswer}
                        onClick={advance}
                      >
                        {questionIndex === ballot.questions.length - 1
                          ? "See my matches"
                          : "Next question"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                </section>
                <aside className="question-aside">
                  <span className="aside-illustration">
                    <Heart size={29} strokeWidth={1.4} />
                    <Sparkles size={18} />
                  </span>
                  <h3>
                    Your perspective
                    <br />
                    belongs here.
                  </h3>
                  <p>
                    Think about the community you want to live in. We’ll connect
                    your answers to candidate positions.
                  </p>
                  <div className="aside-rule" />
                  <div className="aside-point">
                    <Check size={16} />
                    <span>Skip anything you’re unsure about.</span>
                  </div>
                  <div className="aside-point">
                    <Check size={16} />
                    <span>Give extra weight to your biggest priorities.</span>
                  </div>
                  <div className="aside-point">
                    <Check size={16} />
                    <span>Come back and change your answers anytime.</span>
                  </div>
                  <div className="answer-count">
                    <strong>
                      {answered}
                      <span> / {ballot.questions.length}</span>
                    </strong>
                    <span>questions answered</span>
                    <div className="progress-track">
                      <div style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("matches")}
                  >
                    Preview my matches
                    <ArrowRight size={15} />
                  </button>
                </aside>
              </div>
              <div className="privacy-note">
                <ShieldCheck size={16} /> Your answers stay in this browser tab
                and disappear when you close or refresh it.
              </div>
            </>
          )}
          {page === "matches" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR VALUES, IN PERSPECTIVE.</div>
                  <h1>
                    {answered ? "Meet your matches" : "Meet the candidates"}
                    <span>.</span>
                  </h1>
                  <p>
                    {answered
                      ? "A starting point for your research, shaped by what matters to you."
                      : "Explore each race, then share your priorities to see your alignment."}
                  </p>
                </div>
                <button
                  className="button button-white"
                  onClick={() => navigate("priorities")}
                >
                  <SlidersHorizontal size={16} />
                  {answered ? "Edit my answers" : "Answer questions"}
                </button>
              </div>
              {ballot.isDemo && (
                <div className="demo-banner">
                  <Sparkles size={18} />
                  <span>
                    <strong>A practice ballot.</strong> All candidates and
                    positions shown here are fictional.
                  </span>
                  <button onClick={() => setDialog("import")}>
                    Import your ballot
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
              <div className="match-summary">
                <div className="summary-icon">
                  <CheckCheck size={25} />
                </div>
                <div>
                  <h3>
                    {answered
                      ? "Your priorities are taking shape."
                      : "Your priorities bring the picture into focus."}
                  </h3>
                  <p>
                    {answered
                      ? `${answered} of ${ballot.questions.length} questions answered. You can refine your answers anytime.`
                      : "Answer a few questions to compare your views with each candidate’s positions."}
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("priorities")}
                >
                  {answered === ballot.questions.length
                    ? "Review answers"
                    : "Keep exploring"}
                  <ArrowRight size={16} />
                </button>
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
                                  ? match.answeredCount > 0 ? "No known positions" : "Answer to compare"
                                  : tied
                                    ? "alignment · tied"
                                    : "alignment"}
                              </span>
                            </div>
                          </div>
                          <p className="candidate-bio">{match.candidate.bio}</p>
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
                              answered positions known
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
                              Early match: based on fewer than 3 positions.
                              Answer more questions before drawing conclusions.
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
                <aside className="results-aside">
                  <span className="aside-icon">
                    <Scale size={23} />
                  </span>
                  <h3>
                    A match is a<br />
                    starting point.
                  </h3>
                  <p>
                    These results compare issue positions. They don’t measure a
                    candidate’s experience, character, or ability to deliver.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setDialog("method")}
                  >
                    Understand the math
                    <ArrowUpRight size={14} />
                  </button>
                  <div className="aside-rule" />
                  <h4>Keep your curiosity.</h4>
                  <p>
                    Read the sources. Explore a candidate’s record. There’s more
                    to a good choice than a percentage.
                  </p>
                  {answered > 0 && (
                    <button className="reset-button" onClick={resetAnswers}>
                      <RotateCcw size={14} /> Clear my answers
                    </button>
                  )}
                </aside>
              </div>
              <div className="bottom-promise">
                <span>
                  <ShieldCheck size={18} /> Independent comparisons. Your
                  decision.
                </span>
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
          <footer>
            <a
              className="footer-brand"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                navigate("ballot");
              }}
            >
              ballotwise.
            </a>
            <span>A clearer ballot. A more confident you.</span>
            <button onClick={() => setDialog("method")}>
              Our approach
              <ArrowUpRight size={12} />
            </button>
          </footer>
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
                <div className="eyebrow">BRING YOUR BALLOT</div>
                <h2>A ballot of your own.</h2>
                <p>
                  Import structured ballot data with candidates, issue
                  questions, and documented positions. Importing replaces this
                  ballot and clears your answers.
                </p>
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
                    Need the format?{" "}
                    <button
                      onClick={() =>
                        download(sampleBallot, "ballotwise-sample.json")
                      }
                    >
                      Download the sample JSON
                    </button>
                    . Replace fictional data with verified candidate positions
                    and source links. PDFs and photos need to be converted to
                    this format first.
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
                <div className="eyebrow">TRANSPARENT BY DESIGN</div>
                <h2>Your values. Clear comparisons.</h2>
                <p>
                  Ballotwise helps you explore candidate alignment using only
                  the issue opinions you choose to share.
                </p>
                <div className="method-step">
                  <span>01</span>
                  <div>
                    <h3>You set the priorities</h3>
                    <p>
                      Choose a position from strongly disagree (−2) to strongly
                      agree (+2). An especially important issue counts twice.
                    </p>
                  </div>
                </div>
                <div className="method-step">
                  <span>02</span>
                  <div>
                    <h3>We compare documented positions</h3>
                    <p>
                      For each race, alignment is 100 × (1 − weighted average
                      distance ÷ 4). Identical positions align 100%; opposite
                      positions align 0%.
                    </p>
                  </div>
                </div>
                <div className="method-step">
                  <span>03</span>
                  <div>
                    <h3>You see the full picture</h3>
                    <p>
                      Skipped answers and unknown positions don’t affect scores.
                      We show how much information supports each match. Equal
                      scores share a rank.
                    </p>
                  </div>
                </div>
                <div className="method-note">
                  <ShieldCheck size={20} />
                  <p>
                    Your answers stay in this tab. No account, tracking, or
                    opinion data sent to a server. Refreshing clears your
                    answers and imported ballot.
                  </p>
                </div>
                <p className="method-disclaimer">
                  This is an issue comparison tool, not a voting recommendation
                  or an official election resource. Sample candidates are
                  fictional. Imported data should be checked against reliable
                  sources.
                </p>
                <button
                  className="button button-dark full-width"
                  onClick={() => setDialog(null)}
                >
                  Sounds good
                  <Check size={16} />
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
      <h3 className="detail-heading">Where your views meet</h3>
      <p className="detail-caption">
        Positions use the same five-point agreement scale as your answers.
      </p>
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
            ? "This is fictional example data; there are no real-world sources."
            : "No source links supplied. Verify these positions independently before relying on this comparison."}
        </p>
      )}
    </>
  );
}

export default App;
