import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "SOCRA TUTOR",
  description: "AI 수학 튜터",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: "#f9f9f7" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        ` }} />
        {children}
      </body>
    </html>
  );
}
