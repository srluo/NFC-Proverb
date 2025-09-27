"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  const [proverb, setProverb] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("daily");

  useEffect(() => {
    async function fetchProverb() {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");

      if (!d) {
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
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        // 📌 檢查模式
        setMode(data.mode || "daily");

        // 📌 一般模式要檢查 RLC，隨機模式不用
        if (ts !== "00000000" && data.signature.toLowerCase() !== rlc.toLowerCase()) {
          setError("⚠️ 重新感應 NFC TAG");
          return;
        }

        setProverb(data.proverb);
      } catch {
        setError("⚠️ 重新感應 NFC TAG");
      }
    }

    fetchProverb();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "url('/bg.jpg') no-repeat center center fixed",
        backgroundSize: "cover",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: "120px", margin: "0 auto 1rem", display: "block" }}
      />

      <h1 style={{ marginBottom: "1.5rem", color: "#4a2f00" }}>
        📖 今日箴言 {mode === "random" && <span style={{ fontSize: "1rem", color: "#666" }}>（隨機抽取）</span>}
      </h1>

      {error && <p style={{ color: "red", fontSize: "1.2rem" }}>{error}</p>}

      {proverb && (
        <blockquote
          style={{
            background: "rgba(255,255,255,0.9)",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
            maxWidth: "700px",
            margin: "0 auto",
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
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.9rem",
                color: "#555",
                fontStyle: "italic",
              }}
            >
              👉 {proverb.explanation}
            </p>
          )}
        </blockquote>
      )}
    </div>
  );
}
