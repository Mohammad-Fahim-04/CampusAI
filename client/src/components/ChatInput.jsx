import { useRef, useState } from "react";
import { Paperclip, SendHorizonal } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);
  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onChange = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="input-wrap">
      <div className="input-box">
        <button className="icon-btn" type="button" disabled title="Attachments aren't available yet" aria-label="Attach file">
          <Paperclip size={18} />
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Type your question here..."
        />
        <button className="send-btn" onClick={submit} disabled={!canSend} aria-label="Send message">
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
