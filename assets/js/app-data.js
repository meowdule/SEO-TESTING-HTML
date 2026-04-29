(function (global) {
  "use strict";

  var KEYS = {
    users: "demo_app_users_v1",
    posts: "demo_app_posts_v1",
    comments: "demo_app_comments_v1",
    session: "demo_app_session_v1",
  };

  var impl = "local";
  var sb = null;
  var initPromise = null;
  var nameCache = {};

  function siteConfigured() {
    var S = global.SITE || {};
    return !!(S.supabaseUrl && S.supabaseAnonKey && String(S.supabaseUrl).trim().indexOf("http") === 0);
  }

  function P(x) {
    return Promise.resolve(x);
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function hashPassword(password) {
    var enc = new TextEncoder().encode(password);
    var buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function getUsers() {
    return readJson(KEYS.users, []);
  }

  function saveUsers(users) {
    writeJson(KEYS.users, users);
  }

  function findUserByLoginLocal(login) {
    var q = (login || "").trim().toLowerCase();
    if (!q) return null;
    return (
      getUsers().find(function (u) {
        return u.username.toLowerCase() === q || u.email.toLowerCase() === q;
      }) || null
    );
  }

  function findUserByEmailLocal(email) {
    var q = (email || "").trim().toLowerCase();
    if (!q) return null;
    return getUsers().find(function (u) {
      return u.email.toLowerCase() === q;
    });
  }

  async function registerUserLocal(payload) {
    var username = (payload.username || "").trim();
    var email = (payload.email || "").trim().toLowerCase();
    var name = (payload.name || "").trim();
    var password = payload.password || "";
    if (!username || !email || !name || password.length < 4) {
      throw new Error("필수 항목을 모두 입력하고, 비밀번호는 4자 이상으로 설정해 주세요.");
    }
    var users = getUsers();
    if (
      users.some(function (u) {
        return u.username.toLowerCase() === username.toLowerCase();
      })
    ) {
      throw new Error("이미 사용 중인 아이디입니다.");
    }
    if (
      users.some(function (u) {
        return u.email === email;
      })
    ) {
      throw new Error("이미 가입된 이메일입니다.");
    }
    var user = {
      id: uid(),
      username: username,
      email: email,
      name: name,
      passwordHash: await hashPassword(password),
      createdAt: Date.now(),
    };
    users.push(user);
    saveUsers(users);
    return user;
  }

  async function verifyLoginLocal(login, password) {
    var user = findUserByLoginLocal(login);
    if (!user) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    var h = await hashPassword(password);
    if (h !== user.passwordHash) {
      throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    }
    return user;
  }

  function setSessionLocal(user) {
    var mini = { id: user.id, username: user.username, name: user.name, email: user.email };
    sessionStorage.setItem(KEYS.session, JSON.stringify(mini));
  }

  function clearSessionLocal() {
    sessionStorage.removeItem(KEYS.session);
  }

  function getSessionLocal() {
    try {
      var raw = sessionStorage.getItem(KEYS.session);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  async function requireSessionLocal() {
    var s = getSessionLocal();
    if (!s) return null;
    var u = getUsers().find(function (x) {
      return x.id === s.id;
    });
    return u || null;
  }

  function getPostsLocal() {
    return readJson(KEYS.posts, []).sort(function (a, b) {
      return b.updatedAt - a.updatedAt;
    });
  }

  function getPostLocal(id) {
    return (
      getPostsLocal().find(function (p) {
        return p.id === id;
      }) || null
    );
  }

  function upsertPostLocal(authorId, data) {
    var posts = readJson(KEYS.posts, []);
    var now = Date.now();
    var outId;
    if (data.id) {
      var idx = posts.findIndex(function (p) {
        return p.id === data.id;
      });
      if (idx === -1) throw new Error("게시글을 찾을 수 없습니다.");
      if (posts[idx].authorId !== authorId) throw new Error("본인이 작성한 글만 수정할 수 있습니다.");
      posts[idx] = Object.assign({}, posts[idx], {
        title: (data.title || "").trim(),
        body: (data.body || "").trim(),
        updatedAt: now,
      });
      outId = posts[idx].id;
    } else {
      outId = uid();
      posts.unshift({
        id: outId,
        authorId: authorId,
        title: (data.title || "").trim(),
        body: (data.body || "").trim(),
        createdAt: now,
        updatedAt: now,
      });
    }
    writeJson(KEYS.posts, posts);
    return { id: outId };
  }

  function deletePostLocal(authorId, postId) {
    var posts = readJson(KEYS.posts, []);
    var p = posts.find(function (x) {
      return x.id === postId;
    });
    if (!p) throw new Error("게시글을 찾을 수 없습니다.");
    if (p.authorId !== authorId) throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
    var next = posts.filter(function (x) {
      return x.id !== postId;
    });
    writeJson(KEYS.posts, next);
    var comments = readJson(KEYS.comments, []).filter(function (c) {
      return c.postId !== postId;
    });
    writeJson(KEYS.comments, comments);
  }

  function getCommentsLocal(postId) {
    return readJson(KEYS.comments, [])
      .filter(function (c) {
        return c.postId === postId;
      })
      .sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });
  }

  function addCommentLocal(authorId, postId, text) {
    var post = getPostLocal(postId);
    if (!post) throw new Error("게시글이 없습니다.");
    var comments = readJson(KEYS.comments, []);
    comments.push({
      id: uid(),
      postId: postId,
      authorId: authorId,
      body: (text || "").trim(),
      createdAt: Date.now(),
    });
    writeJson(KEYS.comments, comments);
  }

  function updateCommentLocal(authorId, commentId, text) {
    var comments = readJson(KEYS.comments, []);
    var idx = comments.findIndex(function (c) {
      return c.id === commentId;
    });
    if (idx === -1) throw new Error("댓글을 찾을 수 없습니다.");
    if (comments[idx].authorId !== authorId) throw new Error("본인 댓글만 수정할 수 있습니다.");
    comments[idx].body = (text || "").trim();
    comments[idx].updatedAt = Date.now();
    writeJson(KEYS.comments, comments);
  }

  function deleteCommentLocal(authorId, commentId) {
    var comments = readJson(KEYS.comments, []);
    var c = comments.find(function (x) {
      return x.id === commentId;
    });
    if (!c) throw new Error("댓글을 찾을 수 없습니다.");
    if (c.authorId !== authorId) throw new Error("본인 댓글만 삭제할 수 있습니다.");
    var next = comments.filter(function (x) {
      return x.id !== commentId;
    });
    writeJson(KEYS.comments, next);
  }

  async function displayNameLocal(userId) {
    var u = getUsers().find(function (x) {
      return x.id === userId;
    });
    return u ? u.name + " (" + u.username + ")" : "알 수 없음";
  }

  async function resetPasswordLocal(email, username, newPassword) {
    if (!newPassword || newPassword.length < 4) throw new Error("새 비밀번호는 4자 이상이어야 합니다.");
    var u = findUserByEmailLocal(email);
    if (!u || u.username !== (username || "").trim()) {
      throw new Error("이메일과 아이디가 일치하는 계정을 찾을 수 없습니다.");
    }
    var users = getUsers();
    var idx = users.findIndex(function (x) {
      return x.id === u.id;
    });
    users[idx].passwordHash = await hashPassword(newPassword);
    saveUsers(users);
  }

  function mapPostRow(row) {
    return {
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      body: row.body,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    };
  }

  function mapCommentRow(row) {
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      body: row.body,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    };
  }

  async function profileById(userId) {
    if (nameCache[userId]) return nameCache[userId];
    var r = await sb.from("profiles").select("username, display_name").eq("id", userId).maybeSingle();
    if (r.error || !r.data) {
      nameCache[userId] = { username: "?", display_name: "알 수 없음" };
    } else {
      nameCache[userId] = { username: r.data.username, display_name: r.data.display_name };
    }
    return nameCache[userId];
  }

  async function registerUserRemote(payload) {
    var username = (payload.username || "").trim();
    var email = (payload.email || "").trim().toLowerCase();
    var name = (payload.name || "").trim();
    var password = payload.password || "";
    if (!username || !email || !name || password.length < 6) {
      throw new Error("필수 항목을 모두 입력하고, 클라우드 모드에서는 비밀번호를 6자 이상으로 설정해 주세요.");
    }
    var taken = await sb.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken.data) throw new Error("이미 사용 중인 아이디입니다.");
    var res = await sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { username: username, display_name: name } },
    });
    if (res.error) throw new Error(res.error.message || "가입에 실패했습니다.");
    if (!res.data.user) throw new Error("가입에 실패했습니다.");
    if (!res.data.session) {
      throw new Error(
        "가입 확인 메일을 발송했습니다. 메일의 링크를 누른 뒤 로그인해 주세요. (데모에서는 Supabase 대시보드에서 이메일 확인을 끄면 바로 로그인됩니다.)"
      );
    }
    nameCache = {};
    return await requireSessionRemote();
  }

  async function verifyLoginRemote(login, password) {
    var r = await sb.rpc("resolve_login", { p_login: (login || "").trim() });
    if (r.error) throw new Error(r.error.message || "로그인에 실패했습니다.");
    var raw = r.data;
    var email = typeof raw === "string" ? raw : raw && raw[0];
    if (!email) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    var sign = await sb.auth.signInWithPassword({ email: email, password: password });
    if (sign.error) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    nameCache = {};
    return await requireSessionRemote();
  }

  async function getSessionRemote() {
    var s = await sb.auth.getSession();
    if (!s.data.session) return null;
    var u = s.data.session.user;
    var p = await profileById(u.id);
    return { id: u.id, username: p.username, name: p.display_name, email: u.email || "" };
  }

  async function requireSessionRemote() {
    var gu = await sb.auth.getUser();
    if (!gu.data.user) return null;
    var p = await profileById(gu.data.user.id);
    return {
      id: gu.data.user.id,
      username: p.username,
      name: p.display_name,
      email: gu.data.user.email || "",
    };
  }

  async function setSessionRemote() {
    return;
  }

  async function clearSessionRemote() {
    nameCache = {};
    await sb.auth.signOut();
    clearSessionLocal();
  }

  async function getPostsRemote() {
    var r = await sb.from("posts").select("*").order("updated_at", { ascending: false });
    if (r.error) throw new Error(r.error.message);
    return (r.data || []).map(mapPostRow);
  }

  async function getPostRemote(id) {
    var r = await sb.from("posts").select("*").eq("id", id).maybeSingle();
    if (r.error || !r.data) return null;
    return mapPostRow(r.data);
  }

  async function upsertPostRemote(authorId, data) {
    var nowIso = new Date().toISOString();
    if (data.id) {
      var u = await sb
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
    var ins = await sb
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
    return { id: ins.data.id };
  }

  async function deletePostRemote(authorId, postId) {
    var d = await sb.from("posts").delete().eq("id", postId).eq("author_id", authorId).select("id");
    if (d.error) throw new Error(d.error.message);
    if (!d.data || !d.data.length) throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
  }

  async function getCommentsRemote(postId) {
    var r = await sb.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (r.error) throw new Error(r.error.message);
    return (r.data || []).map(mapCommentRow);
  }

  async function addCommentRemote(authorId, postId, text) {
    var nowIso = new Date().toISOString();
    var ins = await sb
      .from("comments")
      .insert({ post_id: postId, author_id: authorId, body: (text || "").trim(), created_at: nowIso })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);
  }

  async function updateCommentRemote(authorId, commentId, text) {
    var u = await sb
      .from("comments")
      .update({ body: (text || "").trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_id", authorId)
      .select("id");
    if (u.error) throw new Error(u.error.message);
    if (!u.data || !u.data.length) throw new Error("본인 댓글만 수정할 수 있습니다.");
  }

  async function deleteCommentRemote(authorId, commentId) {
    var d = await sb.from("comments").delete().eq("id", commentId).eq("author_id", authorId).select("id");
    if (d.error) throw new Error(d.error.message);
    if (!d.data || !d.data.length) throw new Error("본인 댓글만 삭제할 수 있습니다.");
  }

  async function displayNameRemote(userId) {
    var p = await profileById(userId);
    return p.display_name + " (" + p.username + ")";
  }

  async function findUserByEmailRemote(email) {
    var r = await sb.rpc("find_username_by_email", { p_email: (email || "").trim() });
    if (r.error) return null;
    var raw = r.data;
    var un = typeof raw === "string" ? raw : raw && raw[0];
    if (!un) return null;
    return { username: un };
  }

  async function resetPasswordRemote(email, username, newPassword) {
    void username;
    void newPassword;
    var base = new URL("../../auth/login/index.html", location.href).href;
    var r = await sb.auth.resetPasswordForEmail((email || "").trim(), { redirectTo: base });
    if (r.error) throw new Error(r.error.message || "요청에 실패했습니다.");
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async function () {
      if (siteConfigured()) {
        try {
          var url = "https://esm.sh/@supabase/supabase-js@2.49.8";
          var mod = await import(url);
          sb = mod.createClient(String(global.SITE.supabaseUrl).trim(), String(global.SITE.supabaseAnonKey).trim(), {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            },
          });
          impl = "remote";
        } catch (e) {
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

  function isRemote() {
    return impl === "remote";
  }

  global.AppData = {
    init: init,
    isRemote: isRemote,
    KEYS: KEYS,

    registerUser: function (payload) {
      return impl === "remote" ? registerUserRemote(payload) : registerUserLocal(payload);
    },
    verifyLogin: function (login, password) {
      return impl === "remote" ? verifyLoginRemote(login, password) : verifyLoginLocal(login, password);
    },
    setSession: function (user) {
      return impl === "remote" ? setSessionRemote() : P(setSessionLocal(user));
    },
    clearSession: function () {
      return impl === "remote" ? clearSessionRemote() : P(clearSessionLocal());
    },
    getSession: function () {
      return impl === "remote" ? getSessionRemote() : P(getSessionLocal());
    },
    requireSession: function () {
      return impl === "remote" ? requireSessionRemote() : requireSessionLocal();
    },
    getUsers: function () {
      return P(getUsers());
    },
    findUserByEmail: function (email) {
      return impl === "remote" ? findUserByEmailRemote(email) : P(findUserByEmailLocal(email));
    },
    findUserByLogin: function (login) {
      return P(findUserByLoginLocal(login));
    },
    getPosts: function () {
      return impl === "remote" ? getPostsRemote() : P(getPostsLocal());
    },
    getPost: function (id) {
      return impl === "remote" ? getPostRemote(id) : P(getPostLocal(id));
    },
    upsertPost: function (authorId, data) {
      return impl === "remote" ? upsertPostRemote(authorId, data) : P(upsertPostLocal(authorId, data));
    },
    deletePost: function (authorId, postId) {
      return impl === "remote" ? deletePostRemote(authorId, postId) : P(deletePostLocal(authorId, postId));
    },
    getComments: function (postId) {
      return impl === "remote" ? getCommentsRemote(postId) : P(getCommentsLocal(postId));
    },
    addComment: function (authorId, postId, text) {
      return impl === "remote" ? addCommentRemote(authorId, postId, text) : P(addCommentLocal(authorId, postId, text));
    },
    updateComment: function (authorId, commentId, text) {
      return impl === "remote" ? updateCommentRemote(authorId, commentId, text) : P(updateCommentLocal(authorId, commentId, text));
    },
    deleteComment: function (authorId, commentId) {
      return impl === "remote" ? deleteCommentRemote(authorId, commentId) : P(deleteCommentLocal(authorId, commentId));
    },
    displayName: function (userId) {
      return impl === "remote" ? displayNameRemote(userId) : displayNameLocal(userId);
    },
    resetPassword: function (email, username, newPassword) {
      return impl === "remote" ? resetPasswordRemote(email, username, newPassword) : resetPasswordLocal(email, username, newPassword);
    },
  };
})(window);
