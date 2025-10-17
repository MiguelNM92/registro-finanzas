let transactions = [];
const presupuestoMensual = 5000;

const fechasCorte = {
  "Klar": 26,
  "Bradescard": 10,
  "PlataCard": 17,
  "Mercado Pago": 7
};

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

  let periodo = null;
  if (fechasCorte[method]) {
    periodo = obtenerPeriodoCorte(date, method);
  }

  transactions.push({ type, amount, method, category, note, date, periodo });
  updateUI();
  e.target.reset();
  document.getElementById("formContainer").classList.add("hidden");
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
  actualizarSelectorPeriodos();
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
 [43dcd9a7-70db-4a1f-b0ae-981daa162054](https://github.com/pozeydon-code/AppRepository/tree/800099c5cd023b0790d343f8b75b01c9f710bc76/resources%2Fviews%2Fauth%2Fregister.blade.php?citationMarker=43dcd9a7-70db-4a1f-b0ae-981daa162054&citationId=1&citationId=2 "github.com")
