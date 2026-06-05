// index.js (Deno Deploy Engine - Enhanced Anti-AI & Anti-Bhai Logic)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    const userMessage = url.searchParams.get("text") || "";
    const historyRaw = url.searchParams.get("history") || "[]"; 

    let finalMessage = userMessage;
    if (!finalMessage && url.search.includes("text=")) {
      const match = url.search.match(/[?&]text=([^&]*)/);
      if (match) finalMessage = decodeURIComponent(match[1]);
    }

    if (!finalMessage) {
      return new Response(JSON.stringify({ error: "Text parameter missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Strict Language Mode
    let languageInstruction = "";
    if (allowedLanguage === "roman urdu") {
      languageInstruction = "Write ONLY in natural, casual Roman Urdu (text language like 'theek hu' or 'kya ho rha').";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Write ONLY in short, casual English text messaging style.";
    } else {
      languageInstruction = "Mix Roman Urdu and English naturally like local young girls do.";
    }

    // 🚨 ULTRA STRICT SYSTEM PROMPT ENGINE
    const dynamicSystemPrompt = `
You are a real human girl named ${charName}, ${charAge} years old from ${charCity}. You are talking to a guy.
YOUR CURRENT MOOD: ${currentMood.toUpperCase()}

CRITICAL RULES (NEVER BREAK THESE):
1. NEVER use the words "bhai", "bro", "sister", "ai", "bot", "assistant", "model", or "language model". You are NOT a bot.
2. Do not act like a formal AI assistant. Do not say "main aapki kya madad kar sakti hu". Speak like a normal young girl chating on WhatsApp.
3. Keep your replies extremely short, natural, and conversational (Maximum 1 short line, 3 to 7 words only).
4. Write strictly in lowercase. Do not use full stops '.', exclamation marks '!', or proper punctuation. Keep it clean text.
5. ${languageInstruction}

Example if user says "kya haal hai":
Correct Response: "theek hu aap batao" OR "bas sahi chal rha" OR "main theek tum batao"
`;

    let historyContext = "";
    try {
      const decodedHistory = JSON.parse(decodeURIComponent(historyRaw));
      if (Array.isArray(decodedHistory) && decodedHistory.length > 0) {
        historyContext = "\n[RECENT CHAT LOG]\n" + decodedHistory.map(h => `${h.role}: ${h.msg}`).join("\n");
      }
    } catch (e) {
      historyContext = "";
    }

    const finalPrompt = `${dynamicSystemPrompt}
    ${historyContext}
    
    User Message: "${finalMessage}"
    Give your direct, short, realistic girl reply matching your mood now:`;

    // Fetch Call to Ollama
    const ollamaResponse = await fetch("http://108.181.196.208:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt: finalPrompt,
        stream: false,
        options: {
          temperature: 0.8, // Responses ko mazeed natural aur dynamic banane ke liye
          top_p: 0.9
        }
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama Server Error Status: ${ollamaResponse.status}`);
    }

    const targetData = await ollamaResponse.json();
    let replyText = targetData.response || "hmm ❤️";

    // Double Filter (Safety net to remove "bhai" or "bot" if AI tries to sneak it in)
    replyText = replyText.toLowerCase()
                         .replace(/\bbhai\b/g, "")
                         .replace(/\bbro\b/g, "")
                         .replace(/\bbot\b/g, "")
                         .replace(/\./g, "")
                         .trim();

    if (!replyText) replyText = "theek hu tum batao";

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, reply: "theek hu" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
