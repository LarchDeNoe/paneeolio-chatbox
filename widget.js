(function () {
  // ⚙️ À modifier une fois le backend déployé sur Vercel :
  const API_URL = "https://TON-PROJET.vercel.app/api/chat";

  const STYLE = `
    #po-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 60px; height: 60px; border-radius: 50%;
      background: #1c1912; border: 1px solid #c9a15a;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      transition: transform 0.2s ease;
    }
    #po-bubble:hover { transform: scale(1.06); }
    #po-bubble svg { width: 26px; height: 26px; }

    #po-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 999999;
      width: 340px; max-width: calc(100vw - 32px);
      height: 480px; max-height: calc(100vh - 140px);
      background: #1c1912;
      border: 1px solid #3a3221;
      border-radius: 14px;
      display: none; flex-direction: column;
      overflow: hidden;
      font-family: 'Georgia', serif;
      box-shadow: 0 20px 50px rgba(0,0,0,0.45);
    }
    #po-window.open { display: flex; }

    #po-header {
      padding: 16px 18px;
      border-bottom: 1px solid #3a3221;
      background: #221e15;
    }
    #po-header .title {
      color: #f0e8d8; font-size: 17px; letter-spacing: 0.5px;
      font-weight: 600;
    }
    #po-header .subtitle {
      color: #c9a15a; font-size: 11px; margin-top: 2px;
      font-family: Arial, sans-serif; letter-spacing: 1px;
      text-transform: uppercase;
    }

    #po-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .po-msg {
      max-width: 82%; padding: 9px 13px; border-radius: 10px;
      font-size: 14px; line-height: 1.45;
      font-family: Arial, sans-serif;
    }
    .po-msg.bot {
      background: #2a2519; color: #ecdfc4;
      align-self: flex-start; border: 1px solid #3a3221;
    }
    .po-msg.user {
      background: #c9a15a; color: #1c1912;
      align-self: flex-end; font-weight: 500;
    }
    .po-msg.typing { color: #a89a78; font-style: italic; }

    #po-inputRow {
      display: flex; gap: 8px; padding: 12px;
      border-top: 1px solid #3a3221; background: #221e15;
    }
    #po-input {
      flex: 1; background: #1c1912; border: 1px solid #3a3221;
      border-radius: 8px; padding: 9px 11px; color: #f0e8d8;
      font-size: 14px; font-family: Arial, sans-serif; outline: none;
    }
    #po-input::placeholder { color: #6b6350; }
    #po-send {
      background: #c9a15a; border: none; border-radius: 8px;
      padding: 0 14px; color: #1c1912; font-weight: 600;
      cursor: pointer; font-family: Arial, sans-serif; font-size: 13px;
    }
    #po-send:disabled { opacity: 0.5; cursor: default; }
  `;

  function injectStyles() {
    const s = document.createElement("style");
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function buildUI() {
    const bubble = document.createElement("div");
    bubble.id = "po-bubble";
    bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#c9a15a" stroke-width="1.6">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4c-1.3-.06-2.6-.4-3.7-1L3 20l1.2-4.1c-.6-1.1-1-2.4-1-3.9A8.4 8.4 0 0 1 12 3.6a8.3 8.3 0 0 1 9 7.9Z"/>
    </svg>`;

    const win = document.createElement("div");
    win.id = "po-window";
    win.innerHTML = `
      <div id="po-header">
        <div class="title">Pane &amp; Olio</div>
        <div class="subtitle">Taverna sicilienne · assistant</div>
      </div>
      <div id="po-messages"></div>
      <div id="po-inputRow">
        <input id="po-input" type="text" placeholder="Pose ta question..." />
        <button id="po-send">Envoyer</button>
      </div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(win);

    bubble.addEventListener("click", () => {
      win.classList.toggle("open");
      if (win.classList.contains("open") && messages.length === 0) {
        addMessage("bot", "Buonasera ! Je suis l'assistant de Pane & Olio. Question sur le menu, les horaires ou une réservation ?");
      }
    });

    const input = win.querySelector("#po-input");
    const sendBtn = win.querySelector("#po-send");
    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

  let messages = []; // historique envoyé à l'API : [{role, content}]

  function addMessage(role, text) {
    const box = document.getElementById("po-messages");
    const el = document.createElement("div");
    el.className = "po-msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  }

  async function handleSend() {
    const input = document.getElementById("po-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    messages.push({ role: "user", content: text });
    input.value = "";

    const sendBtn = document.getElementById("po-send");
    sendBtn.disabled = true;
    const typingEl = addMessage("bot", "…");
    typingEl.classList.add("typing");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      typingEl.remove();

      const reply = data.reply || "Désolé, une erreur est survenue.";
      addMessage("bot", reply);
      messages.push({ role: "assistant", content: reply });
    } catch (err) {
      typingEl.remove();
      addMessage("bot", "Connexion impossible pour le moment, réessaie dans un instant.");
    } finally {
      sendBtn.disabled = false;
    }
  }

  injectStyles();
  buildUI();
})();
