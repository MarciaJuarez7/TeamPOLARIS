let miembros = [];
let eventos = [];

// ==================== MODAL DE ALERTA ====================
function mostrarAlerta(titulo, mensaje, tipo = 'success') {
    const modal = document.getElementById('modalAlerta');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalMensaje = document.getElementById('modalMensaje');
    const modalIcono = document.getElementById('modalIcono');

    modalTitulo.textContent = titulo;
    modalMensaje.textContent = mensaje;

    if (tipo === 'success') {
        modalIcono.className = 'w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center';
        modalIcono.innerHTML = `<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (tipo === 'error') {
        modalIcono.className = 'w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center';
        modalIcono.innerHTML = `<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    }

    modal.classList.remove('hidden');

    document.getElementById('modalAceptar').onclick = () => {
        modal.classList.add('hidden');
    };

    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };
}

// ==================== MODAL DE CONFIRMACIÓN ====================
function mostrarConfirmacion(titulo, mensaje, callback) {
    const modal = document.getElementById('modalConfirmacion');
    const confirmTitulo = document.getElementById('confirmTitulo');
    const confirmMensaje = document.getElementById('confirmMensaje');
    const btnEliminar = document.getElementById('confirmEliminar');
    const btnCancelar = document.getElementById('confirmCancelar');

    confirmTitulo.textContent = titulo;
    confirmMensaje.textContent = mensaje;

    modal.classList.remove('hidden');

    const nuevoEliminar = btnEliminar.cloneNode(true);
    const nuevoCancelar = btnCancelar.cloneNode(true);
    btnEliminar.parentNode.replaceChild(nuevoEliminar, btnEliminar);
    btnCancelar.parentNode.replaceChild(nuevoCancelar, btnCancelar);

    nuevoEliminar.onclick = () => {
        modal.classList.add('hidden');
        callback(true);
    };

    nuevoCancelar.onclick = () => {
        modal.classList.add('hidden');
        callback(false);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            callback(false);
        }
    };
}

// ==================== FUNCIONES AUXILIARES ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getIconoTipo(tipo) {
    const iconos = {
        'Conferencia': '🎤',
        'Taller': '🛠️',
        'Webinar': '💻',
        'Reunion': '🤝',
        'Capacitacion': '📚',
        'Social': '🎉'
    };
    return iconos[tipo] || '📅';
}

// ==================== CRUD DE MIEMBROS ====================
async function cargarMiembros() {
    try {
        const res = await fetch('/api/miembros');
        if (res.ok) miembros = await res.json();
    } catch (error) { console.error(error); }
}

// ==================== CHECKBOXES ====================
function renderCheckboxes(containerId, seleccionados = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!miembros.length) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay miembros registrados</p>';
        return;
    }
    container.innerHTML = miembros.map(m => `
                <div class="checkbox-item">
                    <input type="checkbox" value="${m.id}" id="${containerId}_${m.id}" ${seleccionados.includes(m.id) ? 'checked' : ''}>
                    <label for="${containerId}_${m.id}"><strong>${escapeHtml(m.nombre)}</strong> <span class="text-xs text-pink-600">(${escapeHtml(m.rol)})</span></label>
                </div>
            `).join('');
}

function getSeleccionados(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
}

// ==================== CREAR TARJETA HTML ====================
function crearTarjetaHTML(evento) {
    const nombres = (evento.asistentes || []).map(id => {
        const m = miembros.find(m => m.id === id);
        return m ? m.nombre : null;
    }).filter(n => n);

    return `
                <div id="evento-${evento.id}" class="border rounded-xl p-4 shadow hover:shadow-lg transition hover:border-pink-300">
                    <h3 class="text-lg font-bold text-pink-800">${escapeHtml(evento.nombre)}</h3>
                    <p class="text-gray-500 text-xs mb-1">${getIconoTipo(evento.tipo)} ${evento.tipo} | 📍 ${escapeHtml(evento.ubicacion)}</p>
                    <p class="text-gray-500 text-xs mb-2">📅 ${formatFecha(evento.fecha)} - ${evento.hora}</p>
                    <p class="text-gray-600 text-sm mb-2">${escapeHtml(evento.descripcion)}</p>
                    <div class="mt-2 pt-2 border-t">
                        <p class="text-pink-600 text-xs font-semibold">Asistentes (${nombres.length}):</p>
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${nombres.map(n => `<span class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">${escapeHtml(n)}</span>`).join('') || '<span class="text-gray-400 text-xs">Sin asistentes</span>'}
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-3">
                        <button onclick="editarItem(${evento.id})" class="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-sm transition">Editar</button>
                        <button onclick="eliminarItem(${evento.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">Eliminar</button>
                    </div>
                </div>
            `;
}

// ==================== ACTUALIZAR TARJETA ESPECÍFICA ====================
function actualizarTarjetaEventoEnDOM(id, nuevosDatos) {
    const indice = eventos.findIndex(e => e.id === parseInt(id));
    if (indice !== -1) {
        eventos[indice] = { ...eventos[indice], ...nuevosDatos };
        const tarjetaVieja = document.getElementById(`evento-${id}`);
        if (tarjetaVieja) {
            tarjetaVieja.outerHTML = crearTarjetaHTML(eventos[indice]);
        }
    }
}

// ==================== CARGAR EVENTOS ====================
async function cargarLista() {
    try {
        const res = await fetch('/api/eventos');
        eventos = await res.json();
        document.getElementById('totalEventos').textContent = eventos.length;
        const container = document.getElementById('lista');

        if (!eventos.length) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">📭 No hay eventos registrados</p>';
            return;
        }

        container.innerHTML = eventos.map(evento => crearTarjetaHTML(evento)).join('');
    } catch (error) {
        mostrarAlerta('Error', 'Error al cargar eventos', 'error');
    }
}

// ==================== REGISTRAR EVENTO ====================
document.getElementById('formPrincipal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const seleccionados = getSeleccionados('listaItems');
    if (seleccionados.length === 0) return mostrarAlerta('Error', 'Selecciona al menos un asistente', 'error');

    const data = {
        nombre: document.getElementById('nombre').value,
        ubicacion: document.getElementById('ubicacion').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        tipo: document.getElementById('tipo').value,
        descripcion: document.getElementById('descripcion').value,
        asistentes: seleccionados
    };

    try {
        const res = await fetch('/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
            mostrarAlerta('Agregado', `"${data.nombre}" registrado con ${seleccionados.length} asistente(s)`, 'success');
            document.getElementById('formPrincipal').reset();
            document.getElementById('formulario').classList.add('hidden');
            cargarLista();
        } else {
            mostrarAlerta('Error', 'No se pudo registrar el evento', 'error');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// ==================== EDITAR EVENTO ====================
window.editarItem = async (id) => {
    try {
        const res = await fetch(`/api/eventos/${id}`);
        const item = await res.json();
        document.getElementById('editId').value = item.id;
        document.getElementById('editNombre').value = item.nombre;
        document.getElementById('editUbicacion').value = item.ubicacion;
        document.getElementById('editFecha').value = item.fecha;
        document.getElementById('editHora').value = item.hora;
        document.getElementById('editTipo').value = item.tipo;
        document.getElementById('editDescripcion').value = item.descripcion;
        renderCheckboxes('editItems', item.asistentes || []);
        document.getElementById('modalEditar').classList.remove('hidden');
    } catch (error) {
        mostrarAlerta('Error', 'No se pudo cargar el evento', 'error');
    }
};

// ==================== GUARDAR EDICIÓN ====================
document.getElementById('formEditar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const seleccionados = getSeleccionados('editItems');

    const data = {
        nombre: document.getElementById('editNombre').value,
        ubicacion: document.getElementById('editUbicacion').value,
        fecha: document.getElementById('editFecha').value,
        hora: document.getElementById('editHora').value,
        tipo: document.getElementById('editTipo').value,
        descripcion: document.getElementById('editDescripcion').value,
        asistentes: seleccionados
    };

    try {
        const res = await fetch(`/api/eventos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
            mostrarAlerta('Actualizado', `"${data.nombre}" actualizado correctamente`, 'success');
            cerrarModal();
            actualizarTarjetaEventoEnDOM(id, data);
        } else {
            mostrarAlerta('Error', 'No se pudo actualizar el evento', 'error');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// ==================== ELIMINAR EVENTO ====================
window.eliminarItem = async (id) => {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;

    mostrarConfirmacion(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar el evento "${evento.nombre}"?`,
        async (confirmado) => {
            if (confirmado) {
                try {
                    const res = await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        mostrarAlerta('Eliminado', `"${evento.nombre}" eliminado correctamente`, 'success');
                        cargarLista();
                    } else {
                        mostrarAlerta('Error', 'No se pudo eliminar el evento', 'error');
                    }
                } catch (error) {
                    mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
                }
            }
        }
    );
};

// ==================== CERRAR MODAL ====================
window.cerrarModal = () => {
    document.getElementById('modalEditar').classList.add('hidden');
};

// ==================== TOGGLE FORMULARIO ====================
document.getElementById('btnNuevo')?.addEventListener('click', () => {
    const form = document.getElementById('formulario');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) renderCheckboxes('listaItems', []);
});

// Cancelar formulario
document.getElementById('btnCancelarForm')?.addEventListener('click', () => {
    document.getElementById('formulario').classList.add('hidden');
    document.getElementById('formPrincipal').reset();
    document.querySelectorAll('#listaItems input:checked').forEach(cb => cb.checked = false);
});

// ==================== MENÚ MÓVIL ====================
const menuBtn = document.getElementById('menuBtn'), menuMobile = document.getElementById('menuMobile');
if (menuBtn && menuMobile) menuBtn.addEventListener('click', () => menuMobile.classList.toggle('hidden'));

// ==================== INICIALIZAR ====================
async function init() {
    await cargarMiembros();
    await cargarLista();
}
init();