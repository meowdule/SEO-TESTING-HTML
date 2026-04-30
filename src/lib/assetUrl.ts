/** SVG 스프라이트 (public/assets/icons.svg) */
export function iconSpriteUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}assets/icons.svg`;
}
