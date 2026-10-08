import { useEffect, useState } from "react";
import { Bot, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function removeSvgArtifact(text) {
  return text.replace(/^[ \t]*\*\*svg\*\*[ \t]*(?:\r?\n|$)/gim, "");
}

export default function ChatMessage({
  role,
  content,
  queryType,
  loading,
  error,
  feedback = null,
  onFeedbackChange,
  onRegenerate,
  isRegenerating,
  regenerateDisabled,
  regenerationError,
}) {
  const [copyState, setCopyState] = useState("Copy");
  const safeContent = typeof content === "string" ? content : content == null ? "" : String(content);

  useEffect(() => {
    if (copyState === "Copy") return undefined;
    const timeout = window.setTimeout(() => setCopyState("Copy"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(safeContent);
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed");
    }
  };
  const renderedContent = removeSvgArtifact(safeContent);

  if (role === "user") {
    return (
      <div className="msg-row user">
        <div className="bubble user-bubble">{safeContent}</div>
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
          <>
            {error ? (
              <div className="answer error">{safeContent}</div>
            ) : (
              <div className="answer markdown-answer">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="markdown-table-wrap">
                        <table>{children}</table>
                      </div>
                    ),
                  }}
                >
                  {renderedContent}
                </ReactMarkdown>
              </div>
            )}
            {!error && (
              <>
                <div className="answer-actions">
                  <button className="answer-action-btn" onClick={copyAnswer}>
                    <Copy size={14} />
                    {copyState}
                  </button>
                  <button
                    className={`answer-action-btn feedback-btn ${feedback === "up" ? "selected-up" : ""}`}
                    onClick={() => onFeedbackChange?.("up")}
                    aria-label="Helpful"
                    aria-pressed={feedback === "up"}
                    title="Helpful"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    className={`answer-action-btn feedback-btn ${feedback === "down" ? "selected-down" : ""}`}
                    onClick={() => onFeedbackChange?.("down")}
                    aria-label="Not helpful"
                    aria-pressed={feedback === "down"}
                    title="Not helpful"
                  >
                    <ThumbsDown size={14} />
                  </button>
                  <button
                    className="answer-action-btn"
                    onClick={onRegenerate}
                    disabled={isRegenerating || regenerateDisabled}
                  >
                    <RefreshCw size={14} className={isRegenerating ? "spin" : ""} />
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>
                {regenerationError && (
                  <div className="regeneration-error" role="status">
                    Regeneration failed: {regenerationError}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
