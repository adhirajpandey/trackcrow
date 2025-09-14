"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function CrowBotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [activeMenu, setActiveMenu] = useState<
    "transaction" | "analytics" | null
  >(null);

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
    setMessages([]);
    setActiveMenu(null);
  };

  const toggleMenu = (menu: "transaction" | "analytics") => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Got it! Processing your request..." },
      ]);
    }, 1000);

    setInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {messages.length > 0 && (
        <header className="flex justify-center p-4">
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

              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleMenu("transaction")}
                    className={`rounded-lg border border-border px-3 py-1 text-sm ${
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
                    onClick={() => toggleMenu("analytics")}
                    className={`rounded-lg border border-border px-3 py-1 text-sm ${
                      activeMenu === "analytics"
                        ? "text-white"
                        : "bg-background hover:bg-accent"
                    }`}
                    style={{
                      backgroundColor:
                        activeMenu === "analytics" ? "#75378d" : undefined,
                    }}
                  >
                    Analytics
                  </button>
                </div>
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
            {messages.map((msg, i) => (
              <div key={i} className="w-full max-w-2xl mx-auto flex">
                {msg.sender === "bot" ? (
                  <div className="mr-auto text-foreground text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="ml-auto bg-muted text-white px-4 py-2 rounded-lg text-sm max-w-xs break-words">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </main>

      {messages.length > 0 && (
        <footer className="p-4">
          <div className="w-full max-w-2xl mx-auto rounded-xl border border-border bg-muted px-4 py-3 shadow-lg flex flex-col">
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

            <div className="flex justify-end gap-3">
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
        </footer>
      )}
    </div>
  );
}
