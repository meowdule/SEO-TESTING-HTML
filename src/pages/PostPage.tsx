import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SiteHeader } from "../components/layout/SiteHeader";
import { ButtonLink } from "../components/ui/ButtonLink";
import { Button } from "../components/ui/Button";
import { FormMessage } from "../components/ui/FormMessage";
import { Icon } from "../components/ui/Icon";
import { Modal, ModalActions } from "../components/ui/Modal";
import type { CommentRecord, PostRecord } from "../lib/appData";
import * as AppData from "../lib/appData";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

export function PostPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");

  const [user, setUser] = useState<{ id: string; username: string; name: string; email: string } | null | undefined>(
    undefined,
  );
  const [post, setPost] = useState<PostRecord | null | "gone">(null);
  const [authorName, setAuthorName] = useState("");
  const [comments, setComments] = useState<{ c: CommentRecord; label: string }[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [emsg, setEmsg] = useState<{ tone: "hidden" | "ok" | "err"; text: string }>({ tone: "hidden", text: "" });

  const loadComments = useCallback(async (postId: string) => {
    const cs = await AppData.getComments(postId);
    const labels = await Promise.all(cs.map((c) => AppData.displayName(c.authorId)));
    setComments(cs.map((c, i) => ({ c, label: labels[i] })));
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
      if (!id) {
        nav("/app/board", { replace: true });
        return;
      }
      const p = await AppData.getPost(id);
      if (!p) {
        setPost("gone");
        return;
      }
      setPost(p);
      setAuthorName(await AppData.displayName(p.authorId));
      await loadComments(p.id);
    })();
  }, [id, nav, loadComments]);

  useEffect(() => {
    if (user === null) nav("/auth/login", { replace: true });
  }, [user, nav]);

  async function refreshPost(pid: string) {
    const p = await AppData.getPost(pid);
    if (p) {
      setPost(p);
      setAuthorName(await AppData.displayName(p.authorId));
    }
  }

  if (user === undefined) {
    return (
      <>
        <SiteHeader variant="post" />
        <p className="wrap muted" style={{ padding: "2rem 0" }}>
          불러오는 중…
        </p>
      </>
    );
  }
  if (!user || !id) return null;

  if (post === "gone") {
    return (
      <>
        <SiteHeader variant="post" />
        <main className="wrap post-detail">
          <div className="empty">게시글을 찾을 수 없습니다.</div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <SiteHeader variant="post" />
        <p className="wrap muted" style={{ padding: "2rem 0" }}>
          불러오는 중…
        </p>
      </>
    );
  }

  const currentPost = post;
  const currentUser = user;
  const isOwner = currentPost.authorId === currentUser.id;

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setEmsg({ tone: "hidden", text: "" });
    try {
      await AppData.upsertPost(currentUser.id, {
        id: currentPost.id,
        title: String(fd.get("title") || ""),
        body: String(fd.get("body") || ""),
      });
      await refreshPost(currentPost.id);
      setEditOpen(false);
    } catch (err) {
      setEmsg({ tone: "err", text: err instanceof Error ? err.message : "저장 실패" });
    }
  }

  async function onDelete() {
    if (!confirm("이 글과 댓글을 모두 삭제할까요?")) return;
    try {
      await AppData.deletePost(currentUser.id, currentPost.id);
      nav("/app/board");
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  async function onComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const t = String(fd.get("body") || "");
    if (!t.trim()) return;
    try {
      await AppData.addComment(currentUser.id, currentPost.id, t);
      e.currentTarget.reset();
      await loadComments(currentPost.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "댓글 실패");
    }
  }

  return (
    <>
      <SiteHeader variant="post" />
      <main className="wrap post-detail">
        <div className="head">
          <ButtonLink to="/app/board" variant="ghost" size="sm">
            <Icon id="i-arrow" className="flip-h" />
            목록으로
          </ButtonLink>
          {isOwner ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} aria-label="내 글 작업">
              <Button size="sm" type="button" onClick={() => setEditOpen(true)}>
                <Icon id="i-edit" />
                수정
              </Button>
              <Button variant="danger" size="sm" type="button" onClick={() => void onDelete()}>
                <Icon id="i-trash" />
                삭제
              </Button>
            </div>
          ) : null}
        </div>
        <h1>{currentPost.title}</h1>
        <p className="muted" style={{ margin: "0 0 18px" }}>
          {authorName} · 수정: {fmt(currentPost.updatedAt)}
        </p>
        <div className="prose">{currentPost.body}</div>

        <section className="comments" aria-label="댓글">
          <h2>
            <Icon id="i-chat" />
            댓글
          </h2>
          <div>
            {comments.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                아직 댓글이 없습니다.
              </p>
            ) : (
              comments.map(({ c, label }) => (
                <div key={c.id} className="comment">
                  <div className="c-meta">
                    {label} · {fmt(c.updatedAt ?? c.createdAt)}
                  </div>
                  <div className="cbody" style={{ whiteSpace: "pre-wrap" }}>
                    {c.body}
                  </div>
                  {c.authorId === currentUser.id ? (
                    <div className="c-actions">
                      <Button
                        size="sm"
                        type="button"
                        onClick={async () => {
                          const nv = prompt("댓글 수정", c.body);
                          if (nv == null) return;
                          try {
                            await AppData.updateComment(currentUser.id, c.id, nv);
                            await loadComments(currentPost.id);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "수정 실패");
                          }
                        }}
                      >
                        <Icon id="i-edit" />
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={async () => {
                          if (!confirm("댓글을 삭제할까요?")) return;
                          try {
                            await AppData.deleteComment(currentUser.id, c.id);
                            await loadComments(currentPost.id);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "삭제 실패");
                          }
                        }}
                      >
                        <Icon id="i-trash" />
                        삭제
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => void onComment(e)} style={{ marginTop: 14 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="ct" className="sr-only">
                댓글 입력
              </label>
              <textarea className="textarea" id="ct" name="body" placeholder="댓글을 입력하세요" style={{ minHeight: 88 }} />
            </div>
            <Button variant="primary" size="sm" type="submit">
              <Icon id="i-add" />
              댓글 등록
            </Button>
          </form>
        </section>
      </main>

      <Modal open={editOpen} title="글 수정" onClose={() => setEditOpen(false)}>
        <FormMessage tone={emsg.tone}>{emsg.text}</FormMessage>
        <form
          key={currentPost.updatedAt}
          onSubmit={(e) => {
            void onEditSubmit(e);
          }}
        >
          <div className="field">
            <label htmlFor="et">제목</label>
            <input className="input" id="et" name="title" required defaultValue={currentPost.title} />
          </div>
          <div className="field">
            <label htmlFor="eb">내용</label>
            <textarea className="textarea" id="eb" name="body" required defaultValue={currentPost.body} />
          </div>
          <ModalActions onCancel={() => setEditOpen(false)} submitLabel="저장" />
        </form>
      </Modal>
    </>
  );
}
