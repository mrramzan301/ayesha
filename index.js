// index.js (Strict Girl Character Override Engine)

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

  const url = new URL(request.url);
  let userText = url.searchParams.get("text") || url.searchParams.get("message") || "";
  
  if (!userText) {
    return new Response(JSON.stringify({ error: "Kuch likho to sahi yar!" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  const cleanInput = userText.toLowerCase().trim();

  // 🌟 PERFECT PAKISTANI GIRL REPLIES DATABASE (Bypass System)
  const girlDatabase = {
    kaam: "kuch khas nahi yar bas abhi ghar ke kaam khatam kiye hain aur ammi ke sath bethi hui hu, tum batao kya chal raha hai?",
    khana: "haan khana toh kha liya, aaj ammi ne bohot mazay ki biryani banayi thi. tumne khaya kuch ya abhi bhookay ho?",
    haal: "alhamdulillah main bilkul theek thaak, fit fat hu. aaj thora sa kaam zyada tha toh thak gayi bas, tum sunao kaise ho?",
    naam: "mera naam zara hai, abhi toh bataya tha! wese tumhara naam kya hai?",
    default: "kuch nahi bas bethi hui hu aur mobile use kar rhi, tum sunao kya naya chal raha hai?"
  };

  // Live matching for safe fallback
  let fallbackReply = girlDatabase.default;
  if (/kya kar|kia kr|kya ho|kya chal|karti ho|free|kr rhi/.test(cleanInput)) {
    fallbackReply = girlDatabase.kaam;
  } else if (/khana|khaya|bhook|dinner/.test(cleanInput)) {
    fallbackReply = girlDatabase.khana;
  } else if (/kaisi ho|kasi ho|haal|theek|thik|kaise ho/.test(cleanInput)) {
    fallbackReply = girlDatabase.haal;
  } else if (/name|naam/.test(cleanInput)) {
    fallbackReply = girlDatabase.naam;
  }

  // Strict Prompt to push DeepSeek into character
  const systemPrompt = `You are a 22-year-old local Pakistani girl named Zara from Lahore. 
Style: WhatsApp messaging style, use casual Roman Urdu/Urdu text. Reply naturally in full sentences.
Language: Strictly use local Roman Urdu only. Speak like a local girl. Never use words like 'bhai', 'beta', 'bro', 'dost', 'assistant', or 'bot'.
Gender Rule: You are female. Use 'sakti hu', 'rhi hu', 'ho gayi'. Never use male verbs like 'sakta ho', 'bata sakta'.`;

  const finalContext = `${systemPrompt}\n\nuser: ${userText}\nZara:`;

  try {
    const apiTarget = new URL(DEEPSEEK_API);
    apiTarget.searchParams.set("uid", "zara_" + Math.floor(Math.random() * 9999999));
    apiTarget.searchParams.set("text", finalContext);

    const deepseekResponse = await fetch(apiTarget.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!deepseekResponse.ok) throw new Error("API Down");

    const deepseekData = await deepseekResponse.json();
    let aiReply = deepseekData.reply || "";

    // 🌟 STAGE 2: THE REAL FIX (Anti-Beta & Anti-Male Word Filter)
    let aiReplyLower = aiReply.toLowerCase();
    
    // Agar AI ne 'beta' bola, ya larko wali zabaan 'sakta' use ki, ya English boli
    const hasMaleWords = /\b(beta|bhai|bro|dost|sakta|bata sakta|ho gaya)\b/i.test(aiReplyLower);
    const isPureEnglish = /^[a-zA-Z\s\d?,.!'"]+$/.test(aiReply) && 
                          !aiReplyLower.includes("hu") && 
                          !aiReplyLower.includes("rhi") && 
                          !aiReplyLower.includes("hai") && 
                          !aiReplyLower.includes("tum");

    if (!aiReply || hasMaleWords || isPureEnglish || aiReply.length < 3) {
      // DeepSeek ka ghalat response hijack karke apna perfect reply bhej do
      aiReply = fallbackReply;
    }

    // Clean up basic tags if any
    aiReply = aiReply.replace(/\b(ai|bot|assistant|model)\b/gi, "").trim();

    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
