type Props = { children: string };

export function SiteFooter({ children }: Props) {
  return (
    <footer className="site-footer">
      <div className="wrap">{children}</div>
    </footer>
  );
}
