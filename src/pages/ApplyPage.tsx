import { useEffect, useState } from "react";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AuthCard } from "../components/layout/AuthCard";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import * as AppData from "../lib/appData";

export function ApplyPage() {
  const [hint, setHint] = useState("신청서는 데모용으로 브라우저에만 저장됩니다.");
  const [msg, setMsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });

  useEffect(() => {
    if (AppData.isRemote()) {
      setHint("Supabase에 연결된 경우 신청은 서버에 저장되며, 관리자가 커뮤니티 보드에서 확인할 수 있습니다.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg({ tone: "hidden", text: "" });
    try {
      await AppData.submitApplySubmission({
        company: String(fd.get("company") || ""),
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        plan: String(fd.get("plan") || ""),
        note: String(fd.get("note") || ""),
      });
      setMsg({
        tone: "ok",
        text: AppData.isRemote() ? "신청이 접수되었습니다." : "신청이 저장되었습니다.",
      });
      e.currentTarget.reset();
    } catch (err) {
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "제출에 실패했습니다." });
    }
  }

  return (
    <>
      <SiteHeader variant="simple" />
      <AuthCard title="지금 신청하기" iconId="i-user-plus" hint={hint}>
        <FormMessage tone={msg.tone}>{msg.text}</FormMessage>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="company">회사 / 팀</label>
            <input className="input" id="company" name="company" required />
          </div>
          <div className="field">
            <label htmlFor="name">담당자 이름</label>
            <input className="input" id="name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="plan">희망 플랜</label>
            <select className="input" id="plan" name="plan" defaultValue="Starter">
              <option>Starter</option>
              <option>Pro</option>
              <option>Team</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="note">추가 메모</label>
            <textarea className="textarea" id="note" name="note" />
          </div>
          <Button variant="primary" type="submit">
            <Icon id="i-send" />
            신청 제출
          </Button>
        </form>
      </AuthCard>
    </>
  );
}
