# Demo Service (GitHub Pages)

정적 HTML/CSS/JS만 사용합니다. 저장소 **Settings → Pages**에서 브랜치(예: `main`)와 폴더(`/ (root)`)를 지정하면 배포됩니다.

## 폴더 구조

| 경로 | 설명 |
|------|------|
| `index.html` | 랜딩 |
| `assets/` | 공통 CSS, JS, SVG, `site-config.js` |
| `pages/contact/`, `apply/`, `plans/` | 문의·신청·플랜 |
| `auth/login/`, `signup/`, `find-id/`, `find-password/` | 인증 |
| `app/board/`, `app/post/` | 보드·글 상세 (`app/post/index.html?id=글UUID`) |
| `sql/supabase-schema.sql` | 전역 저장용 DB 스키마 |

## 네비게이션

- `file://`로 `index.html`을 직접 열 때도 동작하도록 링크는 **`…/index.html`** 형태를 사용합니다.
- 각 페이지 `<head>`에 **자동 `<base href>`**를 넣어, GitHub Pages의 **프로젝트 페이지**(`username.github.io/reponame/`)에서도 상대 경로가 깨지지 않게 했습니다.

## 데이터 저장 (로컬 vs 전역)

| 모드 | 조건 | 설명 |
|------|------|------|
| 로컬 | `assets/js/site-config.js`에 URL/키가 비어 있음 | 회원·글·댓글은 **이 브라우저 `localStorage`** 만 사용 |
| 전역 | Supabase URL + anon 키 설정 | **모든 방문자**가 같은 DB를 사용 (GitHub Pages만으로는 불가능하므로 Supabase 무료 티어 사용) |

GitHub 저장소만으로 “진짜 서버 DB”를 붙일 수는 없습니다. 전역 공유를 위해 **Supabase**를 쓰며, 클라이언트에는 **`anon` 공개 키 + Project URL**만 넣습니다. **`service_role` 비밀 키는 절대 넣지 마세요.**

### 테스트만 할 때 (실제 메일 안 씀)

연결에 필요한 것은 **`assets/js/site-config.js`의 URL + anon 키**뿐입니다.

1. [Supabase](https://supabase.com)에서 프로젝트 생성.
2. **SQL Editor**에서 `sql/supabase-schema.sql` 실행.  
   - 트리거 오류 시 `execute procedure public.handle_new_user();` 로 바꿔 재시도.
3. **Authentication → Providers → Email**에서 **Confirm email**을 **끄기** → 가입 직후 로그인(메일 인증 없음).
4. 가입 시 이메일은 `아무값@test.local`처럼 **형식만 맞으면 됨** (실제 수신 불필요).
5. **Project Settings → API**에서 **Project URL**과 **`anon` `public`** 키만 복사해 `site-config.js`에 붙여넣기 → 푸시.

```javascript
window.SITE = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
};
```

비밀번호 찾기(재설정 메일)는 **실제로 메일을 보내지 않을 거면** 쓰지 않는 편이 낫습니다. 비밀번호를 바꾸려면 Supabase **Authentication → Users**에서 해당 사용자를 수정하거나, 새 계정으로 가입하면 됩니다.

(나중에 진짜 메일을 쓰게 되면 **URL Configuration**에 GitHub Pages 주소와 `…/auth/login/index.html` 등 Redirect URL을 추가하고, 필요 시 SMTP/메일 템플릿을 설정하면 됩니다.)

### 동작 요약 (클라우드 모드)

- 가입·로그인: Supabase Auth (비밀번호 **6자 이상** 권장).
- 아이디 찾기: `find_username_by_email` RPC.
- 비밀번호 찾기: 메일 연동 시에만 의미 있음(테스트 생략 가능).
- 게시글·댓글: `posts`, `comments` + RLS로 **본인 글·댓글만 수정·삭제**.
