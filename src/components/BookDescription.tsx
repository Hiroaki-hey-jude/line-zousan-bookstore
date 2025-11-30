"use client";

import { useState } from "react";

export function BookDescription({ text }: { text: string }) {
  const LIMIT = 100;
  const isLong = text.length > LIMIT;

  const [expanded, setExpanded] = useState(false);

  const displayText = expanded ? text : text.slice(0, LIMIT);

  return (
    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
      {displayText}
      {isLong && !expanded && "…"}

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 block text-sm font-semibold text-blue-600 hover:underline"
        >
          {expanded ? "閉じる ▲" : "続きを読む ▼"}
        </button>
      )}
    </div>
  );
}
