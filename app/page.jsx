"use client";

import React, { useState, useEffect } from "react";

// 依月份回傳對應的背景與文字色
function getSeasonStyleByMonth(month) {
  if ([3, 4, 5].includes(month)) {
    // 春
    return { bg: "/bg-spring.jpg", mainColor: "#3a2a1a", accent: "#61773c", subtitle: "#333" };
  }
  if ([6, 7, 8].includes(month)) {
    // 夏
    return { bg: "/bg-summer.jpg", mainColor: "#1a2a4a", accent: "#2e6d84", subtitle: "#2f3f5f" };
  }
  if ([9, 10, 11].includes(month)) {
    // 秋
    return { bg: "/bg-autumn.jpg", mainColor: "#4a1f0f", accent: "#814d12", subtitle: "#5a2f1a" };
  }
  // 冬 (12,1,2)
  return { bg: "/bg-winter.jpg", mainColor: "#1f2f3f", accent: "#5a6b6e", subtitle: "#444" };
}

// 由 "MM-DD" 推得月份；若異常則回今天月份
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
  // 預設先用今天月份的樣式，等 API 回來後再依 data.date 更新
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
        setError("⚠️ 重新感應 NFC TAG");
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
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        setMode(data.mode || "daily");

        // 一般模式要檢查 RLC，隨機模式不用
        if (ts !== "00000000" && data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setProverb(null);
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        // 隨機模式 → 顯示 debug
        if (data.mode === "random" && typeof data.randomIndex !== "undefined") {
          setRandomInfo(`隨機模式抽到第 ${data.randomIndex} 筆 (${data.date})`);
        } else {
          setRandomInfo(null);
        }

        // ✅ 依回傳的 date (MM-DD) 動態切換季節樣式
        setSeason(getSeasonStyleByDateKey(data.date));

        setProverb(data.proverb);
        setError(null);
      } catch {
        setProverb(null);
        setError("⚠️ 重新感應 NFC TAG");
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

      {/* Debug：只在隨機模式顯示 */}
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
    </div>
  );
}
