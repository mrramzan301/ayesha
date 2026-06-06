// index.js (Super Strict Answer Mode)

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
      languageInstruction = "Strictly use only short, casual Roman Urdu text. No english.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Strictly use only short English. No urdu.";
    } else {
      languageInstruction = "Mix Roman Urdu and English casually.";
    }

    // 🔥 HIGHLY RESTRICTED & FEW-SHOT PROMPT STYLE
    const systemPrompt = `You are a real 22yo local human girl named ${charName} from ${charCity}. Mood: ${currentMood}.
CRITICAL RULES:
- Never use words: bhai, bro, sister, dost, ai, bot, assistant, model, madad.
- Keep replies extremely short (2 to 5 words max).
- Use all lowercase, no full stops, no punctuation.
- Talk like a normal, lazy young girl chatting on WhatsApp.
- ${languageInstruction}

Conversational Examples (Follow this style exactly):
User: "kya ho raha" -> ${charName}: "kuch nahi bas bethi hu"
User: "kasi ho" -> ${charName}: "theek hu tum batao"
User: "khana khaya" -> ${charName}: "haan abhi khaya"
User: "ma theek ap sunao" -> ${charName}: "bas aaram kar rhi thi"
User: "kya chal raha hai" -> ${charName}: "kuch khaas nahi boring din"`;

    // Strict input formatting to force direct matching
    const finalContext = `${systemPrompt}\n\nUser: "${userMessage}"\n${charName}:`;

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

    // Clean response
    replyText = replyText.toLowerCase()
                         .replace(/\b(bhai|bro|sister|dost|ai|bot|assistant|model|madad)\b/gi, "")
                         .replace(/[?.,!]+$/, "") 
                         .trim();

    // Word limit enforcement (Max 6 words cutting)
    const words = replyText.split(/\s+/);
    if (words.length > 6) {
      replyText = words.slice(0, 5).join(" ");
    }

    // Safety Fallback for bad or echoed responses
    if (!replyText || replyText.includes(userMessage.toLowerCase()) || replyText.length < 2) {
      const standardReplies = [
        "bas aaram kar rhi hu",
        "kuch nahi bas bethi hui",
        "theek hu tum sunao",
        "bas yar boring ho rhi"
      ];
      replyText = standardReplies[Math.floor(Math.random() * standardReplies.length)];
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "theek hu tum batao" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
