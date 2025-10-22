let transactions = [];
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
  const saved = localStorage.getItem("transactions");
  if (saved) {
    try {
      transactions = JSON.parse(saved);
    } catch {
      transactions = [];
    }
  }
  updateUI();
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

document.getElementById("formGasto").onsubmit = (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("gastoAmount").value);
  const method = document.getElementById("gastoMethod").value;
  const category = document.getElementById("gastoCategory").value;
  const dateInput = document.getElementById("gastoDate").value;
  const note = document.getElementById("gastoNote").value;
  const date = dateInput ? new Date(dateInput) : new Date();

  let periodo = null;
  if (fechasCorte[method]) {
    periodo = obtenerPeriodoCorte(date, method);
  }

  const nueva = { type: "expense", amount, method, category, note, date, periodo };
  transactions.push(nueva);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
  e.target.reset();
};

document.getElementById("formIngreso").onsubmit = (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("ingresoAmount").value);
  const method = document.getElementById("ingresoMethod").value;
  const category = document.getElementById("ingresoCategory").value;
  const dateInput = document.getElementById("ingresoDate").value;
  const note = document.getElementById("ingresoNote").value;
  const date = dateInput ? new Date(dateInput) : new Date();

  const nueva = { type: "deposit", amount, method, category, note, date };
  transactions.push(nueva);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
  e.target.reset();
};

function updateUI() {
  renderHistorial();
  aplicarFiltros();
  actualizarSelectorPeriodos();
  actualizarBarrasCredito();
}

function renderHistorial() {
  const ingresos = document.getElementById("listaIngresos");
  const gastos = document.getElementById("listaGastos");
  ingresos.innerHTML = "";
  gastos.innerHTML = "";

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
    t.type === "deposit" ? ingresos.appendChild(item) : gastos.appendChild(item);
  });
}

function deleteTransaction(index) {
  if (confirm("¿Eliminar esta transacción?")) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
  }
}

document.getElementById("clearBtn").onclick = () => {
  if (confirm("¿Seguro que quieres borrar todo?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    updateUI();
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

function actualizarBarrasCredito() {
  const container = document.getElementById("barrasContainer");
  container.innerHTML = "";

  Object.keys(lineasCredito).forEach(tarjeta => {
    const creditoTotal = lineasCredito[tarjeta];
    const gastos = transactions
      .filter(t => t.method === tarjeta && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const disponible = creditoTotal - gastos;
    const porcentajeUsado = Math.min((gastos / creditoTotal) * 100, 100);
    const porcentajeDisponible = 100 - porcentajeUsado;

    const barra = document.createElement("div");
    barra.className = "barraTarjeta";
    barra.innerHTML = `
      <div class="infoTarjeta">
        <strong>${tarjeta}</strong> — $${gastos.toFixed(2)} usado / $${disponible.toFixed(2)} disponible
        <br>${porcentajeUsado.toFixed(1)}% usado / ${porcentajeDisponible.toFixed(1)}% disponible
      </div>
      <div class="barraFondo">
        <div class="barraUsado" style="width:${porcentajeUsado}%"></div>
        <div class="barraDisponible" style="width:${porcentajeDisponible}%"></div>
      </div>
    `;
    container.appendChild(barra);
  });
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
  confirm.style.borderRadius = "8px";
  confirm.style.fontWeight = "bold";
  confirm.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  confirm.style.zIndex = "999";
  document.body.appendChild(confirm);
  setTimeout(() => confirm.remove(), 3000);
}
