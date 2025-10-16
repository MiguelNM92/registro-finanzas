let transactions = [];
const presupuestoMensual = 5000;

document.getElementById("addBtn").onclick = () => {
  document.getElementById("formContainer").classList.toggle("hidden");
};

document.getElementById("transactionForm").onsubmit = (e) => {
  e.preventDefault();
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const method = document.getElementById("method").value;
  const category = document.getElementById("category").value;
  const dateInput = document.getElementById("date").value;
  const note = document.getElementById("note").value;
  const date = dateInput ? new Date(dateInput) : new Date();

  transactions.push({ type, amount, method, category, note, date });
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
      ${t.category} • ${t.date.toLocaleDateString()}<br/>
      ${t.type === "deposit" ? "+" : "-"}$${t.amount.toFixed(2)}
    `;
    list.appendChild(item);
    total += t.type === "deposit" ? t.amount : -t.amount;
  });

  document.getElementById("total").textContent = total.toFixed(2);

  const gastosDelMes = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  if (gastosDelMes > presupuestoMensual) {
    alert("⚠️ Has superado tu presupuesto mensual de $" + presupuestoMensual);
  }

  renderChart();
}

function renderChart() {
  const ingresos = transactions
    .filter(t => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);

  const gastos = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const ctx = document.getElementById("chart").getContext("2d");

  if (window.chartInstance) {
    window.chartInstance.destroy();
  }

  window.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [{
        label: "Este mes",
        data: [ingresos, gastos],
        backgroundColor: ["#3b82f6", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.getElementById("exportBtn").onclick = () => {
  const data = transactions.map(t => ({
    Fecha: new Date(t.date).toLocaleDateString(),
    Tipo: t.type === "deposit" ? "Depósito" : "Gasto",
    Monto: t.amount,
    Método: t.method,
    Categoría: t.category,
    Nota: t.note
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

  XLSX.writeFile(workbook, "registro_finanzas.xlsx");
};

window.onload = () => {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    transactions = JSON.parse(saved);
    updateUI();
  }
};
