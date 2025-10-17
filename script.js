let transactions = [];
const presupuestoMensual = 5000;

const lineasCredito = {
  "PlataCard": 11500,
  "Bradescard": 34500,
  "Klar": 28500,
  "Mercado Pago": 21500
};

const fechasCorte = {
  "Klar": 26,
  "Bradescard": 10,
  "PlataCard": 17,
  "Mercado Pago": 7
};

window.addEventListener("load", () => {
  try {
    const saved = localStorage.getItem("transactions");
    if (saved) {
      transactions = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error al cargar transacciones:", e);
    transactions = [];
  }
  updateUI();
});

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
  document.getElementById("type").value = "deposit";
  document.getElementById("method").value = "";
  document.getElementById("category").value = "";
  document.getElementById("date").value = "";
  document.getElementById("note").value = "";

  mostrarConfirmacion("✅ Transacción registrada");
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

  transactions.forEach((t, index) => {
    const item = document.createElement("li");
    item.className = `transaction ${t.type}`;
    item.innerHTML = `
      <div class="trans-content">
        <div>
          <strong>${t.note || "Sin nota"}</strong> - ${t.method}<br/>
          ${t.category} • ${new Date(t.date).toLocaleDateString()}<br/>
          ${t.type === "deposit" ? "+" : "-"}$${t.amount.toFixed(2)}
        </div>
        <button class="deleteBtn" onclick="deleteTransaction(${index})">🗑</button>
      </div>
    `;
    list.appendChild(item);
    total += t.type === "deposit" ? t.amount : -t.amount;
  });

  document.getElementById("total").textContent = total.toFixed(2);

  renderChart();
  actualizarSelectorPeriodos();
  aplicarFiltros();
  actualizarSaldosTarjetas();
  actualizarBarrasCredito();
}

function renderChart() {
  const ingresos = transactions.filter(t => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0);
  const gastos = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const ctx = document.getElementById("chart").getContext("2d");

  if (window.chartInstance) window.chartInstance.destroy();

  window.chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [{
        label: "Resumen",
        data: [ingresos, gastos],
        backgroundColor: ["#3b82f6", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function deleteTransaction(index) {
  if (confirm("¿Eliminar esta transacción?")) {
    transactions.splice(index, 1);
    updateUI();
  }
}

document.getElementById("clearBtn").onclick = () => {
  if (confirm("¿Seguro que quieres borrar todo?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    updateUI();
    mostrarConfirmacion("🧹 Historial borrado");
  }
};

document.getElementById("categoryFilter").onchange = aplicarFiltros;
document.getElementById("methodFilter").onchange = aplicarFiltros;

function aplicarFiltros() {
  const categoria = document.getElementById("categoryFilter").value;
  const metodo = document.getElementById("methodFilter").value;

  const filtradas = transactions.filter(t => {
    const coincideCategoria = categoria ? t.category === categoria : true;
    const coincideMetodo = metodo ? t.method === metodo : true;
    return coincideCategoria && coincideMetodo;
  });

  const total = filtradas.reduce((sum, t) => t.type === "deposit" ? sum + t.amount : sum - t.amount, 0);
  document.getElementById("totalFiltrado").textContent = total.toFixed(2);
}

function actualizarSelectorPeriodos() {
  const selector = document.getElementById("periodSelector");
  const periodos = [...new Set(transactions.map(t => t.periodo).filter(Boolean))];
  selector.innerHTML = `<option value="">-- Selecciona un periodo --</option>`;
  periodos.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    selector.appendChild(option);
  });
}

document.getElementById("periodSelector").onchange = () => {
  const periodo = document.getElementById("periodSelector").value;
  const filtradas = transactions.filter(t => t.periodo === periodo && t.type === "expense");
  const total = filtradas.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById("totalPeriodo").textContent = total.toFixed(2);
};

document.getElementById("exportBtn").onclick = () => {
  const wsData = [["Tipo", "Monto", "Método", "Categoría", "Fecha", "Nota"]];
  transactions.forEach(t => {
    wsData.push([
      t.type,
      t.amount,
      t.method,
      t.category,
      new Date(t.date).toLocaleDateString(),
      t.note
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
  XLSX.writeFile(wb, "reporte_finanzas.xlsx");
};

function mostrarConfirmacion(texto) {
  const confirm = document.createElement("div");
  confirm.textContent = texto;
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
  setTimeout(() => confirm.remove(), 2500);
}

function actualizarSaldosTarjetas() {
  const saldos = {};
  Object.keys(lineasCredito).forEach(t => saldos[t] = lineasCredito[t]);

  transactions.forEach(t => {
    if (saldos[t.method] !== undefined) {
      saldos[t.method] += t.type === "deposit" ? t.amount : -t.amount;
    }
  });

  const lista = document.getElementById("saldosTarjetas");
  lista.innerHTML = "";
  Object.entries(saldos).forEach(([tarjeta, saldo]) => {
    const li = document.createElement
