import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { ButtonLink } from "../components/ui/ButtonLink";
import { Icon } from "../components/ui/Icon";

export function HomePage() {
  return (
    <>
      <SiteHeader variant="landing" />
      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="pill">
                <Icon id="i-spark" />
                GitHub Pages 정적 배포
              </span>
              <h1>
                빠르게 검증하고,
                <br />
                아름답게 확장하세요.
              </h1>
              <p className="lead">
                GitHub Pages로 정적 배포하고, 선택적으로 Supabase를 연결하면 방문자 모두가 같은 회원·게시글 데이터를
                사용합니다. 연결하지 않으면 이 브라우저에만 저장됩니다.
              </p>
              <div className="cta-row">
                <ButtonLink to="/pages/apply" variant="primary">
                  <Icon id="i-check" />
                  지금 신청하기
                </ButtonLink>
                <ButtonLink to="/pages/contact">
                  <Icon id="i-mail" />
                  문의하기
                </ButtonLink>
                <ButtonLink to="/pages/plans">
                  <Icon id="i-card" />
                  구매 플랜 조회
                </ButtonLink>
                <ButtonLink to="/auth/login">
                  <Icon id="i-rocket" />
                  체험하기
                </ButtonLink>
              </div>
            </div>
            <div className="card-panel" aria-label="하이라이트">
              <h2 style={{ margin: "0 0 8px", fontSize: "1.25rem" }}>왜 이 데모인가요?</h2>
              <p className="muted" style={{ margin: "0 0 8px" }}>
                UI는 SVG 아이콘과 타이포그래피로 정리했고, 권한은 세션·작성자 ID로 단순하게 막았습니다.
              </p>
              <ul className="feature-list">
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>로그인 후 게시글 작성 / 댓글 달기</span>
                </li>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>본인 글·댓글만 수정·삭제</span>
                </li>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>로컬 저장 또는 Supabase로 전역 저장 선택</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <h2>바로가기</h2>
            <p className="sub">랜딩에서 주요 화면으로 이동해 플로우를 확인해 보세요.</p>
            <div className="tile-grid">
              <ButtonLink to="/pages/contact" className="tile">
                <Icon id="i-mail" size="lg" />
                <h3>문의하기</h3>
                <p>간단한 폼으로 문의 내용을 남깁니다. (로컬에만 저장)</p>
              </ButtonLink>
              <ButtonLink to="/pages/apply" className="tile">
                <Icon id="i-user-plus" size="lg" />
                <h3>지금 신청하기</h3>
                <p>신청서를 작성하고 제출합니다. (로컬에만 저장)</p>
              </ButtonLink>
              <ButtonLink to="/pages/plans" className="tile">
                <Icon id="i-card" size="lg" />
                <h3>구매 플랜 조회</h3>
                <p>Starter · Pro · Team 플랜을 비교합니다.</p>
              </ButtonLink>
              <ButtonLink to="/auth/login" className="tile">
                <Icon id="i-lock" size="lg" />
                <h3>체험하기 (로그인)</h3>
                <p>회원가입 후 커뮤니티 보드로 이동합니다.</p>
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter>© SEO DEMO · GitHub Pages + React SPA</SiteFooter>
    </>
  );
}
