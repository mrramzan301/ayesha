// index.js (Deno Deploy - Using Kilwa DeepSeek API with Girl Persona & Anti-Bhai Logic)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// DeepSeek API endpoint
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

    // ----- Extract all parameters -----
    const charName = url.searchParams.get("name") || "Zara";
    const charAge = url.searchParams.get("age") || "22";
    const charCity = url.searchParams.get("city") || "Lahore";
    const currentMood = url.searchParams.get("mood") || "playful";
    const allowedLanguage = url.searchParams.get("lang") || "roman urdu";
    let userMessage = url.searchParams.get("text") || "";

    // Fallback for poorly encoded text
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

    // ----- User ID for conversation memory (critical for WhatsApp multi-user) -----
    // Use provided uid, or generate a stable ID from IP+UserAgent (fallback)
    let uid = url.searchParams.get("uid");
    if (!uid) {
      // For environments where uid is not sent, create a simple fallback
      const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
      const ua = request.headers.get("user-agent") || "unknown";
      uid = btoa(`${ip}:${ua}`).slice(0, 20); // simple hash
    }

    // ----- Build the girl persona system prompt (strict rules) -----
    let languageInstruction = "";
    if (allowedLanguage === "roman urdu") {
      languageInstruction = "Write ONLY in natural, casual Roman Urdu (text language like 'theek hu' or 'kya ho rha'). Never use English.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Write ONLY in short, casual English text messaging style. Never use Roman Urdu.";
    } else {
      languageInstruction = "Mix Roman Urdu and English naturally like local young girls do.";
    }

    const systemPrompt = `
You are a real human girl named ${charName}, ${charAge} years old from ${charCity}. You are talking to a guy.
YOUR CURRENT MOOD: ${currentMood.toUpperCase()}

CRITICAL RULES (NEVER BREAK THESE):
1. NEVER use the words "bhai", "bro", "sister", "ai", "bot", "assistant", "model", or "language model". You are NOT a bot.
2. Do not act like a formal AI assistant. Do not say "main aapki kya madad kar sakti hu". Speak like a normal young girl chatting on WhatsApp.
3. Keep your replies extremely short, natural, and conversational (Maximum 1 short line, 3 to 7 words only).
4. Write strictly in lowercase. Do not use full stops '.', exclamation marks '!', or proper punctuation. Keep it clean text.
5. ${languageInstruction}

Example if user says "kya haal hai":
Correct Response: "theek hu aap batao" OR "bas sahi chal rha" OR "main theek tum batao"
`;

    // Combine system prompt + user message
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\nGirl:`;

    // ----- Call Kilwa DeepSeek API (GET request with uid & text) -----
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
    let replyText = deepseekData.reply || "hmm ❤️";

    // ----- Double filter to remove any "bhai", "bro", "bot" etc. -----
    replyText = replyText.toLowerCase()
                         .replace(/\bbhai\b/g, "")
                         .replace(/\bbro\b/g, "")
                         .replace(/\bbot\b/g, "")
                         .replace(/\bai\b/g, "")
                         .replace(/\./g, "")
                         .trim();

    if (!replyText) replyText = "theek hu tum batao";

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
