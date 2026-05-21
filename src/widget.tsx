import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { RotateCw, X, ArrowUp, Loader2, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { Message, GenUIData } from "./widgets/types";
import { toolIcon, toolLabel, toolDoneLabel } from "./widgets/tool-labels";
import { parseStructuredResponse, getResponseText } from "./widgets/parse-response";
import { ss, PRIMARY_COLOR } from "./widgets/styles";
import { ProductsCard, BookingCard, TaskCard, OrdersCard, EventsCard } from "./widgets/tools";

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
const TOGGLE_ICON = window.MarnoChatConfig?.toggleIcon || "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg";
const FONT_FAMILY = window.MarnoChatConfig?.fontFamily || "Karla";

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

function GenUIBlock({ genUI }: { genUI: GenUIData }) {
  return (
    <>
      {genUI.products && genUI.products.length > 0 && <ProductsCard products={genUI.products} />}
      {genUI.booking && <BookingCard booking={genUI.booking} />}
      {genUI.task && <TaskCard task={genUI.task} />}
      {genUI.orders && genUI.orders.length > 0 && <OrdersCard orders={genUI.orders} />}
      {genUI.events && genUI.events.length > 0 && <EventsCard events={genUI.events} />}
    </>
  );
}

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

      // JSON response (structured output)
      const resp = await res.json();
      const genUI = parseStructuredResponse(resp);
      const responseText = getResponseText(genUI, resp);

      const steps = resp.steps || resp.intermediateSteps || [];
      if (steps.length > 0) {
        const toolSteps = steps.filter((s: any) => s.toolCalls && s.toolCalls.length > 0);
        for (const step of toolSteps) {
          for (const tc of (step.toolCalls || [])) {
            const toolName = tc.toolName || tc.tool_name || "unknown";
            const toolId = crypto.randomUUID();
            setMessages((prev) => [...prev, { id: toolId, role: "tool", text: toolLabel(toolName), toolName, toolDone: false }]);
            await new Promise((r) => setTimeout(r, 600));
            setMessages((prev) => prev.map((m) => (m.id === toolId ? { ...m, text: toolDoneLabel(toolName), toolDone: true } : m)));
          }
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      setIsLoading(false);

      if (responseText || genUI) {
        const finalId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: finalId, role: "model", text: responseText, genUI }]);
      } else {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", text: "I'm sorry, I didn't get a response. Please try again." }]);
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

                      const parts = isUser ? [msg.text] : msg.text.split(/(?:\r?\n){2,}/).filter((t) => t.trim().length > 0);
                      if (parts.length === 0 && isAi) parts.push("");
                      const genUI = isAi ? msg.genUI : undefined;
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
                            {genUI && <GenUIBlock genUI={genUI} />}
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
