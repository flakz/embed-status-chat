import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { RotateCw, X, ArrowUp, Loader2, Search, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

declare global {
  interface Window {
    MarnoChatConfig?: {
      webhookUrl?: string;
      kbSlug?: string;
      brandName?: string;
      brandLogo?: string;
      primaryColor?: string;
      toggleIcon?: string;
      fontFamily?: string;
      suggestions?: { label: string; prompt: string }[];
      greetings?: [string, string];
    };
  }
}

const BRAND_NAME = window.MarnoChatConfig?.brandName || "Marno AI";
const BRAND_LOGO = window.MarnoChatConfig?.brandLogo || "";
const PRIMARY_COLOR = window.MarnoChatConfig?.primaryColor || "#0D72FF";
const TOGGLE_ICON = window.MarnoChatConfig?.toggleIcon || "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg";
const FONT_FAMILY = window.MarnoChatConfig?.fontFamily || "Karla";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}
const [pr, pg, pb] = hexToRgb(PRIMARY_COLOR);
const PRIMARY_LIGHT = rgbToHex(
  pr + (255 - pr) * 0.90,
  pg + (255 - pg) * 0.90,
  pb + (255 - pb) * 0.90,
);

const WEBHOOK_URL = window.MarnoChatConfig?.webhookUrl || "https://n8n.marno.pro/webhook/marno-chat";
const KB_SLUG = window.MarnoChatConfig?.kbSlug || "kbase";

const SUGGESTIONS = window.MarnoChatConfig?.suggestions || [
  { label: "Get started", prompt: "How do I get started with the platform?" },
  { label: "See templates", prompt: "Can you show me the available templates?" },
  { label: "Pricing", prompt: "What are the pricing plans available?" },
  { label: "Book a demo", prompt: "I would like to book a demo." },
  { label: "Documentation", prompt: "Where can I find the API documentation?" },
];

const GREETING_1 = window.MarnoChatConfig?.greetings?.[0] || "Hi there! I'm an AI agent trained on docs, help articles, and other important content.";
const GREETING_2 = window.MarnoChatConfig?.greetings?.[1] || "How can I best help you today?";

type Message = { id: string; role: "user" | "model" | "system" | "tool"; text: string; toolName?: string; toolDone?: boolean };

function toolIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("search") || lower.includes("duck") || lower.includes("google")) return "🔍";
  if (lower.includes("book") || lower.includes("calendar") || lower.includes("schedule")) return "📅";
  if (lower.includes("email") || lower.includes("mail")) return "📧";
  if (lower.includes("weather")) return "🌤️";
  if (lower.includes("database") || lower.includes("query")) return "🗄️";
  if (lower.includes("code") || lower.includes("api")) return "⚙️";
  if (lower.includes("image") || lower.includes("picture")) return "🖼️";
  return "🔧";
}

function toolLabel(name: string) {
  const lower = name.toLowerCase();
  if (lower === "search" || lower.includes("duck")) return `Searching…`;
  if (lower.includes("book")) return `Booking appointment…`;
  if (lower.includes("calendar")) return `Checking calendar…`;
  if (lower.includes("email")) return `Sending email…`;
  if (lower.includes("weather")) return `Getting weather…`;
  return `Running ${name}…`;
}

function toolDoneLabel(name: string) {
  const lower = name.toLowerCase();
  if (lower === "search" || lower.includes("duck")) return `Search complete`;
  if (lower.includes("book")) return `Appointment booked`;
  if (lower.includes("calendar")) return `Calendar checked`;
  if (lower.includes("email")) return `Email sent`;
  return `${name} complete`;
}

const ss: Record<string, React.CSSProperties | ((...args: any[]) => React.CSSProperties)> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483646,
  },
  panel: {
    position: "fixed",
    bottom: 74,
    right: 24,
    zIndex: 2147483647,
    width: 400,
    height: 720,
    maxHeight: "calc(100vh - 8rem)",
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 12px 48px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #f3f4f6",
    fontFamily: "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    background: PRIMARY_COLOR,
    color: "#fff",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 26, height: 26, borderRadius: "50%", background: "#2A2E35",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
  },
  headerTitle: { fontWeight: 600, fontSize: 15, letterSpacing: "0.02em" },
  headerActions: { display: "flex", alignItems: "center", gap: 14 },
  headerBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.8 },
  msgArea: {
    flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column",
    padding: "24px 16px 112px", scrollbarWidth: "none",
  } as React.CSSProperties,
  msgList: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", position: "relative" as const },
  msgRowUser: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", alignItems: "flex-end" },
  msgRowBot: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", alignItems: "flex-start" },
  bubbleUser: {
    padding: "8px 16px", borderRadius: 12, borderBottomRightRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%", lineHeight: 1.375,
    background: PRIMARY_COLOR, color: "#fff", overflow: "hidden",
  },
  bubbleBot: {
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%", lineHeight: 1.375,
    background: "#F0F2F5", color: "#1E1E1E", overflow: "hidden",
  },
  thinking: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%",
    background: "#F0F2F5", color: "#9ca3af",
  },
  toolCard: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content" as const, maxWidth: "88%",
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR,
    border: `1px solid ${PRIMARY_COLOR}20`,
  },
  toolCardDone: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content" as const, maxWidth: "88%",
    background: "#ECFDF5", color: "#065F46",
    border: "1px solid #A7F3D0",
  },
  suggestions: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 8, width: "100%" },
  suggestBtn: {
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR, border: "none",
    borderRadius: 10, padding: "8px 14px", fontSize: 14.5, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    outline: "none",
  },
  inputWrap: {
    position: "absolute" as const, bottom: 0, left: 0, right: 0,
    padding: "44px 16px 16px",
    background: "linear-gradient(to top, #fff 0%, rgba(255,255,255,0.95) 40%, transparent 100%)",
    pointerEvents: "none" as const,
  },
  inputBar: {
    position: "relative" as const, display: "flex", alignItems: "center",
    borderRadius: 9999, background: "#fff", border: "2px solid #e5e7eb",
    pointerEvents: "auto" as const,
  },
  input: {
    width: "100%", background: "transparent", border: "none", outline: "none",
    color: "#111827", borderRadius: 9999,
    padding: "10px 48px 10px 20px", fontSize: 15,
    fontFamily: "inherit",
  },
  sendBtn: (active: boolean): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)", right: 5,
    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: active ? "pointer" : "not-allowed",
    background: active ? PRIMARY_COLOR : "#E5E5E5", color: active ? "#fff" : "#8C8C8C",
    fontFamily: "inherit",
    outline: "none",
  }),
  toggle: {
    position: "fixed" as const, bottom: 24, right: 24, zIndex: 2147483646,
    borderRadius: "50%", overflow: "hidden",
    width: 40, height: 40,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    border: "none", padding: 0, cursor: "pointer",
    background: "transparent",
    outline: "none",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  toggleImg: { width: "100%", height: "100%", objectFit: "cover" as const },
};

const mdStyles = `
@keyframes marno-spin { to { transform: rotate(360deg); } }
@keyframes marno-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.marno-md p { margin: 0; }
.marno-md p:not(:last-child) { margin-bottom: 12px; }
.marno-md ul, .marno-md ol { margin: 8px 0; padding-left: 20px; }
.marno-md ul { list-style: disc; }
.marno-md ol { list-style: decimal; }
.marno-md strong { font-weight: 600; }
.marno-tool-spinner {
  animation: marno-spin 1s linear infinite;
  width: 14px; height: 14px; flex-shrink: 0;
}
`;

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: "system", text: GREETING_1 },
    { id: crypto.randomUUID(), role: "system", text: GREETING_2 },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toggleHover, setToggleHover] = useState(false);
  const [toggleActive, setToggleActive] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { sessionIdRef.current = crypto.randomUUID(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    if (!textOverride) setInputValue("");
    const userMsgObj: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsgObj]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    const sessionId = sessionIdRef.current;

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, sessionId, slug: KB_SLUG }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      const contentType = res.headers.get("content-type") || "";

      // Streaming response
      if (!contentType.includes("application/json") && !contentType.includes("text/html")) {
        const reader = res.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = "";
          let streamingAnswerId = "";
          let answerStarted = false;
          const toolMessages: Map<string, Message> = new Map();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              let event: any;
              try { event = JSON.parse(trimmedLine); } catch {
                if (!answerStarted) { streamingAnswerId = crypto.randomUUID(); setMessages((prev) => [...prev, { id: streamingAnswerId, role: "model", text: "" }]); answerStarted = true; }
                setMessages((prev) => prev.map((m) => (m.id === streamingAnswerId ? { ...m, text: m.text + trimmedLine } : m)));
                continue;
              }
              if (event.version === 1 && event.toolCalls) {
                for (const tc of event.toolCalls) {
                  const toolId = tc.toolCallId || crypto.randomUUID();
                  setMessages((prev) => [...prev, { id: toolId, role: "tool", text: toolLabel(tc.toolName), toolName: tc.toolName, toolDone: false }]);
                }
              } else if (event.version === 1 && event.toolResults) {
                for (const tr of event.toolResults) {
                  setMessages((prev) => prev.map((m) => (m.role === "tool" && m.toolName === tr.toolName && !m.toolDone ? { ...m, text: toolDoneLabel(tr.toolName), toolDone: true } : m)));
                }
              }
            }
          }
          setIsLoading(false);
          return;
        }
      }

      // JSON response (non-streaming)
      const resp = await res.json();
      let responseText = resp.response || resp.output || "";

      // Animate tool steps from response
      const steps = resp.steps || resp.intermediateSteps || [];
      if (steps.length > 0) {
        // Filter: only steps that actually have tool calls (not the final text step)
        const toolSteps = steps.filter((s: any) => s.toolCalls && s.toolCalls.length > 0);
        for (let i = 0; i < toolSteps.length; i++) {
          const step = toolSteps[i];
          const toolCalls = step.toolCalls || [];
          for (const tc of toolCalls) {
            const toolName = tc.toolName || tc.tool_name || "unknown";
            const toolId = crypto.randomUUID();
            setMessages((prev) => [...prev, { id: toolId, role: "tool", text: toolLabel(toolName), toolName, toolDone: false }]);
            await new Promise((r) => setTimeout(r, 600));
            setMessages((prev) => prev.map((m) => (m.id === toolId ? { ...m, text: toolDoneLabel(toolName), toolDone: true } : m)));
          }
        }
        await new Promise((r) => setTimeout(r, 300));

        // If responseText is empty, try to get it from the last step
        if (!responseText) {
          for (let i = steps.length - 1; i >= 0; i--) {
            if (steps[i].text) {
              responseText = steps[i].text;
              break;
            }
          }
        }
      }

      setIsLoading(false);
      if (responseText) {
        const finalId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: finalId, role: "model", text: "" }]);
        const chars = responseText.split("");
        let fullText = "";
        for (let i = 0; i < chars.length; i += 2) {
          fullText += chars[i] + (chars[i + 1] || "");
          setMessages((prev) => prev.map((m) => (m.id === finalId ? { ...m, text: fullText } : m)));
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "model", text: "I'm sorry, I encountered an error. Please check your connection or try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSend(); };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([
      { id: crypto.randomUUID(), role: "system", text: GREETING_1 },
      { id: crypto.randomUUID(), role: "system", text: GREETING_2 },
    ]);
    setInputValue("");
    setIsLoading(false);
    sessionIdRef.current = crypto.randomUUID();
  };

  const isInputEmpty = inputValue.trim().length === 0;

  return (
    <>
      <style>{mdStyles}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={ss.panel as React.CSSProperties}>
              <div style={ss.header}>
                <div style={ss.headerLeft}>
                  <div style={ss.logoCircle}>
                    {BRAND_LOGO ? (
                      <img src={BRAND_LOGO} alt={BRAND_NAME} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(1px)" }}>
                        <path d="M4 17V10A4 4 0 0 1 12 10V17M12 17V10A4 4 0 0 1 20 10V17" />
                      </svg>
                    )}
                  </div>
                  <span style={ss.headerTitle}>{BRAND_NAME}</span>
                </div>
                <div style={ss.headerActions}>
                  <button onClick={handleReset} style={ss.headerBtn} title="Reset chat"><RotateCw size={18} strokeWidth={2.5} /></button>
                  <button onClick={() => setIsOpen(false)} style={ss.headerBtn}><X size={20} strokeWidth={2.5} /></button>
                </div>
              </div>

              <div style={ss.msgArea as React.CSSProperties}>
                <div style={ss.msgList}>
                  <AnimatePresence mode="popLayout" initial={true}>
                    {messages.map((msg, index) => {
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const isRoleChange = prevMsg && (prevMsg.role !== msg.role || (prevMsg.role === "system" && msg.role === "model"));
                      const isUser = msg.role === "user";
                      const isTool = msg.role === "tool";
                      const isAi = msg.role === "model" || msg.role === "system";

                      // Tool progress cards
                      if (isTool) {
                        const cardStyle = msg.toolDone ? ss.toolCardDone : ss.toolCard;
                        return (
                          <motion.div
                            layout
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ marginTop: isRoleChange ? 12 : 0 }}
                          >
                            <div style={ss.msgRowBot}>
                              <div style={cardStyle as React.CSSProperties}>
                                {msg.toolDone ? (
                                  <Check size={14} style={{ color: "#059669", flexShrink: 0 }} />
                                ) : (
                                  <Loader2 size={14} className="marno-tool-spinner" style={{ color: PRIMARY_COLOR }} />
                                )}
                                <span>{msg.toolDone ? msg.text : `${toolIcon(msg.toolName || "")} ${msg.text}`}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      // Normal messages
                      const parts = isUser ? [msg.text] : msg.text.split(/(?:\r?\n){2,}/).filter((t) => t.trim().length > 0);
                      if (parts.length === 0 && isAi) parts.push("");
                      return (
                        <motion.div
                          layout={isUser ? true : "position"}
                          key={msg.id}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{ marginTop: isRoleChange ? 12 : 0 }}
                        >
                          <div style={isUser ? ss.msgRowUser : ss.msgRowBot}>
                            {parts.map((part, pIdx) => (
                              <motion.div
                                layoutId={isUser && pIdx === 0 ? `suggestion-${msg.text}` : undefined}
                                key={pIdx}
                                style={isUser ? ss.bubbleUser : ss.bubbleBot}
                              >
                                <div className="marno-md">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{part || " "}</ReactMarkdown>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}

                    {isLoading && (
                      <motion.div layout key="loading-indicator" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease: "easeOut" }} style={{ marginTop: 12 }}>
                        <div style={ss.thinking}><Loader2 size={16} style={{ animation: "marno-spin 1s linear infinite", color: "#6b7280" }} /><span>Thinking...</span></div>
                      </motion.div>
                    )}

                    {!isLoading && messages.length === 2 && messages[0].role === "system" && (
                      <motion.div layout key="suggestions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }} transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}>
                        <div style={ss.suggestions}>
                          {SUGGESTIONS.map((s) => (
                            <motion.button layoutId={`suggestion-${s.prompt}`} key={s.prompt} onClick={() => handleSend(s.prompt)} style={ss.suggestBtn}>{s.label}</motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div ref={messagesEndRef} />
              </div>

              <div style={ss.inputWrap}>
                <div style={ss.inputBar}>
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message..." disabled={isLoading} style={ss.input} />
                  <button onClick={() => handleSend()} disabled={isInputEmpty || isLoading} style={ss.sendBtn(!isInputEmpty && !isLoading)}><ArrowUp size={18} strokeWidth={2.5} /></button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setToggleHover(true)}
        onMouseLeave={() => { setToggleHover(false); setToggleActive(false); }}
        onMouseDown={() => setToggleActive(true)}
        onMouseUp={() => setToggleActive(false)}
        style={{
          ...ss.toggle,
          transform: toggleActive ? "scale(0.95)" : toggleHover ? "scale(1.1) rotate(12deg)" : "scale(1)",
          boxShadow: toggleHover ? "0 6px 20px rgba(0,0,0,0.35)" : "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        <img src={TOGGLE_ICON} alt="Chat" style={ss.toggleImg} />
      </button>
    </>
  );
}

function mount() {
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = `https://fonts.googleapis.com/css2?family=${FONT_FAMILY.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(fontLink);

  const fontOverride = document.createElement("style");
  fontOverride.textContent = `#marno-widget-root, #marno-widget-root * { font-family: "${FONT_FAMILY}", ui-sans-serif, system-ui, sans-serif !important; }`;
  document.head.appendChild(fontOverride);

  const root = document.createElement("div");
  root.id = "marno-widget-root";
  document.body.appendChild(root);
  createRoot(root).render(React.createElement(ChatWidget));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
