import React from "react";

export default function HomePage() {
  const [data, setData] = React.useState({ loading: true });

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const uid = url.searchParams.get("uid") || url.pathname.slice(1, 15);
    const token = url.searchParams.get("token") || url.pathname.slice(15);
    fetch(`/api/proverb?uid=${uid}&token=${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.error) setData({ loading: false, error: res.error });
        else setData({ loading: false, proverb: res.proverb, date: res.date });
      })
      .catch(e => setData({ loading: false, error: String(e) }));
  }, []);

  if (data.loading) return <main style={{ padding: 24 }}>載入中…</main>;
  if (data.error) return <main style={{ padding: 24, color: "crimson" }}>錯誤：{data.error}</main>;

  const { zh, en, author, theme_name } = data.proverb || {};
  return (
    <main style={{ padding: 24, textAlign: "center" }}>
      <img src="/logo.png" alt="logo" style={{ width: 80, margin: "0 auto" }} />
      <h1>📖 今日箴言</h1>
      <div style={{ marginTop: 8, color: "#666" }}>{data.date}｜{theme_name}</div>
      <div style={{ marginTop: 24, fontSize: 22 }}>{zh}</div>
      <div style={{ marginTop: 12, fontSize: 16, color: "#555" }}>{en}</div>
      <div style={{ marginTop: 12, color: "#888" }}>— {author}</div>
    </main>
  );
}
