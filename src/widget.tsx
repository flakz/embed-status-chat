import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { RotateCw, X, ArrowUp, Loader2, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { Message, GenUIData, AgentStep } from "./widgets/types";
import { toolIcon, toolLabel, toolDoneLabel } from "./widgets/tool-labels";
import { parseStructuredResponse, getResponseText } from "./widgets/parse-response";
import { ss, getPrimaryColor } from "./widgets/styles";
import { ProductsCard, BookingCard, TaskCard, OrdersCard, EventsCard } from "./widgets/tools";
import ErrorBoundary from "./widgets/error-boundary";

function getConfig() {
  const c = window.MarnoChatConfig;
  return {
    brandName: c?.brandName || "Marno AI",
    brandLogo: c?.brandLogo || "",
    toggleIcon: c?.toggleIcon || "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
    fontFamily: c?.fontFamily || "Karla",
    webhookUrl: c?.webhookUrl || "https://n8n.marno.pro/webhook/marno-chat",
    kbSlug: c?.kbSlug || "kbase",
    instructId: c?.instructId || "",
    suggestions: c?.suggestions || [
      { label: "Get started", prompt: "How do I get started with the platform?" },
      { label: "See templates", prompt: "Can you show me the available templates?" },
      { label: "Pricing", prompt: "What are the pricing plans available?" },
      { label: "Book a demo", prompt: "I would like to book a demo." },
      { label: "Documentation", prompt: "Where can I find the API documentation?" },
    ],
    greeting1: c?.greetings?.[0] || "Hi there! I'm an AI agent trained on docs, help articles, and other important content.",
    greeting2: c?.greetings?.[1] || "How can I best help you today?",
    animationSpeed: c?.animationSpeed || "normal",
  };
}

const HIDDEN_TOOL_PATTERNS = ["format", "parser", "json_response"];
const ANIMATION_DELAYS: Record<string, [number, number]> = { fast: [150, 100], normal: [600, 300], off: [0, 0] };

function isVisibleToolStep(step: AgentStep): boolean {
  if (!step.toolCalls || step.toolCalls.length === 0) return false;
  const name = step.toolCalls[0]?.toolName?.toLowerCase() || "";
  return !HIDDEN_TOOL_PATTERNS.some((p) => name.includes(p));
}

async function animateTyping(text: string, messageId: string, setMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void, abortSignal: AbortSignal) {
  const chars = text.split("");
  let fullText = "";
  for (let i = 0; i < chars.length; i += 2) {
    if (abortSignal.aborted) break;
    fullText += chars[i] + (chars[i + 1] || "");
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text: fullText } : m)));
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function animateToolSteps(steps: AgentStep[], speed: string, setMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void) {
  const toolSteps = steps.filter(isVisibleToolStep);
  const [toolDelay, extraDelay] = ANIMATION_DELAYS[speed] || ANIMATION_DELAYS.normal;
  for (const step of toolSteps) {
    for (const tc of (step.toolCalls || [])) {
      const toolName = tc.toolName || "unknown";
      const toolId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: toolId, role: "tool", text: toolLabel(toolName), toolName, toolDone: false }]);
      await new Promise((r) => setTimeout(r, toolDelay));
      setMessages((prev) => prev.map((m) => (m.id === toolId ? { ...m, text: toolDoneLabel(toolName), toolDone: true } : m)));
    }
  }
  if (toolSteps.length > 0) await new Promise((r) => setTimeout(r, extraDelay));
}

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
  const config = getConfig();
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: crypto.randomUUID(), role: "system", text: config.greeting1 },
    { id: crypto.randomUUID(), role: "system", text: config.greeting2 },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [rotateKey, setRotateKey] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const typingAbortRef = useRef(new AbortController());
  const thinkingStartRef = useRef(0);
  const resetKeyRef = useRef(0);

  const waitMinThinking = async () => {
    const elapsed = Date.now() - thinkingStartRef.current;
    const min = 400;
    if (elapsed < min) await new Promise((r) => setTimeout(r, min - elapsed));
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    typingAbortRef.current.abort();
    typingAbortRef.current = new AbortController();
    setIsLoading(false);
  }, []);

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    if (!textOverride) setInputValue("");
    const userMsgObj: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => {
      const hasGreetings = prev.length === 2 && prev[0].role === "system" && prev[1].role === "system";
      return hasGreetings ? [userMsgObj] : [...prev, userMsgObj];
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    thinkingStartRef.current = Date.now();

    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, sessionId: sessionIdRef.current, slug: config.kbSlug, instructId: config.instructId }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      const finalId = crypto.randomUUID();
      const contentType = res.headers.get("content-type") || "";

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
              try {
                const event = JSON.parse(trimmedLine);
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
              } catch {
                if (!answerStarted) { streamingAnswerId = crypto.randomUUID(); setMessages((prev) => [...prev, { id: streamingAnswerId, role: "model", text: "" }]); answerStarted = true; }
                setMessages((prev) => prev.map((m) => (m.id === streamingAnswerId ? { ...m, text: m.text + trimmedLine } : m)));
              }
            }
          }
          await waitMinThinking();
          setIsLoading(false);
          return;
        }
      }

      const resp = await res.json();
      const genUI = parseStructuredResponse(resp);
      const responseText = getResponseText(genUI, resp);

      const steps: AgentStep[] = resp.steps || resp.intermediateSteps || [];
      await animateToolSteps(steps, config.animationSpeed, setMessages);

      await waitMinThinking();
      setIsLoading(false);

      if (responseText || genUI) {
        setMessages((prev) => [...prev, { id: finalId, role: "model", text: "" }]);
        await animateTyping(responseText, finalId, setMessages, typingAbortRef.current.signal);
        setMessages((prev) => prev.map((m) => (m.id === finalId ? { ...m, genUI } : m)));
      } else {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", text: "I'm sorry, I didn't get a response. Please try again." }]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "model", text: "I'm sorry, I encountered an error. Please check your connection or try again later." },
      ]);
    } finally {
      abortRef.current = null;
      await waitMinThinking();
      setIsLoading(false);
    }
  }, [inputValue, config]);

  const handleResetClick = useCallback(() => {
    setRotateKey((k) => k + 1);
    setConfirmReset(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    abortRef.current?.abort();
    typingAbortRef.current.abort();
    typingAbortRef.current = new AbortController();
    resetKeyRef.current += 1;
    setMessages([
      { id: crypto.randomUUID(), role: "system", text: config.greeting1 },
      { id: crypto.randomUUID(), role: "system", text: config.greeting2 },
    ]);
    setInputValue("");
    setIsLoading(false);
    setConfirmReset(false);
    sessionIdRef.current = crypto.randomUUID();
  }, [config]);

  const handleCancelReset = useCallback(() => {
    setConfirmReset(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    const scrollBehavior: ScrollBehavior = isLoading ? "instant" : "smooth";
    messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
  }, [messages, isLoading]);

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  useEffect(() => {
    window.marno = {
      ...window.marno,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      send: (text: string) => handleSendRef.current(text),
    };
    return () => { delete window.marno; };
  }, []);

  const isInputEmpty = inputValue.trim().length === 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={ss.panel} role="dialog" aria-label={`Chat with ${config.brandName}`}>
              <AnimatePresence>
                {confirmReset && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute", inset: 0, zIndex: 5,
                      background: "rgba(0,0,0,0.15)", borderRadius: 24,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </AnimatePresence>
              <div style={ss.header}>
                <div style={ss.headerLeft}>
                  <div style={ss.logoCircle}>
                    {config.brandLogo ? (
                      <img src={config.brandLogo} alt={config.brandName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(1px)" }}>
                        <path d="M4 17V10A4 4 0 0 1 12 10V17M12 17V10A4 4 0 0 1 20 10V17" />
                      </svg>
                    )}
                  </div>
                  <span style={ss.headerTitle}>{config.brandName}</span>
                </div>
                <div style={ss.headerActions}>
                  <button onClick={handleResetClick} style={ss.headerBtn} title="Reset chat" aria-label="Reset chat">
                    <motion.span
                      key={rotateKey}
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ display: "flex" }}
                    >
                      <RotateCw size={18} strokeWidth={2.5} />
                    </motion.span>
                  </button>
                  <button onClick={() => setIsOpen(false)} style={ss.headerBtn} aria-label="Close chat"><X size={20} strokeWidth={2.5} /></button>
                </div>
              </div>

              <div style={{ ...ss.msgArea, pointerEvents: confirmReset ? "none" : "auto" }}>
                <div style={ss.msgList} role="log" aria-live="polite" key={resetKeyRef.current}>
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
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.08 } }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            style={{ marginTop: isRoleChange ? 12 : 0 }}
                          >
                            <div style={ss.msgRowBot}>
                              <div style={cardStyle as React.CSSProperties}>
                                {msg.toolDone ? (
                                  <Check size={14} style={{ color: "#059669", flexShrink: 0 }} />
                                ) : (
                                  <Loader2 size={14} className="marno-tool-spinner" style={{ color: getPrimaryColor() }} />
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
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          style={{ marginTop: isRoleChange ? 12 : 0 }}
                        >
                          <div style={isUser ? ss.msgRowUser : ss.msgRowBot}>
                            {parts.map((part, pIdx) => (
                              <motion.div
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
                      <motion.div layout key="loading-indicator" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.18, ease: "easeOut" }} style={{ marginTop: 12 }}>
                        <div style={ss.thinking}><Loader2 size={14} style={{ animation: "marno-spin 1s linear infinite", color: "#6b7280" }} /><span className="marno-thinking-shimmer">Thinking...</span></div>
                      </motion.div>
                    )}

                    {!isLoading && messages.length === 2 && messages[0].role === "system" && (
                      <motion.div layout key="suggestions" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.18, delay: 0.05, ease: "easeOut" }}>
                        <div style={ss.suggestions}>
                          {config.suggestions.map((s) => (
                            <motion.button layoutId={`suggestion-${s.prompt}`} key={s.prompt} onClick={() => handleSend(s.prompt)} style={ss.suggestBtn}>{s.label}</motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div ref={messagesEndRef} />
              </div>

              <div style={ss.inputWrap(confirmReset)}>
                <AnimatePresence mode="wait">
                  {confirmReset ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      style={ss.confirmBar}
                    >
                      <button onClick={handleConfirmReset} style={ss.confirmStartBtn}>Start New Chat</button>
                      <button onClick={handleCancelReset} style={ss.confirmCancelBtn}>Cancel</button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ ...ss.inputBar, borderColor: inputFocused ? getPrimaryColor() + "99" : "#e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                    >
                      <textarea
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          const el = e.target;
                          el.style.height = "auto";
                          el.style.height = Math.min(el.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        placeholder="Message..."
                        disabled={isLoading}
                        rows={1}
                        style={ss.input}
                        aria-label="Type a message"
                      />
                      <button
                        onClick={() => isLoading ? handleStop() : handleSend()}
                        style={ss.sendBtn(isLoading || (!isInputEmpty && !isLoading))}
                        aria-label={isLoading ? "Stop generating" : "Send message"}
                      >
                        {isLoading ? <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="3" /></svg> : <ArrowUp size={18} strokeWidth={2.5} />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={ss.toggle}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        <img src={config.toggleIcon} alt="Chat" style={ss.toggleImg} />
      </button>
    </>
  );
}

function mount() {
  const config = getConfig();

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = `https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(fontLink);

  const fontOverride = document.createElement("style");
  fontOverride.textContent = `#marno-widget-root, #marno-widget-root * { font-family: "${config.fontFamily}", ui-sans-serif, system-ui, sans-serif !important; }`;
  document.head.appendChild(fontOverride);

  const animStyles = document.createElement("style");
  animStyles.textContent = `
@keyframes marno-spin { to { transform: rotate(360deg); } }
@keyframes marno-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes marno-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
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
.marno-thinking-shimmer {
  background: linear-gradient(110deg, #6b7280 30%, #9ca3af 50%, #6b7280 70%);
  background-size: 200% 100%;
  animation: marno-shimmer 1.8s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;
  document.head.appendChild(animStyles);

  const root = document.createElement("div");
  root.id = "marno-widget-root";
  document.body.appendChild(root);

  let configKey = 0;

  const render = () => {
    createRoot(root).render(
      <ErrorBoundary key={configKey}>
        <ChatWidget />
      </ErrorBoundary>
    )
  }

  render()

  // Expose updateConfig for runtime config changes
  window.marno = {
    ...window.marno,
    updateConfig: (newConfig?: Partial<typeof window.MarnoChatConfig>) => {
      if (newConfig) {
        window.MarnoChatConfig = { ...window.MarnoChatConfig, ...newConfig } as typeof window.MarnoChatConfig
      }
      configKey++
      render()
    },
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
