import { useRef } from "react";
import { ArrowUpRight, BookOpen, ClipboardCheck, GraduationCap, WalletCards } from "lucide-react";
import { usePointerFx } from "./LandingPage.jsx";

const SUGGESTIONS = [
  {
    title: "Attendance Rules",
    question: "What is the minimum attendance requirement?",
    Icon: ClipboardCheck,
  },
  {
    title: "Fee Structure",
    question: "What is the tuition fee?",
    Icon: WalletCards,
  },
  {
    title: "Exam Rules",
    question: "What are the examination eligibility rules?",
    Icon: BookOpen,
  },
  {
    title: "Course Information",
    question: "What are the course requirements?",
    Icon: GraduationCap,
  },
];

export default function SuggestedQuestions({ onSelect }) {
  const ref = useRef(null);
  usePointerFx(ref);

  return (
    <section className="welcome-section" aria-labelledby="welcome-title" ref={ref}>
      <div className="welcome-copy">
        <span className="welcome-mark" aria-hidden="true">
          <i />
          <i />
          <GraduationCap size={22} />
        </span>
        <h2 id="welcome-title">Welcome to CampusAI</h2>
        <p>Choose a question to get started, or ask me anything about campus.</p>
      </div>
      <div className="suggested-grid">
        {SUGGESTIONS.map(({ title, question, Icon }, index) => (
          <button
            className="suggested-card"
            key={title}
            type="button"
            data-glow
            style={{ "--i": index }}
            onClick={() => onSelect(question)}
          >
            <span className="suggested-card-heading">
              <Icon size={18} aria-hidden="true" />
              <span>{title}</span>
              <ArrowUpRight className="suggested-arrow" size={16} aria-hidden="true" />
            </span>
            <span className="suggested-question">{question}</span>
          </button>
        ))}
      </div>
    </section>
  );
}