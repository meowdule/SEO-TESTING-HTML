import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../ui/ButtonLink";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

export type HeaderVariant = "landing" | "simple" | "board" | "auth" | "post";

type Props = {
  variant: HeaderVariant;
  userLabel?: string;
  onLogout?: () => void;
  /** 헤더 오른쪽에 추가 링크(예: 플랜 페이지의 신청하기) */
  extras?: ReactNode;
};

export function SiteHeader({ variant, userLabel, onLogout, extras }: Props) {
  return (
    <header className="site-header">
      <div className="wrap inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <Icon id="i-spark" size="lg" />
          </span>
          <span>SEO DEMO</span>
        </Link>
        <nav className="nav" aria-label="주요 메뉴">
          {variant === "landing" && (
            <>
              <ButtonLink to="/pages/plans" variant="ghost" size="sm">
                <Icon id="i-card" />
                플랜
              </ButtonLink>
              <ButtonLink to="/pages/contact" variant="ghost" size="sm">
                <Icon id="i-mail" />
                문의
              </ButtonLink>
              <ButtonLink to="/auth/login" variant="primary" size="sm">
                <Icon id="i-rocket" />
                체험하기
              </ButtonLink>
            </>
          )}
          {variant === "simple" && (
            <>
              <ButtonLink to="/" variant="ghost" size="sm">
                <Icon id="i-home" />
                홈
              </ButtonLink>
              {extras}
            </>
          )}
          {variant === "auth" && (
            <ButtonLink to="/auth/login" variant="ghost" size="sm">
              로그인
            </ButtonLink>
          )}
          {variant === "post" && (
            <ButtonLink to="/app/board" variant="ghost" size="sm">
              <Icon id="i-chat" />
              목록
            </ButtonLink>
          )}
          {variant === "board" && (
            <>
              {userLabel ? (
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  {userLabel}
                </span>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
                <Icon id="i-lock" />
                로그아웃
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
