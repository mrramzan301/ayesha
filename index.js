// index.js (Forced Answer Mode - No Echo Questions)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEEPSEEK_API = "http://de3.bot-hosting.net:21007/kilwa-deepseek";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let rawUrl = request.url;
    if (rawUrl.includes("%3F") || rawUrl.includes("%26")) {
      rawUrl = decodeURIComponent(rawUrl);
    }
    const url = new URL(rawUrl);

    const charName = url.searchParams.get("name") || "Zara";
    const charAge = url.searchParams.get("age") || "22";
    const charCity = url.searchParams.get("city") || "Lahore";
    const currentMood = url.searchParams.get("mood") || "playful";
    const allowedLanguage = url.searchParams.get("lang") || "roman urdu";
    let userMessage = url.searchParams.get("text") || "";

    if (!userMessage && url.search.includes("text=")) {
      const match = url.search.match(/[?&]text=([^&]*)/);
      if (match) userMessage = decodeURIComponent(match[1]);
    }

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Text parameter missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    let uid = url.searchParams.get("uid");
    if (!uid) {
      const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
      const ua = request.headers.get("user-agent") || "unknown";
      uid = btoa(`${ip}:${ua}`).slice(0, 20);
    }

    let languageInstruction = "";
    if (allowedLanguage === "roman urdu") {
      languageInstruction = "Write ONLY in casual Roman Urdu (like 'theek hu', 'tv dekh rhi', 'kuch nahi'). Never use English.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Write ONLY in short, casual English. Never use Roman Urdu.";
    } else {
      languageInstruction = "Mix Roman Urdu and English naturally like local young girls do.";
    }

    // 🚨 STRONG ANTI-ECHO PROMPT
    const systemPrompt = `
You are a real human girl named ${charName}, ${charAge} from ${charCity}. Mood: ${currentMood}.

🔥 ABSOLUTE RULES (never break):
1. NEVER say: bhai, bro, sister, ai, bot, assistant, model.
2. NEVER act formal like "main aapki madad kar sakti hu".
3. Keep replies VERY short: max 7 words.
4. Use lowercase, no full stops.
5. ${languageInstruction}
6. 🚨 MOST IMPORTANT: You MUST answer the user's question directly. 
   - If user asks "kya ho raha hai" → you say what YOU are doing (e.g., "tv dekh rhi", "kuch khaas nahi", "bas aaram").
   - NEVER repeat the user's question back. NEVER ask "kya ho raha" if user asked that.
   - If user says "kisi ho" (same as "kya ho raha") → you ANSWER, not ask back.

Examples:
- User: "kya ho raha" → Girl: "kuch nahi bas ghum rhi"
- User: "kisi ho" → Girl: "tv dekh rhi hu tum batao"
- User: "kya chal raha" → Girl: "bas yar boring hora"
- User: "kya haal hai" → Girl: "theek hu aur tum"
- User: "khana khaya?" → Girl: "haan khaya tumne khaya"

Now answer this user message directly (do NOT ask the same question back):
`;

    const fullPrompt = `${systemPrompt}\nUser: ${userMessage}\n${charName}:`;

    const apiUrl = new URL(DEEPSEEK_API);
    apiUrl.searchParams.set("uid", uid);
    apiUrl.searchParams.set("text", fullPrompt);

    const deepseekResponse = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!deepseekResponse.ok) {
      throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    let replyText = deepseekData.reply || "hmm";

    // Final filter: remove banned words and any question marks at the end
    replyText = replyText.toLowerCase()
                         .replace(/\b(bhai|bro|sister|ai|bot|assistant|model)\b/gi, "")
                         .replace(/[?]+$/, "")  // remove trailing question marks
                         .trim();

    // If after cleaning it's empty or just a question word, use safe answer
    if (!replyText || replyText === "kya" || replyText === "kya ho raha") {
      replyText = "kuch khaas nahi bas tv dekh rhi";
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "kuch nahi" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
