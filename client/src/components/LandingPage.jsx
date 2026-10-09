import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  BookOpenCheck,
  Check,
  FileSearch,
  GraduationCap,
  Menu,
  MessageCircle,
  MessageSquareText,
  Search,
  WalletCards,
  X,
} from "lucide-react";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event) => setReduced(event.matches);
    setReduced(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return reduced;
}

export function useReveal(rootRef) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const elements = root.querySelectorAll("[data-reveal]");

    if (reduced || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootRef, reduced]);
}

export function usePointerFx(rootRef) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      reduced ||
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return undefined;
    }

    let activeGlow;
    let activeMagnetic;
    let activeTilt;
    const reset = (element, properties) => {
      if (!element) return;
      properties.forEach((property) => element.style.removeProperty(property));
    };
    const withinRoot = (element) => element && root.contains(element);
    const getClosest = (target, selector) => {
      if (!(target instanceof Element)) return null;
      const element = target.closest(selector);
      return withinRoot(element) ? element : null;
    };
    const setPoint = (element, event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const horizontal = rect.width ? (x / rect.width - 0.5) * 2 : 0;
      const vertical = rect.height ? (y / rect.height - 0.5) * 2 : 0;
      return { x, y, horizontal, vertical };
    };

    const onPointerMove = (event) => {
      const glow = getClosest(event.target, "[data-glow]");
      if (activeGlow !== glow) {
        reset(activeGlow, ["--mx", "--my"]);
        activeGlow = glow;
      }
      if (glow) {
        const point = setPoint(glow, event);
        glow.style.setProperty("--mx", `${point.x}px`);
        glow.style.setProperty("--my", `${point.y}px`);
      }

      const magnetic = getClosest(event.target, "[data-magnetic]");
      if (activeMagnetic !== magnetic) {
        reset(activeMagnetic, ["--tx", "--ty"]);
        activeMagnetic = magnetic;
      }
      if (magnetic) {
        const point = setPoint(magnetic, event);
        magnetic.style.setProperty("--tx", `${point.horizontal * 5}px`);
        magnetic.style.setProperty("--ty", `${point.vertical * 5}px`);
      }

      const tilt = getClosest(event.target, "[data-tilt]");
      if (activeTilt !== tilt) {
        reset(activeTilt, ["--tilt-x", "--tilt-y"]);
        activeTilt = tilt;
      }
      if (tilt) {
        const point = setPoint(tilt, event);
        tilt.style.setProperty("--tilt-x", `${point.vertical * -5}deg`);
        tilt.style.setProperty("--tilt-y", `${point.horizontal * 5}deg`);
      }
    };

    const onPointerOut = (event) => {
      const leaving = (element, selector, properties, active) => {
        if (
          element &&
          element.matches(selector) &&
          !element.contains(event.relatedTarget)
        ) {
          reset(element, properties);
          return null;
        }
        return active;
      };
      activeGlow = leaving(activeGlow, "[data-glow]", ["--mx", "--my"], activeGlow);
      activeMagnetic = leaving(activeMagnetic, "[data-magnetic]", ["--tx", "--ty"], activeMagnetic);
      activeTilt = leaving(activeTilt, "[data-tilt]", ["--tilt-x", "--tilt-y"], activeTilt);
    };

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerout", onPointerOut);
    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerout", onPointerOut);
      reset(activeGlow, ["--mx", "--my"]);
      reset(activeMagnetic, ["--tx", "--ty"]);
      reset(activeTilt, ["--tilt-x", "--tilt-y"]);
    };
  }, [rootRef, reduced]);
}

export function useScrollState(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const progress = root.querySelector("[data-scroll-progress]");
    const nav = root.querySelector("[data-scroll-nav]");
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        const amount =
          scrollableHeight > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
            : 0;
        progress.style.transform = `scaleX(${amount})`;
      }
      nav?.classList.toggle("is-scrolled", window.scrollY > 16);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [rootRef]);
}

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
];

const FEATURES = [
  {
    Icon: BookOpenCheck,
    title: "Academic Answers",
    description: "Get answers about attendance, exams, courses, grading and academic rules.",
  },
  {
    Icon: WalletCards,
    title: "Fee Information",
    description: "Find information about tuition fees, payments, refunds and scholarships.",
  },
  {
    Icon: FileSearch,
    title: "Document-Based Answers",
    description: "CampusAI finds relevant context in your college documents before it answers.",
  },
  {
    Icon: Bot,
    title: "AI-Powered Assistance",
    description: "Ask questions naturally and get helpful, contextual responses.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Ask",
    description: "Ask your college-related question in your own words.",
    Icon: MessageCircle,
  },
  {
    number: "02",
    title: "Retrieve",
    description: "CampusAI finds relevant information from college documents.",
    Icon: Search,
  },
  {
    number: "03",
    title: "Answer",
    description: "AI turns that context into a clear, helpful response.",
    Icon: MessageSquareText,
  },
];

const TECHNOLOGIES = ["React", "FastAPI", "LangGraph", "LangChain", "FAISS", "Hugging Face", "Groq"];

/* The hero demo cycles through the same three routes the chat uses. */
const DEMOS = [
  {
    context: "Academic handbook",
    Icon: BookOpenCheck,
    question: "What are the attendance requirements?",
    answer:
      "According to the academic handbook, students must meet the required attendance criteria to be eligible for examinations.",
    source: "From your college handbook",
  },
  {
    context: "Fee structure",
    Icon: WalletCards,
    question: "When is the tuition fee due?",
    answer: "Tuition amounts, payment methods and due dates are listed in the fee structure document.",
    source: "From your fee structure",
  },
  {
    context: "General knowledge",
    Icon: Bot,
    question: "How do I plan a study week?",
    answer: "Start with the subjects that have the nearest deadlines, then keep short daily slots for revision.",
    source: "General knowledge",
  },
];

const PHASE_STATUS = {
  typing: "Ready to help",
  thinking: "Searching your documents",
  answering: "Writing the answer",
  done: "Ready to help",
  leaving: "Ready to help",
};

/** Splits a line into words that rise out of a mask, one after another. */
function RevealWords({ text, delay = 0 }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      <span className="word">
        <span className="word-inner" style={{ "--d": `${delay + index * 80}ms` }}>
          {word}
        </span>
      </span>{" "}
    </Fragment>
  ));
}

/** typing -> thinking -> answering -> done -> leaving, then the next demo. */
function useDemoLoop(demos, enabled) {
  const [state, setState] = useState({ index: 0, typed: 0, words: 0, phase: "typing" });

  useEffect(() => {
    if (!enabled) return undefined;
    const demo = demos[state.index];
    const wordCount = demo.answer.split(" ").length;
    let timer;

    if (state.phase === "typing") {
      timer =
        state.typed < demo.question.length
          ? setTimeout(() => setState((s) => ({ ...s, typed: s.typed + 1 })), 38)
          : setTimeout(() => setState((s) => ({ ...s, phase: "thinking" })), 380);
    } else if (state.phase === "thinking") {
      timer = setTimeout(() => setState((s) => ({ ...s, phase: "answering" })), 1250);
    } else if (state.phase === "answering") {
      timer =
        state.words < wordCount
          ? setTimeout(() => setState((s) => ({ ...s, words: s.words + 1 })), 58)
          : setTimeout(() => setState((s) => ({ ...s, phase: "done" })), 260);
    } else if (state.phase === "done") {
      timer = setTimeout(() => setState((s) => ({ ...s, phase: "leaving" })), 3600);
    } else {
      timer = setTimeout(
        () => setState({ index: (state.index + 1) % demos.length, typed: 0, words: 0, phase: "typing" }),
        520,
      );
    }
    return () => clearTimeout(timer);
  }, [state, enabled, demos]);

  return state;
}

function HeroDemo() {
  const reduced = useReducedMotion();
  const state = useDemoLoop(DEMOS, !reduced);
  const demo = DEMOS[state.index];
  const DemoIcon = demo.Icon;

  const phase = reduced ? "done" : state.phase;
  const typedQuestion = reduced ? demo.question : demo.question.slice(0, state.typed);
  const shownAnswer = reduced ? demo.answer : demo.answer.split(" ").slice(0, state.words).join(" ");
  const showThread = phase !== "typing";

  return (
    <div className={`preview-card is-${phase}`}>
      <div className="preview-header">
        <div className="preview-assistant-mark">
          <GraduationCap size={19} />
        </div>
        <div className="preview-title">
          <strong>CampusAI</strong>
          <span>
            <span className="status-dot" /> {PHASE_STATUS[phase]}
          </span>
        </div>
        <span className="preview-menu">•••</span>
      </div>

      <div className="preview-context" key={demo.context}>
        <DemoIcon size={13} /> {demo.context}
      </div>

      <div className="preview-thread">
        {showThread && (
          <>
            <div className="preview-message student-message" key={`q-${state.index}`}>
              <span className="preview-message-label">You</span>
              {demo.question}
            </div>
            <div className="preview-answer" key={`a-${state.index}`}>
              <div className="preview-answer-icon">
                <Bot size={15} />
              </div>
              <div className="preview-answer-body">
                <span className="preview-message-label">CampusAI</span>
                {phase === "thinking" ? (
                  <span className="preview-skeleton" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <p>
                    {shownAnswer}
                    {phase === "answering" && <i className="caret" />}
                  </p>
                )}
                {(phase === "done" || phase === "leaving") && (
                  <span className="preview-source">
                    <FileSearch size={12} /> {demo.source}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="preview-input">
        <span className="preview-input-text">
          {phase === "typing" ? (
            <>
              {typedQuestion}
              <i className="caret" />
            </>
          ) : (
            "Ask a follow-up question..."
          )}
        </span>
        <span className={`preview-send ${phase === "typing" && typedQuestion ? "is-ready" : ""}`}>
          <ArrowRight size={15} />
        </span>
      </div>
      <div className="preview-footer">
        <span /> Your college knowledge, made simple
      </div>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useReveal(rootRef);
  usePointerFx(rootRef);
  useScrollState(rootRef);

  /* Highlights the nav link of the section that is currently in view. */
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const sections = NAV_LINKS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const goToChat = () => {
    setMenuOpen(false);
    onNavigate("/chat");
  };

  return (
    <div className="landing-page" ref={rootRef}>
      <div className="scroll-progress" data-scroll-progress aria-hidden="true" />

      <header className="landing-nav" data-scroll-nav>
        <div className="landing-nav-inner">
          <button className="landing-brand" onClick={() => onNavigate("/")} aria-label="CampusAI home">
            <span className="landing-brand-mark"><GraduationCap size={21} /></span>
            <span>Campus<span>AI</span></span>
          </button>

          <button
            className="landing-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <nav className={`landing-nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            {NAV_LINKS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeSection === id ? "is-active" : ""}
                aria-current={activeSection === id ? "true" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <button className="landing-nav-cta" data-magnetic onClick={goToChat}>
              Try CampusAI <ArrowRight size={16} />
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="home" data-glow>
          <div className="hero-bg" aria-hidden="true">
            <span className="hero-grid" />
          </div>

          <div className="landing-hero-inner">
            <div className="hero-copy">
              <div className="hero-status rise" style={{ "--d": "0ms" }}>
                <span className="status-dot" /> Your AI-powered college assistant
              </div>
              <h1 aria-label="Your college, one question away.">
                <span className="line" aria-hidden="true">
                  <RevealWords text="Your college," delay={140} />
                </span>
                <span className="line" aria-hidden="true">
                  <RevealWords text="one question away." delay={380} />
                </span>
              </h1>
              <p className="hero-description rise" style={{ "--d": "760ms" }}>
                Get quick answers about academics, fees, exams, attendance, courses and more —
                powered by your college documents.
              </p>
              <div className="hero-actions rise" style={{ "--d": "900ms" }}>
                <button className="button-primary" data-magnetic onClick={goToChat}>
                  Try CampusAI <ArrowRight size={18} />
                </button>
                <a className="button-secondary" href="#how-it-works">
                  How it works <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="hero-note rise" style={{ "--d": "1040ms" }}>
                <Check size={15} /> Answers grounded in your college resources
              </div>
            </div>

            <div className="hero-visual" data-tilt aria-hidden="true">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <HeroDemo />
              <div className="floating-note">
                <span className="floating-note-icon"><FileSearch size={16} /></span>
                Answers from your documents
              </div>
            </div>
          </div>
          <a className="hero-scroll-cue" href="#features"><span /> Scroll to explore</a>
        </section>

        <section className="landing-section features-section" id="features">
          <div className="features-layout">
            <div className="section-heading" data-reveal>
              <h2>The answers you need, all in one place.</h2>
              <p>Less searching. More clarity. CampusAI helps you find your way through college information.</p>
            </div>
            <div className="feature-list">
              {FEATURES.map(({ Icon, title, description }, index) => (
                <article
                  className="feature-row"
                  key={title}
                  data-glow
                  data-reveal="left"
                  style={{ "--i": index }}
                >
                  <span className="feature-icon"><Icon size={20} /></span>
                  <div className="feature-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section process-section" id="how-it-works">
          <div className="section-heading is-centered" data-reveal>
            <h2>How CampusAI works.</h2>
            <p>Useful answers are just three small steps away.</p>
          </div>
          <ol className="process-track" data-reveal="track">
            {STEPS.map(({ number, title, description, Icon }, index) => (
              <li className="process-step" key={number} style={{ "--i": index }}>
                <span className="step-node"><Icon size={19} /></span>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="technology-section" aria-labelledby="technology-title">
          <div className="technology-inner" data-reveal>
            <h2 id="technology-title">Powered by modern AI tools.</h2>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {[...TECHNOLOGIES, ...TECHNOLOGIES].map((technology, index) => (
                <span key={`${technology}-${index}`} aria-hidden={index >= TECHNOLOGIES.length ? "true" : undefined}>
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta-section" data-reveal="scale">
          <div className="landing-cta-card">
            <span className="cta-mark" aria-hidden="true">
              <i />
              <i />
              <GraduationCap size={22} />
            </span>
            <h2>Have a question<br />about your college?</h2>
            <p>Start with a question. Get a clearer answer.</p>
            <button className="button-primary" data-magnetic onClick={goToChat}>
              Start Chatting <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <button className="landing-brand footer-brand" onClick={() => onNavigate("/")} aria-label="CampusAI home">
          <span className="landing-brand-mark"><GraduationCap size={19} /></span>
          <span>Campus<span>AI</span></span>
        </button>
        <p>Your AI-powered college assistant.</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}