# Demo Service (GitHub Pages + React SPA)

**Vite + React + TypeScript** 단일 페이지 앱입니다. 배포 시 `dist/`만 서빙하며, 크롤러가 HTML 스냅샷만 보면 본문이 거의 비어 있는 일반적인 SPA 배포 형태와 같습니다.

## 로컬 개발

```bash
npm install
npm run dev
```

- 개발 서버 기본 주소: `http://localhost:5173/` (`vite.config.ts`에서 `base`는 `/`)
- 타입 검사: `npm run typecheck`

## 프로덕션 빌드

```bash
npm run build
```

- 결과물: `dist/` (GitHub Pages용 **`404.html`**은 `index.html` 복사본 — 클라이언트 라우트 새로고침 대비)
- **프로젝트 페이지** 경로(`…/SEO-TESTING-HTML/`)에 맞추려면 `vite.config.ts`의 `base`를 저장소 이름에 맞게 수정하세요.

## GitHub Pages 배포

1. 저장소 **Settings → Pages**에서 **Deploy from a branch** 선택.
2. **Branch**를 `gh-pages` / **folder** `(root)` 로 지정.
3. `main`(또는 `master`)에 푸시하면 `.github/workflows/deploy-pages.yml`이 빌드 후 `gh-pages`에 `dist`를 게시합니다.

(처음 한 번은 Actions가 `gh-pages` 브랜치를 만들어야 하므로, 워크플로 한 번 실행될 때까지 기다린 뒤 Pages 설정을 맞추면 됩니다.)

## 설정 (Supabase)

| 파일 | 설명 |
|------|------|
| `src/config/site.ts` | `supabaseUrl`, `supabaseAnonKey`, `adminUsernames` — 비우면 로컬 모드 |

**`service_role` 비밀 키는 넣지 마세요.** anon 공개 키만 사용합니다.

### 테스트만 할 때

1. [Supabase](https://supabase.com)에서 프로젝트 생성.
2. **SQL Editor**에서 `sql/supabase-schema.sql` 실행.
3. **Authentication → Email → Confirm email** 끄기.
4. `src/config/site.ts`에 Project URL과 `anon` `public` 키 입력 후 빌드·배포.

비밀번호 재설정 메일을 쓰려면 Supabase **URL Configuration**에 사이트 URL과 로그인 경로(예: `https://…/SEO-TESTING-HTML/auth/login`)를 Redirect URL로 추가합니다.

## 폴더 구조 (요약)

| 경로 | 설명 |
|------|------|
| `src/pages/` | 라우트별 화면 |
| `src/components/` | 헤더·폼·모달 등 UI |
| `src/lib/appData.ts` | 로컬/Supabase 데이터 로직 |
| `src/styles/global.css` | 기존 데모와 동일 토큰·컴포넌트 스타일 |
| `public/assets/icons.svg` | 아이콘 스프라이트 |
| `sql/supabase-schema.sql` | DB 스키마 |

## 데이터 저장 요약

- **로컬**: Supabase 미설정 시 `localStorage` / `sessionStorage` (기존 키와 동일).
- **전역**: Supabase 연결 시 모든 방문자가 동일 DB 사용.

관리자 문의·신청 탭은 `adminUsernames`에 등록된 **username**과 일치할 때만 표시됩니다(데모 수준).
