import type { ReactNode } from "react";

type Tone = "ok" | "err" | "hidden";

export function FormMessage({ tone, children }: { tone: Tone; children: ReactNode }) {
  if (tone === "hidden" || !children) return <div className="msg" aria-hidden />;
  const cls = tone === "ok" ? "msg show ok" : "msg show err";
  return (
    <div className={cls} role={tone === "err" ? "alert" : "status"}>
      {children}
    </div>
  );
}
