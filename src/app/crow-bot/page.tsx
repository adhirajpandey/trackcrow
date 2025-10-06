"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ExpenseCard } from "@/app/crow-bot/components/expense-card";
import { ShowTransactionsCard } from "@/app/crow-bot/components/show-transactions-card";
import { SpendingTrendCard } from "@/app/crow-bot/components/spend-trend-card";
import { MonthSummaryCard } from "@/app/crow-bot/components/month-summary-card";
import { BudgetCard } from "@/app/crow-bot/components/budget-card";
import { TotalSpendsCard } from "@/app/crow-bot/components/total-spends-card";
import { Thinking } from "@/app/crow-bot/components/thinking";
import { TypingText } from "@/app/crow-bot/components/typing-text";
import { MissingFieldsForm } from "@/app/crow-bot/components/missing-fields-form";

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
    <div className="flex gap-3">
      <button
        onClick={() => {
          setIntentPrompt("");
          toggleMenu("transaction");
        }}
        className={`rounded-lg border border-border px-3 py-1 text-sm ${
          activeMenu === "transaction"
            ? "text-white"
            : "bg-background hover:bg-accent"
        }`}
        style={{
          backgroundColor: activeMenu === "transaction" ? "#75378d" : undefined,
        }}
      >
        Transaction
      </button>
      <button
        onClick={() => {
          setIntentPrompt("");
          toggleMenu("analytics");
        }}
        className={`rounded-lg border border-border px-3 py-1 text-sm ${
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
    return null;
  }
}

function shouldHideUserMessage(message: any) {
  if (message.role !== "user") return false;
  return message.metadata?.hidden === true;
}

export default function CrowBotPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, setMessages } = useChat();
  const [activeMenu, setActiveMenu] = useState<
    "transaction" | "analytics" | null
  >(null);
  const [intentPrompt, setIntentPrompt] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const suggestions =
    activeMenu === "transaction"
      ? [
          "Add a new expense transaction",
          "Show me my last 5 transactions",
          "Calculate total spent on food this week",
        ]
      : activeMenu === "analytics"
        ? [
            "Show spending trend by category",
            "Compare last month vs this month expenses",
            "What’s my biggest expense category?",
          ]
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
      setIntentPrompt(
        "Please select Transaction or Analytics before starting."
      );
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
        className={`flex-1 overflow-y-auto p-6 space-y-4 ${
          messages.length === 0 ? "flex items-center justify-center" : ""
        }`}
      >
        {messages.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto">
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
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="rounded-full p-2 hover:bg-accent"
                    title="Reset"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12a7.5 7.5 0 0112.65-5.303l1.85-1.85M21 12a7.5 7.5 0 01-12.65 5.303l-1.85 1.85"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleSend}
                    className="rounded-full p-2 text-white hover:opacity-90"
                    style={{ backgroundColor: "#75378d" }}
                    title="Send"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {activeMenu && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-border bg-background shadow-lg p-3 space-y-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="cursor-pointer rounded-md px-2 py-1 hover:bg-accent"
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
                                  onSubmit={async (data) => {
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

                          if (part.type === "tool-logExpense") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Your transaction has been successfully
                                  added:
                                </p>
                                <ExpenseCard {...part.output} />
                              </div>
                            );
                          }
                          if (part.type === "tool-setBudget") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Your Budget has been successfully set:
                                </p>
                                <BudgetCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-showTransactions") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Here are your recent transactions:
                                </p>
                                <ShowTransactionsCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-calculateTotalSpent") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Here is the total spend information:
                                </p>
                                <TotalSpendsCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-lastMonthSummary") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Here is your month summary:
                                </p>
                                <MonthSummaryCard {...part.output} />
                              </div>
                            );
                          }

                          if (part.type === "tool-spendingTrend") {
                            return (
                              <div key={index} className="my-4 space-y-2">
                                <p className="text-sm text-green-400 font-medium">
                                  ✅ Here is your spending trend:
                                </p>
                                <SpendingTrendCard {...part.output} />
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
        <footer className="p-4">
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
              />{" "}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-full p-2 hover:bg-accent"
                  title="Reset"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12a7.5 7.5 0 0112.65-5.303l1.85-1.85M21 12a7.5 7.5 0 01-12.65 5.303l-1.85 1.85"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleSend}
                  className="rounded-full p-2 text-white hover:opacity-90"
                  style={{ backgroundColor: "#75378d" }}
                  title="Send"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
