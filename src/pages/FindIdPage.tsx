import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function FindIdPage() {
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    setMsg({ tone: "hidden", text: "" });
    const u = await AppData.findUserByEmail(email);
    if (!u) {
      setMsg({ tone: "err", text: "해당 이메일로 가입된 계정을 찾을 수 없습니다." });
      return;
    }
    setMsg({ tone: "ok", text: `회원님의 아이디는 「${u.username}」 입니다.` });
  }

  return (
    <>
      <SiteHeader variant="auth" />
      <AuthCard title="아이디 찾기" iconId="i-search" hint="가입 시 사용한 이메일로 등록된 아이디를 찾습니다.">
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <Button variant="primary" type="submit">
            <Icon id="i-search" />
            아이디 조회
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
