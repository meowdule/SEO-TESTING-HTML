# Demo Service (GitHub Pages)

정적 HTML/CSS/JS만 사용합니다. 저장소 **Settings → Pages**에서 브랜치(예: `main`)와 폴더(`/ (root)`)를 지정하면 배포됩니다.

- **데이터**: 회원·게시글·댓글은 브라우저 `localStorage` / 세션은 `sessionStorage`에만 저장됩니다. GitHub API 연동이 아니므로 기기·브라우저마다 따로 동작합니다.
- **권한**: 로그인한 사용자 ID와 작성자 ID가 같을 때만 글·댓글 수정·삭제가 가능합니다.
