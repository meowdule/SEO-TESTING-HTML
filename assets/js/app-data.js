(function (global) {
  "use strict";

  var KEYS = {
    users: "demo_app_users_v1",
    posts: "demo_app_posts_v1",
    comments: "demo_app_comments_v1",
    session: "demo_app_session_v1",
  };

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

  function findUserByLogin(login) {
    var q = (login || "").trim().toLowerCase();
    if (!q) return null;
    return (
      getUsers().find(function (u) {
        return u.username.toLowerCase() === q || u.email.toLowerCase() === q;
      }) || null
    );
  }

  function findUserByEmail(email) {
    var q = (email || "").trim().toLowerCase();
    if (!q) return null;
    return getUsers().find(function (u) {
      return u.email.toLowerCase() === q;
    });
  }

  async function registerUser(payload) {
    var username = (payload.username || "").trim();
    var email = (payload.email || "").trim().toLowerCase();
    var name = (payload.name || "").trim();
    var password = payload.password || "";
    if (!username || !email || !name || password.length < 4) {
      throw new Error("필수 항목을 모두 입력하고, 비밀번호는 4자 이상으로 설정해 주세요.");
    }
    var users = getUsers();
    if (users.some(function (u) {
      return u.username.toLowerCase() === username.toLowerCase();
    })) {
      throw new Error("이미 사용 중인 아이디입니다.");
    }
    if (users.some(function (u) {
      return u.email === email;
    })) {
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

  async function verifyLogin(login, password) {
    var user = findUserByLogin(login);
    if (!user) throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    var h = await hashPassword(password);
    if (h !== user.passwordHash) {
      throw new Error("아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.");
    }
    return user;
  }

  function setSession(user) {
    var mini = { id: user.id, username: user.username, name: user.name, email: user.email };
    sessionStorage.setItem(KEYS.session, JSON.stringify(mini));
  }

  function clearSession() {
    sessionStorage.removeItem(KEYS.session);
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(KEYS.session);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function requireSession() {
    var s = getSession();
    if (!s) return null;
    var u = getUsers().find(function (x) {
      return x.id === s.id;
    });
    return u || null;
  }

  function getPosts() {
    return readJson(KEYS.posts, []).sort(function (a, b) {
      return b.updatedAt - a.updatedAt;
    });
  }

  function savePosts(posts) {
    writeJson(KEYS.posts, posts);
  }

  function getPost(id) {
    return getPosts().find(function (p) {
      return p.id === id;
    }) || null;
  }

  function upsertPost(authorId, data) {
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
    savePosts(posts);
    return { id: outId };
  }

  function deletePost(authorId, postId) {
    var posts = readJson(KEYS.posts, []);
    var p = posts.find(function (x) {
      return x.id === postId;
    });
    if (!p) throw new Error("게시글을 찾을 수 없습니다.");
    if (p.authorId !== authorId) throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
    var next = posts.filter(function (x) {
      return x.id !== postId;
    });
    savePosts(next);
    var comments = readJson(KEYS.comments, []).filter(function (c) {
      return c.postId !== postId;
    });
    writeJson(KEYS.comments, comments);
    return next;
  }

  function getComments(postId) {
    return readJson(KEYS.comments, [])
      .filter(function (c) {
        return c.postId === postId;
      })
      .sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });
  }

  function addComment(authorId, postId, text) {
    var post = getPost(postId);
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
    return comments.filter(function (c) {
      return c.postId === postId;
    });
  }

  function updateComment(authorId, commentId, text) {
    var comments = readJson(KEYS.comments, []);
    var idx = comments.findIndex(function (c) {
      return c.id === commentId;
    });
    if (idx === -1) throw new Error("댓글을 찾을 수 없습니다.");
    if (comments[idx].authorId !== authorId) throw new Error("본인 댓글만 수정할 수 있습니다.");
    comments[idx].body = (text || "").trim();
    comments[idx].updatedAt = Date.now();
    writeJson(KEYS.comments, comments);
    return comments;
  }

  function deleteComment(authorId, commentId) {
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
    return next;
  }

  function displayName(userId) {
    var u = getUsers().find(function (x) {
      return x.id === userId;
    });
    return u ? u.name + " (" + u.username + ")" : "알 수 없음";
  }

  async function resetPassword(email, username, newPassword) {
    if (!newPassword || newPassword.length < 4) throw new Error("새 비밀번호는 4자 이상이어야 합니다.");
    var u = findUserByEmail(email);
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

  global.AppData = {
    KEYS: KEYS,
    registerUser: registerUser,
    verifyLogin: verifyLogin,
    setSession: setSession,
    clearSession: clearSession,
    getSession: getSession,
    requireSession: requireSession,
    getUsers: getUsers,
    findUserByEmail: findUserByEmail,
    findUserByLogin: findUserByLogin,
    getPosts: getPosts,
    getPost: getPost,
    upsertPost: upsertPost,
    deletePost: deletePost,
    getComments: getComments,
    addComment: addComment,
    updateComment: updateComment,
    deleteComment: deleteComment,
    displayName: displayName,
    resetPassword: resetPassword,
  };
})(window);
