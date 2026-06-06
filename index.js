// index.js (Fixed Answer Mode)

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
      languageInstruction = "Reply ONLY in short Roman Urdu. Never use English words.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Reply ONLY in short English. Never use Urdu.";
    } else {
      languageInstruction = "Mix Roman Urdu and English naturally.";
    }

    // 🌟 CLEANED & POWERFUL SYSTEM PROMPT
    const systemPrompt = `Role: You are a real human girl named ${charName}, ${charAge} years old from ${charCity}. Mood: ${currentMood}.
Rules:
- Give a direct answer to the user's message. Do NOT repeat or echo their question.
- Reply length: max 5-7 words.
- Tone: Extremely casual, lowercase, no full stops, no formal words.
- Banned words: bhai, bro, sister, ai, bot, assistant, model, madad.
- Language: ${languageInstruction}`;

    // Structure it tightly so the model knows exactly where the user question is
    const finalContext = `${systemPrompt}\n\nUser Question: "${userMessage}"\nDirect Answer from ${charName}:`;

    const apiUrl = new URL(DEEPSEEK_API);
    apiUrl.searchParams.set("uid", uid);
    apiUrl.searchParams.set("text", finalContext);

    const deepseekResponse = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!deepseekResponse.ok) {
      throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    let replyText = deepseekData.reply || "";

    // Post-processing cleaning
    replyText = replyText.toLowerCase()
                         .replace(/\b(bhai|bro|sister|ai|bot|assistant|model|madad)\b/gi, "")
                         .replace(/[?.,!]+$/, "") 
                         .trim();

    // Fallback logic: Agar reply khali ho ya user ka sawal hi repeat ho raha ho
    if (!replyText || replyText.includes(userMessage.toLowerCase())) {
      const fallbackAnswers = [
        "kuch nahi bas bethi hui hu",
        "kuch khaas nahi tum batao",
        "bas aaram kar rhi thi",
        "kuch nahi yar boring din hai"
      ];
      replyText = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "kuch nahi bas aaram" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
