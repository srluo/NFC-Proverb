{/* 📌 隨機模式專屬：LocalStorage 狀態檢視 */}
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
    <h4 style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
      🗄 LocalStorage 狀態
    </h4>
    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      {JSON.stringify(localStorage, null, 2)}
    </pre>
    <button
      onClick={() => {
        localStorage.clear();
        alert("✅ LocalStorage 已清空");
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
      清除 LocalStorage
    </button>
  </div>
)}
