(function() {
let preciosPorKg = {};
let preciosExtras = {
fragancia: 400,
perlas: 300,
perfume: 300,
blanco: 300,
oscuro: 300,
color: 300,
semiSucio: 200,
sucio: 400,
manchado: 800
};
let currentPesosSeleccionados = [];
let planSeleccionado = 'NORMAL';
let extrasMarcados = {
fragancia: false, perlas: false, perfume: false,
blanco: false, oscuro: false, color: false,
semiSucio: false, sucio: false, manchado: false
};
const rangosDisponibles = ['1-2', '3-4', '5-6', '7'];
let contadorRangos = {
'1-2': 0,
'3-4': 0,
'5-6': 0,
'7': 0
};
let formularioInicializado = false;
async function cargarPreciosKg() {
    try {
        const response = await fetch('service.xml');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const planes = xmlDoc.querySelectorAll('planesPeso plan');
        planes.forEach(plan => {
            const id = plan.getAttribute('id');
            preciosPorKg[id] = {};
            plan.querySelectorAll('precio').forEach(p => {
                const rango = p.getAttribute('rango');
                const valor = parseInt(p.textContent, 10);
                preciosPorKg[id][rango] = valor;
            });
        });
        return true;
    } catch (error) {
        console.error('Error cargando precios:', error);
        window.showToast('Error al cargar precios. Recarga la pagina.', true);
        return false;    }
}

function calcularTotal() {
    const totalPesos = currentPesosSeleccionados.reduce((sum, item) => sum + item.precioUnitario, 0);
    const totalExtras = Object.entries(extrasMarcados).reduce((sum, [key, active]) => active ? sum + preciosExtras[key] : sum, 0);
    return totalPesos + totalExtras;
}

function actualizarResumen() {
    const resumenDiv = document.getElementById('resumenContenido');
    if (!resumenDiv) return;
    const items = currentPesosSeleccionados.map(p => `${p.rango} kg ($${p.precioUnitario})`).join(', ') || 'Ninguno';
    const extrasActivos = Object.keys(extrasMarcados).filter(k => extrasMarcados[k]).map(k => {
        const nombres = { fragancia:'Fragancia', perlas:'Perlas olor', perfume:'Perfume', blanco:'D.L.R Blanca', oscuro:'D.L.R Oscura', color:'D.L.R Color', semiSucio:'Semi Sucio', sucio:'Sucio', manchado:'Manchado' };
        return `${nombres[k]} (+$${preciosExtras[k]})`;
    }).join(', ') || 'Ninguno';
    resumenDiv.innerHTML = `
         <p><strong>Plan seleccionado: </strong>${planSeleccionado}</p>
         <p><strong>Items agregados (${currentPesosSeleccionados.length}): </strong>${items}</p>
         <p><strong>Extras: </strong>${extrasActivos}</p>
         <div class="price-preview"><strong>TOTAL: $${calcularTotal()}</strong></div>
    `;
}

function agregarPeso(rango, precio) {
    currentPesosSeleccionados.push({ rango, precioUnitario: precio });
    contadorRangos[rango]++;
    actualizarBotonesRangos();
    actualizarListaPesos();
    actualizarResumen();
    return true;
}

function eliminarPeso(index) {
    const item = currentPesosSeleccionados[index];
    if (item) {
        contadorRangos[item.rango]--;
        currentPesosSeleccionados.splice(index, 1);
        actualizarBotonesRangos();
        actualizarListaPesos();
        actualizarResumen();
    }
}

function actualizarListaPesos() {
    const container = document.getElementById('pesosSeleccionadosLista');
    if (!container) return;
    if (currentPesosSeleccionados.length === 0) {
        container.innerHTML = '<p style="color:gray;">No hay items agregados. Selecciona rangos arriba.</p>';        return;
    }
    container.innerHTML = currentPesosSeleccionados.map((item, idx) => `
         <div class="peso-item">
             <span>${item.rango} kg - $${item.precioUnitario}</span>
             <button type="button" class="btn-eliminar-peso" data-index="${idx}">X</button>
         </div>
    `).join('');
    container.querySelectorAll('.btn-eliminar-peso').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            eliminarPeso(idx);
        });
    });
}

function actualizarBotonesRangos() {
    for (let rango of rangosDisponibles) {
        const precio = preciosPorKg[planSeleccionado]?.[rango];
        if (!precio) continue;
        const contador = contadorRangos[rango];
        const btnContainer = document.getElementById(`btn-rango-${rango}`);
        if (btnContainer) {
            btnContainer.innerHTML = `
                 <div class="rango-nombre">${rango} kg</div>
                 <div class="rango-precio">$${precio}</div>
                 <div class="rango-contador">${contador}</div>
                 <button type="button" class="btn-agregar-rango" data-rango="${rango}">+</button>
            `;
            const btnAgregar = btnContainer.querySelector('.btn-agregar-rango');
            if (btnAgregar) {
                btnAgregar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rangoAgregar = btnAgregar.getAttribute('data-rango');
                    const precioNuevo = preciosPorKg[planSeleccionado][rangoAgregar];
                    agregarPeso(rangoAgregar, precioNuevo);
                });
            }
        }
    }
}

function construirMensajeReserva(nombre, telefono, direccion, carnet, fechaHora, total) {
    const itemsPeso = currentPesosSeleccionados.map(p => `${p.rango} kg: $${p.precioUnitario}`).join('\n');
    const extrasList = Object.keys(extrasMarcados).filter(k => extrasMarcados[k]).map(k => {
        const nombres = { fragancia:'Fragancia', perlas:'Perlas olor', perfume:'Perfume', blanco:'D.L.R Blanca', oscuro:'D.L.R Oscura', color:'D.L.R Color', semiSucio:'Semi Sucio', sucio:'Sucio', manchado:'Manchado' };
        return `${nombres[k]} (+$${preciosExtras[k]})`;
    }).join('\n') || 'Ninguno';
    
    return `RESERVA EKO - NUEVA ORDEN
DATOS DEL CLIENTE
Nombre: ${nombre}
Telefono: ${telefono}
Direccion: ${direccion}
Carnet: ${carnet}
Fecha/Hora: ${fechaHora}
DETALLES DEL SERVICIO
Plan seleccionado: ${planSeleccionado}
RANGOS DE PESO
${itemsPeso || 'Ninguno'}
EXTRAS
${extrasList}
TOTAL A PAGAR: $${total}
Enviado desde Lavanderia EKO`;
}
function resetFormularioReserva() {
    currentPesosSeleccionados = [];
    planSeleccionado = 'NORMAL';
    extrasMarcados = {
        fragancia: false, perlas: false, perfume: false,
        blanco: false, oscuro: false, color: false,
        semiSucio: false, sucio: false, manchado: false
    };
    contadorRangos = {
        '1-2': 0,
        '3-4': 0,
        '5-6': 0,
        '7': 0
    };
    const campos = ['clienteNombre', 'clienteTelefono', 'clienteDireccion', 'clienteCarnet', 'clienteFechaHora'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const checkboxes = document.querySelectorAll('[data-extra]');
    if (checkboxes.length) {
        checkboxes.forEach(chk => chk.checked = false);
    }
    const radioNormal = document.querySelector('input[name="plan"][value="NORMAL"]');
    if (radioNormal) radioNormal.checked = true;
    const mapaContainer = document.getElementById('mapaContainer');
    if (mapaContainer) mapaContainer.innerHTML = '';
    actualizarBotonesRangos();
    actualizarListaPesos();    actualizarResumen();
}
window.resetReservaForm = resetFormularioReserva;

window.setPlanAndOpenServiceTab = function(planId) {
    resetFormularioReserva();
    const radio = document.querySelector(`input[name="plan"][value="${planId}"]`);
    if (radio) {
        radio.checked = true;
        const changeEvent = new Event('change', { bubbles: true });
        radio.dispatchEvent(changeEvent);
    }
    const tabBtn = document.querySelector('.tab-btn[data-tab="servicio"]');
    if (tabBtn) tabBtn.click();
    actualizarResumen();
};

function renderizarFormulario() {
    const formContainer = document.getElementById('reservaForm');
    if (!formContainer) return;
    formContainer.innerHTML = `
         <div class="reserva-tabs" style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--gris-suave); padding-bottom:8px;">
             <button type="button" class="tab-btn active" data-tab="datos">Datos Cliente</button>
             <button type="button" class="tab-btn" data-tab="servicio">Servicio</button>
             <button type="button" class="tab-btn" data-tab="extras">Extras</button>
             <button type="button" class="tab-btn" data-tab="resumen">Resumen</button>
         </div>
         <div id="tab-datos" class="tab-content active">
             <div class="form-group"><label>Nombre y apellido completo</label><input type="text" id="clienteNombre" required></div>
             <div class="form-group"><label>Telefono movil o fijo</label><input type="tel" id="clienteTelefono" required></div>
             <div class="form-group"><label>Direccion completa</label>
                 <input type="text" id="clienteDireccion" required>
                 <button type="button" id="btnUbicacion" class="btn-ubicacion">Usar mi ubicacion</button>
                 <div id="mapaContainer" style="margin-top:8px;"></div>
             </div>
             <div class="form-group"><label>Carnet ID (11 digitos)</label><input type="text" id="clienteCarnet" pattern="[0-9]{11}" maxlength="11" required></div>
             <div class="form-group"><label>Fecha y hora</label><input type="datetime-local" id="clienteFechaHora" required></div>
         </div>
         <div id="tab-servicio" class="tab-content" style="display:none;">
             <div class="form-group"><label>Tipo de plan (solo uno)</label>
                 <div style="display:flex; gap:12px; flex-wrap:wrap;">
                     <label><input type="radio" name="plan" value="NORMAL" checked> NORMAL</label>
                     <label><input type="radio" name="plan" value="BASICO"> BASICO</label>
                     <label><input type="radio" name="plan" value="PREMIUM"> PREMIUM</label>
                     <label><input type="radio" name="plan" value="ESPECIAL"> ESPECIAL</label>
                 </div>
             </div>
             <div class="form-group"><label>Selecciona rangos de peso</label>
                 <small style="display:block; font-size:0.7rem; color:#666;">* Elegir esta opción es opcional. El peso de la ropa se evaluará en el local.</small>
                 <div id="rangosBotonesContainer" class="rangos-container"></div>
                 <div id="pesosSeleccionadosLista" class="pesos-lista"></div>
             </div>
         </div>
         <div id="tab-extras" class="tab-content" style="display:none;">
             <h4>Aromas</h4>
             <label><input type="checkbox" data-extra="fragancia"> Fragancia (+$${preciosExtras.fragancia})</label><br>
             <label><input type="checkbox" data-extra="perlas"> Perlas de olor (+$${preciosExtras.perlas})</label><br>
             <label><input type="checkbox" data-extra="perfume"> Perfume (+$${preciosExtras.perfume})</label><br>
             <h4>Otros lavados</h4>
             <label><input type="checkbox" data-extra="blanco"> D.L.R Blanca (+$${preciosExtras.blanco})</label><br>
             <label><input type="checkbox" data-extra="oscuro"> D.L.R Oscura (+$${preciosExtras.oscuro})</label><br>
             <label><input type="checkbox" data-extra="color"> D.L.R Color (+$${preciosExtras.color})</label><br>
             <h4>Estados de ropa</h4>
             <label><input type="checkbox" data-extra="semiSucio"> Semi Sucio (+$${preciosExtras.semiSucio})</label><br>
             <label><input type="checkbox" data-extra="sucio"> Sucio (+$${preciosExtras.sucio})</label><br>
             <label><input type="checkbox" data-extra="manchado"> Manchado (+$${preciosExtras.manchado})</label><br>
         </div>
         <div id="tab-resumen" class="tab-content" style="display:none;">
             <div id="resumenContenido"></div>
         </div>
         <div class="modal-buttons">
             <button type="submit" class="btn-modal btn-enviar" id="enviarReservaBtn">Enviar reserva</button>
             <button type="button" class="btn-modal btn-cancelar" id="cancelarReservaBtn">Cancelar</button>
         </div>
    `;

    const rangosContainer = document.getElementById('rangosBotonesContainer');
    rangosContainer.innerHTML = '';
    for (let rango of rangosDisponibles) {
        const precioInicial = preciosPorKg[planSeleccionado][rango];
        const btnDiv = document.createElement('div');
        btnDiv.className = 'rango-card';
        btnDiv.id = `btn-rango-${rango}`;
        btnDiv.innerHTML = `
             <div class="rango-nombre">${rango} kg</div>
             <div class="rango-precio">$${precioInicial}</div>
             <div class="rango-contador">0</div>
             <button type="button" class="btn-agregar-rango" data-rango="${rango}">+</button>
        `;
        rangosContainer.appendChild(btnDiv);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.fontWeight = '700';
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.padding = '8px 12px';
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(cont => cont.style.display = 'none');            document.querySelectorAll('.tab-btn').forEach(b => b.style.fontWeight = '400');
            document.getElementById(`tab-${tabId}`).style.display = 'block';
            btn.style.fontWeight = '700';
        });
    });

    document.querySelectorAll('input[name="plan"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            planSeleccionado = e.target.value;
            currentPesosSeleccionados = currentPesosSeleccionados.map(item => {
                const nuevoPrecio = preciosPorKg[planSeleccionado][item.rango];
                return { ...item, precioUnitario: nuevoPrecio };
            });
            actualizarBotonesRangos();
            actualizarListaPesos();
            actualizarResumen();
        });
    });

    document.querySelectorAll('[data-extra]').forEach(chk => {
        chk.addEventListener('change', (e) => {
            extrasMarcados[e.target.getAttribute('data-extra')] = e.target.checked;
            actualizarResumen();
        });
    });

    const btnUbicacion = document.getElementById('btnUbicacion');
    const direccionInput = document.getElementById('clienteDireccion');
    if (btnUbicacion) {
        btnUbicacion.addEventListener('click', () => {
            window.obtenerUbicacion(({ lat, lng, direccion }) => {
                direccionInput.value = direccion;
                window.mostrarMapa(lat, lng, 'mapaContainer');
            });
        });
    }

    document.getElementById('cancelarReservaBtn').addEventListener('click', () => {
        window.cerrarModal(document.getElementById('reservaModal'));
        resetFormularioReserva();
    });

    document.getElementById('enviarReservaBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('clienteNombre').value.trim();
        const telefono = document.getElementById('clienteTelefono').value.trim();
        const direccion = document.getElementById('clienteDireccion').value.trim();
        const carnet = document.getElementById('clienteCarnet').value.trim();
        const fechaHora = document.getElementById('clienteFechaHora').value;
        if (!nombre || !telefono || !direccion || !carnet || !fechaHora) {            window.showToast('Complete todos los datos del cliente', true);
            return;
        }
        if (!/^[0-9]{11}$/.test(carnet)) {
            window.showToast('Carnet debe tener 11 digitos numericos', true);
            return;
        }
        if (currentPesosSeleccionados.length === 0) {
            window.showToast('Debe seleccionar al menos un rango de peso', true);
            return;
        }
        const total = calcularTotal();
        const reserva = {
            cliente: { nombre, telefono, direccion, carnet, fechaHora },
            servicio: { plan: planSeleccionado, pesos: currentPesosSeleccionados },
            extras: extrasMarcados,
            total,
            fechaRegistro: new Date().toISOString()
        };
        window.guardarReservaEnLocalStorage(reserva);
        const mensaje = construirMensajeReserva(nombre, telefono, direccion, carnet, fechaHora, total);
        window.location.href = `https://wa.me/5352952442?text=${encodeURIComponent(mensaje)}`;
        window.cerrarModal(document.getElementById('reservaModal'));
        window.showToast('Reserva guardada localmente y enviada por WhatsApp', false);
        resetFormularioReserva();
    });

    actualizarBotonesRangos();
    actualizarResumen();
    formularioInicializado = true;
}

async function init() {
    const ok = await cargarPreciosKg();
    if (ok) renderizarFormulario();
}
init();
})();