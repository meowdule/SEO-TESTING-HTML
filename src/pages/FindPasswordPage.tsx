import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function FindPasswordPage() {
  const [remote, setRemote] = useState(false);
  const [hint, setHint] = useState(
    "로컬 모드: 이메일·아이디가 일치하면 이 브라우저에서 바로 새 비밀번호로 갱신됩니다. Supabase 연결 시: 이메일로 재설정 링크가 발송됩니다.",
  );
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });

  useEffect(() => {
    const r = AppData.isRemote();
    setRemote(r);
    if (r) {
      setHint(
        "Supabase 연결 모드: 가입 시 사용한 이메일로 재설정 링크를 보냅니다. (아이디·즉시 변경 필드는 사용하지 않습니다.)",
      );
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg({ tone: "hidden", text: "" });
    try {
      await AppData.resetPassword(
        String(fd.get("email") || ""),
        String(fd.get("username") || ""),
        String(fd.get("np") || ""),
      );
      setMsg({
        tone: "ok",
        text: AppData.isRemote()
          ? "재설정 메일을 보냈습니다. 메일함을 확인한 뒤 링크로 새 비밀번호를 설정해 주세요."
          : "비밀번호가 변경되었습니다. 로그인해 주세요.",
      });
      e.currentTarget.reset();
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "처리에 실패했습니다." });
    }
  }

  return (
    <>
      <SiteHeader variant="auth" />
      <AuthCard title="비밀번호 재설정" iconId="i-key" hint={hint}>
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {!remote ? (
            <>
              <div className="field">
                <label htmlFor="username">아이디</label>
                <input className="input" id="username" name="username" required autoComplete="username" />
              </div>
              <div className="field">
                <label htmlFor="np">새 비밀번호 (4자 이상)</label>
                <input className="input" id="np" name="np" type="password" autoComplete="new-password" required minLength={4} />
              </div>
            </>
          ) : null}
          <Button variant="primary" type="submit">
            <Icon id="i-lock" />
            비밀번호 변경
          </Button>
        </form>
        <p className="hint" style={{ marginTop: 18, marginBottom: 0 }}>
          <Link to="/auth/login" style={{ color: "#c4b5fd", textDecoration: "underline" }}>
            로그인으로 돌아가기
          </Link>
        </p>
      </AuthCard>
    </>
  );
}
