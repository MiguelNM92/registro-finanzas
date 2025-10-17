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

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (
      t.type === "expense" &&
      d.getFullYear() === year &&
      d.getMonth() + 1 === month
    ) {
      gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + t.amount;
    }
  });

  const labels = Object.keys(gastosPorCategoria);
  const data = Object.values(gastosPorCategoria);
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  const ctx = document.getElementById("categoryChart").getContext("2d");
  if (window.categoryChartInstance) {
    window.categoryChartInstance.destroy();
  }

  window.categoryChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
};

document.getElementById("exportPdfBtn").onclick = () => {
  const canvas = document.getElementById("categoryChart");
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte mensual por categoría", 20, 20);
  doc.addImage(imgData, "PNG", 15, 30, 180, 100);
  doc.save("reporte_mensual.pdf");
};

document.getElementById("compareMonth1").onchange = compararMeses;
document.getElementById("compareMonth2").onchange = compararMeses;

function compararMeses() {
  const m1 = document.getElementById("compareMonth1").value;
  const m2 = document.getElementById("compareMonth2").value;
  if (!m1 || !m2) return;

  const resumen = {};

  transactions.forEach(t => {
    const d = new Date(t.date);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (t.type === "expense" && (mes === m1 || mes === m2)) {
      const key = `${mes}-${t.category}`;
      resumen[key] = (resumen[key] || 0) + t.amount;
    }
  });

  const categorias = [...new Set(transactions.map(t => t.category))];
  const datosMes1 = categorias.map(cat => resumen[`${m1}-${cat}`] || 0);
  const datosMes2 = categorias.map(cat => resumen[`${m2}-${cat}`] || 0);

  const ctx = document.getElementById("compareChart").getContext("2d");
  if (window.compareChartInstance) {
    window.compareChartInstance.destroy();
  }

  window.compareChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: categorias,
      datasets: [
        {
          label: `Gastos ${m1}`,
          data: datosMes1,
          backgroundColor: "#3b82f6"
        },
        {
          label: `Gastos ${m2}`,
          data: datosMes2,
          backgroundColor: "#ef4444"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

window.onload = () => {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    transactions = JSON.parse(saved);
    updateUI();
  }
};
document.getElementById("toggleFormBtn").onclick = () => {
  document.getElementById("floatingForm").classList.toggle("hidden");
};
