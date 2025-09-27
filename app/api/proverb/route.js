import proverbs from "../../../data/proverbs.json";
import { sign } from "../../../lib/sign.cjs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const ts = searchParams.get("ts");

  if (!uid || !ts) {
    return new Response(
      JSON.stringify({ error: "缺少必要參數 uid 或 ts" }),
      { status: 400 }
    );
  }

  try {
    const rlc = sign({ uid, ts });
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const key = `${month}-${date}`;

    const proverb = proverbs[key] || {
      text: "沒有找到今日箴言",
      author: "系統",
      explanation: "請檢查資料來源",
    };

    return new Response(
      JSON.stringify({
        date: key,
        proverb,
        signature: rlc,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
