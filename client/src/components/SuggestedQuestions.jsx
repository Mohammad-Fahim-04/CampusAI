import { BookOpen, ClipboardCheck, GraduationCap, WalletCards } from "lucide-react";

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
  return (
    <section className="welcome-section" aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <span className="welcome-mark" aria-hidden="true">✦</span>
        <h2 id="welcome-title">Welcome to CampusAI</h2>
        <p>Choose a question to get started, or ask me anything about campus.</p>
      </div>
      <div className="suggested-grid">
        {SUGGESTIONS.map(({ title, question, Icon }) => (
          <button
            className="suggested-card"
            key={title}
            type="button"
            onClick={() => onSelect(question)}
          >
            <span className="suggested-card-heading">
              <Icon size={18} aria-hidden="true" />
              <span>{title}</span>
            </span>
            <span className="suggested-question">{question}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
