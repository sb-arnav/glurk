import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glurk Badge",
  robots: { index: false, follow: false },
};

// Embed iframe contents must not paint over the host site's background.
// We strip the global dark body color so iframe consumers can size the
// frame tightly to the card and have the host page colors show through
// any surrounding margin.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        padding: 0,
        margin: 0,
      }}
    >
      <style>{`
        html, body { background: transparent !important; }
      `}</style>
      {children}
    </div>
  );
}
