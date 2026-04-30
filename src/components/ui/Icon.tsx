import { iconSpriteUrl } from "../../lib/assetUrl";

type IconProps = {
  id: string;
  className?: string;
  size?: "md" | "lg";
};

export function Icon({ id, className = "", size = "md" }: IconProps) {
  const cls = size === "lg" ? `icon icon-lg ${className}`.trim() : `icon ${className}`.trim();
  return (
    <svg className={cls} aria-hidden>
      <use href={`${iconSpriteUrl()}#${id}`} />
    </svg>
  );
}
