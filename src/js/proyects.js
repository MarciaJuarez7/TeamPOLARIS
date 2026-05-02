let miembros = [];
let proyectos = [];

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

// ==================== CRUD DE MIEMBROS ====================
async function cargarMiembros() {
    try {
        const res = await fetch('/api/miembros');
        if (res.ok) miembros = await res.json();
        console.log('Miembros cargados:', miembros);
    } catch (error) { console.error(error); }
}

// ==================== CHECKBOXES ====================
function renderizarCheckboxes(containerId, seleccionados = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!miembros.length) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay miembros registrados</p>';
        return;
    }
    container.innerHTML = miembros.map(m => `
                <div class="checkbox-item">
                    <input type="checkbox" value="${m.id}" id="${containerId}_${m.id}" ${seleccionados.includes(m.id) ? 'checked' : ''}>
                    <label for="${containerId}_${m.id}">
                        <strong>${escapeHtml(m.nombre)}</strong>
                        <span class="rol-badge">${escapeHtml(m.rol || 'Miembro')}</span>
                    </label>
                </div>
            `).join('');
}

function getSeleccionados(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
}

// ==================== CREAR TARJETA HTML ====================
function crearTarjetaHTML(proyecto) {
    const participantesIds = proyecto.participantes || [];
    const nombresParticipantes = participantesIds.map(id => {
        const m = miembros.find(m => m.id === id);
        return m ? m.nombre : null;
    }).filter(n => n);

    return `
                <div id="proyecto-${proyecto.id}" class="border rounded-xl p-4 shadow hover:shadow-xl transition card">
                    <h3 class="text-lg font-bold text-purple-800">${escapeHtml(proyecto.nombre)}</h3>
                    <p class="text-gray-500 text-xs mb-1">📁 ${escapeHtml(proyecto.tipo)} | 📅 ${escapeHtml(proyecto.fecha)}</p>
                    <p class="text-gray-600 text-sm mb-2">📝 ${escapeHtml(proyecto.descripcion)}</p>
                    <div class="mt-2 pt-2 border-t">
                        <p class="text-purple-600 text-xs font-semibold">👥 Participantes (${nombresParticipantes.length}):</p>
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${nombresParticipantes.length ? nombresParticipantes.map(n => `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">${escapeHtml(n)}</span>`).join('') : '<span class="text-xs text-gray-400">Sin participantes</span>'}
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-3">
                        <button onclick="editarItem(${proyecto.id})" class="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-sm transition">Editar</button>
                        <button onclick="eliminarItem(${proyecto.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">Eliminar</button>
                    </div>
                </div>
            `;
}

// ==================== ACTUALIZAR TARJETA ESPECÍFICA ====================
function actualizarTarjetaProyectoEnDOM(id, nuevosDatos) {
    const indice = proyectos.findIndex(p => p.id === parseInt(id));
    if (indice !== -1) {
        proyectos[indice] = { ...proyectos[indice], ...nuevosDatos };
        const tarjetaVieja = document.getElementById(`proyecto-${id}`);
        if (tarjetaVieja) {
            tarjetaVieja.outerHTML = crearTarjetaHTML(proyectos[indice]);
        }
    }
}

// ==================== CARGAR PROYECTOS ====================
async function cargarLista() {
    try {
        const res = await fetch('/api/proyectos');
        proyectos = await res.json();
        console.log('Proyectos cargados:', proyectos);
        document.getElementById('totalProyectos').textContent = proyectos.length;
        const container = document.getElementById('lista');

        if (!proyectos.length) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">📭 No hay proyectos registrados</p>';
            return;
        }

        container.innerHTML = proyectos.map(proyecto => crearTarjetaHTML(proyecto)).join('');
    } catch (error) {
        console.error('Error cargando:', error);
        mostrarAlerta('Error', 'Error al cargar proyectos', 'error');
    }
}

// ==================== REGISTRAR PROYECTO ====================
document.getElementById('formPrincipal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const seleccionados = getSeleccionados('listaItems');
    if (seleccionados.length === 0) return mostrarAlerta('Error', 'Selecciona al menos un participante', 'error');

    const nuevoProyecto = {
        nombre: document.getElementById('nombre').value.trim(),
        tipo: document.getElementById('tipo').value,
        fecha: document.getElementById('fecha').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        participantes: seleccionados
    };

    console.log('Registrando:', nuevoProyecto);

    try {
        const res = await fetch('/api/proyectos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProyecto)
        });

        if (res.ok) {
            mostrarAlerta('Éxito', `"${nuevoProyecto.nombre}" registrado con ${seleccionados.length} participante(s)`, 'success');
            document.getElementById('formPrincipal').reset();
            document.getElementById('formulario').classList.add('hidden');
            cargarLista();
        } else {
            const error = await res.json();
            mostrarAlerta('Error', error.error || 'No se pudo registrar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// ==================== EDITAR PROYECTO ====================
window.editarItem = async (id) => {
    console.log('Editando proyecto ID:', id);
    try {
        const res = await fetch(`/api/proyectos/${id}`);
        const item = await res.json();
        console.log('Datos del proyecto:', item);

        document.getElementById('editId').value = item.id;
        document.getElementById('editNombre').value = item.nombre;
        document.getElementById('editTipo').value = item.tipo;
        document.getElementById('editFecha').value = item.fecha;
        document.getElementById('editDescripcion').value = item.descripcion;

        const participantesIds = item.participantes || [];
        renderizarCheckboxes('editItems', participantesIds);
        document.getElementById('modalEditar').classList.remove('hidden');
    } catch (error) {
        console.error(error);
        mostrarAlerta('Error', 'No se pudo cargar el proyecto', 'error');
    }
};

// ==================== GUARDAR EDICIÓN ====================
document.getElementById('formEditar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const seleccionados = getSeleccionados('editItems');

    const proyecto = {
        nombre: document.getElementById('editNombre').value.trim(),
        tipo: document.getElementById('editTipo').value,
        fecha: document.getElementById('editFecha').value.trim(),
        descripcion: document.getElementById('editDescripcion').value.trim(),
        participantes: seleccionados
    };

    console.log('Actualizando proyecto ID:', id);
    console.log('Datos a enviar:', proyecto);

    try {
        const res = await fetch(`/api/proyectos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proyecto)
        });

        console.log('Respuesta status:', res.status);

        if (res.ok) {
            mostrarAlerta('Éxito', `"${proyecto.nombre}" actualizado correctamente`, 'success');
            cerrarModal();
            await cargarLista();
        } else {
            const error = await res.json();
            console.error('Error del servidor:', error);
            mostrarAlerta('Error', error.error || 'No se pudo actualizar', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// ==================== ELIMINAR PROYECTO ====================
window.eliminarItem = async (id) => {
    const proyecto = proyectos.find(p => p.id === id);
    if (!proyecto) return;

    mostrarConfirmacion(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar el proyecto "${proyecto.nombre}"?`,
        async (confirmado) => {
            if (confirmado) {
                try {
                    const res = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        mostrarAlerta('Éxito', `"${proyecto.nombre}" eliminado correctamente`, 'success');
                        cargarLista();
                    } else {
                        mostrarAlerta('Error', 'No se pudo eliminar', 'error');
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
    if (!form.classList.contains('hidden')) {
        renderizarCheckboxes('listaItems', []);
    }
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