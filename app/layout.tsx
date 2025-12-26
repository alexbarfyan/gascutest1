import "./globals.css";
import Image from "next/image";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid #e5e7eb",
          background: "#0b3d2e", // GASCU-ish green
          color: "white"
        }}>
          <Image src="/gascu-logo.png" alt="GASCU" width={42} height={42} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>ERIC</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>GASCU Internal Assistant</div>
          </div>
        </header>

        <main style={{ padding: 18 }}>{children}</main>
      </body>
    </html>
  );
}
