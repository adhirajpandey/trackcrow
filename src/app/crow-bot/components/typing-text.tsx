import { useState, useRef, useEffect } from "react";

export function TypingText({
  text,
  scrollRef,
}: {
  text: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [displayed, setDisplayed] = useState("");
  const bufferRef = useRef(text);
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bufferRef.current = text;

    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      const target = bufferRef.current;

      if (indexRef.current < target.length) {
        setDisplayed(target.slice(0, indexRef.current + 1));
        indexRef.current++;

        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 30);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, scrollRef]);

  return <span className="whitespace-pre-wrap">{displayed}</span>;
}
