/**
 * Supabase Project URL + anon public 키. 비우면 로컬(localStorage) 모드.
 * adminUsernames: 보드에서 문의·신청 탭을 볼 수 있는 username 목록(데모용).
 */
export const siteConfig = {
  supabaseUrl: "https://qyxqeaxasxamgjbbwqqo.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eHFlYXhhc3hhbWdqYmJ3cXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjM0MTcsImV4cCI6MjA5MzAzOTQxN30.tREGhT2Rgmr6PkxwDFGAfb8Ue_jGaAEL9ATlwVTkL6M",
  adminUsernames: ["ys.kim"] as string[],
};
