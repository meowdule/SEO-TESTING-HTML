import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";

type Props = {
  title: string;
  iconId: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function AuthCard({ title, iconId, hint, children }: Props) {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>
          <Icon id={iconId} />
          {title}
        </h1>
        {hint ? <p className="hint">{hint}</p> : null}
        {children}
      </div>
    </main>
  );
}
