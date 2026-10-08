import { useMemo, useState } from "react";
import {
  Check,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

export const PROGRAMMES = ["BCA", "BBA", "B.Com (H)"];

const ROUTES = ["Academic Handbook (RAG)", "Fee Structure (RAG)", "General Knowledge"];

export default function Sidebar({
  programme,
  onProgrammeChange,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onHome,
  open,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""),
    );
    if (!query) return sorted;
    return sorted.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(query) ||
        conversation.messages.some(
          (message) =>
            message &&
            !message.error &&
            typeof message.content === "string" &&
            message.content.toLowerCase().includes(query),
        ),
    );
  }, [conversations, search]);

  const startRename = (conversation) => {
    setEditingId(conversation.id);
    setTitleDraft(conversation.title);
    setOpenMenuId(null);
  };

  const saveRename = (id) => {
    const title = titleDraft.trim();
    if (title) onRenameConversation(id, title);
    setEditingId(null);
  };

  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <button className="brand-home" onClick={onHome} aria-label="Go to CampusAI home">
            <span className="brand-icon">
              <GraduationCap size={22} />
            </span>
            <span>
              <span className="brand-name">CampusAI</span>
              <span className="brand-sub">College Assistant</span>
            </span>
          </button>
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
            onChange={(event) => onProgrammeChange(event.target.value)}
          >
            {PROGRAMMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="current">
            Currently set as:
            <strong>{programme} student</strong>
          </p>
        </section>

        <hr />

        <section className="side-section history-section">
          <div className="history-heading">
            <h2>Chat History</h2>
            <button className="new-chat-btn" onClick={onNewChat}>
              <Plus size={16} /> New Chat
            </button>
          </div>
          <label className="chat-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
            />
          </label>
          <div className="conversation-list">
            {filteredConversations.length === 0 ? (
              <p className="history-empty">
                {search ? "No matching conversations." : "Your conversations will appear here."}
              </p>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-row ${conversation.id === activeConversationId ? "active" : ""}`}
                >
                  {editingId === conversation.id ? (
                    <form
                      className="conversation-rename"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveRename(conversation.id);
                      }}
                    >
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        aria-label="Conversation title"
                      />
                      <button className="conversation-action" type="submit" aria-label="Save title">
                        <Check size={15} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        className="conversation-select"
                        onClick={() => onSelectConversation(conversation)}
                        title={conversation.title}
                      >
                        <span>{conversation.title}</span>
                        <small>{conversation.programme}</small>
                      </button>
                      <div className="conversation-menu-wrap">
                        <button
                          className="conversation-action"
                          onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)}
                          aria-label={`Options for ${conversation.title}`}
                          aria-expanded={openMenuId === conversation.id}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                        {openMenuId === conversation.id && (
                          <div className="conversation-menu">
                            <button onClick={() => startRename(conversation)}>
                              <Pencil size={14} /> Rename
                            </button>
                            <button
                              className="delete-action"
                              onClick={() => {
                                onDeleteConversation(conversation.id);
                                setOpenMenuId(null);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <hr />

        <section className="side-section">
          <h2>Routes queries to:</h2>
          <ul className="routes">
            {ROUTES.map((route) => (
              <li key={route}>
                <span className="dot" /> {route}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  );
}
