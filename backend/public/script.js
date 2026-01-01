document.getElementById("check").addEventListener("click", () => {
  const ingredients = document.getElementById("ingredients").value;
  const name = document.getElementById("productName").value;

  document.getElementById("result").innerText = "Analyzing...";

  fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      ingredients: ingredients
    })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("result").innerText =
        data.explanation;
    });
});




const historyToggle = document.getElementById("historyToggle");
const historySidebar = document.getElementById("historySidebar");
const closeHistory = document.getElementById("closeHistory");

historyToggle.addEventListener("click", async () => {
  historySidebar.classList.add("open");
  await loadHistory();
});

closeHistory.addEventListener("click", () => {
  historySidebar.classList.remove("open");
});





async function loadHistory() {
  const res = await fetch("/api/history");
  const data = await res.json();

  historyList.innerHTML = "";

  // Show newest first (like ChatGPT)
  const items = data.history.slice().reverse();

  items.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="history-name">${entry.name}</div>
      <div class="history-preview">
        ${entry.explanation.slice(0, 80)}${entry.explanation.length > 80 ? "…" : ""}
      </div>
    `;

    historyList.appendChild(card);
  });
}

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

clearHistoryBtn.addEventListener("click", async () => {
  const confirmClear = confirm("Clear all previous checks?");
  if (!confirmClear) return;

  await fetch("/api/clear-history", {
    method: "POST"
  });

  // Clear UI immediately
  historyList.innerHTML = "";
});

