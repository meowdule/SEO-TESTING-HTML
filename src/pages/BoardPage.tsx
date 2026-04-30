import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import { Modal, ModalActions } from "../components/ui/Modal";
import type { PostRecord } from "../lib/appData";
import * as AppData from "../lib/appData";

type Tab = "posts" | "inquiries" | "apply";

type InquiryRow = { at: number; name: string; email: string; topic: string; body: string };
type ApplyRow = { at: number; company: string; name: string; email: string; plan: string; note: string };

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

export function BoardPage() {
  const nav = useNavigate();
  const [user, setUser] = useState<{ id: string; username: string; name: string; email: string } | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<{ post: PostRecord; author: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mmsg, setMmsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });
  const [inquiries, setInquiries] = useState<InquiryRow[] | "err" | "loading">("loading");
  const [applyRows, setApplyRows] = useState<ApplyRow[] | "err" | "loading">("loading");
  const [inqHint, setInqHint] = useState(
    "문의하기 페이지에서 제출된 항목입니다. 이 PC 브라우저 localStorage에만 저장되므로, 다른 기기나 시크릿 창에서는 목록이 비어 있을 수 있습니다.",
  );
  const [applyHint, setApplyHint] = useState(
    "지금 신청하기 페이지에서 제출된 항목입니다. 데모 모드에서는 이 브라우저 localStorage에만 저장됩니다.",
  );

  const loadPosts = useCallback(async () => {
    const list = await AppData.getPosts();
    const authorLabels = await Promise.all(list.map((p) => AppData.displayName(p.authorId)));
    setPosts(list.map((p, i) => ({ post: p, author: authorLabels[i] })));
  }, []);

  useEffect(() => {
    (async () => {
      await AppData.init();
      const u = await AppData.requireSession();
      if (!u) {
        setUser(null);
        return;
      }
      setUser({ id: u.id, username: u.username, name: u.name, email: u.email });
      if (AppData.isRemote()) {
        setInqHint(
          "문의하기 페이지에서 접수된 전체 문의입니다. Supabase에 저장되며, app_admins에 등록된 관리자만 조회할 수 있습니다.",
        );
        setApplyHint(
          "지금 신청하기 페이지에서 접수된 전체 신청입니다. Supabase에 저장되며, app_admins에 등록된 관리자만 조회할 수 있습니다.",
        );
      }
      await loadPosts();
    })();
  }, [loadPosts]);

  useEffect(() => {
    if (user === null) nav("/auth/login", { replace: true });
  }, [user, nav]);

  async function loadInquiries() {
    setInquiries("loading");
    try {
      const rows = (await AppData.getContactInquiries()) as InquiryRow[];
      setInquiries(rows);
    } catch (e) {
      setInquiries("err");
    }
  }

  async function loadApply() {
    setApplyRows("loading");
    try {
      const rows = (await AppData.getApplySubmissions()) as ApplyRow[];
      setApplyRows(rows);
    } catch {
      setApplyRows("err");
    }
  }

  useEffect(() => {
    if (!user) return;
    if (!AppData.isAdminUser(user.username)) return;
    if (tab === "inquiries") void loadInquiries();
    if (tab === "apply") void loadApply();
  }, [tab, user]);

  async function logout() {
    await AppData.clearSession();
    nav("/auth/login");
  }

  async function onNewPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "");
    const body = String(fd.get("body") || "");
    setMmsg({ tone: "hidden", text: "" });
    try {
      if (!title.trim() || !body.trim()) throw new Error("제목과 내용을 입력해 주세요.");
      const r = await AppData.upsertPost(user.id, { title, body });
      setModalOpen(false);
      nav(`/app/post?id=${encodeURIComponent(r.id)}`);
    } catch (err) {
      setMmsg({ tone: "err", text: err instanceof Error ? err.message : "저장에 실패했습니다." });
    }
  }

  if (user === undefined) {
    return (
      <>
        <SiteHeader variant="board" userLabel="" onLogout={logout} />
        <p className="wrap muted" style={{ padding: "2rem 0" }}>
          불러오는 중…
        </p>
      </>
    );
  }
  if (!user) return null;

  const isAdmin = AppData.isAdminUser(user.username);

  return (
    <>
      <SiteHeader variant="board" userLabel={`${user.name} · @${user.username}`} onLogout={() => void logout()} />
      <main className="section">
        <div className="wrap">
          {isAdmin ? (
            <div className="board-tabs" role="tablist" aria-label="보드 구역">
              <button
                type="button"
                className={`tab-btn ${tab === "posts" ? "tab-btn-active" : ""}`}
                role="tab"
                aria-selected={tab === "posts"}
                onClick={() => setTab("posts")}
              >
                <Icon id="i-chat" />
                게시판
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "inquiries" ? "tab-btn-active" : ""}`}
                role="tab"
                aria-selected={tab === "inquiries"}
                onClick={() => setTab("inquiries")}
              >
                <Icon id="i-mail" />
                문의
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "apply" ? "tab-btn-active" : ""}`}
                role="tab"
                aria-selected={tab === "apply"}
                onClick={() => setTab("apply")}
              >
                <Icon id="i-user-plus" />
                신청
              </button>
            </div>
          ) : null}

          {tab === "posts" ? (
            <>
              <div className="board-toolbar">
                <div>
                  <h1 style={{ margin: "0 0 6px", fontSize: "clamp(1.35rem, 3vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                    <Icon id="i-chat" />
                    커뮤니티 보드
                  </h1>
                  <p className="muted" style={{ margin: 0 }}>
                    게시글을 눌러 댓글까지 이어가 보세요.
                  </p>
                </div>
                <Button variant="primary" type="button" onClick={() => setModalOpen(true)}>
                  <Icon id="i-add" />
                  새 글 작성
                </Button>
              </div>
              <div className="post-list">
                {posts.length === 0 ? (
                  <div className="empty">
                    <Icon id="i-chat" size="lg" />
                    첫 게시글을 작성해 보세요.
                  </div>
                ) : (
                  posts.map(({ post, author }) => (
                    <article
                      key={post.id}
                      className="post-item"
                      onClick={() => nav(`/app/post?id=${encodeURIComponent(post.id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") nav(`/app/post?id=${encodeURIComponent(post.id)}`);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <h3>{post.title}</h3>
                        <div className="meta">
                          {author} · {fmt(post.updatedAt)}
                        </div>
                      </div>
                      <Icon id="i-arrow" />
                    </article>
                  ))
                )}
              </div>
            </>
          ) : null}

          {tab === "inquiries" ? (
            <>
              <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
                <Icon id="i-mail" />
                문의
              </h2>
              <p className="muted" style={{ margin: "0 0 16px" }}>
                {inqHint}
              </p>
              <div className="inquiry-list">
                {inquiries === "loading" ? (
                  <div className="empty">불러오는 중…</div>
                ) : inquiries === "err" ? (
                  <div className="empty">문의 목록을 불러오지 못했습니다. app_admins 권한을 확인하세요.</div>
                ) : inquiries.length === 0 ? (
                  <div className="empty">저장된 문의가 없습니다.</div>
                ) : (
                  inquiries.map((r, i) => (
                    <article key={i} className="inquiry-card">
                      <div className="inq-head">
                        <span>{fmt(r.at)}</span>
                        <span>
                          {r.name} · {r.email}
                        </span>
                        <span className="inq-topic">{r.topic}</span>
                      </div>
                      <div className="inq-body">{r.body}</div>
                    </article>
                  ))
                )}
              </div>
            </>
          ) : null}

          {tab === "apply" ? (
            <>
              <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
                <Icon id="i-user-plus" />
                신청
              </h2>
              <p className="muted" style={{ margin: "0 0 16px" }}>
                {applyHint}
              </p>
              <div className="inquiry-list">
                {applyRows === "loading" ? (
                  <div className="empty">불러오는 중…</div>
                ) : applyRows === "err" ? (
                  <div className="empty">신청 목록을 불러오지 못했습니다. app_admins 권한을 확인하세요.</div>
                ) : applyRows.length === 0 ? (
                  <div className="empty">저장된 신청이 없습니다.</div>
                ) : (
                  applyRows.map((a, i) => (
                    <article key={i} className="inquiry-card">
                      <div className="inq-head">
                        <span>{fmt(a.at)}</span>
                        <span>
                          {a.company} · {a.name}
                        </span>
                        <span className="inq-topic">{a.plan}</span>
                      </div>
                      <div className="inq-body">
                        {a.email}
                        {a.note ? (
                          <>
                            <br />
                            {a.note}
                          </>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Modal open={modalOpen} title="새 게시글" onClose={() => setModalOpen(false)}>
        <FormMessage tone={mmsg.tone}>{mmsg.text}</FormMessage>
        <form
          onSubmit={(e) => {
            void onNewPost(e);
          }}
        >
          <div className="field">
            <label htmlFor="mt">제목</label>
            <input className="input" id="mt" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="mb">내용</label>
            <textarea className="textarea" id="mb" name="body" required />
          </div>
          <ModalActions onCancel={() => setModalOpen(false)} submitLabel="등록" />
        </form>
      </Modal>
    </>
  );
}
