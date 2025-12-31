"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ExpenseCard } from "@/app/crow-bot/components/expense-card";
import { Thinking } from "@/app/crow-bot/components/thinking";
import { TypingText } from "@/app/crow-bot/components/typing-text";
import { MissingFieldsForm } from "@/app/crow-bot/components/missing-fields-form";
import { DashboardSummaryLink } from "@/app/crow-bot/components/dashboard-summary-card";
import { TransactionSearchCard } from "./transaction-search-card";
import { ExpenseComparisonCard } from "./expense-comparision-card";
import { TopExpenseCard } from "./top-expense-card";
import { TotalSpendCard } from "./total-spend-card";
import { Wallet, BarChart2, RefreshCw, Send } from "lucide-react";
import { CrowBotConfig } from "@/app/crow-bot/config/ui";

function MenuToggle({
  activeMenu,
  toggleMenu,
  setIntentPrompt,
}: {
  activeMenu: "transaction" | "analytics" | null;
  toggleMenu: (menu: "transaction" | "analytics") => void;
  setIntentPrompt: (msg: string) => void;
}) {
  return (
    <>
      {/* Desktop: full text buttons */}
      <div className="hidden sm:flex gap-3">
        <button
          onClick={() => {
            setIntentPrompt("");
            toggleMenu("transaction");
          }}
          className={`rounded-lg border border-border px-3 py-1 text-sm min-w-0 truncate ${
            activeMenu === "transaction"
              ? "text-white"
              : "bg-background hover:bg-accent"
          }`}
          style={{
            backgroundColor:
              activeMenu === "transaction" ? "#75378d" : undefined,
          }}
        >
          Transaction
        </button>
        <button
          onClick={() => {
            setIntentPrompt("");
            toggleMenu("analytics");
          }}
          className={`rounded-lg border border-border px-3 py-1 text-sm min-w-0 truncate ${
            activeMenu === "analytics"
              ? "text-white"
              : "bg-background hover:bg-accent"
          }`}
          style={{
            backgroundColor: activeMenu === "analytics" ? "#75378d" : undefined,
          }}
        >
          Analytics
        </button>
      </div>

      {/* Mobile: compact round icon buttons aligned left in the same row */}
      <div className="flex sm:hidden gap-2 items-center">
        <button
          onClick={() => {
            setIntentPrompt("");
            toggleMenu("transaction");
          }}
          aria-label="Transaction"
          className={`w-10 h-10 flex items-center justify-center rounded-full border border-border flex-shrink-0 transition ${
            activeMenu === "transaction"
              ? "bg-[#75378d] text-white"
              : "bg-background"
          }`}
        >
          <Wallet size={18} />
        </button>

        <button
          onClick={() => {
            setIntentPrompt("");
            toggleMenu("analytics");
          }}
          aria-label="Analytics"
          className={`w-10 h-10 flex items-center justify-center rounded-full border border-border flex-shrink-0 transition ${
            activeMenu === "analytics"
              ? "bg-[#75378d] text-white"
              : "bg-background"
          }`}
        >
          <BarChart2 size={18} />
        </button>
      </div>
    </>
  );
}

export function tryParseJSON(text: string) {
  if (!text) return null;

  const cleaned = text.trim();

  if (!cleaned.startsWith("{") || !cleaned.includes("}")) return null;

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("Error in crowbot-client:", err);
    return null;
  }
}

function shouldHideUserMessage(message: any) {
  if (message.role !== "user") return false;
  return message.metadata?.hidden === true;
}

export default function CrowBotClient() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, setMessages } = useChat();
  const [activeMenu, setActiveMenu] = useState<
    "transaction" | "analytics" | null
  >(null);
  const [intentPrompt, setIntentPrompt] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const suggestions =
    activeMenu === "transaction"
      ? CrowBotConfig.suggestions.transaction
      : activeMenu === "analytics"
        ? CrowBotConfig.suggestions.analytics
        : [];

  const handleReset = () => {
    setInput("");
    setActiveMenu(null);
    setMessages([]);
  };

  const toggleMenu = (menu: "transaction" | "analytics") => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSend = async () => {
    const currentIntent = activeMenu;
    const userText = input.trim();
    if (!currentIntent) {
      setIntentPrompt(CrowBotConfig.prompts.selectMode);
      return;
    }
    if (!userText) return;

    setIntentPrompt("");
    setInput("");

    await sendMessage({
      text: userText,
      metadata: { intent: currentIntent },
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {messages.length > 0 && (
        <header className="sticky top-0 z-10 bg-background flex justify-center p-2 border-border">
          <h2 className="text-gray-400 text-sm font-medium">
            Conversation with the Crow Bot
          </h2>
        </header>
      )}
      <main
        className={`flex-1 overflow-y-auto pb-32 sm:pb-32 ${
          messages.length === 0
            ? "flex items-center justify-center p-4"
            : "p-4 sm:p-6 space-y-4"
        }`}
      >
        {messages.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto px-2">
            <h1 className="text-xl font-bold flex items-center gap-2 justify-center mb-4">
              <Image
                src="/trackcrow.jpg"
                alt="Crow Bot"
                width={32}
                height={32}
                className="rounded-full"
              />
              How can I help you?
            </h1>

            <div className="w-full rounded-xl border border-border bg-muted px-4 py-3 shadow-lg flex flex-col relative">
              <textarea
                rows={3}
                className="w-full resize-none bg-transparent outline-none px-1 text-sm mb-3"
                placeholder="Message Crow Bot"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {intentPrompt && (
                <div className="text-red-500 text-xs mb-2">{intentPrompt}</div>
              )}

              <div className="flex items-center justify-between gap-3">
                <MenuToggle
                  activeMenu={activeMenu}
                  toggleMenu={toggleMenu}
                  setIntentPrompt={setIntentPrompt}
                />
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={handleReset}
                    className="rounded-full p-2 hover:bg-accent"
                    title="Reset"
                    aria-label="Reset"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={handleSend}
                    className="rounded-full p-2 text-white hover:opacity-90"
                    style={{ backgroundColor: "#75378d" }}
                    title="Send"
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {activeMenu && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-border bg-background shadow-lg p-3 space-y-2 max-h-44 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="cursor-pointer rounded-md px-2 py-1 hover:bg-accent break-words"
                      onClick={() => setInput(s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages
              .filter((m) => !shouldHideUserMessage(m))
              .map((message) => (
                <div
                  key={message.id}
                  className="w-full max-w-2xl mx-auto flex mb-2"
                >
                  {message.role === "assistant" ? (
                    <div className="mr-auto text-foreground text-sm space-y-2">
                      {Array.isArray(message.parts) &&
                        message.parts.map((part: any, index: number) => {
                          if (part.type === "text") {
                            const parsed = tryParseJSON(part.text);

                            if (parsed && parsed.type === "missing_fields") {
                              return (
                                <MissingFieldsForm
                                  key={index}
                                  fields={parsed.fields}
                                  resumeState={parsed.resumeState}
                                  categories={parsed.categories || []}
                                  onSubmit={async (data: any) => {
                                    try {
                                      await sendMessage({
                                        text: JSON.stringify({
                                          ...data,
                                          __resume: true,
                                          resumeState: parsed.resumeState,
                                        }),
                                        metadata: {
                                          resumeIntent: true,
                                          resumeState: parsed.resumeState,
                                          hidden: true,
                                          intent: activeMenu,
                                        },
                                      });
                                    } catch (err) {
                                      console.error(
                                        "Error resuming chat:",
                                        err
                                      );
                                    }
                                  }}
                                />
                              );
                            }

                            return (
                              <TypingText
                                key={index}
                                text={part.text}
                                scrollRef={chatEndRef}
                              />
                            );
                          }

                          if (part.type === "tool-recordExpense") {
                            console.log("Rendering ExpenseCard with:", part);
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Transaction successfully added:
                                </p>
                                <ExpenseCard {...part.output} />
                              </div>
                            );
                          }
                          if (part.type === "tool-dashboardSummary") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <DashboardSummaryLink />
                              </div>
                            );
                          }

                          if (part.type === "tool-transactionSearch") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <TransactionSearchCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-expenseComparison") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <ExpenseComparisonCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-topExpense") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <TopExpenseCard {...part.output} />
                              </div>
                            );
                          }
                          if (part.type === "tool-totalSpend") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <TotalSpendCard {...part.output} />
                              </div>
                            );
                          }
                          return null;
                        })}
                    </div>
                  ) : (
                    <div className="ml-auto bg-muted text-white px-4 py-2 rounded-lg text-sm max-w-xs break-words">
                      {Array.isArray(message.parts) &&
                        message.parts.map((part: any, index: number) => {
                          if (part.type === "text") {
                            return <p key={index}>{part.text}</p>;
                          }
                          return null;
                        })}
                    </div>
                  )}
                </div>
              ))}

            {status === "submitted" && (
              <div className="w-full max-w-2xl mx-auto text-sm text-zinc-500 italic">
                <Thinking />
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </main>

      {messages.length > 0 && (
        <footer
          className="sticky bottom-0 p-4 bg-background z-20"
          style={{ paddingTop: 12 }}
        >
          <div className="w-full max-w-2xl mx-auto rounded-xl border border-border bg-muted px-4 py-3 shadow-lg flex flex-col">
            {intentPrompt && (
              <div className="text-red-500 text-xs mb-2">{intentPrompt}</div>
            )}

            <textarea
              rows={2}
              className="w-full resize-none bg-transparent outline-none px-1 text-sm mb-3"
              placeholder="Message Crow Bot"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="flex items-center justify-between gap-3">
              <MenuToggle
                activeMenu={activeMenu}
                toggleMenu={toggleMenu}
                setIntentPrompt={setIntentPrompt}
              />
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={handleReset}
                  className="rounded-full p-2 hover:bg-accent"
                  title="Reset"
                  aria-label="Reset"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={handleSend}
                  className="rounded-full p-2 text-white hover:opacity-90"
                  style={{ backgroundColor: "#75378d" }}
                  title="Send"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
