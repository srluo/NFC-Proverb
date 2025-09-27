import React from "react";

export const metadata = {
  title: "今日箴言",
  description: "NFC 每日箴言展示頁",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        {/* 全域 Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "'Noto Serif TC', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
          backgroundColor: "#f8f8f8",
          color: "#2c3e50",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <main style={{ flex: 1 }}>{children}</main>
        <footer
          style={{
            textAlign: "center",
            padding: "1rem",
            fontSize: "0.8rem",
            color: "#888",
            borderTop: "1px solid #ddd",
            backgroundColor: "#fafafa",
            position: "sticky",
            bottom: 0,
          }}
        >
          © 2025 NFCTOGO
        </footer>
      </body>
    </html>
  );
}