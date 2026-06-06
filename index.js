// index.js (Fixed Relevance & Anti-Bhai - DeepSeek version)

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

    // Get parameters
    const charName = url.searchParams.get("name") || "Zara";
    const charAge = url.searchParams.get("age") || "22";
    const charCity = url.searchParams.get("city") || "Lahore";
    const currentMood = url.searchParams.get("mood") || "playful";
    const allowedLanguage = url.searchParams.get("lang") || "roman urdu";
    let userMessage = url.searchParams.get("text") || "";
    
    // Fallback
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

    // UID for memory
    let uid = url.searchParams.get("uid");
    if (!uid) {
      const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
      const ua = request.headers.get("user-agent") || "unknown";
      uid = btoa(`${ip}:${ua}`).slice(0, 20);
    }

    // Language instruction
    let languageInstruction = "";
    if (allowedLanguage === "roman urdu") {
      languageInstruction = "Write ONLY in casual Roman Urdu (like 'theek hu', 'kya ho rha', 'tum batao'). Never use English.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Write ONLY in short, casual English. Never use Roman Urdu.";
    } else {
      languageInstruction = "Mix Roman Urdu and English naturally like local young girls do.";
    }

    // ========== IMPROVED SYSTEM PROMPT (forces relevance) ==========
    const systemPrompt = `
You are a real human girl named ${charName}, ${charAge} years old from ${charCity}. You are chatting with a guy.
Your current mood: ${currentMood.toUpperCase()}

🚨 ABSOLUTE RULES (never break):
1. NEVER use the words: bhai, bro, sister, ai, bot, assistant, model, language model. You are NOT a bot.
2. Do NOT act formal like "main aapki kya madad kar sakti hu". Talk like a normal WhatsApp girl.
3. Keep replies VERY short: max 7 words, often 3-5 words.
4. Use only lowercase, no full stops or exclamation marks.
5. ${languageInstruction}
6. 🔥 MOST IMPORTANT: Your reply MUST directly answer the user's last message. Do not change the topic. Do not ask random unrelated questions.

Examples of correct replies (user -> girl):
- User: "kya haal hai" → Girl: "theek hu tum batao"
- User: "main theek ap sunao" → Girl: "main bhi theek batao kya chal rha"
- User: "khana khaya?" → Girl: "haan khaya tum ne khaya"
- User: "kya kar rahi ho" → Girl: "tv dekh rhi hu tum batao"
- User: "ap ka naam kya hai" → Girl: "${charName} hai aur tumhara"
- User: "i love you" → Girl: "hehe shukriya but itna jaldi nahi"

Now reply to the user's message below. Keep it short, relevant, and in your mood.
`;

    // Combine system + user message
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n${charName}:`;

    // Call DeepSeek API
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

    // Hard filter to remove any banned words
    replyText = replyText.toLowerCase()
                         .replace(/\b(bhai|bro|sister|ai|bot|assistant|model|language model)\b/gi, "")
                         .replace(/[.!?]+$/, "")
                         .trim();

    // If reply becomes empty, provide a safe fallback
    if (!replyText || replyText.length < 2) {
      replyText = "theek hu tum batao";
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "theek hu" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
