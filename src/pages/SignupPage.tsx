import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function SignupPage() {
  const nav = useNavigate();
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });
  const [pwMin, setPwMin] = useState(4);
  const [pwLabel, setPwLabel] = useState("비밀번호 (4자 이상)");

  useEffect(() => {
    if (AppData.isRemote()) {
      setPwMin(6);
      setPwLabel("비밀번호 (6자 이상, Supabase 정책)");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg({ tone: "hidden", text: "" });
    try {
      const u = await AppData.registerUser({
        username: String(fd.get("username") || ""),
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || ""),
      });
      await AppData.setSession(u);
      setMsg({ tone: "ok", text: "가입되었습니다. 보드로 이동합니다…" });
      setTimeout(() => nav("/app/board"), 600);
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "가입에 실패했습니다." });
    }
  }

  return (
    <>
      <SiteHeader variant="auth" />
      <AuthCard
        title="회원가입"
        iconId="i-user-plus"
        hint="Supabase를 연결하지 않으면 이 PC 브라우저에만 저장됩니다. 연결하면 모든 방문자가 같은 데이터를 사용합니다."
      >
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="username">아이디</label>
            <input className="input" id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="name">이름</label>
            <input className="input" id="name" name="name" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">{pwLabel}</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={pwMin}
            />
          </div>
          <Button variant="primary" type="submit">
            <Icon id="i-check" />
            가입 완료
          </Button>
        </form>
        <p className="hint" style={{ marginTop: 18, marginBottom: 0 }}>
          이미 계정이 있나요?{" "}
          <Link to="/auth/login" style={{ color: "#c4b5fd", textDecoration: "underline" }}>
            로그인
          </Link>
        </p>
      </AuthCard>
    </>
  );
}
