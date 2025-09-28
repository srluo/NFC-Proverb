"use client";

import React, { useState, useEffect } from "react";

// 依月份回傳對應的背景與文字色
function getSeasonStyleByMonth(month) {
  if ([3, 4, 5].includes(month)) {
    return { bg: "/bg-spring.jpg", mainColor: "#3a2a1a", accent: "#61773c", subtitle: "#333" };
  }
  if ([6, 7, 8].includes(month)) {
    return { bg: "/bg-summer.jpg", mainColor: "#1a2a4a", accent: "#2e6d84", subtitle: "#2f3f5f" };
  }
  if ([9, 10, 11].includes(month)) {
    return { bg: "/bg-autumn.jpg", mainColor: "#4a1f0f", accent: "#814d12", subtitle: "#5a2f1a" };
  }
  return { bg: "/bg-winter.jpg", mainColor: "#1f2f3f", accent: "#5a6b6e", subtitle: "#444" };
}

function getSeasonStyleByDateKey(dateKey) {
  let month = new Date().getMonth() + 1;
  if (typeof dateKey === "string" && /^\d{2}-\d{2}$/.test(dateKey)) {
    month = parseInt(dateKey.slice(0, 2), 10);
  }
  return getSeasonStyleByMonth(month);
}

export default function HomePage() {
  const [proverb, setProverb] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("daily");
  const [randomInfo, setRandomInfo] = useState(null);
  const [season, setSeason] = useState(() => {
    const m = new Date().getMonth() + 1;
    return getSeasonStyleByMonth(m);
  });
  const [tokenStorage, setTokenStorage] = useState({});

  useEffect(() => {
    async function fetchProverb() {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");

      if (!d) {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG (0)");
        return;
      }

      const uid = d.slice(0, 14);
      const ts = d.slice(16, 24);
      const rlc = d.slice(24);

      try {
        const res = await fetch(`/api/proverb?uid=${uid}&ts=${ts}`);
        const data = await res.json();

        if (data.error) {
          setProverb(null);
          setError("⚠️ 重新感應 NFC TAG (d)");
          return;
        }

        setMode(data.mode || "daily");

        if (ts !== "00000000" && data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setProverb(null);
          setError("⚠️ 重新感應 NFC TAG (RLC)");
          return;
        }

        if (data.mode === "random" && typeof data.randomIndex !== "undefined") {
          setRandomInfo(`隨機模式抽到第 ${data.randomIndex} 筆 (${data.date})`);
        } else {
          setRandomInfo(null);
        }

        setSeason(getSeasonStyleByDateKey(data.date));

        setProverb(data.proverb);
        setError(null);

        // 📌 更新 LocalStorage Token 狀態
        const tokens = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith("token-")) {
            tokens[key] = localStorage.getItem(key);
          }
        }
        setTokenStorage(tokens);
      } catch {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG (E)");
      }
    }

    fetchProverb();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `url('${season.bg}') no-repeat center center fixed`,
        backgroundSize: "cover",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: "120px", margin: "30px auto 20px", display: "block" }}
      />

      <h2 style={{ marginBottom: "1.6rem", color: season.accent }}>
        📖 今日箴言{" "}
        {mode === "random" && (
          <span style={{ fontSize: "1rem", color: season.subtitle }}>（隨機抽取）</span>
        )}
      </h2>

      {error && <p style={{ color: "red", fontSize: "1.2rem" }}>{error}</p>}

      {proverb && (
        <blockquote
          style={{
            background: "rgba(255,255,255,0.45)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <p style={{ fontSize: "1.4rem", lineHeight: "1.8", color: season.mainColor }}>
            「{proverb.zh}」
          </p>

          {proverb.en && (
            <>
              <img
                src="/dividing-lines-1.png"
                alt="divider"
                style={{
                  width: "50%",
                  margin: "1.5rem auto",
                  display: "block",
                  opacity: 0.5,
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                }}
              />
              <p style={{ fontSize: "1.2rem", marginTop: "0.5rem", color: season.subtitle }}>
                {proverb.en}
              </p>
            </>
          )}

          {proverb.author && (
            <footer style={{ marginTop: "1.6rem", fontWeight: "bold", color: season.mainColor }}>
              — {proverb.author}
            </footer>
          )}
          {proverb.explanation && (
            <p
              style={{
                marginTop: "1.6rem",
                fontSize: "0.9rem",
                color: season.subtitle,
                fontStyle: "italic",
              }}
            >
              👉 {proverb.explanation}
            </p>
          )}
        </blockquote>
      )}

      {mode === "random" && randomInfo && (
        <div
          style={{
            marginTop: "1.2rem",
            fontSize: "0.9rem",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          ⚡ Debug：{randomInfo}
        </div>
      )}

      {/* 📌 LocalStorage 狀態檢視：只在隨機模式顯示 */}
      {mode === "random" && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "rgba(255,255,255,0.7)",
            borderRadius: "8px",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "left",
            fontSize: "0.85rem",
            color: "#333",
          }}
        >
          <h4 style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>🗄 Token 狀態 (LocalStorage)</h4>
          {Object.keys(tokenStorage).length > 0 ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {JSON.stringify(tokenStorage, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#666" }}>（尚無 Token 紀錄）</p>
          )}
          <button
            onClick={() => {
              Object.keys(tokenStorage).forEach((key) => localStorage.removeItem(key));
              alert("✅ Token 紀錄已清空");
              window.location.reload();
            }}
            style={{
              marginTop: "0.8rem",
              padding: "0.5rem 1rem",
              background: "#ff6666",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            清除 Token 紀錄
          </button>
        </div>
      )}
    </div>
  );
}
