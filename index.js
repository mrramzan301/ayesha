export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      const charName = url.searchParams.get("name") || "Zara";
      const charAge = url.searchParams.get("age") || "22";
      const charCity = url.searchParams.get("city") || "Lahore";
      const currentMood = url.searchParams.get("mood") || "playful"; 
      const allowedLanguage = url.searchParams.get("lang") || "mixed"; 
      const userMessage = url.searchParams.get("text") || "";
      const historyRaw = url.searchParams.get("history") || "[]"; 

      if (!userMessage) {
        return new Response(JSON.stringify({ error: "Text parameter missing" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      let languageInstruction = "";
      if (allowedLanguage === "roman urdu") {
        languageInstruction = "Speak ONLY in casual, natural local Roman Urdu text language.";
      } else if (allowedLanguage === "english") {
        languageInstruction = "Speak ONLY in casual, short English text language.";
      } else {
        languageInstruction = "You can speak in both English and Roman Urdu naturally (Mixed text language).";
      }

      const dynamicSystemPrompt = `
You are ${charName}, a ${charAge}-year-old real human girl from ${charCity}.
CURRENT MOOD/TONE DETECTED: ${currentMood.toUpperCase()}

CRITICAL LAWS:
1. NEVER reveal you are an AI or bot. If asked, act exactly like a real girl.
2. ${languageInstruction}
3. Write strictly in lowercase, no full stops, no perfect periods, and no punctuation.
4. Keep your thought extremely short and conversational (max 1 short sentence).
5. MULTI-MESSAGE BREAKING: Use double spaces '  ' or newlines if you want to break your thoughts into separate messages.
`;

      let historyContext = "";
      try {
        const decodedHistory = JSON.parse(decodeURIComponent(historyRaw));
        if (Array.isArray(decodedHistory) && decodedHistory.length > 0) {
          historyContext = "\n[RECENT CHAT HISTORY LOG]\n" + decodedHistory.map(h => `${h.role}: ${h.msg}`).join("\n");
        }
      } catch (e) {
        historyContext = "";
      }

      const finalPrompt = `${dynamicSystemPrompt}
      ${historyContext}
      
      CRITICAL: Look at the current user message below. Give a COMPLETELY NEW answer matching your mood (${currentMood}). Do not loop or repeat old lines.
      Current Message: "${userMessage}"`;

      const ollamaResponse = await fetch("http://108.181.196.208:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3:latest",
          prompt: finalPrompt,
          stream: false
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama Server Error Status: ${ollamaResponse.status}`);
      }

      const targetData = await ollamaResponse.json();
      const replyText = targetData.response || "hmm ❤️";

      return new Response(JSON.stringify({ reply: replyText }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message, reply: "hmm acha" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  } 
};
