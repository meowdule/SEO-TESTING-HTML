import { Navigate, Route, Routes } from "react-router-dom";
import { ApplyPage } from "./pages/ApplyPage";
import { BoardPage } from "./pages/BoardPage";
import { ContactPage } from "./pages/ContactPage";
import { FindIdPage } from "./pages/FindIdPage";
import { FindPasswordPage } from "./pages/FindPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PlansPage } from "./pages/PlansPage";
import { PostPage } from "./pages/PostPage";
import { SignupPage } from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pages/plans" element={<PlansPage />} />
      <Route path="/pages/contact" element={<ContactPage />} />
      <Route path="/pages/apply" element={<ApplyPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/find-id" element={<FindIdPage />} />
      <Route path="/auth/find-password" element={<FindPasswordPage />} />
      <Route path="/app/board" element={<BoardPage />} />
      <Route path="/app/post" element={<PostPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
