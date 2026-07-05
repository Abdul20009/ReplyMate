const Groq = require("groq-sdk");
const Contact = require("../models/contact_model");
const SuggestionLog = require("../models/suggestion_log_model");
const User = require("../models/user_model");

let groq;
const getGroqClient = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

// ─── Helper: build the prompt sent to the model ────────────
const buildPrompt = (user, contact, messages) => {
  const userContextLines = [];
  if (user.profile.communicationStyle) {
    userContextLines.push(`How I naturally communicate: ${user.profile.communicationStyle}`);
  }
  if (user.profile.occupation) {
    userContextLines.push(`My occupation: ${user.profile.occupation}`);
  }
  const userContext = userContextLines.length
    ? userContextLines.join("\n")
    : "No extra context provided about the user.";

 const sharedInstructions = `Generate exactly 3 short reply options as a JSON array of strings, nothing else.
No preamble, no markdown, no explanation — just a raw JSON array like ["reply one", "reply two", "reply three"].
Keep each option SHORT and natural, like LinkedIn's quick-reply suggestions (a few words to one short sentence, not a paragraph) — the user should be able to tap one and send it as-is.
Detect the language and dialect used in the conversation (e.g. standard English, Nigerian Pidgin, etc.) and match it naturally. For example, if the contact writes in Pidgin ("how far", "wetin dey happen"), your suggestions should also be in Pidgin, not translated into formal English.
Match both the user's own communication style and the preferred tone. Don't use emojis unless the conversation already does.`;

  // No prior messages — this is a brand new conversation, suggest openers instead of replies
  if (!messages || messages.length === 0) {
    return `You are helping someone start a brand new ${contact.platform} conversation with ${contact.contactName}. There is no message history yet.

About the person you're helping (write as if you are them):
${userContext}

Context about the contact they're messaging: ${contact.profileNotes || "No extra context provided."}
Preferred tone: ${contact.tonePreference}

${sharedInstructions}`;
  }

  const conversationText = messages
    .map((m) => `${m.sender === "me" ? "Me" : contact.contactName}: ${m.text}`)
    .join("\n");

  return `You are helping someone draft a reply in a ${contact.platform} conversation with ${contact.contactName}.

About the person you're helping (write replies as if you are them):
${userContext}

Context about the contact they're replying to: ${contact.profileNotes || "No extra context provided."}
Preferred tone for this contact: ${contact.tonePreference}

Recent conversation:
${conversationText}

${sharedInstructions}`;
};

// @route   POST /api/suggest
// @desc    Generate AI reply suggestions for a conversation
// @access  Private
const getSuggestions = async (req, res) => {
  try {
    const { contactId, messages } = req.body;

    // 1. Validate input — messages can be an empty array (new conversation, no history yet)
    if (!contactId || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "contactId is required, and messages must be an array (can be empty for a new conversation)",
      });
    }

    // 2. Fetch user and contact, scoped to this user
    const user = await User.findById(req.user.id);
    const contact = await Contact.findOne({ _id: contactId, userId: req.user.id });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 3. Build prompt and call Groq
    const prompt = buildPrompt(user, contact, messages);

    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
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