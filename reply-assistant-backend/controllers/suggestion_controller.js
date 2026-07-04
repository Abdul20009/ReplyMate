const Groq = require("groq-sdk");
const Contact = require("../models/contact_model");
const SuggestionLog = require("../models/suggestion_log_model");

// lazy singleton — only created the first time it's actually needed,
// by which point dotenv.config() has definitely already run
let groq;
const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

// ─── Helper: build the prompt sent to the model ────────────
const buildPrompt = (contact, messages) => {
  const conversationText = messages
    .map((m) => `${m.sender === "me" ? "Me" : contact.contactName}: ${m.text}`)
    .join("\n");

  return `You are helping someone draft a reply in a ${contact.platform} conversation with ${contact.contactName}.

Context about this contact: ${contact.profileNotes || "No extra context provided."}
Preferred tone: ${contact.tonePreference}

Recent conversation:
${conversationText}

Generate exactly 3 short, natural reply options as a JSON array of strings, nothing else.
No preamble, no markdown, no explanation — just a raw JSON array like ["reply one", "reply two", "reply three"].
Keep replies natural and human, matching the preferred tone. Don't use emojis unless the conversation already does.`;
};

// @route   POST /api/suggest
// @desc    Generate AI reply suggestions for a conversation
// @access  Private
const getSuggestions = async (req, res) => {
  try {
    const { contactId, messages } = req.body;

    // 1. Validate input
    if (!contactId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "contactId and a non-empty messages array are required",
      });
    }

    // 2. Fetch contact, scoped to this user
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.user.id,
    });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 3. Build prompt and call Groq
    const prompt = buildPrompt(contact, messages);

    const completion = await getGroqClient().chat.completions.create({
      model: "meta-llama/llama-prompt-guard-2-86m",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const rawText = completion.choices[0]?.message?.content?.trim() || "";

    // 4. Parse the model's response into an array of suggestions
    let suggestions;
    try {
      const cleaned = rawText.replace(/^```json|```$/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", rawText);
      return res.status(502).json({
        success: false,
        message: "AI response could not be parsed, try again",
      });
    }

    // 5. Log usage (no message content stored, just that a request happened)
    await SuggestionLog.create({
      userId: req.user.id,
      contactId: contact._id,
      platform: contact.platform,
    });

    // 6. Send response
    return res.status(200).json({
      success: true,
      message: "Suggestions generated successfully",
      data: { suggestions },
    });
  } catch (error) {
    console.error("Get suggestions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getSuggestions };
