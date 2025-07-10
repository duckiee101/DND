let memoryLog = [];
let activeCharacter = JSON.parse(localStorage.getItem("playerCharacter")) || {};
let pendingRoll = null;

function rollStats() { ... } // same as before
function saveCharacter() { ... } // same as before

function rollDice() {
  const diceType = parseInt(document.getElementById("diceType").value);
  const roll = Math.floor(Math.random() * diceType) + 1;
  const output = document.getElementById("output");

  output.classList.remove("dice-animation");
  void output.offsetWidth;
  output.classList.add("dice-animation");

  output.textContent += `\n\n🎲 You rolled a d${diceType}: ${roll}`;

  if (pendingRoll) {
    const rollContext = `Player rolled a ${roll} on ${pendingRoll.action} (${pendingRoll.type}).`;
    memoryLog.push(`Roll Result: ${rollContext}`);
    pendingRoll = null;
    document.getElementById("prompt").value = rollContext;
    generate(); // continue story with result
  }
}

function showStats() { ... } // same as before

function saveCampaign() {
  const campaignData = {
    character: activeCharacter,
    memoryLog,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem("campaignSave", JSON.stringify(campaignData));
  alert("Campaign saved successfully!");
}

function loadCampaign() {
  const saved = JSON.parse(localStorage.getItem("campaignSave"));
  if (!saved) return alert("No saved campaign found.");
  activeCharacter = saved.character;
  memoryLog = saved.memoryLog || [];
  document.getElementById("output").textContent = `📂 Campaign loaded from ${saved.timestamp}\n\n`;
  showStats();
}

async function generate() {
  const userInput = document.getElementById("prompt").value;
  const output = document.getElementById("output");
  let lore = {};

  try {
    const res = await fetch("dndLore.json");
    lore = await res.json();
  } catch {
    lore = {
      dmRoles: ["storyteller"],
      playerStyles: { acting: ["roleplay"], fighting: ["combat"] },
      worldBuilding: { multiverse: true, npcMemory: true }
    };
  }

  if (userInput) memoryLog.push(`Player: ${userInput}`);
  const memoryContext = memoryLog.slice(-6).join("\n");

  const prompt = `
You are a Dungeon Master AI with the personality of a vivid, emotionally intelligent storyteller. Speak with rich sensory detail, dramatic pacing, and emotional nuance. Use tension, metaphor, and immersive narration.

If you want the player to roll, say: “Roll a d20 for [action]” and wait for input. Do not continue the story until the roll result is provided.

Player Character:
Name: ${activeCharacter.name || "Unnamed"}
Race: ${activeCharacter.race || "Unknown"}
Class: ${activeCharacter.class || "Unknown"}
Alignment: ${activeCharacter.alignment || "Neutral"}
Stats: ${activeCharacter.stats ? Object.entries(activeCharacter.stats).map(([k,v]) => `${k}: ${v}`).join(", ") : "Not set"}

Lore:
DM Roles: ${lore.dmRoles.join(", ")}
Player Styles: ${Object.entries(lore.playerStyles).map(([style, traits]) => `${style}: ${traits.join(", ")}`).join(" | ")}
World Building: ${Object.entries(lore.worldBuilding).map(([k,v]) => `${k}: ${v}`).join(", ")}

Maintain continuity and build upon previous events. Structure each scene with:
1. Setting and mood
2. NPC introduction or environmental detail
3. Tension or mystery
4. Player choices or consequences

${memoryContext}

${userInput ? `Player action: ${userInput}` : "Begin a new campaign in a haunted forest near a forgotten ruin. Introduce NPCs, describe the setting, and offer choices."}
  `.trim();

  try {
    const response = await puter.ai.chat([{ role: "user", content: prompt }]);
    memoryLog.push(`DM: ${response}`);
    output.textContent += `\n\n${response}`;
    document.getElementById("prompt").value = "";
    output.scrollTop = output.scrollHeight;

    if (/roll a d(\d+)\s+for\s+(\w+)/i.test(response)) {
      const match = response.match(/roll a d(\d+)\s+for\s+(\w+)/i);
      pendingRoll = {
        type: `d${match[1]}`,
        action: match[2]
      };
      alert(`🧙‍♂️ The DM requests: Roll a ${pendingRoll.type} for ${pendingRoll.action}`);
    }
  } catch (err) {
    console.error("AI request failed:", err);
    output.textContent += "\n⚠️ AI generation error: " + err.message;
  }
}
