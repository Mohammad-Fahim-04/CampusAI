import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  FileSearch,
  GraduationCap,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

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
    Icon: Sparkles,
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
    Icon: Sparkles,
  },
];

const TECHNOLOGIES = ["React", "FastAPI", "LangGraph", "LangChain", "FAISS", "Hugging Face", "Groq"];

export default function LandingPage({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const goToChat = () => {
    setMenuOpen(false);
    onNavigate("/chat");
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
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
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <button className="landing-nav-cta" onClick={goToChat}>
              Try CampusAI <ArrowRight size={16} />
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="landing-hero-inner">
            <div className="hero-copy">
              <div className="hero-eyebrow"><span className="status-dot" /> AI COLLEGE ASSISTANT</div>
              <h1>Your college,<br /><span>one question away.</span></h1>
              <p className="hero-tagline">Your AI-powered college assistant.</p>
              <p className="hero-description">
                Get quick answers about academics, fees, exams, attendance, courses and more —
                powered by your college documents.
              </p>
              <div className="hero-actions">
                <button className="button-primary" onClick={goToChat}>
                  Try CampusAI <ArrowRight size={18} />
                </button>
                <a className="button-secondary" href="#how-it-works">
                  How it works <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="hero-note"><Check size={15} /> Answers grounded in your college resources</div>
            </div>

            <div className="hero-visual" aria-label="Preview of a CampusAI conversation">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-assistant-mark"><GraduationCap size={19} /></div>
                  <div className="preview-title">
                    <strong>CampusAI</strong>
                    <span><span className="status-dot" /> Ready to help</span>
                  </div>
                  <span className="preview-menu">•••</span>
                </div>
                <div className="preview-context"><BookOpenCheck size={13} /> Academic handbook</div>
                <div className="preview-message student-message">
                  <span className="preview-message-label">YOU</span>
                  What are the attendance requirements?
                </div>
                <div className="preview-answer">
                  <div className="preview-answer-icon"><Sparkles size={15} /></div>
                  <div>
                    <span className="preview-message-label">CAMPUSAI</span>
                    <p>According to the academic handbook, students must meet the required attendance criteria to be eligible for examinations.</p>
                    <span className="preview-source"><FileSearch size={12} /> From your college handbook</span>
                  </div>
                </div>
                <div className="preview-input">
                  <span>Ask a follow-up question...</span>
                  <span className="preview-send"><ArrowRight size={15} /></span>
                </div>
                <div className="preview-footer"><span /> Your college knowledge, made simple</div>
              </div>
              <div className="floating-note"><span className="floating-note-icon"><FileSearch size={16} /></span>Answers from your documents</div>
            </div>
          </div>
          <a className="hero-scroll-cue" href="#features"><span /> Scroll to explore</a>
        </section>

        <section className="landing-section features-section" id="features">
          <div className="section-heading">
            <span className="section-kicker">MADE FOR CAMPUS LIFE</span>
            <h2>The answers you need,<br /><span>all in one place.</span></h2>
            <p>Less searching. More clarity. CampusAI helps you find your way through college information.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ Icon, title, description }, index) => (
              <article className="feature-card" key={title}>
                <div className="feature-card-top">
                  <span className="feature-icon"><Icon size={20} /></span>
                  <span className="feature-index">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section process-section" id="how-it-works">
          <div className="process-heading">
            <div className="section-heading">
              <span className="section-kicker">SIMPLE BY DESIGN</span>
              <h2>How CampusAI<br /><span>works.</span></h2>
              <p>Useful answers are just three small steps away.</p>
            </div>
            <div className="process-steps">
              {STEPS.map(({ number, title, description, Icon }) => (
                <article className="process-step" key={number}>
                  <div className="step-icon"><Icon size={19} /></div>
                  <div className="step-copy">
                    <span className="step-number">{number}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="technology-section" aria-labelledby="technology-title">
          <div className="technology-inner">
            <div>
              <span className="section-kicker">BUILT WITH THOUGHTFUL TECH</span>
              <h2 id="technology-title">Powered by modern AI tools.</h2>
            </div>
            <div className="technology-list">
              {TECHNOLOGIES.map((technology) => <span key={technology}>{technology}</span>)}
            </div>
          </div>
        </section>

        <section className="landing-cta-section">
          <div className="landing-cta-card">
            <div className="cta-sparkle"><Sparkles size={22} /></div>
            <span className="section-kicker">HERE WHEN YOU NEED IT</span>
            <h2>Have a question<br />about your college?</h2>
            <p>Start with a question. Get a clearer answer.</p>
            <button className="button-primary" onClick={goToChat}>
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
