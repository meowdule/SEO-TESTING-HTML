/**
 * 테스트용 전역 DB: Supabase **Project URL** + **anon public** 키만 넣으면 됩니다.
 * (Settings → API 의 `Project URL`, `anon` `public` 키 — service_role 비밀 키는 넣지 마세요.)
 *
 * 실제 이메일 없이 쓰려면 Supabase에서 **이메일 확인(Confirm email) 끄기** 후,
 * 가입 시 이메일 칸에는 `아무이름@test.local` 같이 형식만 맞는 값을 쓰면 됩니다.
 *
 * 비밀번호 찾기(재설정 메일)는 실제 SMTP가 없으면 메일이 가지 않습니다. 테스트 시에는
 * 비밀번호를 잊었으면 Supabase 대시보드 Authentication → Users에서 해당 사용자 비밀번호를 바꾸거나, 새로 가입하세요.
 *
 * 아래 둘 다 비우면 → 이 브라우저 localStorage만 사용 (로컬 모드).
 *
 * adminUsernames: 보드에서「문의 기록」탭을 볼 수 있는 로그인 아이디(username) 목록.
 * (클라이언트 전용이라 실서비스 수준 보안은 아님 — 데모용)
 */
window.SITE = {
  supabaseUrl: "https://qyxqeaxasxamgjbbwqqo.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eHFlYXhhc3hhbWdqYmJ3cXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjM0MTcsImV4cCI6MjA5MzAzOTQxN30.tREGhT2Rgmr6PkxwDFGAfb8Ue_jGaAEL9ATlwVTkL6M",
  adminUsernames: [ys.kim],
};
