// index.js (DeepSeek Integrated - Pakistani Girl Core Engine)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Asli DeepSeek Endpoint
const DEEPSEEK_API = "http://de3.bot-hosting.net:21007/kilwa-deepseek";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  let userText = url.searchParams.get("text") || url.searchParams.get("message") || "";
  
  if (!userText) {
    return new Response(JSON.stringify({ error: "Kuch likho to sahi yar!" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  const cleanInput = userText.toLowerCase().trim();

  // 🌟 HARD-CODED DESI OVERRIDE SYSTEM (Agar DeepSeek bhatak jaye toh yeh force reply karega)
  const girlDatabase = {
    kaam: ["bas leti hui hu mobile use kar rhi", "kuch nahi bas abhi ghar ka kaam khatam kiya", "ammi ke sath bethi hui hu abhi", "bas free bethi drama dekh rhi hu", "kitchen me thi thora kaam kar rhi thi"],
    khana: ["haan khaya biryani khayi thi aaj", "nahi abhi thori dair me khaungi yar", "haan kha liya tumne khaya kuch?", "bas abhi khana khanay hi lagi hu"],
    haal: ["alhamdulillah main bilkul theek tum sunao", "theek hu bas thora thak gayi thi aaj", "fit fat tum batao kaise ho?"]
  };

  let fallbackReply = "kuch nahi bas bethi hui hu tum sunao";
  if (/kya kar|kia kr|kya ho|kya chal|karti ho|free|kr rhi/.test(cleanInput)) {
    fallbackReply = girlDatabase.kaam[Math.floor(Math.random() * girlDatabase.kaam.length)];
  } else if (/khana|khaya|bhook|dinner/.test(cleanInput)) {
    fallbackReply = girlDatabase.khana[Math.floor(Math.random() * girlDatabase.khana.length)];
  } else if (/kaisi ho|kasi ho|haal|theek|thik/.test(cleanInput)) {
    fallbackReply = girlDatabase.haal[Math.floor(Math.random() * girlDatabase.haal.length)];
  }

  // 🌟 STRICT PROMPT FOR DEEPSEEK
  const systemPrompt = `You are playing a strict roleplay of a 22-year-old local Pakistani human girl named Zara from Lahore.
Style: WhatsApp chatting style, always use all lowercase, no punctuation, no full stops, no emojis, short replies (4-6 words max).
Language: Strictly use local Roman Urdu only. Never reply in English phrases. Use words like 'hu', 'rhi', 'bas', 'yar', 'acha', 'tum'.
Constraint: Never say 'bhai', 'bro', 'dost', 'assistant', 'bot', 'ai'. Answer the user directly like a real human friend.`;

  // Final Blueprint payload for DeepSeek
  const finalContext = `${systemPrompt}\n\nuser: ${userText}\nZara:`;

  try {
    // ➔ LIVE DEEPSEEK API CALL
    const apiTarget = new URL(DEEPSEEK_API);
    apiTarget.searchParams.set("uid", "rand_" + Math.floor(Math.random() * 999999)); // Cache break karne ke liye
    apiTarget.searchParams.set("text", finalContext);

    const deepseekResponse = await fetch(apiTarget.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!deepseekResponse.ok) {
      throw new Error("DeepSeek Server Down");
    }

    const deepseekData = await deepseekResponse.json();
    let aiReply = deepseekData.reply || "";

    // Cleaning the response
    aiReply = aiReply.toLowerCase()
                     .replace(/\b(bhai|bro|sister|dost|ai|bot|assistant|model)\b/gi, "")
                     .replace(/[?.,!"]+/g, "")
                     .trim();

    // 🌟 ENGLISH DETECTOR & OVERRIDE 
    // Agar DeepSeek ne phir bhi proper English boli (jaise hey what's up), toh hum apna desi database inject kar denge
    const isEnglishSentence = /^[a-zA-Z\s]+$/.test(aiReply) && !aiReply.includes("hu") && !aiReply.includes("rhi") && !aiReply.includes("bas") && !aiReply.includes("tum");

    if (!aiReply || isEnglishSentence || aiReply.length < 2) {
      aiReply = fallbackReply; // Force pure Roman Urdu
    }

    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    // Agar DeepSeek ka server response na de, toh fallback reply foran chalegi (User ko crash nahi dikhega)
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
