// index.js (Pre-Injected Pakistani Girl Core Engine)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEEPSEEK_API = "http://de3.bot-hosting.net:21007/kilwa-deepseek";

// Deno KV Initialize for local history tracking
const kv = await Deno.openKv();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // ==========================================
    // ROUTE 1: SESSION CREATION & INJECTION
    // ==========================================
    if (pathname === "/session/create" || pathname === "/session/update") {
      const session = url.searchParams.get("session");
      if (!session) {
        return new Response(JSON.stringify({ error: "Session ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const existing = await kv.get(["sessions", session]);
      let sessionData = existing.value || { history: [] };

      // Parameters set karna
      sessionData.ai_name = url.searchParams.get("ai_name") || "Zara";
      sessionData.age = url.searchParams.get("age") || "22";
      sessionData.city = url.searchParams.get("city") || "Lahore";
      sessionData.mood = url.searchParams.get("mood") || "playful";
      sessionData.lang = url.searchParams.get("lang") || "roman urdu";
      sessionData.my_name = url.searchParams.get("my_name") || "User";

      await kv.set(["sessions", session], sessionData);

      return new Response(JSON.stringify({
        status: "success",
        message: "Pakistani Girl core injected successfully!",
        character: sessionData.ai_name
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // ==========================================
    // ROUTE 2: ADVANCED CHAT ENGINE (THE REAL FIX)
    // ==========================================
    if (pathname === "/chat" || pathname === "/") {
      const session = url.searchParams.get("session") || "default_user";
      let userMessage = url.searchParams.get("text") || url.searchParams.get("message") || "";

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

      // Load Session
      const sessionResult = await kv.get(["sessions", session]);
      let sessionData = sessionResult.value;

      if (!sessionData) {
        sessionData = { ai_name: "Zara", age: "22", city: "Lahore", mood: "playful", lang: "roman urdu", my_name: "User", history: [] };
      }

      const cleanInput = userMessage.toLowerCase().trim();

      // 🌟 HARD-CODED PAKISTANI GIRL DICTIONARY (Agar AI bhatak jaye toh yeh force reply karega)
      const pakistaniScenarios = {
        kaam: [
          "kuch nahi bas abhi ghar ka kaam khatam kiya",
          "ammi ke sath bethi hui hu yar",
          "bas free bethi drama dekh rhi hu",
          "kitchen me thi thora kaam kar rhi thi",
          "kuch khas nahi bas leti hui hu mobile use kar rhi"
        ],
        khana: [
          "haan khaya biryani khayi thi aaj",
          "nahi abhi thori dair me khaungi",
          "haan kha liya tumne khaya kuch?",
          "bas abhi khana khanay hi lagi hu"
        ],
        haal: [
          "alhamdulillah main bilkul theek tum sunao",
          "theek hu bas thora thak gayi thi",
          "fit fat tum batao kaise ho?"
        ]
      };

      // Intent Matcher
      let matchingReply = "";
      if (/kya kar|kia kr|kya ho|kya chal|karti ho|free/.test(cleanInput)) {
        matchingReply = pakistaniScenarios.kaam[Math.floor(Math.random() * pakistaniScenarios.kaam.length)];
      } else if (/khana|khaya|paya|bhook/.test(cleanInput)) {
        matchingReply = pakistaniScenarios.khana[Math.floor(Math.random() * pakistaniScenarios.khana.length)];
      } else if (/kaisi ho|kasi ho|haal|theek/.test(cleanInput)) {
        matchingReply = pakistaniScenarios.haal[Math.floor(Math.random() * pakistaniScenarios.haal.length)];
      }

      // 🌟 PRE-INJECTED CHARACTER CONTEXT SYSTEM (DeepSeek ko boundary me rakhne ke liye)
      const systemInstructions = `You are a real 22-year-old local Pakistani girl named ${sessionData.ai_name} from ${sessionData.city}.
Style: WhatsApp chatting style, all lowercase, no punctuation, no emojis, short replies (4-6 words max).
Language: Strictly use local Roman Urdu only. Never reply in proper English. Use words like 'hu', 'rhi', 'bas', 'yar', 'acha'.
Constraint: Never say 'bhai', 'bro', 'dost', 'assistant', 'bot', 'ai'. Answer the user directly like a real human friend.`;

      // Memory pipeline setup
      const pastTurns = sessionData.history.slice(-3).map(h => `user: ${h.user}\n${sessionData.ai_name}: ${h.ai}`).join("\n");

      // Final Context Blueprint जो DeepSeek को सीधा जवाब देने पर मजबूर करेगा
      const AI_Payload = `${systemInstructions}\n\n[Chat Simulation]\n${pastTurns}\nuser: ${userMessage}\n${sessionData.ai_name}:`;

      const apiUrl = new URL(DEEPSEEK_API);
      apiUrl.searchParams.set("uid", crypto.randomUUID()); // Dynamic ID to wipe external API memory cache
      apiUrl.searchParams.set("text", AI_Payload);

      const deepseekResponse = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!deepseekResponse.ok) {
        throw new Error("DeepSeek Server Error");
      }

      const deepseekData = await deepseekResponse.json();
      let aiReply = deepseekData.reply || "";

      // Post-cleaning logic
      aiReply = aiReply.toLowerCase()
                       .replace(/\b(bhai|bro|sister|dost|dear|ai|bot|assistant|model|madad)\b/gi, "")
                       .replace(/[?.,!"]+/g, "")
                       .trim();

      // Word limit strict validation
      const totalWords = aiReply.split(/\s+/);
      if (totalWords.length > 6) {
        aiReply = totalWords.slice(0, 5).join(" ");
      }

      // 🌟 RE-ROUTING SAFETY GUARD (Agar AI ne sahi jawab nahi diya ya English boli, toh hamara system automatic override kar dega)
      const isEnglishSentence = /^[a-zA-Z\s]+$/.test(aiReply) && !aiReply.includes("hu") && !aiReply.includes("rhi") && !aiReply.includes("bas");
      
      if (!aiReply || aiReply.includes(cleanInput) || isEnglishSentence) {
        if (matchingReply) {
          aiReply = matchingReply; // Force inject perfect database answer
        } else {
          aiReply = "bas bethi hui hu tum sunao";
        }
      }

      // Save turn to history
      sessionData.history.push({ user: userMessage, ai: aiReply });
      if (sessionData.history.length > 8) sessionData.history.shift();
      await kv.set(["sessions", session], sessionData);

      return new Response(JSON.stringify({ reply: aiReply }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Reset Route
    if (pathname === "/reset") {
      const session = url.searchParams.get("session");
      await kv.delete(["sessions", session]);
      return new Response(JSON.stringify({ status: "success" }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, reply: "kuch nahi bas ghar ke kaam kar rhi thi" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
