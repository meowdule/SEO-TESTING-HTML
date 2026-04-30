import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function LoginPage() {
  const nav = useNavigate();
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });
  const [modeHint, setModeHint] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await AppData.init();
      if (!AppData.isRemote()) {
        setModeHint(
          "로컬 데모 모드: 계정·게시글이 이 브라우저에만 저장됩니다. GitHub Pages에서 Supabase를 쓰려면 site.ts에 Project URL과 anon 키가 있어야 하며, adminUsernames 등 문법 오류가 없어야 합니다.",
        );
      }
      const s = await AppData.getSession();
      if (s) nav("/app/board", { replace: true });
    })();
  }, [nav]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg({ tone: "hidden", text: "" });
    try {
      const u = await AppData.verifyLogin(String(fd.get("login") || ""), String(fd.get("password") || ""));
      await AppData.setSession(u);
      nav("/app/board");
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "로그인에 실패했습니다." });
    }
  }

  return (
    <>
      <SiteHeader variant="simple" />
      <AuthCard title="로그인" iconId="i-lock" hint="체험 계정으로 로그인하면 커뮤니티 보드로 이동합니다.">
        {modeHint ? (
          <p className="hint" style={{ display: "block", color: "#fbbf24" }}>
            {modeHint}
          </p>
        ) : null}
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="login">아이디 또는 이메일</label>
            <input className="input" id="login" name="login" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div className="stack">
            <Button variant="primary" type="submit">
              <Icon id="i-arrow" />
              로그인하고 보드로 이동
            </Button>
          </div>
        </form>
        <div className="row-between" style={{ marginTop: 18 }}>
          <div className="links-inline">
            <Link to="/auth/find-id">
              <Icon id="i-search" />
              아이디 찾기
            </Link>
            <Link to="/auth/find-password">
              <Icon id="i-key" />
              비밀번호 찾기
            </Link>
            <Link to="/auth/signup">
              <Icon id="i-user-plus" />
              회원가입
            </Link>
          </div>
        </div>
      </AuthCard>
    </>
  );
}
