/**
 * Embed Layout
 * Minimal layout for iframe-embedded assessments — no site chrome
 */

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="m-0 p-0">{children}</div>;
}
