const API = '/api/miembros';

// ==================== MODALES ====================
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

// ==================== CRUD ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function cargarMiembros() {
    try {
        const res = await fetch(API);
        const data = await res.json();
        document.getElementById('totalMiembros').textContent = data.length;
        const tbody = document.getElementById('tableBody');
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500 italic">No hay miembros registrados</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(m => `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td class="px-4 py-3">${m.id}</td>
                        <td class="px-4 py-3 font-medium">${escapeHtml(m.nombre)}</td>
                        <td class="px-4 py-3 hidden md:table-cell text-gray-500">${escapeHtml(m.correo)}</td>
                        <td class="px-4 py-3"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${escapeHtml(m.rol)}</span></td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <button onclick="editarMiembro(${m.id})" class="bg-teal-600 hover:bg-teal-700 text-white w-8 h-8 rounded-lg transition flex items-center justify-center" title="Editar">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z" />
                                    </svg>
                                </button>
                                <button onclick="eliminarMiembro(${m.id})" class="bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-lg transition flex items-center justify-center" title="Eliminar">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
    } catch (e) {
        console.error(e);
        mostrarAlerta('Error', 'No se pudieron cargar los miembros', 'error');
    }
}

// Registrar miembro
document.getElementById('formRegistro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const rol = document.getElementById('rol').value;

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, rol })
        });

        if (res.ok) {
            mostrarAlerta('Registrado agregado', `"${nombre}" registrad@ correctamente`, 'success');
            cargarMiembros();
            e.target.reset();
            document.getElementById('formularioPanel').classList.add('hidden');
        } else {
            mostrarAlerta('Error', 'No se pudo registrar el miembro', 'error');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// Editar miembro
window.editarMiembro = async (id) => {
    try {
        const res = await fetch(API);
        const data = await res.json();
        const m = data.find(x => x.id === id);
        document.getElementById('editId').value = m.id;
        document.getElementById('editNombre').value = m.nombre;
        document.getElementById('editCorreo').value = m.correo;
        document.getElementById('editRol').value = m.rol;
        document.getElementById('cardEdicion').style.display = 'flex';
    } catch (error) {
        mostrarAlerta('Error', 'No se pudo cargar el miembro', 'error');
    }
};

// Guardar edición
document.getElementById('formEdicion')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nombre = document.getElementById('editNombre').value;
    const correo = document.getElementById('editCorreo').value;
    const rol = document.getElementById('editRol').value;

    try {
        const res = await fetch(`${API}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, rol })
        });

        if (res.ok) {
            mostrarAlerta('Actualizado', `"${nombre}" actualizad@ correctamente`, 'success');
            cerrarEdicion();
            cargarMiembros();
        } else {
            mostrarAlerta('Error', 'No se pudo actualizar el miembro', 'error');
        }
    } catch (error) {
        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    }
});

// Eliminar miembro con confirmación
window.eliminarMiembro = async (id) => {
    try {
        const res = await fetch(API);
        const miembros = await res.json();
        const miembro = miembros.find(m => m.id === id);
        if (!miembro) return;

        mostrarConfirmacion(
            'Confirmar eliminación',
            `¿Estás seguro de que deseas eliminar a "${miembro.nombre}"?`,
            async (confirmado) => {
                if (confirmado) {
                    try {
                        const deleteRes = await fetch(`${API}/${id}`, { method: 'DELETE' });
                        if (deleteRes.ok) {
                            mostrarAlerta('Eliminad@', `"${miembro.nombre}" eliminad@ correctamente`, 'success');
                            cargarMiembros();
                        } else {
                            mostrarAlerta('Error', 'No se pudo eliminar el miembro', 'error');
                        }
                    } catch (error) {
                        mostrarAlerta('Error de conexión', 'No se pudo conectar con el servidor', 'error');
                    }
                }
            }
        );
    } catch (error) {
        mostrarAlerta('Error', 'No se pudo obtener información del miembro', 'error');
    }
};

window.cerrarEdicion = () => document.getElementById('cardEdicion').style.display = 'none';

// Toggle formulario
document.getElementById('btnMostrarFormulario')?.addEventListener('click', () => {
    const form = document.getElementById('formularioPanel');
    form.classList.toggle('hidden');
});

// Cancelar formulario
document.getElementById('btnCancelarForm')?.addEventListener('click', () => {
    document.getElementById('formularioPanel').classList.add('hidden');
    document.getElementById('formRegistro').reset();
});

// Menú móvil
const menuBtn = document.getElementById('menuBtn');
const menuMobile = document.getElementById('menuMobile');
if (menuBtn && menuMobile) {
    menuBtn.addEventListener('click', () => {
        menuMobile.classList.toggle('hidden');
    });
    menuMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => menuMobile.classList.add('hidden'));
    });
}

cargarMiembros();

