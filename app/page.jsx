"use client";

import React, { useState, useEffect } from "react";

export default function HomePage() {
  const [proverb, setProverb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProverb() {
      try {
        const res = await fetch("/api/proverb");
        const data = await res.json();
        setProverb(data.proverb);
      } catch (err) {
        console.error("取得箴言失敗:", err);
      } finally {
        setLoading(false);
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
      <h1 style={{ marginBottom: "1.5rem" }}>今日箴言</h1>
      {loading ? (
        <p>載入中...</p>
      ) : proverb ? (
        <blockquote style={{ fontStyle: "italic", lineHeight: "1.6" }}>
          <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            「{proverb.text}」
          </p>
          <footer style={{ marginBottom: "0.5rem" }}>— {proverb.author}</footer>
          <p style={{ fontSize: "0.9rem", color: "#555" }}>
            {proverb.explanation}
          </p>
        </blockquote>
      ) : (
        <p>今天沒有找到箴言。</p>
      )}
    </div>
  );
}
