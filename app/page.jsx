"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  const [proverb, setProverb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProverb() {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");

      if (!d) {
        setError("⚠️ 重新感應 NFC TAG");
        return;
      }

      // 拆解 token
      const uid = d.slice(0, 14);
      const ts = d.slice(16, 24);
      const rlc = d.slice(24);

      // 📌 LocalStorage 檢查：同 UID 的 TS 必須比上一次大
      const lastTsKey = `last_ts_${uid}`;
      const lastTs = localStorage.getItem(lastTsKey);

      if (lastTs && parseInt(ts, 16) <= parseInt(lastTs, 16)) {
        setError("⚠️ 重新感應 NFC TAG");
        return;
      }

      try {
        const res = await fetch(`/api/proverb?uid=${uid}&ts=${ts}`);
        const data = await res.json();

        if (data.error) {
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        if (data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        // ✅ 驗證成功 → 更新 LocalStorage
        localStorage.setItem(lastTsKey, ts);

        setProverb(data.proverb);
      } catch (err) {
        setError("⚠️ 重新感應 NFC TAG");
      }
    }

    fetchProverb();
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>📖 今日箴言</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {proverb && (
        <blockquote
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "1.3rem", lineHeight: "1.6" }}>
            「{proverb.zh}」
          </p>
          {proverb.en && (
            <p style={{ fontSize: "1rem", marginTop: "0.5rem", color: "#333" }}>
              {proverb.en}
            </p>
          )}
          {proverb.author && (
            <footer style={{ marginTop: "1rem", fontWeight: "bold" }}>
              — {proverb.author}
            </footer>
          )}
          {proverb.explanation && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
              👉 {proverb.explanation}
            </p>
          )}
        </blockquote>
      )}
    </div>
  );
}
