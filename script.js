let transactions = [];

document.getElementById("addBtn").onclick = () => {
  document.getElementById("formContainer").classList.toggle("hidden");
};

document.getElementById("transactionForm").onsubmit = (e) => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const method = document.getElementById("method").value;
  const note = document.getElementById("note").value;

  transactions.push({ type, amount, method, note, date: new Date() });
  updateUI();
  e.target.reset();
  document.getElementById("formContainer").classList.add("hidden");
};

function updateUI() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  const list = document.getElementById("transactionList");
  list.innerHTML = "";
  let total = 0;

  transactions.forEach((t) => {
    const item = document.createElement("li");
    item.className = `transaction ${t.type}`;
    item.innerHTML = `
      <strong>${t.note || "Sin nota"}</strong> - ${t.method}<br/>
      ${t.type === "deposit" ? "+" : "-"}$${t.amount.toFixed(2)} (${t.date.toLocaleDateString()})
    `;
    list.appendChild(item);
    total += t.type === "deposit" ? t.amount : -t.amount;
  });

  document.getElementById("total").textContent = total.toFixed(2);
}

window.onload = () => {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    transactions = JSON.parse(saved);
    updateUI();
  }
};
