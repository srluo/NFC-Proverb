import proverbs from "@/data/proverbs.json";
import signModule from "@/lib/sign.cjs";
const { sign } = signModule;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get("uid");
    const token = url.searchParams.get("token") || "";
    const tp = token.slice(0, 2);
    const tsHex = token.slice(2, 10);
    const rlc = token.slice(10);
    if (!uid || !tp || !tsHex || !rlc)
      return new Response(JSON.stringify({ error: "缺少必要參數" }), { status: 400 });
    if (tp !== "DW")
      return new Response(JSON.stringify({ error: "TP 無效" }), { status: 403 });

    const expect = sign({ uid: uid.toUpperCase(), ts: tsHex.toUpperCase() }).toUpperCase();
    if (expect !== rlc.toUpperCase())
      return new Response(JSON.stringify({ error: "RLC 不匹配" }), { status: 403 });

    const today = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" })
      .format(new Date())
      .replace("/", "-");

    const p = proverbs[today] || Object.values(proverbs)[0];
    return new Response(JSON.stringify({ date: today, proverb: p }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
