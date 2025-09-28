// app/api/proverb/route.js
import proverbs from "../../../data/proverbs.json";
import { sign } from "../../../lib/sign.cjs";

function todayKeyTaipei() {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const mm = parts.find(p => p.type === "month").value;
  const dd = parts.find(p => p.type === "day").value;
  return `${mm}-${dd}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  let uid = searchParams.get("uid");
  let ts = searchParams.get("ts");
  let tokenRlc = null;

  const d = searchParams.get("d");
  if (d) {
    uid = d.slice(0, 14);
    const tp = d.slice(14, 16); // 例如 "DW"
    ts = d.slice(16, 24);
    tokenRlc = d.slice(24);

    // ✅ 嚴格檢查 TP checked
    if (tp !== "DW") {
      return new Response(JSON.stringify({ error: "NFC TAG無效，請重新感應" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!uid || !ts) {
    return new Response(JSON.stringify({ error: "缺少必要參數 uid 或 ts" }), { status: 400 });
  }

  try {
    const rlc = sign({ uid: uid.toUpperCase(), ts: ts.toUpperCase() });

    // 隨機模式 (TS=00000000) 跳過 RLC 驗證
    if (ts !== "00000000" && tokenRlc && rlc.toLowerCase() !== tokenRlc.toLowerCase()) {
      return new Response(JSON.stringify({ error: "RLC 驗證失敗，請重新感應" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = todayKeyTaipei();
    const proverb = proverbs[key] || {
      zh: "沒有找到今日箴言。",
      en: "",
      author: "系統",
      theme_id: 0,
      theme_name: "未分類",
    };

    return new Response(
      JSON.stringify({
        date: key,
        proverb,
        signature: rlc,
        verified: ts === "00000000" || rlc.toLowerCase() === tokenRlc?.toLowerCase(),
        mode: ts === "00000000" ? "random" : "daily",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "server-error", detail: String(error) }), { status: 500 });
  }
}
