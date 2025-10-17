let transactions = [];
const presupuestoMensual = 5000;

const fechasCorte = {
  "Klar": 26,
  "Bradescard": 10,
  "PlataCard": 17,
  "Mercado Pago": 7
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

  let periodo = null;
  if (fechasCorte[method]) {
    periodo = obtenerPeriodoCorte(date, method);
  }

  transactions.push({ type, amount, method, category, note, date, periodo });
  updateUI();
  e.target.reset();
};

function obtenerPeriodoCorte(fecha, tarjeta) {
  const diaCorte = fechasCorte[tarjeta];
  const f = new Date(fecha);
  const año = f.getFullYear();
  const mes = f.getMonth();

  if (f.getDate() <= diaCorte) {
    return `${año}-${String(mes + 1).padStart(2, '0')}`;
  } else {
    const siguienteMes = mes + 1;
    const añoFinal = siguienteMes > 11 ? año + 1 : año;
    const mesFinal = siguienteMes % 12;
    return `${añoFinal}-${String(mesFinal + 1).padStart(2, '0')}`;
  }
}

function updateUI() {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
    alert("❌ No se pudo guardar la transacción.");
    return;
  }

  const list = document.getElementById("transactionList");
  list.innerHTML = "";
  let total = 0;

  transactions.forEach((t) => {
    const item = document.createElement("li");
    item.className = `transaction ${t.type}`;
    item.innerHTML = `
      <strong>${t.note || "Sin nota"}</strong> - ${t.method}<br/>
      ${t.category} • ${new Date(t.date).toLocaleDateString()}<br/>
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
  actualizarSelectorPeriodos();

  const confirm = document.createElement("div");
  confirm.textContent = "✅ Transacción guardada";
  confirm.style.position = "fixed";
  confirm.style.bottom = "20px";
  confirm.style.left = "50%";
  confirm.style.transform = "translateX(-50%)";
  confirm.style.background = "#22c55e";
  confirm.style.color = "white";
  confirm.style.padding = "10px 20px";
  confirm.style.borderRadius = "6px";
  confirm.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  confirm.style.zIndex = "1000";
  document.body.appendChild(confirm);
  setTimeout(() => confirm.remove(), 2000);
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
    Nota: t.note,
    Periodo: t.periodo || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

  XLSX.writeFile(workbook, "registro_finanzas.xlsx");
};

function actualizarSelectorPeriodos() {
  const selector = document.getElementById("periodSelector");
  const periodosUnicos = [...new Set(transactions.map(t => t.periodo).filter(p => p))];
  selector.innerHTML = `<option value="">-- Selecciona un periodo --</option>`;
  periodosUnicos.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    selector.appendChild(option);
  });
}

document.getElementById("periodSelector").onchange = () => {
  const periodo = document.getElementById("periodSelector").value;
  const gastos = transactions
    .filter(t => t.periodo === periodo && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById("totalPeriodo").textContent = gastos.toFixed(2);
};

document.getElementById("monthSelector").onchange = () => {
  const selected = document.getElementById("monthSelector").value;
  if (!selected) return;

  const [year, month] = selected.split("-").map(Number);
  const gastosPorCategoria = {};

  transactions.for
