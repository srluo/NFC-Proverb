"use client";

import React, { useState, useEffect } from "react";

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
  const [ts, setTs] = useState(null);

  const [season, setSeason] = useState(() => {
    const m = new Date().getMonth() + 1;
    return getSeasonStyleByMonth(m);
  });

  useEffect(() => {
    async function fetchProverb() {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");

      if (!d) {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG (D)");
        return;
      }

      // ✅ 本地檢查是否已經使用過
      const usedTokens = JSON.parse(localStorage.getItem("usedTokens") || "[]");
      if (usedTokens.includes(d)) {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG (R)");
        return;
      }

      const uid = d.slice(0, 14);
      const tsValue = d.slice(16, 24);
      const rlc = d.slice(24);
      setTs(tsValue);

      try {
        const res = await fetch(`/api/proverb?uid=${uid}&ts=${tsValue}`);
        const data = await res.json();

        if (data.error) {
          setProverb(null);
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        setMode(data.mode || "daily");

        if (tsValue !== "00000000" && data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setProverb(null);
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        // ✅ 使用成功 → 記錄 token
        localStorage.setItem("usedTokens", JSON.stringify([...usedTokens, d]));

        if (data.mode === "random" && typeof data.randomIndex !== "undefined") {
          setRandomInfo(`隨機模式抽到第 ${data.randomIndex} 筆 (${data.date})`);
        } else {
          setRandomInfo(null);
        }

        setSeason(getSeasonStyleByDateKey(data.date));
        setProverb(data.proverb);
        setError(null);
      } catch {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG (0)");
      }
    }

    fetchProverb();
  }, []);

  function clearLocalStorage() {
    localStorage.removeItem("usedTokens");
    alert("✅ LocalStorage 已清除，請重新整理頁面！");
  }

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
              <p
                style={{
                  fontSize: "1.2rem",
                  marginTop: "0.5rem",
                  color: season.subtitle,
                }}
              >
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

      {/* Debug + 清除按鈕：只在隨機模式顯示 */}
      {mode === "random" && (
        <div
          style={{
            marginTop: "1.5rem",
            fontSize: "0.9rem",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          {randomInfo && <div>⚡ Debug：{randomInfo}</div>}
          {ts === "00000000" && (
            <button
              onClick={clearLocalStorage}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "none",
                background: "#ff6666",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              🧹 清除 LocalStorage
            </button>
          )}
        </div>
      )}
    </div>
  );
}
