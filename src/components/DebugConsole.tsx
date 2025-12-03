"use client";

import { useEffect, useRef, useState } from "react";

export function DebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const originalLogRef = useRef(console.log);

  useEffect(() => {
    // ラップ関数（オリジナルconsole.logは残す）
    function hookLog(...args: unknown[]) {
      originalLogRef.current(...args);
      setLogs((prev) => [
        ...prev,
        args.map((a) => JSON.stringify(a)).join(" "),
      ]);
    }

    // ⛔ グローバル変数書き換えは禁止なので window.console.log を patch する
    const consoleProxy = new Proxy(console, {
      get(target, prop) {
        if (prop === "log") return hookLog;
        return Reflect.get(target, prop);
      },
    });

    // console を差し替え
    (window as any).console = consoleProxy;

    return () => {
      (window as any).console = originalLogRef.current;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        maxHeight: "40%",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        fontSize: 10,
        padding: 8,
        overflowY: "scroll",
        zIndex: 999999,
      }}
    >
      {logs.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
