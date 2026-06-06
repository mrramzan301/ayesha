// index.js (Advanced Context & Scenario Base AI Mode)

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

    const cleanInput = userMessage.toLowerCase().trim();

    // 🌟 ADVANCED SCENARIO DATABASE (For realistic & dynamic responses)
    const activities = [
      "kuch nahi bas ghar ka kaam kar rhi thi",
      "ammi ke sath bethi hui hu",
      "bas free bethi hu drama dekh rhi",
      "kuch khas nahi kitchen me thi",
      "bas abhi room saaf kiya yar",
      "kuch nahi bas leti hui hu mobile use kar rhi"
    ];

    const foodReplies = [
      "haan khaya biryani khayi aaj",
      "nahi abhi thori dair me khaungi",
      "haan kha liya tumne khaya",
      "bas abhi khana hi kha rhi hu"
    ];

    const fineReplies = [
      "alhamdulillah bilkul theek tum sunao",
      "theek hu bas thori thaki hui",
      "main sahi hu tum batao kaise ho"
    ];

    // 🌟 KEYWORD-BASED CONTEXT INJECTION (Yeh AI ko sahi rasta dikhayega)
    let extraContext = "";
    if (cleanInput.includes("kar rhi") || cleanInput.includes("kya kar") || cleanInput.includes("kya ho raha") || cleanInput.includes("kya chal")) {
      extraContext = `Context Note: User is asking what you are doing. You should answer like: "${activities[Math.floor(Math.random() * activities.length)]}".`;
    } else if (cleanInput.includes("khana") || cleanInput.includes("khaya")) {
      extraContext = `Context Note: User is asking about food. You should answer like: "${foodReplies[Math.floor(Math.random() * foodReplies.length)]}".`;
    } else if (cleanInput.includes("kaisi ho") || cleanInput.includes("haal") || cleanInput.includes("theek ap sunao") || cleanInput.includes("tum sunao")) {
      extraContext = `Context Note: User is asking about your well-being. You should answer like: "${fineReplies[Math.floor(Math.random() * fineReplies.length)]}".`;
    }

    let languageInstruction = "";
    if (allowedLanguage === "roman urdu") {
      languageInstruction = "Strictly reply only in casual Roman Urdu text. Do not use proper English.";
    } else if (allowedLanguage === "english") {
      languageInstruction = "Strictly reply only in short casual English.";
    } else {
      languageInstruction = "Mix Roman Urdu and English casually like local youngsters.";
    }

    // 🌟 MASTER SYSTEM PROMPT (Ultra Detailed & Long)
    const systemPrompt = `You are playing the role of a real local human girl.
Identity: Name is ${charName}, age is ${charAge}, living in ${charCity}. Current mood is ${currentMood}.

STRICT OBLIGATIONS:
1. You must act like a lazy, normal girl chatting on WhatsApp. Use all lowercase letters. Do not use full stops or exclamation marks.
2. Never repeat the user's question. Always answer the question directly based on your daily life activities (e.g., doing household chores, sitting with mom, watching TV, relaxing).
3. Keep the reply extremely short and precise (Maximum 4 to 6 words).
4. Strictly banned words (If you use them, you fail): bhai, bro, sister, dost, dear, ai, bot, assistant, model, madad, main aapki kya madad kar sakti hu.
5. Language Requirement: ${languageInstruction}

${extraContext}

Conversational Style Reference:
User: "kya kar rhi ho" -> ${charName}: "ghar ka kaam kar rhi thi"
User: "kya ho raha hai" -> ${charName}: "bas ammi ke sath bethi hu"
User: "khana khaya" -> ${charName}: "haan abhi khaya tum sunao"
User: "kya chal raha" -> ${charName}: "bas yar boring din hai"
User: "ma theek ap sunao" -> ${charName}: "main bhi sahi bas leti hui"`;

    // Strict Request-Response Structure
    const finalContext = `${systemPrompt}\n\nUser Message: "${userMessage}"\nDirect Short Answer from ${charName}:`;

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

    // 🌟 BACKEND CLEANING FILTERS
    replyText = replyText.toLowerCase()
                         .replace(/\b(bhai|bro|sister|dost|dear|ai|bot|assistant|model|madad)\b/gi, "")
                         .replace(/[?.,!]+$/, "") 
                         .trim();

    // Word Limit Enforcement (Strict cutting at 7 words max)
    const words = replyText.split(/\s+/);
    if (words.length > 7) {
      replyText = words.slice(0, 6).join(" ");
    }

    // 🌟 INTELLIGENT FALLBACK ROUTER (Agar AI bhatak jaye toh sahi jawab thop do)
    if (!replyText || replyText.includes(cleanInput) || replyText.length < 2) {
      if (cleanInput.includes("kar rhi") || cleanInput.includes("kya ho") || cleanInput.includes("kya kar")) {
        replyText = activities[Math.floor(Math.random() * activities.length)];
      } else if (cleanInput.includes("khana")) {
        replyText = foodReplies[Math.floor(Math.random() * foodReplies.length)];
      } else {
        replyText = fineReplies[Math.floor(Math.random() * fineReplies.length)];
      }
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "bas ghar ka kaam kar rhi thi" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
