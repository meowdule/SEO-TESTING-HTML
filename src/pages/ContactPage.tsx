import { useEffect, useState } from "react";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function ContactPage() {
  const [hint, setHint] = useState("문의 내용은 이 브라우저의 localStorage에만 기록됩니다.");
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });

  useEffect(() => {
    if (AppData.isRemote()) {
      setHint("Supabase에 연결된 경우 문의는 서버에 저장되며, 관리자가 커뮤니티 보드에서 확인할 수 있습니다.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg({ tone: "hidden", text: "" });
    try {
      await AppData.submitContactInquiry({
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        topic: String(fd.get("topic") || ""),
        body: String(fd.get("body") || ""),
      });
      setMsg({
        tone: "ok",
        text: AppData.isRemote() ? "문의가 접수되었습니다." : "문의가 저장되었습니다. (이 PC 브라우저에만 보관)",
      });
      e.currentTarget.reset();
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "제출에 실패했습니다." });
    }
  }

  return (
    <>
      <SiteHeader variant="simple" />
      <AuthCard title="문의하기" iconId="i-mail" hint={hint}>
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">이름</label>
            <input className="input" id="name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="topic">주제</label>
            <select className="input" id="topic" name="topic" defaultValue="제품 문의">
              <option>제품 문의</option>
              <option>가격 / 견적</option>
              <option>기술 지원</option>
              <option>기타</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="body">내용</label>
            <textarea className="textarea" id="body" name="body" required />
          </div>
          <div className="stack">
            <Button variant="primary" type="submit">
              <Icon id="i-send" />
              제출하기
            </Button>
          </div>
        </form>
      </AuthCard>
    </>
  );
}
