let transactions = [];
const DEBUG = true;

const lineasCredito = {
  "Klar": 28500,
  "PlataCard": 11500,
  "Mercado Pago": 22500,
  "Bradescard": 34500
};

const fechasCorte = {
  "Klar": 26,
  "Bradescard": 10,
  "PlataCard": 17,
  "Mercado Pago": 7
};

window.onload = () => {
  if (DEBUG) console.log("🟢 Cargando transacciones desde localStorage...");
  const saved = localStorage.getItem("transactions");
  if (saved) {
    try {
      transactions = JSON.parse(saved);
      if (DEBUG) console.log("✅ Transacciones cargadas:", transactions);
    } catch (e) {
      console.error("❌ Error al cargar transacciones:", e);
      transactions = [];
    }
  }
  updateUI();
};

document.getElementById("transactionForm").onsubmit = (e) => {
  e.preventDefault();
  if (DEBUG) console.log("📥 Guardando nueva transacción...");

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

  const nueva = { type, amount, method, category, note, date, periodo };
  transactions.push(nueva);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  if (DEBUG) console.log("✅ Transacción registrada:", nueva);

  updateUI();
  e.target.reset();
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
  if (DEBUG) console.log("🔄 Actualizando interfaz...");
  renderHistorial();
  aplicarFiltros();
  actualizarSelectorPeriodos();
  actualizarSaldosTarjetas();
  actualizarBarrasCredito();
}

function renderHistorial() {
  const list = document.getElementById("transactionList");
  list.innerHTML = "";
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
  });
  if (DEBUG) console.log("📋 Historial actualizado");
}

function deleteTransaction(index) {
  if (confirm("¿Eliminar esta transacción?")) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
    if (DEBUG) console.log("🗑 Transacción eliminada");
  }
}

document.getElementById("clearBtn").onclick = () => {
  if (confirm("¿Seguro que quieres borrar todo?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    updateUI();
    mostrarConfirmacion("🧹 Historial borrado");
    if (DEBUG) console.log("🧹 Todas las transacciones eliminadas");
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
  if (DEBUG) console.log("🔍 Filtro aplicado:", { categoria, metodo, total });
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
  if (DEBUG) console.log("📅 Periodos actualizados:", periodos);
}

document.getElementById("periodSelector").onchange = () => {
  const periodo = document.getElementById("periodSelector").value;
  const filtradas = transactions.filter(t => t.periodo === periodo && t.type === "expense");
  const total = filtradas.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById("totalPeriodo").textContent = total.toFixed(2);
  if (DEBUG) console.log("📊 Total en periodo:", periodo, total);
};

function actualizarSaldosTarjetas() {
  const saldos = {};
  Object.keys(lineasCredito).forEach(t => saldos[t] = lineasCredito[t]);

  transactions.forEach(t => {
    if (!saldos[t.method]) saldos[t.method] = 0;
    saldos[t.method] += t.type === "deposit" ? t.amount : -t.amount;
  });

  const lista = document.getElementById("saldosTarjetas");
  lista.innerHTML = "";

  Object.entries(saldos).forEach(([tarjeta, saldo]) => {
    const esCredito = lineasCredito[tarjeta] !== undefined;
    const li = document.createElement("li");
    li.innerHTML = esCredito
      ? `<strong>${tarjeta}</strong>: $${saldo.toFixed(2)} / $${lineasCredito[tarjeta].toFixed(2)} disponibles`
      : `<strong>${tarjeta}</strong>: $${saldo.toFixed(2)} disponibles`;
    lista.appendChild(li);
  });

  if (DEBUG) console.log("💳 Saldos actualizados:", saldos);
}

function actualizarBarrasCredito() {
  const container = document.getElementById("barrasContainer");
  container.innerHTML = "";

  Object.keys(lineasCredito).forEach(tarjeta => {
    const gastos = transactions
      .filter(t => t.method === tarjeta && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const porcentaje = Math.min((gastos / lineasCredito[tarjeta]) * 100, 100);
    const barra = document.createElement("div");
    barra.className = "barraTarjeta";
    barra.innerHTML = `
      <span>${tarjeta}: ${porcentaje.toFixed(1)}% usado</span>
      <div class="progreso" style="width:${porcentaje}%"></div>
    `;
    container.appendChild(barra);
  });

  if (DEBUG) console.log("📈 Barras de consumo actualizadas");
}

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
  confirm.style.boxShadow = "0
