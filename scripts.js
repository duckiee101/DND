let memoryLog = [];
let activeCharacter = JSON.parse(localStorage.getItem("playerCharacter")) || {};

function rollStats() { ... }
function saveCharacter() { ... }
function rollDice() { ... }
function showStats() { ... }

async function generate() {
  const lore = await fetchLore();
  const prompt = buildPrompt(lore, activeCharacter, memoryLog);
  const response = await puter.ai.chat([{ role: "user", content: prompt }]);
  updateOutput(response);
}

async function fetchLore() {
  try {
    const res = await fetch("dndLore.json");
    return await res.json();
  } catch {
    return { dmRoles: ["storyteller"], playerStyles: {}, worldBuilding: {} };
  }
}
