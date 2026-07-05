const API_BASE = "http://localhost:5000/api";

let currentContactId = null;
let currentContactName = null;

const getToken = async () => {
  const stored = await chrome.storage.local.get(["token"]);
  return stored.token;
};

const getActiveChatName = () => {
  const titleEl = document.querySelector(
    'span[data-testid="conversation-info-header-chat-title"]'
  );
  return titleEl ? titleEl.innerText.trim() : null;
};

const getRecentMessages = (limit = 10) => {
  const messageRows = document.querySelectorAll("div.message-in, div.message-out");
  const recent = Array.from(messageRows).slice(-limit);

  return recent
    .map((row) => {
      const isOutgoing = row.classList.contains("message-out");
      const textEl = row.querySelector("span.selectable-text");
      const text = textEl ? textEl.innerText.trim() : null;

      if (!text) return null;

      return {
        sender: isOutgoing ? "me" : "them",
        text,
      };
    })
    .filter(Boolean);
};

const ensureContact = async (contactName) => {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (data.success) {
    const existing = data.data.find(
      (c) => c.contactName === contactName && c.platform === "whatsapp"
    );
    if (existing) return existing;
  }

  const createRes = await fetch(`${API_BASE}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      platform: "whatsapp",
      contactName,
    }),
  });
  const createData = await createRes.json();
  return createData.success ? createData.data : null;
};

const fetchSuggestions = async () => {
  const token = await getToken();
  if (!token) {
    alert("Please log in to ReplyMate from the extension icon first.");
    return;
  }

  const contactName = getActiveChatName();
  if (!contactName) {
    alert("Couldn't detect the current chat. Try opening a conversation first.");
    return;
  }

  if (contactName !== currentContactName) {
    currentContactName = contactName;
    const contact = await ensureContact(contactName);
    currentContactId = contact ? contact._id : null;
  }

  if (!currentContactId) {
    alert("Couldn't set up this contact. Try again.");
    return;
  }

  const messages = getRecentMessages();

  const res = await fetch(`${API_BASE}/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contactId: currentContactId, messages }),
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || "Could not get suggestions");
    return;
  }

  renderSuggestions(data.data.suggestions);
};

const renderSuggestions = (suggestions) => {
  removeSuggestionBox();

  const box = document.createElement("div");
  box.id = "replymate-suggestions";

  suggestions.forEach((text) => {
    const chip = document.createElement("button");
    chip.className = "replymate-chip";
    chip.textContent = text;
    chip.onclick = () => insertIntoComposer(text);
    box.appendChild(chip);
  });

  const footer = document.getElementById("main")?.querySelector("footer");
  if (footer) {
    footer.parentElement.insertBefore(box, footer);
  }
};

const removeSuggestionBox = () => {
  const existing = document.getElementById("replymate-suggestions");
  if (existing) existing.remove();
};

const insertIntoComposer = (text) => {
  const composer = document.querySelector("footer div[contenteditable='true']");
  if (!composer) {
    alert("Could not find the message box");
    return;
  }

  composer.focus();
  document.execCommand("insertText", false, text);
  removeSuggestionBox();
};

const injectTriggerButton = () => {
  if (document.getElementById("replymate-trigger")) return;

  const btn = document.createElement("button");
  btn.id = "replymate-trigger";
  btn.textContent = "✨ Suggest Reply";
  btn.onclick = fetchSuggestions;
  document.body.appendChild(btn);
};

const waitForWhatsAppToLoad = setInterval(() => {
  if (document.getElementById("main")) {
    injectTriggerButton();
    clearInterval(waitForWhatsAppToLoad);
  }
}, 1000);