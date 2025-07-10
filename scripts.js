let memoryLog = [];
let activeCharacter = JSON.parse(localStorage.getItem("playerCharacter")) || {};

function rollStats() {
  const roll = () => {
    let rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((a, b) => a + b, 0);
  };

  activeCharacter.stats = {
    strength: roll(),
    dexterity: roll(),
    constitution: roll(),
    intelligence: roll(),
    wisdom: roll(),
    charisma: roll()
  };

  document.getElementById("charPreview").innerHTML = `
    <strong>Stats Rolled:</strong><br>
    Strength: ${activeCharacter.stats.strength}<br>
    Dexterity: ${activeCharacter.stats.dexterity}<br>
    Constitution: ${activeCharacter.stats.constitution}<br>
    Intelligence: ${activeCharacter.stats.intelligence}<br>
    Wisdom: ${activeCharacter.stats.wisdom}<br>
    Charisma: ${activeCharacter.stats.charisma}
  `;
  document.getElementById("charPreview").style.display = "block";
}

function saveCharacter() {
  activeCharacter.name = document.getElementById("charName").value;
  activeCharacter.race = document.getElementById("charRace").value;
  activeCharacter.class = document.getElementById("charClass").value;
  activeCharacter.alignment = document.getElementById("charAlign").value;

  localStorage.setItem("playerCharacter", JSON.stringify(activeCharacter));
  alert(`Character ${activeCharacter.name} saved!`);
}

function rollDice() {
  const diceType = parseInt(document.getElementById("diceType").value);
  const roll = Math.floor(Math.random() * diceType) + 1;
  const output = document.getElementById("output");
  output.classList.remove("dice-animation");
  void output.offsetWidth;
  output.classList.add("dice-animation");
  output.textContent += `\n\n🎲 You rolled a d${diceType}: ${roll}`;
}

function showStats() {
  const sheet = activeCharacter;
  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = `
    <strong>Name:</strong> ${sheet.name}<br>
    <strong>Race:</strong> ${sheet.race}<br>
    <strong>Class:</strong> ${sheet.class}<br>
    <strong>Alignment:</strong> ${sheet.alignment}<br>
    <strong>Stats:</strong><br>
    Strength: ${sheet.stats?.strength ?? "-"}<br>
    Dexterity: ${sheet.stats?.dexterity ?? "-"}<br>
    Constitution: ${sheet.stats?.constitution ?? "-"}<br>
    Intelligence: ${sheet.stats?.intelligence ?? "-"}<br>
    Wisdom: ${sheet.stats?.wisdom ?? "-"}<br>
    Charisma: ${sheet.stats?.charisma ?? "-"}
  `;
  statsDiv.style.display = "block";
}

function saveCampaign() {
  const campaignData = {
    character: activeCharacter,
    memoryLog,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem("campaignSave", JSON.stringify(campaignData));
    alert("Campaign saved successfully!");
  } catch (err) {
    console.error("Save failed:", err);
    alert("⚠️ Save failed. Check storage permissions.");
  }
}

function loadCampaign() {
  try {
    const saved = JSON.parse(localStorage.getItem("campaignSave"));
    if (!saved) return alert("No saved campaign found.");

    activeCharacter = saved.character;
    memoryLog = saved.memoryLog || [];
    document.getElementById("output").textContent = `📂 Campaign loaded from ${saved.timestamp}\n\n`;
    showStats();
  } catch (err) {
    console.error("Load failed:", err);
    alert("⚠️ Load failed. Check saved data format.");
  }
}

async function generate() {
  const userInput = document.getElementById("prompt").value;
  const output = document.getElementById("output");
  let lore = {};

  try {
    const res = await fetch("dndLore.json");
    if (!res.ok) throw new Error("Failed to load dndLore.json");
    lore = await res.json();
  } catch (e) {
    console.warn("Lore loading failed:", e);
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
  } catch (err) {
    console.error("AI request failed:", err);
    output.textContent += "\n⚠️ AI generation error: " + err.message;
  }
}
