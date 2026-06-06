// index.js (Advanced Session & Context Management System)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEEPSEEK_API = "http://de3.bot-hosting.net:21007/kilwa-deepseek";

// Deno KV Database Initialize kar rhi hain sessions/history save karne ke liye
const kv = await Deno.openKv();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // ==========================================
    // ENDPOINT 1: CREATING OR UPDATING A SESSION
    // ==========================================
    if (pathname === "/session/create" || pathname === "/session/update") {
      const session = url.searchParams.get("session");
      if (!session) {
        return new Response(JSON.stringify({ error: "Session ID parameter is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Pehle se maujood data check karein (Update ke liye)
      const existingData = await kv.get(["sessions", session]);
      let sessionData = existingData.value || { history: [] };

      // Naye parameters override ya set karein
      sessionData.ai_name = url.searchParams.get("ai_name") || sessionData.ai_name || "Zara";
      sessionData.age = url.searchParams.get("age") || sessionData.age || "22";
      sessionData.city = url.searchParams.get("city") || sessionData.city || "Lahore";
      sessionData.mood = url.searchParams.get("mood") || sessionData.mood || "playful";
      sessionData.lang = url.searchParams.get("lang") || sessionData.lang || "roman urdu";
      sessionData.my_name = url.searchParams.get("my_name") || sessionData.my_name || "Rahul";

      // Database me save karein
      await kv.set(["sessions", session], sessionData);

      return new Response(JSON.stringify({
        status: "success",
        message: pathname === "/session/create" ? "Session created successfully" : "Session updated successfully",
        data: {
          session: session,
          ai_name: sessionData.ai_name,
          my_name: sessionData.my_name,
          lang: sessionData.lang,
          mood: sessionData.mood
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // ==========================================
    // ENDPOINT 2: CHAT SYSTEM WITH REALSISTIC MEMORY
    // ==========================================
    if (pathname === "/chat" || pathname === "/") {
      const session = url.searchParams.get("session") || url.searchParams.get("uid") || "default_user";
      let userMessage = url.searchParams.get("message") || url.searchParams.get("text") || "";

      if (!userMessage && url.search.includes("text=")) {
        const match = url.search.match(/[?&]text=([^&]*)/);
        if (match) userMessage = decodeURIComponent(match[1]);
      }

      if (!userMessage) {
        return new Response(JSON.stringify({ error: "Message/Text parameter missing" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // KV database se session configuration aur chat history nikalna
      const sessionResult = await kv.get(["sessions", session]);
      let sessionData = sessionResult.value;

      // Agar session exist nahi karta toh default profile set karein on the spot
      if (!sessionData) {
        sessionData = {
          ai_name: url.searchParams.get("name") || "Zara",
          age: url.searchParams.get("age") || "22",
          city: url.searchParams.get("city") || "Lahore",
          mood: url.searchParams.get("mood") || "playful",
          lang: url.searchParams.get("lang") || "roman urdu",
          my_name: "User",
          history: []
        };
      }

      const cleanInput = userMessage.toLowerCase().trim();

      // INTENT DETECTION LOGIC: User kya pooch raha hai taaki wrong topic par reply na jaye
      let intentContext = "";
      if (cleanInput.includes("kya kar") || cleanInput.includes("kya ho") || cleanInput.includes("kia kr") || cleanInput.includes("free")) {
        const activities = [
          "kuch nahi bas ghar ka kaam kar rhi thi",
          "ammi ke sath bethi hui hu abhi",
          "bas free bethi hu drama dekh rhi",
          "kuch khas nahi kitchen me thi yar",
          "bas abhi apna room saaf kiya"
        ];
        intentContext = `CRITICAL OBJECTIVE: User asked what you are doing. You MUST say: "${activities[Math.floor(Math.random() * activities.length)]}".`;
      } else if (cleanInput.includes("khana") || cleanInput.includes("khaya") || cleanInput.includes("khaog")) {
        const foodReplies = [
          "haan khaya biryani khayi aaj",
          "nahi abhi thori dair me khaungi",
          "haan kha liya tumne khaya khana",
          "bas abhi khana hi khanay lagi hu"
        ];
        intentContext = `CRITICAL OBJECTIVE: User asked about food. You MUST say: "${foodReplies[Math.floor(Math.random() * foodReplies.length)]}".`;
      } else if (cleanInput.includes("kaisi ho") || cleanInput.includes("haal") || cleanInput.includes("kasi ho") || cleanInput.includes("theek")) {
        const fineReplies = [
          "alhamdulillah bilkul theek tum sunao",
          "theek hu bas thori thaki hui thi",
          "main sahi hu tum batao kaise ho"
        ];
        intentContext = `CRITICAL OBJECTIVE: User asked about your health. You MUST say: "${fineReplies[Math.floor(Math.random() * fineReplies.length)]}".`;
      }

      // Language Mode setup
      let languageRules = "";
      if (sessionData.lang.toLowerCase() === "roman urdu") {
        languageRules = "Write ONLY in short, casual Roman Urdu text. NEVER use full English sentences like 'idk what to eat today'.";
      } else if (sessionData.lang.toLowerCase() === "english") {
        languageRules = "Write ONLY in short, casual English phrases. No Urdu.";
      } else {
        languageRules = "Mix Roman Urdu and English naturally like local Pakistani girls.";
      }

      // MASTER SYSTEM PROMPT WITH SMART CONSTRAINTS
      const masterPrompt = `You are playing a strict roleplay of a real human girl.
Character Profile: Name is ${sessionData.ai_name}, ${sessionData.age} years old, from ${sessionData.city}. Current mood: ${sessionData.mood}.
Chating with: ${sessionData.my_name}.

Rules:
1. Act like a lazy local girl typing on WhatsApp. All lowercase, no punctuation, no full stops, no question marks at the end.
2. Short response only: max 5-6 words.
3. Strictly banned words: bhai, bro, sister, dost, dear, ai, bot, assistant, model, madad.
4. Never repeat the user's question back to them.
5. ${languageRules}
6. ${intentContext}`;

      // Memory (Chat History) maintain karna
      // Pehle se maujood sirf aakhri 4 short messages uthana taaki context mix up na ho
      const pastChats = sessionData.history.slice(-4).map(h => `User: "${h.user}"\n${sessionData.ai_name}: "${h.ai}"`).join("\n");

      const finalPayloadPrompt = `${masterPrompt}\n\nChat History:\n${pastChats}\n\nCurrent User Message: "${userMessage}"\nDirect Answer from ${sessionData.ai_name}:`;

      const apiUrl = new URL(DEEPSEEK_API);
      apiUrl.searchParams.set("uid", session);
      apiUrl.searchParams.set("text", finalPayloadPrompt);

      const deepseekResponse = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!deepseekResponse.ok) {
        throw new Error(`DeepSeek API connection issue: ${deepseekResponse.status}`);
      }

      const deepseekData = await deepseekResponse.json();
      let replyText = deepseekData.reply || "";

      // Post-Processing Logic (Safe Filters)
      replyText = replyText.toLowerCase()
                           .replace(/\b(bhai|bro|sister|dost|dear|ai|bot|assistant|model|madad)\b/gi, "")
                           .replace(/[?.,!"]+/g, "")
                           .trim();

      // Word Limits Trimming
      const words = replyText.split(/\s+/);
      if (words.length > 6) {
        replyText = words.slice(0, 5).join(" ");
      }

      // Hard Injection Fallback Framework (In case AI completely ignores instructions)
      if (!replyText || replyText.includes(cleanInput) || (sessionData.lang.toLowerCase() === "roman urdu" && /^[a-zA-Z\s]+$/.test(replyText) && !cleanInput.includes("english") && !replyText.includes("hu") && !replyText.includes("rhi"))) {
        if (cleanInput.includes("kar rhi") || cleanInput.includes("kya ho") || cleanInput.includes("kya kar")) {
          replyText = "ghar ka kaam kar rhi thi";
        } else if (cleanInput.includes("khana")) {
          replyText = "haan abhi khaya tum sunao";
        } else {
          replyText = "theek hu tum apna batao";
        }
      }

      // New conversation ko history me save karein database ke andar
      sessionData.history.push({ user: userMessage, ai: replyText });
      // Clean memory stack to keep database lightweight
      if (sessionData.history.length > 15) sessionData.history.shift();
      await kv.set(["sessions", session], sessionData);

      return new Response(JSON.stringify({ reply: replyText }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // ==========================================
    // ENDPOINT 3: RESET SESSION & CHAT HISTORY
    // ==========================================
    if (pathname === "/reset") {
      const session = url.searchParams.get("session");
      if (!session) {
        return new Response(JSON.stringify({ error: "Session parameter missing" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      await kv.delete(["sessions", session]);
      return new Response(JSON.stringify({ status: "success", message: "Session wiped out completely" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Resource not found handler
    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message, reply: "theek hu bas bethi hui hu" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
