import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { ButtonLink } from "../components/ui/ButtonLink";
import { Icon } from "../components/ui/Icon";

export function PlansPage() {
  return (
    <>
      <SiteHeader
        variant="simple"
        extras={
          <ButtonLink to="/pages/apply" variant="primary" size="sm">
            신청하기
          </ButtonLink>
        }
      />
      <main className="section">
        <div className="wrap">
          <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>
            <Icon id="i-card" />
            구매 플랜 조회
          </h1>
          <p className="sub">데모용 가격표입니다. 실제 과금과 무관합니다.</p>

          <div className="tile-grid" style={{ alignItems: "stretch" }}>
            <article className="tile" style={{ display: "flex", flexDirection: "column" }}>
              <div className="pill" style={{ alignSelf: "flex-start" }}>
                Starter
              </div>
              <h3 style={{ margin: "14px 0 8px", fontSize: "1.35rem" }}>₩0 / 월</h3>
              <p className="muted" style={{ margin: "0 0 16px", flex: 1 }}>
                개인 실험, 포트폴리오에 적합합니다.
              </p>
              <ul className="feature-list" style={{ margin: 0 }}>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>체험 보드 포함</span>
                </li>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>브라우저 로컬 저장</span>
                </li>
              </ul>
              <ButtonLink to="/auth/login" className="btn btn-sm" style={{ marginTop: 18 }}>
                체험하기
              </ButtonLink>
            </article>

            <article
              className="tile"
              style={{
                display: "flex",
                flexDirection: "column",
                borderColor: "rgba(124, 92, 255, 0.55)",
                boxShadow: "0 18px 60px rgba(124, 92, 255, 0.18)",
              }}
            >
              <div
                className="pill"
                style={{
                  alignSelf: "flex-start",
                  background: "rgba(34, 211, 238, 0.12)",
                  borderColor: "rgba(34, 211, 238, 0.35)",
                  color: "#a5f3fc",
                }}
              >
                Pro · 인기
              </div>
              <h3 style={{ margin: "14px 0 8px", fontSize: "1.35rem" }}>₩29,000 / 월</h3>
              <p className="muted" style={{ margin: "0 0 16px", flex: 1 }}>
                소규모 팀이 프로토타입을 공유할 때.
              </p>
              <ul className="feature-list" style={{ margin: 0 }}>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>우선 지원 (데모)</span>
                </li>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>추가 테마 예정</span>
                </li>
              </ul>
              <ButtonLink to="/pages/apply" variant="primary" className="btn btn-sm" style={{ marginTop: 18 }}>
                이 플랜으로 신청
              </ButtonLink>
            </article>

            <article className="tile" style={{ display: "flex", flexDirection: "column" }}>
              <div className="pill" style={{ alignSelf: "flex-start" }}>
                Team
              </div>
              <h3 style={{ margin: "14px 0 8px", fontSize: "1.35rem" }}>문의</h3>
              <p className="muted" style={{ margin: "0 0 16px", flex: 1 }}>
                조직 단위 도입, 보안 검토가 필요한 경우.
              </p>
              <ul className="feature-list" style={{ margin: 0 }}>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>전담 매니저 (데모)</span>
                </li>
                <li>
                  <span className="tick" aria-hidden="true">
                    <Icon id="i-check" />
                  </span>
                  <span>맞춤 온보딩</span>
                </li>
              </ul>
              <ButtonLink to="/pages/contact" className="btn btn-sm" style={{ marginTop: 18 }}>
                문의하기
              </ButtonLink>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter>가격은 예시이며 실제 서비스와 다를 수 있습니다.</SiteFooter>
    </>
  );
}
