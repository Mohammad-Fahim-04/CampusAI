import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, GraduationCap, PanelLeft } from "lucide-react";
import LandingPage from "./components/LandingPage.jsx";
import Sidebar, { PROGRAMMES } from "./components/Sidebar.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import ChatInput from "./components/ChatInput.jsx";
import SuggestedQuestions from "./components/SuggestedQuestions.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { sendMessage } from "./api/chatApi.js";

const STORAGE_KEY = "campusai_conversations";

/**
 * Runs a UI state change inside a View Transition when the browser supports it
 * (page changes cross-fade, the theme change reveals as a circle from the toggle).
 * Falls back to a plain update elsewhere and for reduced-motion users.
 */
function withViewTransition(kind, update, origin) {
  const canAnimate =
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canAnimate) {
    update();
    return;
  }
  const root = document.documentElement;
  root.dataset.transition = kind;
  if (origin) {
    root.style.setProperty("--vt-x", `${origin.x}px`);
    root.style.setProperty("--vt-y", `${origin.y}px`);
  }
  const transition = document.startViewTransition(() => {
    flushSync(update);
  });
  transition.finished.finally(() => {
    delete root.dataset.transition;
  });
}

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (conversation) =>
        conversation &&
        typeof conversation.id === "string" &&
        typeof conversation.title === "string" &&
        Array.isArray(conversation.messages) &&
        (PROGRAMMES.includes(conversation.programme) || conversation.programme === "BCA"),
    ).map((conversation) => ({
      ...conversation,
      programme: conversation.programme === "BCA" ? "BSc IT" : conversation.programme,
      messages: conversation.messages
        .filter(
          (message) =>
            message &&
            typeof message === "object" &&
            ["user", "assistant"].includes(message.role),
        )
        .map((message) => ({
          ...message,
          id: typeof message.id === "string" ? message.id : createId(),
          content: typeof message.content === "string" ? message.content : "",
          feedback: ["up", "down"].includes(message.feedback) ? message.feedback : null,
        })),
    }));
  } catch (error) {
    console.error("Could not load saved CampusAI conversations.", error);
    return [];
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createTitle(message) {
  const title = message
    .replace(/^(?:what is|what are|tell me about|explain|can you explain)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .trim();
  if (!title) return "New conversation";
  const shortened = title.length > 38 ? `${title.slice(0, 35).trimEnd()}...` : title;
  return shortened.charAt(0).toUpperCase() + shortened.slice(1);
}

function persistedConversations(conversations) {
  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.filter((message) => !message.error && !message.loading),
  }));
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const mostRecent = [...conversations].sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    )[0];
    return mostRecent?.id || null;
  });
  const [programme, setProgramme] = useState(() => {
    const mostRecent = [...conversations].sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    )[0];
    return mostRecent?.programme || "BSc IT";
  });
  const [loadingConversationId, setLoadingConversationId] = useState(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState(null);
  const [regenerationErrors, setRegenerationErrors] = useState({});
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const endRef = useRef(null);
  const activeConversation = conversations.find((item) => item.id === activeConversationId);
  const messages = activeConversation?.messages || [];
  const isLoading =
    loadingConversationId === activeConversationId &&
    activeConversationId !== null &&
    regeneratingMessageId === null;

  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      withViewTransition("page", () => {
        setCurrentPath(path);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 820px)").matches) setSidebarOpen(true);
    else setSidebarCollapsed((collapsed) => !collapsed);
  };

  const handleThemeToggle = (event) => {
    const next = theme === "dark" ? "light" : "dark";
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    withViewTransition(
      "theme",
      () => {
        document.documentElement.setAttribute("data-theme", next);
        setTheme(next);
      },
      rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined,
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedConversations(conversations)));
    } catch (error) {
      console.error("Could not save CampusAI conversations.", error);
    }
  }, [conversations]);

  useEffect(() => {
    if (messages.length === 0 && !isLoading) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleProgrammeChange = (nextProgramme) => {
    setProgramme(nextProgramme);
    if (activeConversationId) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversationId
            ? { ...conversation, programme: nextProgramme, updatedAt: new Date().toISOString() }
            : conversation,
        ),
      );
    }
  };

  const handleNewChat = () => {
    const now = new Date().toISOString();
    const conversation = {
      id: createId(),
      title: "New Chat",
      messages: [],
      programme,
      createdAt: now,
      updatedAt: now,
    };
    setConversations((current) => [...current, conversation]);
    setActiveConversationId(conversation.id);
    setLoadingConversationId(null);
    setRegeneratingMessageId(null);
    setRegenerationErrors({});
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversationId(conversation.id);
    setProgramme(conversation.programme);
    setLoadingConversationId(null);
    setRegeneratingMessageId(null);
    setRegenerationErrors({});
    setSidebarOpen(false);
  };

  const handleRenameConversation = (id, title) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, title: cleanTitle, updatedAt: new Date().toISOString() }
          : conversation,
      ),
    );
  };

  const handleDeleteConversation = (id) => {
    setConversations((current) => current.filter((conversation) => conversation.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  };

  const handleFeedbackChange = (conversationId, messageId, feedback) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? { ...message, feedback: message.feedback === feedback ? null : feedback }
                : message,
            ),
          }
          : conversation,
      ),
    );
  };

  const handleSend = async (text) => {
    const existing = activeConversation;
    const conversationId = existing?.id || createId();
    const userMessage = { id: createId(), role: "user", content: text };
    const previousMessages = existing?.messages || [];
    const currentHistory = previousMessages
      .filter((message) => !message.error && (message.role === "user" || message.role === "assistant"))
      .map(({ role, content }) => ({ role, content }));
    const now = new Date().toISOString();

    if (existing) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, messages: [...conversation.messages, userMessage], updatedAt: now }
            : conversation,
        ),
      );
    } else {
      setConversations((current) => [
        ...current,
        {
          id: conversationId,
          title: createTitle(text),
          messages: [userMessage],
          programme,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      setActiveConversationId(conversationId);
    }

    setLoadingConversationId(conversationId);
    try {
      const { answer, query_type } = await sendMessage(programme, text, currentHistory);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: createId(),
                  role: "assistant",
                  content: answer,
                  queryType: query_type,
                  feedback: null,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
            : conversation,
        ),
      );
    } catch (error) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: createId(), role: "assistant", content: error.message, error: true },
              ],
              updatedAt: new Date().toISOString(),
            }
            : conversation,
        ),
      );
    } finally {
      setLoadingConversationId((current) => (current === conversationId ? null : current));
    }
  };

  const handleRegenerate = async (assistantMessageId) => {
    const conversation = conversations.find((item) => item.id === activeConversationId);
    if (!conversation || loadingConversationId !== null) return;

    const assistantIndex = conversation.messages.findIndex(
      (message) => message.id === assistantMessageId,
    );
    if (assistantIndex < 0) return;

    let userIndex = assistantIndex - 1;
    while (userIndex >= 0 && conversation.messages[userIndex].role !== "user") {
      userIndex -= 1;
    }
    if (userIndex < 0) return;

    const userMessage = conversation.messages[userIndex];
    const history = conversation.messages
      .slice(0, userIndex)
      .filter(
        (message) =>
          !message.error && (message.role === "user" || message.role === "assistant"),
      )
      .map(({ role, content }) => ({ role, content }));

    setRegenerationErrors((current) => {
      const next = { ...current };
      delete next[assistantMessageId];
      return next;
    });
    setRegeneratingMessageId(assistantMessageId);
    setLoadingConversationId(conversation.id);

    try {
      const { answer, query_type } = await sendMessage(
        conversation.programme,
        userMessage.content,
        history,
      );
      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
              ...item,
              messages: item.messages.map((message) =>
                message.id === assistantMessageId
                  ? {
                    ...message,
                    content: answer,
                    queryType: query_type,
                    error: false,
                    feedback: null,
                  }
                  : message,
              ),
              updatedAt: new Date().toISOString(),
            }
            : item,
        ),
      );
    } catch (error) {
      setRegenerationErrors((current) => ({
        ...current,
        [assistantMessageId]: error.message || "Please try again.",
      }));
    } finally {
      setRegeneratingMessageId(null);
      setLoadingConversationId((current) =>
        current === conversation.id ? null : current,
      );
    }
  };

  if (currentPath !== "/chat") {
    return <LandingPage onNavigate={navigate} />;
  }

  return (
    <div className={`app${sidebarCollapsed ? " is-collapsed" : ""}`}>
      <Sidebar
        programme={programme}
        onProgrammeChange={handleProgrammeChange}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onHome={() => navigate("/")}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={!sidebarCollapsed}
            title="Toggle sidebar"
          >
            <PanelLeft size={20} />
          </button>
          <button className="chat-home-link" onClick={() => navigate("/")} aria-label="Back to CampusAI home">
            <ArrowLeft size={16} />
            <span>CampusAI</span>
          </button>
          <div className="title-block">
            <h1>
              <GraduationCap size={22} className="title-icon" /> College Assistant
            </h1>
            <p>Ask me about academics, fees, or anything else campus-related</p>
          </div>
          <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
        </header>

        <div className="chat-scroll">
          <div className="chat-inner">
            {messages.length === 0 && !isLoading && (
              <SuggestedQuestions onSelect={handleSend} />
            )}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                {...message}
                onFeedbackChange={(feedback) =>
                  handleFeedbackChange(activeConversationId, message.id, feedback)
                }
                onRegenerate={() => handleRegenerate(message.id)}
                isRegenerating={regeneratingMessageId === message.id}
                regenerateDisabled={loadingConversationId !== null}
                regenerationError={regenerationErrors[message.id]}
              />
            ))}
            {isLoading && <ChatMessage role="assistant" loading />}
            <div ref={endRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} disabled={loadingConversationId !== null} />
      </main>
    </div>
  );
}