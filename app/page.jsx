"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  const [proverb, setProverb] = useState(null);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    async function fetchProverb() {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");

      if (!d) {
        setError("❌ 缺少 Token，請重新感應 NFC 標籤");
        return;
      }

      // 拆解 token
      const uid = d.slice(0, 14);
      const tp = d.slice(14, 16);
      const ts = d.slice(16, 24);
      const rlc = d.slice(24);

      try {
        const res = await fetch(`/api/proverb?uid=${uid}&ts=${ts}`);
        const data = await res.json();

        setDebug({
          UID: uid,
          TP: tp,
          TS: ts,
          "Token RLC": rlc,
          "API RLC": data.signature || "無",
        });

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setError("⚠️ RLC 驗證失敗，請重新感應");
          return;
        }

        setProverb(data.proverb);
      } catch (err) {
        setError("❌ 無法連線伺服器");
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
          {proverb.author && (
            <footer style={{ marginTop: "1rem", fontWeight: "bold" }}>
              — {proverb.author}
            </footer>
          )}
          {proverb.explanation && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
              {proverb.explanation}
            </p>
          )}
        </blockquote>
      )}

      {debug && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            textAlign: "left",
            fontSize: "0.85rem",
            background: "#f0f0f0",
            borderRadius: "8px",
            color: "#444",
            whiteSpace: "pre-wrap",
          }}
        >
          {Object.entries(debug)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}
        </div>
      )}
    </div>
  );
}
