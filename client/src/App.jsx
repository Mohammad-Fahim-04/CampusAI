import { useEffect, useRef, useState } from "react";
import { GraduationCap, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import ChatInput from "./components/ChatInput.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { sendMessage } from "./api/chatApi.js";

let nextId = 1;

export default function App() {
  const [programme, setProgramme] = useState("BCA");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    setMessages((m) => [...m, { id: nextId++, role: "user", content: text }]);
    setLoading(true);
    try {
      const { answer, query_type } = await sendMessage(programme, text);
      setMessages((m) => [
        ...m,
        { id: nextId++, role: "assistant", content: answer, queryType: query_type },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: nextId++, role: "assistant", content: err.message, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        programme={programme}
        onProgrammeChange={setProgramme}
        onClear={() => setMessages([])}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          <div className="title-block">
            <h1>
              <GraduationCap size={22} className="title-icon" /> College Assistant
            </h1>
            <p>Ask me about academics, fees, or anything else campus-related</p>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </header>

        <div className="chat-scroll">
          <div className="chat-inner">
            {messages.length === 0 && !loading && (
              <div className="empty">Ask a question to get started.</div>
            )}
            {messages.map((m) => (
              <ChatMessage key={m.id} {...m} />
            ))}
            {loading && <ChatMessage role="assistant" loading />}
            <div ref={endRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}
