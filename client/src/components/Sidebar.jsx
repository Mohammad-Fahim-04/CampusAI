import { GraduationCap, Trash2, X } from "lucide-react";

export const PROGRAMMES = ["BCA", "BBA", "B.Com (H)"];

const ROUTES = ["Academic Handbook (RAG)", "Fee Structure (RAG)", "General Knowledge"];

export default function Sidebar({ programme, onProgrammeChange, onClear, open, onClose }) {
  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="brand-name">CampusAI</div>
            <div className="brand-sub">College Assistant</div>
          </div>
          <button className="icon-btn close-sidebar" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <section className="side-section">
          <h2>Setup</h2>
          <label htmlFor="programme">Select your programme</label>
          <select
            id="programme"
            value={programme}
            onChange={(e) => onProgrammeChange(e.target.value)}
          >
            {PROGRAMMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <p className="current">
            Currently set as:
            <strong>{programme} student</strong>
          </p>
          <button className="clear-btn" onClick={onClear}>
            <Trash2 size={15} /> Clear Chat
          </button>
        </section>

        <hr />

        <section className="side-section">
          <h2>Routes queries to:</h2>
          <ul className="routes">
            {ROUTES.map((r) => (
              <li key={r}>
                <span className="dot" /> {r}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  );
}
