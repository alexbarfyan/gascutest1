import "./globals.css";

export const metadata = {
  title: "Eric • GASCU Internal Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
            background: "#0b3d2e", // GASCU-ish green
            color: "white",
          }}
        >
          <img
            src="/gascu-logo.png"
            alt="GASCU"
            style={{ width: 34, height: 34, borderRadius: 6, background: "white", padding: 4 }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Eric</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>GASCU Internal Assistant</div>
          </div>
        </header>

        <main style={{ maxWidth: 980, margin: "0 auto", padding: 18 }}>{children}</main>
      </body>
    </html>
  );
}
