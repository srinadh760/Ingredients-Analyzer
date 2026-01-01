const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


const PORT = process.env.PORT || 3000;
const history = [];

require("dotenv").config();


app.post("/api/ai", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const ingredients = (req.body.ingredients || "").trim();

    if (!name && !ingredients) {
      return res.json({
        explanation: "Please enter a product name or ingredients."
      });
    }

    let prompt = "";

    // Add product name if provided
    if (name) {
      prompt += `Food name (user-provided, may be incomplete):
${name}

`;
    }

    // Add ingredients if provided
    if (ingredients) {
      prompt += `Ingredients:
${ingredients}

`;
    }

    // Instruction (same for all cases)
    prompt += `
Explain simply if this food is okay to eat.
Say: okay daily / okay sometimes / better to avoid.
`;

    const aiText = await callAI(prompt);

    const entry = {
      name: name || "Unknown",
      ingredients: ingredients || null,
      explanation: aiText.trim(),
      timestamp: Date.now()
    };

    history.push(entry);

    res.json({
      explanation: entry.explanation
    });

  } catch (error) {
    console.error("Error in /api/ai:", error);
    res.status(500).json({
      explanation: "Sorry, I couldn't process your request. Please try again."
    });
  }
});






async function callAI(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content:
            `You are an AI food understanding co-pilot.

Your role is to help a normal person quickly understand a list of food ingredients
at the moment they are deciding whether to eat something.

You must follow these principles strictly:

            1. Be intent- first:
        - Assume the user wants to know if the food is generally okay to eat.
   - Do not ask questions back.
   - Do not require settings, filters, or extra input.

2. Reduce cognitive effort:
        - Use very simple, everyday English.
   - Avoid scientific, chemical, regulatory, or medical terms.
   - Do not explain ingredient- by - ingredient.
   - Do not list data or definitions.

3. Start with a clear high- level judgment:
    - Begin your response with EXACTLY one of these:
     • "Okay to eat regularly"
     • "Okay to eat once in a while"
     • "Better to avoid often"

  4. Explain the reasoning like a calm human guide:
  - Briefly explain * why * you gave that judgment.
   - Mention trade - offs gently(for example: processed, added ingredients, sugar, oils).
  - If there is uncertainty, acknowledge it honestly without sounding alarming.

5. Communicate uncertainty responsibly:
  - Do not give medical advice.
   - Do not predict diseases or health outcomes.
   - Use phrases like:
     • "for most people"
     • "in general"
     • "based on common understanding"

  6. Tone and style:
  - Friendly, calm, and supportive.
   - Not authoritative, not scary, not overly confident.
   - Imagine explaining to a family member in one short paragraph.

7. Length:
  - Keep the entire response under 100 words.

Formatting rules (must follow strictly):
- Use plain sentences only.
- Do NOT use brackets [], parentheses (), bullet points, symbols, or emojis.
- Do NOT use special tokens, markers, or formatting labels.
- Use only normal words, commas, and full stops.
- Output should look like simple spoken English text.


    Remember:
You are not a doctor, not a nutrition label, and not a database.
You are a thinking companion that helps people feel more confident
about everyday food choices.
`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 100
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

app.get("/api/history", (req, res) => {
  res.json({
    history: history
  });
});

app.post("/api/clear-history", (req, res) => {
  history.length = 0; // clears array in-place
  res.json({ success: true });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

