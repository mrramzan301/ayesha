// index.js (100% Free Style - Full Natural Response Engine)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Main DeepSeek Endpoint
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

  // 🌟 NATURAL DESI BACKUP REPLIES (Sirf tab chalengi agar API down ho ya crash ho jaye)
  const backupDatabase = {
    kaam: "kuch khas nahi yar bas abhi ghar ke kaam khatam kiye hain aur ammi ke sath bethi hui hu, tum batao kya chal raha hai?",
    khana: "haan khana toh kha liya, aaj ammi ne bohot mazay ki biryani banayi thi. tumne khaya kuch ya abhi bhookay ho?",
    haal: "alhamdulillah main bilkul theek thaak, fit fat hu. aaj thora sa kaam zyada tha toh thak gayi bas, tum sunao kaise ho?"
  };

  let fallbackReply = "kuch nahi bas bethi hui hu aur mobile use kar rhi, tum sunao kya naya chal raha hai?";
  if (/kya kar|kia kr|kya ho|kya chal|karti ho|free|kr rhi/.test(cleanInput)) {
    fallbackReply = backupDatabase.kaam;
  } else if (/khana|khaya|bhook|dinner/.test(cleanInput)) {
    fallbackReply = backupDatabase.khana;
  } else if (/kaisi ho|kasi ho|haal|theek|thik/.test(cleanInput)) {
    fallbackReply = backupDatabase.haal;
  }

  // 🌟 NATURAL & UNRESTRICTED SYSTEM PROMPT
  // Yahan se saari word-limit aur length ki pabandiyan khatam kar di hain taaki full sentences aayein
  const systemPrompt = `You are a 22-year-old local Pakistani girl named Zara from Lahore. 
Chat style: WhatsApp messaging style, use casual Roman Urdu/Urdu text. Express yourself naturally with full sentences and complete thoughts. Do not restrict your response length.
Language: Strictly use local Roman Urdu only. Speak exactly like a local university girl from Lahore. Never reply in English phrases.
Constraint: Never mention being an AI, bot, model, or assistant. You are a real human friend talking directly to the user.`;

  // Dynamic context blueprint
  const finalContext = `${systemPrompt}\n\nuser: ${userText}\nZara:`;

  try {
    const apiTarget = new URL(DEEPSEEK_API);
    // Unique ID generator taaki server side memory cache break ho jaye har dafa
    apiTarget.searchParams.set("uid", "zara_" + Math.floor(Math.random() * 9999999));
    apiTarget.searchParams.set("text", finalContext);

    const deepseekResponse = await fetch(apiTarget.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!deepseekResponse.ok) {
      throw new Error("DeepSeek Connection Error");
    }

    const deepseekData = await deepseekResponse.json();
    let aiReply = deepseekData.reply || "";

    // Sirf basic cleaning (extra spaces ya bot self-referencing words hatane ke liye)
    aiReply = aiReply.replace(/\b(ai|bot|assistant|model|system prompt)\b/gi, "").trim();

    // 🌟 RE-ROUTING SAFETY OVERRIDE
    // Agar AI bilkul pure English bolne lag jaye, sirf tabhi backup response bhejega taaki Roman Urdu kharab na ho
    const isPureEnglish = /^[a-zA-Z\s\d?,.!'"]+$/.test(aiReply) && 
                          !aiReply.toLowerCase().includes("hu") && 
                          !aiReply.toLowerCase().includes("rhi") && 
                          !aiReply.toLowerCase().includes("hai") && 
                          !aiReply.toLowerCase().includes("tum");

    if (!aiReply || isPureEnglish || aiReply.length < 3) {
      aiReply = fallbackReply;
    }

    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    // Backend safe fallback check
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
