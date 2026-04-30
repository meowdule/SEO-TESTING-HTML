import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "../config/site";

export const KEYS = {
  users: "demo_app_users_v1",
  posts: "demo_app_posts_v1",
  comments: "demo_app_comments_v1",
  session: "demo_app_session_v1",
} as const;

export const CONTACT_INQUIRIES_KEY = "demo_contact_submissions_v1";
export const APPLY_LOCAL_KEY = "demo_apply_submissions_v1";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  email: string;
};

type LocalUser = SessionUser & {
  passwordHash: string;
  createdAt: number;
};

export type PostRecord = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type CommentRecord = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: number;
  updatedAt?: number;
};

type RegisterPayload = {
  username: string;
  name: string;
  email: string;
  password: string;
};

type UpsertPostPayload = { id?: string; title: string; body: string };

let impl: "local" | "remote" = "local";
let sb: SupabaseClient | null = null;
let initPromise: Promise<boolean> | null = null;
const nameCache: Record<string, { username: string; display_name: string }> = {};

function siteConfigured(): boolean {
  const u = siteConfig.supabaseUrl?.trim() ?? "";
  const k = siteConfig.supabaseAnonKey?.trim() ?? "";
  return u.startsWith("http") && !!k;
}

function P<T>(x: T): Promise<T> {
  return Promise.resolve(x);
}

function assertSb(): SupabaseClient {
  if (!sb) throw new Error("Supabase client unavailable");
  return sb;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers(): LocalUser[] {
  return readJson<LocalUser[]>(KEYS.users, []);
}

function saveUsers(users: LocalUser[]) {
  writeJson(KEYS.users, users);
}

function findUserByLoginLocal(login: string): LocalUser | null {
  const q = (login || "").trim().toLowerCase();
  if (!q) return null;
  return getUsers().find((u) => u.username.toLowerCase() === q || u.email.toLowerCase() === q) ?? null;
}

function findUserByEmailLocal(email: string): LocalUser | null {
  const q = (email || "").trim().toLowerCase();
  if (!q) return null;
  return getUsers().find((u) => u.email.toLowerCase() === q) ?? null;
}

async function registerUserLocal(payload: RegisterPayload): Promise<LocalUser> {
  const username = (payload.username || "").trim();
  const email = (payload.email || "").trim().toLowerCase();
  const name = (payload.name || "").trim();
  const password = payload.password || "";
  if (!username || !email || !name || password.length < 4) {
    throw new Error("필수 항목을 모두 입력하고, 비밀번호는 4자 이상으로 설정해 주세요.");
  }
  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }
  if (users.some((u) => u.email === email)) {
    throw new Error("이미 가입된 이메일입니다.");
  }
  const user: LocalUser = {
    id: uid(),
    username,
    email,
    name,
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

async function verifyLoginLocal(login: string, password: string): Promise<LocalUser> {
  const user = findUserByLoginLocal(login);
  if (!user) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
  const h = await hashPassword(password);
  if (h !== user.passwordHash) {
    throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
  }
  return user;
}

function setSessionLocal(user: SessionUser) {
  const mini: SessionUser = { id: user.id, username: user.username, name: user.name, email: user.email };
  sessionStorage.setItem(KEYS.session, JSON.stringify(mini));
}

function clearSessionLocal() {
  sessionStorage.removeItem(KEYS.session);
}

function getSessionLocal(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(KEYS.session);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

async function requireSessionLocal(): Promise<LocalUser | null> {
  const s = getSessionLocal();
  if (!s) return null;
  return getUsers().find((x) => x.id === s.id) ?? null;
}

function getPostsLocal(): PostRecord[] {
  return readJson<PostRecord[]>(KEYS.posts, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

function getPostLocal(id: string): PostRecord | null {
  return getPostsLocal().find((p) => p.id === id) ?? null;
}

function upsertPostLocal(authorId: string, data: UpsertPostPayload): { id: string } {
  const posts = readJson<PostRecord[]>(KEYS.posts, []);
  const now = Date.now();
  let outId: string;
  if (data.id) {
    const idx = posts.findIndex((p) => p.id === data.id);
    if (idx === -1) throw new Error("게시글을 찾을 수 없습니다.");
    if (posts[idx].authorId !== authorId) throw new Error("본인이 작성한 글만 수정할 수 있습니다.");
    posts[idx] = {
      ...posts[idx],
      title: (data.title || "").trim(),
      body: (data.body || "").trim(),
      updatedAt: now,
    };
    outId = posts[idx].id;
  } else {
    outId = uid();
    posts.unshift({
      id: outId,
      authorId,
      title: (data.title || "").trim(),
      body: (data.body || "").trim(),
      createdAt: now,
      updatedAt: now,
    });
  }
  writeJson(KEYS.posts, posts);
  return { id: outId };
}

function deletePostLocal(authorId: string, postId: string) {
  const posts = readJson<PostRecord[]>(KEYS.posts, []);
  const p = posts.find((x) => x.id === postId);
  if (!p) throw new Error("게시글을 찾을 수 없습니다.");
  if (p.authorId !== authorId) throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
  writeJson(
    KEYS.posts,
    posts.filter((x) => x.id !== postId),
  );
  const comments = readJson<CommentRecord[]>(KEYS.comments, []).filter((c) => c.postId !== postId);
  writeJson(KEYS.comments, comments);
}

function getCommentsLocal(postId: string): CommentRecord[] {
  return readJson<CommentRecord[]>(KEYS.comments, [])
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function addCommentLocal(authorId: string, postId: string, text: string) {
  const post = getPostLocal(postId);
  if (!post) throw new Error("게시글이 없습니다.");
  const comments = readJson<CommentRecord[]>(KEYS.comments, []);
  comments.push({
    id: uid(),
    postId,
    authorId,
    body: (text || "").trim(),
    createdAt: Date.now(),
  });
  writeJson(KEYS.comments, comments);
}

function updateCommentLocal(authorId: string, commentId: string, text: string) {
  const comments = readJson<CommentRecord[]>(KEYS.comments, []);
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx === -1) throw new Error("댓글을 찾을 수 없습니다.");
  if (comments[idx].authorId !== authorId) throw new Error("본인 댓글만 수정할 수 있습니다.");
  comments[idx] = { ...comments[idx], body: (text || "").trim(), updatedAt: Date.now() };
  writeJson(KEYS.comments, comments);
}

function deleteCommentLocal(authorId: string, commentId: string) {
  const comments = readJson<CommentRecord[]>(KEYS.comments, []);
  const c = comments.find((x) => x.id === commentId);
  if (!c) throw new Error("댓글을 찾을 수 없습니다.");
  if (c.authorId !== authorId) throw new Error("본인 댓글만 삭제할 수 있습니다.");
  writeJson(
    KEYS.comments,
    comments.filter((x) => x.id !== commentId),
  );
}

async function displayNameLocal(userId: string): Promise<string> {
  const u = getUsers().find((x) => x.id === userId);
  return u ? `${u.name} (${u.username})` : "알 수 없음";
}

async function resetPasswordLocal(email: string, username: string, newPassword: string) {
  if (!newPassword || newPassword.length < 4) throw new Error("새 비밀번호는 4자 이상이어야 합니다.");
  const u = findUserByEmailLocal(email);
  if (!u || u.username !== (username || "").trim()) {
    throw new Error("이메일과 아이디가 일치하는 계정을 찾을 수 없습니다.");
  }
  const users = getUsers();
  const idx = users.findIndex((x) => x.id === u.id);
  users[idx] = { ...users[idx], passwordHash: await hashPassword(newPassword) };
  saveUsers(users);
}

function mapPostRow(row: {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}): PostRecord {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function mapCommentRow(row: {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string | null;
}): CommentRecord {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
  };
}

async function profileById(userId: string) {
  const client = assertSb();
  if (nameCache[userId]) return nameCache[userId];
  const r = await client.from("profiles").select("username, display_name").eq("id", userId).maybeSingle();
  if (r.error || !r.data) {
    nameCache[userId] = { username: "?", display_name: "알 수 없음" };
  } else {
    nameCache[userId] = { username: r.data.username, display_name: r.data.display_name };
  }
  return nameCache[userId];
}

async function registerUserRemote(payload: RegisterPayload): Promise<SessionUser> {
  const client = assertSb();
  const username = (payload.username || "").trim();
  const email = (payload.email || "").trim().toLowerCase();
  const name = (payload.name || "").trim();
  const password = payload.password || "";
  if (!username || !email || !name || password.length < 6) {
    throw new Error("필수 항목을 모두 입력하고, 클라우드 모드에서는 비밀번호를 6자 이상으로 설정해 주세요.");
  }
  const taken = await client.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken.data) throw new Error("이미 사용 중인 아이디입니다.");
  const res = await client.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: name } },
  });
  if (res.error) throw new Error(res.error.message || "가입에 실패했습니다.");
  if (!res.data.user) throw new Error("가입에 실패했습니다.");
  if (!res.data.session) {
    throw new Error(
      "가입 확인 메일을 발송했습니다. 메일의 링크를 누른 뒤 로그인해 주세요. (데모에서는 Supabase 대시보드에서 이메일 확인을 끄면 바로 로그인됩니다.)",
    );
  }
  for (const k of Object.keys(nameCache)) delete nameCache[k];
  const session = await requireSessionRemote();
  if (!session) throw new Error("가입 후 세션을 만들지 못했습니다.");
  return session;
}

async function verifyLoginRemote(login: string, password: string): Promise<SessionUser> {
  const client = assertSb();
  const r = await client.rpc("resolve_login", { p_login: (login || "").trim() });
  if (r.error) throw new Error(r.error.message || "로그인에 실패했습니다.");
  const raw = r.data as string | string[] | null;
  const email = typeof raw === "string" ? raw : raw && raw[0];
  if (!email) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
  const sign = await client.auth.signInWithPassword({ email, password });
  if (sign.error) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
  for (const k of Object.keys(nameCache)) delete nameCache[k];
  const session = await requireSessionRemote();
  if (!session) throw new Error("로그인 후 세션을 만들지 못했습니다.");
  return session;
}

async function getSessionRemote(): Promise<SessionUser | null> {
  const client = assertSb();
  const s = await client.auth.getSession();
  if (!s.data.session) return null;
  const u = s.data.session.user;
  const p = await profileById(u.id);
  return { id: u.id, username: p.username, name: p.display_name, email: u.email || "" };
}

async function requireSessionRemote(): Promise<SessionUser | null> {
  const client = assertSb();
  const gu = await client.auth.getUser();
  if (!gu.data.user) return null;
  const p = await profileById(gu.data.user.id);
  return {
    id: gu.data.user.id,
    username: p.username,
    name: p.display_name,
    email: gu.data.user.email || "",
  };
}

async function clearSessionRemote() {
  for (const k of Object.keys(nameCache)) delete nameCache[k];
  await assertSb().auth.signOut();
  clearSessionLocal();
}

function readLocalContactList(): { at: number; name: string; email: string; topic: string; body: string }[] {
  try {
    const raw = localStorage.getItem(CONTACT_INQUIRIES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as { at: number; name: string; email: string; topic: string; body: string }[]) : [];
  } catch {
    return [];
  }
}

function pushLocalContact(row: { at: number; name: string; email: string; topic: string; body: string }) {
  const arr = readLocalContactList();
  arr.push(row);
  localStorage.setItem(CONTACT_INQUIRIES_KEY, JSON.stringify(arr));
}

async function getContactInquiriesRemote() {
  const client = assertSb();
  await client.auth.getSession();
  const r = await client.from("contact_inquiries").select("*").order("created_at", { ascending: false });
  if (r.error) throw new Error(r.error.message);
  return (r.data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    at: new Date(row.created_at as string).getTime(),
    name: row.name as string,
    email: row.email as string,
    topic: row.topic as string,
    body: row.body as string,
  }));
}

async function getApplySubmissionsRemote() {
  const client = assertSb();
  await client.auth.getSession();
  const r = await client.from("apply_submissions").select("*").order("created_at", { ascending: false });
  if (r.error) throw new Error(r.error.message);
  return (r.data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    at: new Date(row.created_at as string).getTime(),
    company: row.company as string,
    name: row.contact_name as string,
    email: row.email as string,
    plan: row.plan as string,
    note: (row.note as string) || "",
  }));
}

async function submitContactInquiry(payload: { name: string; email: string; topic: string; body: string }) {
  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const topic = (payload.topic || "").trim();
  const body = (payload.body || "").trim();
  if (!name || !email || !topic || !body) throw new Error("필수 항목을 모두 입력해 주세요.");
  if (!siteConfigured() || impl !== "remote" || !sb) {
    pushLocalContact({ at: Date.now(), name, email, topic, body });
    return P(undefined);
  }
  const ins = await assertSb().from("contact_inquiries").insert({ name, email, topic, body });
  if (ins.error) throw new Error(ins.error.message);
  return P(undefined);
}

async function submitApplySubmission(payload: {
  company: string;
  name: string;
  email: string;
  plan: string;
  note: string;
}) {
  const company = (payload.company || "").trim();
  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const plan = (payload.plan || "").trim();
  const note = (payload.note || "").trim();
  if (!company || !name || !email || !plan) throw new Error("필수 항목을 입력해 주세요.");
  if (!siteConfigured() || impl !== "remote" || !sb) {
    let list: unknown[] = [];
    try {
      list = JSON.parse(localStorage.getItem(APPLY_LOCAL_KEY) || "[]") as unknown[];
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    list.push({ at: Date.now(), company, name, email, plan, note });
    localStorage.setItem(APPLY_LOCAL_KEY, JSON.stringify(list));
    return P(undefined);
  }
  const ins = await assertSb().from("apply_submissions").insert({
    company,
    contact_name: name,
    email,
    plan,
    note: note || null,
  });
  if (ins.error) throw new Error(ins.error.message);
  return P(undefined);
}

async function getPostsRemote(): Promise<PostRecord[]> {
  const client = assertSb();
  await client.auth.getSession();
  const r = await client.from("posts").select("*").order("updated_at", { ascending: false });
  if (r.error) throw new Error(r.error.message);
  return (r.data || []).map((row) => mapPostRow(row as Parameters<typeof mapPostRow>[0]));
}

async function getPostRemote(id: string): Promise<PostRecord | null> {
  const client = assertSb();
  await client.auth.getSession();
  const r = await client.from("posts").select("*").eq("id", id).maybeSingle();
  if (r.error || !r.data) return null;
  return mapPostRow(r.data as Parameters<typeof mapPostRow>[0]);
}

async function upsertPostRemote(authorId: string, data: UpsertPostPayload): Promise<{ id: string }> {
  const client = assertSb();
  const nowIso = new Date().toISOString();
  if (data.id) {
    const u = await client
      .from("posts")
      .update({
        title: (data.title || "").trim(),
        body: (data.body || "").trim(),
        updated_at: nowIso,
      })
      .eq("id", data.id)
      .eq("author_id", authorId)
      .select("id")
      .maybeSingle();
    if (u.error) throw new Error(u.error.message);
    if (!u.data) throw new Error("본인이 작성한 글만 수정할 수 있습니다.");
    return { id: data.id };
  }
  const ins = await client
    .from("posts")
    .insert({
      author_id: authorId,
      title: (data.title || "").trim(),
      body: (data.body || "").trim(),
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();
  if (ins.error) throw new Error(ins.error.message);
  return { id: (ins.data as { id: string }).id };
}

async function deletePostRemote(authorId: string, postId: string) {
  const client = assertSb();
  const d = await client.from("posts").delete().eq("id", postId).eq("author_id", authorId).select("id");
  if (d.error) throw new Error(d.error.message);
  if (!d.data?.length) throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
}

async function getCommentsRemote(postId: string): Promise<CommentRecord[]> {
  const client = assertSb();
  await client.auth.getSession();
  const r = await client.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (r.error) throw new Error(r.error.message);
  return (r.data || []).map((row) => mapCommentRow(row as Parameters<typeof mapCommentRow>[0]));
}

async function addCommentRemote(authorId: string, postId: string, text: string) {
  const client = assertSb();
  const nowIso = new Date().toISOString();
  const ins = await client
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, body: (text || "").trim(), created_at: nowIso })
    .select("id")
    .single();
  if (ins.error) throw new Error(ins.error.message);
}

async function updateCommentRemote(authorId: string, commentId: string, text: string) {
  const client = assertSb();
  const u = await client
    .from("comments")
    .update({ body: (text || "").trim(), updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", authorId)
    .select("id");
  if (u.error) throw new Error(u.error.message);
  if (!u.data?.length) throw new Error("본인 댓글만 수정할 수 있습니다.");
}

async function deleteCommentRemote(authorId: string, commentId: string) {
  const client = assertSb();
  const d = await client.from("comments").delete().eq("id", commentId).eq("author_id", authorId).select("id");
  if (d.error) throw new Error(d.error.message);
  if (!d.data?.length) throw new Error("본인 댓글만 삭제할 수 있습니다.");
}

async function displayNameRemote(userId: string): Promise<string> {
  const p = await profileById(userId);
  return `${p.display_name} (${p.username})`;
}

async function findUserByEmailRemote(email: string): Promise<{ username: string } | null> {
  const client = assertSb();
  const r = await client.rpc("find_username_by_email", { p_email: (email || "").trim() });
  if (r.error) return null;
  const raw = r.data as string | string[] | null;
  const un = typeof raw === "string" ? raw : raw && raw[0];
  if (!un) return null;
  return { username: un };
}

async function resetPasswordRemote(email: string, _username: string, _newPassword: string) {
  void _username;
  void _newPassword;
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const redirectTo = `${window.location.origin}${basePath}auth/login/`;
  const r = await assertSb().auth.resetPasswordForEmail((email || "").trim(), { redirectTo });
  if (r.error) throw new Error(r.error.message || "요청에 실패했습니다.");
}

export async function init(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (siteConfigured()) {
      try {
        sb = createClient(siteConfig.supabaseUrl.trim(), siteConfig.supabaseAnonKey.trim(), {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        impl = "remote";
      } catch {
        impl = "local";
        sb = null;
      }
    } else {
      impl = "local";
    }
    return true;
  })();
  return initPromise;
}

export function isRemote() {
  return impl === "remote";
}

export function registerUser(payload: RegisterPayload) {
  return impl === "remote" ? registerUserRemote(payload) : registerUserLocal(payload);
}

export function verifyLogin(login: string, password: string) {
  return impl === "remote" ? verifyLoginRemote(login, password) : verifyLoginLocal(login, password);
}

export function setSession(user: SessionUser) {
  return impl === "remote" ? P(undefined) : P(setSessionLocal(user));
}

export function clearSession() {
  return impl === "remote" ? clearSessionRemote() : P(clearSessionLocal());
}

export function getSession() {
  return impl === "remote" ? getSessionRemote() : P(getSessionLocal());
}

export function requireSession() {
  return impl === "remote" ? requireSessionRemote() : requireSessionLocal();
}

export function findUserByEmail(email: string) {
  return impl === "remote" ? findUserByEmailRemote(email) : P(findUserByEmailLocal(email));
}

export function findUserByLogin(login: string) {
  return P(findUserByLoginLocal(login));
}

export function getPosts() {
  return impl === "remote" ? getPostsRemote() : P(getPostsLocal());
}

export function getPost(id: string) {
  return impl === "remote" ? getPostRemote(id) : P(getPostLocal(id));
}

export function upsertPost(authorId: string, data: UpsertPostPayload) {
  return impl === "remote" ? upsertPostRemote(authorId, data) : P(upsertPostLocal(authorId, data));
}

export function deletePost(authorId: string, postId: string) {
  return impl === "remote" ? deletePostRemote(authorId, postId) : P(deletePostLocal(authorId, postId));
}

export function getComments(postId: string) {
  return impl === "remote" ? getCommentsRemote(postId) : P(getCommentsLocal(postId));
}

export function addComment(authorId: string, postId: string, text: string) {
  return impl === "remote" ? addCommentRemote(authorId, postId, text) : P(addCommentLocal(authorId, postId, text));
}

export function updateComment(authorId: string, commentId: string, text: string) {
  return impl === "remote" ? updateCommentRemote(authorId, commentId, text) : P(updateCommentLocal(authorId, commentId, text));
}

export function deleteComment(authorId: string, commentId: string) {
  return impl === "remote" ? deleteCommentRemote(authorId, commentId) : P(deleteCommentLocal(authorId, commentId));
}

export function displayName(userId: string) {
  return impl === "remote" ? displayNameRemote(userId) : displayNameLocal(userId);
}

export function resetPassword(email: string, username: string, newPassword: string) {
  return impl === "remote" ? resetPasswordRemote(email, username, newPassword) : resetPasswordLocal(email, username, newPassword);
}

export function isAdminUser(username: string) {
  const raw = siteConfig.adminUsernames;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" && String(raw).trim() ? [raw] : [];
  const u = String(username || "").trim().toLowerCase();
  return list.some((a) => String(a).trim().toLowerCase() === u);
}

export function getContactInquiries() {
  if (impl === "remote" && sb) return getContactInquiriesRemote();
  const arr = readLocalContactList().sort((a, b) => (b.at || 0) - (a.at || 0));
  return P(arr);
}

export function getApplySubmissions() {
  if (impl === "remote" && sb) return getApplySubmissionsRemote();
  let raw: string | null;
  try {
    raw = localStorage.getItem(APPLY_LOCAL_KEY);
  } catch {
    raw = "[]";
  }
  let arr: { at: number; company: string; name: string; email: string; plan: string; note: string }[];
  try {
    arr = raw ? (JSON.parse(raw) as typeof arr) : [];
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) arr = [];
  arr = arr.slice().sort((a, b) => (b.at || 0) - (a.at || 0));
  return P(arr);
}

export { submitContactInquiry, submitApplySubmission };
