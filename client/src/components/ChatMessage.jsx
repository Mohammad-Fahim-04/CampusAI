import { Bot } from "lucide-react";

export default function ChatMessage({ role, content, queryType, loading, error }) {
  if (role === "user") {
    return (
      <div className="msg-row user">
        <div className="bubble user-bubble">{content}</div>
      </div>
    );
  }
  return (
    <div className="msg-row assistant">
      <div className="ai-avatar">
        <Bot size={18} />
      </div>
      <div className="assistant-body">
        {queryType && <span className={`badge badge-${queryType}`}>{queryType.toUpperCase()}</span>}
        {loading ? (
          <div className="thinking">
            Thinking<span className="dots"><i /><i /><i /></span>
          </div>
        ) : (
          <div className={`answer ${error ? "error" : ""}`}>{content}</div>
        )}
      </div>
    </div>
  );
}
