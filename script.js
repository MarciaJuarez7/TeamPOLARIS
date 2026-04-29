// Al cargar la página, se muestran los miembros
document.addEventListener('DOMContentLoaded', function() {
    cargarMiembros();
    setTimeout(() => {
        inicializarModuloProyectos();
        actualizarContadoresDashboard();
    }, 100);
});

async function actualizarContadoresDashboard() {
    try {
        const responseMiembros = await fetch('/api/miembros');
        const miembros = await responseMiembros.json();
        
        const responseProyectos = await fetch('/api/proyectos');
        const proyectos = await responseProyectos.json();
        
        const responseEventos = await fetch('/api/eventos');
        const eventos = await responseEventos.json();
        
        const totalMiembrosSpan = document.getElementById('totalMiembros');
        const totalProyectosSpan = document.getElementById('totalProyectos');
        const totalEventosSpan = document.getElementById('totalEventos');
        
        if (totalMiembrosSpan) totalMiembrosSpan.textContent = miembros.length;
        if (totalProyectosSpan) totalProyectosSpan.textContent = proyectos.length;
        if (totalEventosSpan) totalEventosSpan.textContent = eventos.length;
    } catch (error) {}
}

function mostrarModal(titulo, mensaje, tipo="info", callback=null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const btnOk = document.getElementById('modal-ok');
    const btnCancel = document.getElementById('modal-cancel');

    modalTitle.textContent = titulo;
    modalMessage.textContent = mensaje;

    if (tipo === "confirm") {
        btnCancel.style.display = "inline-block";
    } else {
        btnCancel.style.display = "none";
    }

    modal.style.display = "flex";

    btnOk.onclick = () => {
        modal.style.display = "none";
        if (callback) callback(true);
    };
    btnCancel.onclick = () => {
        modal.style.display = "none";
        if (callback) callback(false);
    };
}

const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async function(evento) {
        evento.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;
        const rol = document.getElementById('rol').value;

        try {
            const respuesta = await fetch('/api/miembros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, rol })
            });

            if (respuesta.ok) {
                document.getElementById('formRegistro').reset();
                await cargarMiembros();
                await cargarMiembrosParaCheckboxes();
                await actualizarContadoresDashboard();
                mostrarModal("Registro exitoso", "¡Miembro registrado correctamente!");
            } else {
                mostrarModal("Error", "No se pudo registrar el miembro");
            }
        } catch (error) {
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}



// Cargar miembros
async function cargarMiembros() {
    try {
        const respuesta = await fetch('/api/miembros');
        const miembros = await respuesta.json();

        const tableBody = document.getElementById('tableBody');

        if (!tableBody) return;

        if (miembros.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500 italic">No hay miembros registrados</td></tr>';
            return;
        }

        let contenido = '';
        for (let miembro of miembros) {
            contenido += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-4 py-3 border-b">${miembro.id}</td>
                    <td class="px-4 py-3 border-b font-medium">${escapeHtml(miembro.nombre)}</td>
                    <td class="px-4 py-3 border-b hidden md:table-cell">${escapeHtml(miembro.correo)}</td>
                    <td class="px-4 py-3 border-b">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${escapeHtml(miembro.rol)}</span>
                    </td>
                    <td class="px-4 py-3 border-b">
                        <div class="flex items-center gap-2">
                            <button class="inline-flex items-center justify-center bg-teal-500 text-white w-8 h-8 rounded-lg hover:bg-teal-600 transition" onclick="editarMiembro(${miembro.id})" title="Editar" aria-label="Editar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button class="inline-flex items-center justify-center bg-red-500 text-white w-8 h-8 rounded-lg hover:bg-red-600 transition" onclick="eliminarMiembro(${miembro.id})" title="Eliminar" aria-label="Eliminar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        tableBody.innerHTML = contenido;
    } catch (error) {
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-500 italic">Error al cargar los miembros</td></tr>';
        }
    }
}


async function editarMiembro(id) {
    try {
        const respuesta = await fetch('/api/miembros');
        const miembros = await respuesta.json();
        const miembro = miembros.find(m => m.id === id);

        if (!miembro) {
            mostrarModal("Error", "Miembro no encontrado");
            return;
        }

        document.getElementById('editId').value = miembro.id;
        document.getElementById('editNombre').value = miembro.nombre;
        document.getElementById('editCorreo').value = miembro.correo;
        document.getElementById('editRol').value = miembro.rol;

        document.getElementById('cardEdicion').style.display = 'flex';
    } catch (error) {

        mostrarModal("Error", "No se pudo cargar el miembro");

    }
}


const formEdicion = document.getElementById('formEdicion');
if (formEdicion) {
    formEdicion.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const nombre = document.getElementById('editNombre').value;
        const correo = document.getElementById('editCorreo').value;
        const rol = document.getElementById('editRol').value;

        try {
            const respuesta = await fetch(`/api/miembros/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, rol })
            });

            if (respuesta.ok) {
                cancelarEdicion();
                await cargarMiembros();
                await cargarMiembrosParaCheckboxes();
                await actualizarContadoresDashboard();
                mostrarModal("Actualización", "Miembro actualizado correctamente");
            } else {
                mostrarModal("Error", "No se pudo actualizar el miembro");
            }
        } catch (error) {
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}

function cancelarEdicion() {
    document.getElementById('formEdicion').reset();
    document.getElementById('editId').value = '';
    document.getElementById('cardEdicion').style.display = 'none';
}

const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener('click', cancelarEdicion);
}

async function eliminarMiembro(id) {
    mostrarModal("Confirmar eliminación", "¿Seguro que deseas eliminar este miembro?", "confirm", async (confirmado) => {
        if (!confirmado) return;

        try {
            const respuesta = await fetch(`/api/miembros/${id}`, { method: 'DELETE' });

            if (respuesta.ok) {
                await cargarMiembros();
                await cargarMiembrosParaCheckboxes();
                await actualizarContadoresDashboard();
                mostrarModal("Eliminado", "Miembro eliminado correctamente");
            } else {
                mostrarModal("Error", "No se pudo eliminar el miembro");
            }
        } catch (error) {
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}

// ==================== MODULO DE PROYECTOS ====================

let proyectos = [];
let miembrosParaProyectos = [];

async function cargarMiembrosParaCheckboxes() {
    try {
        const response = await fetch('/api/miembros');
        
        if (response.ok) {
            miembrosParaProyectos = await response.json();
            renderCheckboxesParticipantes();
            renderCheckboxesEdicionParticipantesEmpty();
        } else {
            const container = document.getElementById('participantesCheckboxes');
            if (container) {
                container.innerHTML = '<p class="text-center text-red-500 py-4">Error al cargar miembros</p>';
            }
        }
    } catch (error) {
        const container = document.getElementById('participantesCheckboxes');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-500 py-4">No se pudo conectar con el servidor</p>';
        }
    }
}

function renderCheckboxesParticipantes() {
    const container = document.getElementById('participantesCheckboxes');
    
    if (!container) return;
    
    if (!miembrosParaProyectos || miembrosParaProyectos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-slate-500 italic">No hay miembros registrados.</p>
                <p class="text-xs text-slate-400 mt-2">Registra miembros primero en la sección de Miembros.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = miembrosParaProyectos.map(miembro => `
        <div class="checkbox-item flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer mb-2">
            <input type="checkbox" id="miembro_${miembro.id}" value="${miembro.id}" class="participante-checkbox w-5 h-5 text-blue-600 rounded mr-3">
            <label for="miembro_${miembro.id}" class="flex-1 cursor-pointer">
                <span class="font-medium text-slate-700">${escapeHtml(miembro.nombre)}</span>
                <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">${escapeHtml(miembro.rol)}</span>
                <span class="text-xs text-slate-400 ml-2">${escapeHtml(miembro.correo)}</span>
            </label>
        </div>
    `).join('');
}

function renderCheckboxesEdicionParticipantesEmpty() {
    const container = document.getElementById('editParticipantesCheckboxes');
    if (container && miembrosParaProyectos && miembrosParaProyectos.length > 0) {
        container.innerHTML = miembrosParaProyectos.map(miembro => `
            <div class="checkbox-item flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:bg-blue-50 transition cursor-pointer mb-2">
                <input type="checkbox" id="edit_miembro_${miembro.id}" value="${miembro.id}" class="edit-participante-checkbox w-5 h-5 text-blue-600 rounded mr-3">
                <label for="edit_miembro_${miembro.id}" class="flex-1 cursor-pointer">
                    <span class="font-medium text-slate-700">${escapeHtml(miembro.nombre)}</span>
                    <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">${escapeHtml(miembro.rol)}</span>
                </label>
            </div>
        `).join('');
    }
}

function getParticipantesSeleccionados() {
    const checkboxes = document.querySelectorAll('.participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    return miembrosParaProyectos.filter(miembro => idsSeleccionados.includes(miembro.id));
}

async function registrarProyecto(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('proyectoNombre').value.trim();
    const tipo = document.getElementById('proyectoTipo').value;
    const fecha = document.getElementById('proyectoFecha').value.trim();
    const descripcion = document.getElementById('proyectoDescripcion').value.trim();
    const participantes = getParticipantesSeleccionados();
    
    if (!nombre) {
        mostrarModal('Error de validación', 'Por favor ingresa el nombre del proyecto/evento.');
        return;
    }
    
    if (!tipo) {
        mostrarModal('Error de validación', 'Por favor selecciona un tipo.');
        return;
    }
    
    if (!fecha) {
        mostrarModal('Error de validación', 'Por favor ingresa la fecha o periodo.');
        return;
    }
    
    if (!descripcion) {
        mostrarModal('Error de validación', 'Por favor ingresa una descripción breve.');
        return;
    }
    
    if (participantes.length === 0) {
        mostrarModal('Error de validación', 'Debes seleccionar al menos un participante inicial.');
        return;
    }
    
    const nuevoProyecto = {
        nombre,
        tipo,
        fecha,
        descripcion,
        participantes: participantes
    };
    
    try {
        const response = await fetch('/api/proyectos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProyecto)
        });
        
        if (response.ok) {
            mostrarModal('Éxito', `${tipo} "${nombre}" registrado correctamente con ${participantes.length} participante(s).`);
            document.getElementById('formProyecto').reset();
            document.querySelectorAll('.participante-checkbox').forEach(cb => cb.checked = false);
            await cargarProyectos();
            await actualizarContadoresDashboard();
        } else {
            const error = await response.json();
            mostrarModal('Error', error.error || 'No se pudo registrar el proyecto.');
        }
    } catch (error) {
        mostrarModal('Error de conexión', 'No se pudo conectar con el servidor.');
    }
}

async function cargarProyectos() {
    try {
        const response = await fetch('/api/proyectos');
        if (response.ok) {
            proyectos = await response.json();
            renderListaProyectos();
        } else {
            const listaProyectos = document.getElementById('listaProyectos');
            if (listaProyectos) {
                listaProyectos.innerHTML = '<p class="text-center text-red-500 py-8 italic">Error al cargar proyectos</p>';
            }
        }
    } catch (error) {
        const listaProyectos = document.getElementById('listaProyectos');
        if (listaProyectos) {
            listaProyectos.innerHTML = '<p class="text-center text-red-500 py-8 italic">No se pudo conectar con el servidor</p>';
        }
    }
}

function renderListaProyectos() {
    const container = document.getElementById('listaProyectos');
    
    if (!container) return;
    
    if (!proyectos || proyectos.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 italic py-8">No hay proyectos registrados aún. ¡Crea el primero!</p>';
        return;
    }
    
    const proyectosOrdenados = [...proyectos].reverse();
    
    container.innerHTML = proyectosOrdenados.map(proyecto => {
        return `
            <div class="proyecto-card bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 shadow-md hover:shadow-xl transition border-l-4 border-blue-500">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-bold text-blue-900">${getIconoPorTipo(proyecto.tipo)} ${escapeHtml(proyecto.nombre)}</h3>
                    <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">${escapeHtml(proyecto.tipo)}</span>
                </div>
                <p class="text-sm text-slate-500 mb-2">📅 ${escapeHtml(proyecto.fecha)}</p>
                <p class="text-slate-600 text-sm mb-3">${escapeHtml(proyecto.descripcion)}</p>
                
                <div class="bg-slate-100 rounded-lg p-3 mb-3">
                    <p class="text-xs font-semibold text-slate-600 mb-2">👥 Participantes (${proyecto.participantes.length})</p>
                    <div class="flex flex-wrap gap-1">
                        ${proyecto.participantes.map(p => `
                            <span class="text-xs bg-white px-2 py-1 rounded-full shadow-sm">${escapeHtml(p.nombre)}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <button onclick="editarProyecto(${proyecto.id})" class="inline-flex items-center justify-center bg-teal-500 text-white w-8 h-8 rounded-lg hover:bg-teal-600 transition" title="Editar" aria-label="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarProyecto(${proyecto.id})" class="inline-flex items-center justify-center bg-red-500 text-white w-8 h-8 rounded-lg hover:bg-red-600 transition" title="Eliminar" aria-label="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getIconoPorTipo(tipo) {
    const iconos = {
        'Proyecto': '',
        'Competencia': '',
        'Evento': '',
        'Actividad': '',
        'Hackathon': '',
        'Feria': '',
        'Prototipo': ''
    };
    return iconos[tipo] || '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== FUNCIONES PARA EDITAR PROYECTOS ====================

async function editarProyecto(id) {
    try {
        await cargarMiembrosParaCheckboxes();
        
        const respuesta = await fetch(`/api/proyectos/${id}`);
        const proyecto = await respuesta.json();

        if (!respuesta.ok) {
            mostrarModal("Error", "Proyecto no encontrado");
            return;
        }

        document.getElementById('editProyectoId').value = proyecto.id;
        document.getElementById('editProyectoNombre').value = proyecto.nombre;
        document.getElementById('editProyectoTipo').value = proyecto.tipo;
        document.getElementById('editProyectoFecha').value = proyecto.fecha;
        document.getElementById('editProyectoDescripcion').value = proyecto.descripcion;

        renderCheckboxesEdicionParticipantes(proyecto.participantes);
        document.getElementById('cardEdicionProyecto').style.display = 'flex';
    } catch (error) {
        mostrarModal("Error", "No se pudo cargar el proyecto");
    }
}

function renderCheckboxesEdicionParticipantes(participantesActuales) {
    const container = document.getElementById('editParticipantesCheckboxes');
    
    if (!container) return;
    
    if (!miembrosParaProyectos || miembrosParaProyectos.length === 0) {
        container.innerHTML = `<div class="text-center py-8"><p class="text-slate-500 italic">No hay miembros registrados.</p></div>`;
        return;
    }
    
    const idsParticipantes = participantesActuales.map(p => p.id);
    
    container.innerHTML = miembrosParaProyectos.map(miembro => {
        const checked = idsParticipantes.includes(miembro.id) ? 'checked' : '';
        return `
            <div class="checkbox-item flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:bg-blue-50 transition cursor-pointer mb-2">
                <input type="checkbox" id="edit_miembro_${miembro.id}" value="${miembro.id}" class="edit-participante-checkbox w-5 h-5 text-blue-600 rounded mr-3" ${checked}>
                <label for="edit_miembro_${miembro.id}" class="flex-1 cursor-pointer">
                    <span class="font-medium text-slate-700">${escapeHtml(miembro.nombre)}</span>
                    <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">${escapeHtml(miembro.rol)}</span>
                </label>
            </div>
        `;
    }).join('');
}

function getParticipantesSeleccionadosEdicion() {
    const checkboxes = document.querySelectorAll('.edit-participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    return miembrosParaProyectos.filter(miembro => idsSeleccionados.includes(miembro.id));
}

const formEdicionProyecto = document.getElementById('formEdicionProyecto');
if (formEdicionProyecto) {
    formEdicionProyecto.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('editProyectoId').value;
        const nombre = document.getElementById('editProyectoNombre').value.trim();
        const tipo = document.getElementById('editProyectoTipo').value;
        const fecha = document.getElementById('editProyectoFecha').value.trim();
        const descripcion = document.getElementById('editProyectoDescripcion').value.trim();
        const participantes = getParticipantesSeleccionadosEdicion();

        if (!nombre || !tipo || !fecha || !descripcion) {
            mostrarModal('Error de validación', 'Todos los campos son obligatorios.');
            return;
        }
        
        if (participantes.length === 0) {
            mostrarModal('Error de validación', 'Debes seleccionar al menos un participante.');
            return;
        }

        try {
            const respuesta = await fetch(`/api/proyectos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, tipo, fecha, descripcion, participantes })
            });

            if (respuesta.ok) {
                cancelarEdicionProyecto();
                await cargarProyectos();
                await actualizarContadoresDashboard();
                mostrarModal("Actualización", `${tipo} "${nombre}" actualizado correctamente`);
            } else {
                const error = await respuesta.json();
                mostrarModal("Error", error.error || "No se pudo actualizar el proyecto");
            }
        } catch (error) {
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}

function cancelarEdicionProyecto() {
    document.getElementById('formEdicionProyecto').reset();
    document.getElementById('editProyectoId').value = '';
    document.getElementById('cardEdicionProyecto').style.display = 'none';
}

const btnCancelarEdicionProyecto = document.getElementById('btnCancelarEdicionProyecto');
if (btnCancelarEdicionProyecto) {
    btnCancelarEdicionProyecto.addEventListener('click', cancelarEdicionProyecto);
}

async function eliminarProyecto(id) {
    try {
        const respuesta = await fetch(`/api/proyectos/${id}`);
        const proyecto = await respuesta.json();
        
        if (!respuesta.ok) {
            mostrarModal("Error", "Proyecto no encontrado");
            return;
        }

        mostrarModal(`${proyecto.tipo}: ${proyecto.nombre}`, `¿Seguro que deseas eliminar "${proyecto.nombre}"?`, "confirm", async (confirmado) => {
            if (!confirmado) return;

            try {
                const respuesta = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });

                if (respuesta.ok) {
                    await cargarProyectos();
                    await actualizarContadoresDashboard();
                    mostrarModal("Eliminado", `${proyecto.tipo} "${proyecto.nombre}" eliminado correctamente`);
                } else {
                    mostrarModal("Error", "No se pudo eliminar el proyecto");
                }
            } catch (error) {
                mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
            }
        });
    } catch (error) {
        mostrarModal("Error", "No se pudo obtener información del proyecto");
    }
}

function inicializarModuloProyectos() {
    const container = document.getElementById('participantesCheckboxes');
    if (!container) return;
    
    cargarMiembrosParaCheckboxes();
    cargarProyectos();
    
    const formProyecto = document.getElementById('formProyecto');
    if (formProyecto) {
        formProyecto.removeEventListener('submit', registrarProyecto);
        formProyecto.addEventListener('submit', registrarProyecto);
    }
}

// ==================== MODULO DE EVENTOS ====================

let eventos = [];

async function cargarMiembrosParaEventos() {
    try {
        const response = await fetch('/api/miembros');
        if (response.ok) {
            const miembros = await response.json();
            renderCheckboxesEventos(miembros);
        } else {
            const container = document.getElementById('eventoParticipantesCheckboxes');
            if (container) {
                container.innerHTML = '<p class="text-center text-red-500 py-4">Error al cargar miembros</p>';
            }
        }
    } catch (error) {
        const container = document.getElementById('eventoParticipantesCheckboxes');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-500 py-4">No se pudo conectar con el servidor</p>';
        }
    }
}

function renderCheckboxesEventos(miembros) {
    const container = document.getElementById('eventoParticipantesCheckboxes');
    
    if (!container) return;
    
    if (!miembros || miembros.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-slate-500 italic">No hay miembros registrados.</p>
                <p class="text-xs text-slate-400 mt-2">Registra miembros primero en la sección de Miembros.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = miembros.map(miembro => `
        <div class="checkbox-item flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:bg-pink-50 hover:border-pink-300 transition cursor-pointer mb-2">
            <input type="checkbox" id="evento_miembro_${miembro.id}" value="${miembro.id}" class="evento-participante-checkbox w-5 h-5 text-pink-600 rounded mr-3">
            <label for="evento_miembro_${miembro.id}" class="flex-1 cursor-pointer">
                <span class="font-medium text-slate-700">${escapeHtml(miembro.nombre)}</span>
                <span class="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full ml-2">${escapeHtml(miembro.rol)}</span>
                <span class="text-xs text-slate-400 ml-2">${escapeHtml(miembro.correo)}</span>
            </label>
        </div>
    `).join('');
}

async function getAsistentesSeleccionadosEvento() {
    const checkboxes = document.querySelectorAll('.evento-participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const response = await fetch('/api/miembros');
    const miembros = await response.json();
    return miembros.filter(miembro => idsSeleccionados.includes(miembro.id));
}

async function registrarEvento(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('eventoNombre').value.trim();
    const ubicacion = document.getElementById('eventoUbicacion').value.trim();
    const fecha = document.getElementById('eventoFecha').value;
    const hora = document.getElementById('eventoHora').value;
    const tipo = document.getElementById('eventoTipo').value;
    const descripcion = document.getElementById('eventoDescripcion').value.trim();
    const asistentes = await getAsistentesSeleccionadosEvento();
    
    if (!nombre || !ubicacion || !fecha || !hora || !tipo || !descripcion) {
        mostrarModal('Error de validación', 'Todos los campos son obligatorios.');
        return;
    }
    
    if (asistentes.length === 0) {
        mostrarModal('Error de validación', 'Debes seleccionar al menos un asistente.');
        return;
    }
    
    try {
        const response = await fetch('/api/eventos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes })
        });
        
        if (response.ok) {
            mostrarModal('Éxito', `Evento "${nombre}" registrado correctamente con ${asistentes.length} asistente(s).`);
            document.getElementById('formEvento').reset();
            document.querySelectorAll('.evento-participante-checkbox').forEach(cb => cb.checked = false);
            await cargarEventos();
            await actualizarContadoresDashboard();
        } else {
            const error = await response.json();
            mostrarModal('Error', error.error || 'No se pudo registrar el evento.');
        }
    } catch (error) {
        mostrarModal('Error de conexión', 'No se pudo conectar con el servidor.');
    }
}

async function cargarEventos() {
    try {
        const response = await fetch('/api/eventos');
        if (response.ok) {
            eventos = await response.json();
            renderListaEventos();
        } else {
            const container = document.getElementById('listaEventos');
            if (container) {
                container.innerHTML = '<p class="text-center text-red-500 py-8 italic">Error al cargar eventos</p>';
            }
        }
    } catch (error) {
        const container = document.getElementById('listaEventos');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-500 py-8 italic">No se pudo conectar con el servidor</p>';
        }
    }
}

function renderListaEventos() {
    const container = document.getElementById('listaEventos');
    
    if (!container) return;
    
    if (!eventos || eventos.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 italic py-8">No hay eventos registrados aún. ¡Crea el primero!</p>';
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        const fechaObj = new Date(evento.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="evento-card bg-gradient-to-br from-white to-pink-50 rounded-xl p-5 shadow-md hover:shadow-xl transition border-l-4 border-pink-500">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-bold text-pink-800">${getIconoPorTipoEvento(evento.tipo)} ${escapeHtml(evento.nombre)}</h3>
                    <span class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">${escapeHtml(evento.tipo)}</span>
                </div>
                <div class="space-y-2 mb-3">
                    <p class="text-sm text-slate-600 flex items-center gap-2">
                        <span>📅</span> ${fechaFormateada} - ${evento.hora}
                    </p>
                    <p class="text-sm text-slate-600 flex items-center gap-2">
                        <span>📍</span> ${escapeHtml(evento.ubicacion)}
                    </p>
                    <p class="text-slate-600 text-sm">${escapeHtml(evento.descripcion)}</p>
                </div>
                
                <div class="bg-pink-100 rounded-lg p-3 mb-3">
                    <p class="text-xs font-semibold text-pink-700 mb-2">👥 Asistentes (${evento.asistentes.length})</p>
                    <div class="flex flex-wrap gap-1">
                        ${evento.asistentes.map(a => `
                            <span class="text-xs bg-white px-2 py-1 rounded-full shadow-sm">${escapeHtml(a.nombre)}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <button onclick="editarEvento(${evento.id})" class="inline-flex items-center justify-center bg-teal-500 text-white w-8 h-8 rounded-lg hover:bg-teal-600 transition" title="Editar" aria-label="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarEvento(${evento.id})" class="inline-flex items-center justify-center bg-red-500 text-white w-8 h-8 rounded-lg hover:bg-red-600 transition" title="Eliminar" aria-label="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getIconoPorTipoEvento(tipo) {
    const iconos = {
        'Conferencia': '',
        'Taller': '',
        'Webinar': '',
        'Reunión': '',
        'Capacitación': '',
        'Social': ''
    };
    return iconos[tipo] || '';
}

async function editarEvento(id) {
    try {
        const respuesta = await fetch(`/api/eventos/${id}`);
        const evento = await respuesta.json();

        if (!respuesta.ok) {
            mostrarModal("Error", "Evento no encontrado");
            return;
        }
        
        const responseMiembros = await fetch('/api/miembros');
        const miembros = await responseMiembros.json();
        
        document.getElementById('editEventoId').value = evento.id;
        document.getElementById('editEventoNombre').value = evento.nombre;
        document.getElementById('editEventoUbicacion').value = evento.ubicacion;
        document.getElementById('editEventoFecha').value = evento.fecha;
        document.getElementById('editEventoHora').value = evento.hora;
        document.getElementById('editEventoTipo').value = evento.tipo;
        document.getElementById('editEventoDescripcion').value = evento.descripcion;
        
        // Limpiar el contenedor ANTES de renderizar
        const container = document.getElementById('editEventoParticipantesCheckboxes');
        if (container) {
            container.innerHTML = '';
        }
        
        renderCheckboxesEdicionEventos(miembros, evento.asistentes);
        document.getElementById('cardEdicionEvento').style.display = 'flex';
    } catch (error) {
        mostrarModal("Error", "No se pudo cargar el evento");
    }
}

function renderCheckboxesEdicionEventos(miembros, asistentesActuales) {
    const container = document.getElementById('editEventoParticipantesCheckboxes');
    
    if (!container) return;
    
    // Limpiar el contenedor antes de agregar nuevos checkboxes
    container.innerHTML = '';
    
    if (!miembros || miembros.length === 0) {
        container.innerHTML = `<div class="text-center py-8"><p class="text-slate-500 italic">No hay miembros registrados.</p></div>`;
        return;
    }
    
    const idsAsistentes = asistentesActuales.map(a => a.id);
    
    const html = miembros.map(miembro => {
        const checked = idsAsistentes.includes(miembro.id) ? 'checked' : '';
        return `
            <div class="checkbox-item flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:bg-pink-50 hover:border-pink-300 transition cursor-pointer mb-2">
                <input type="checkbox" id="edit_evento_miembro_${miembro.id}" value="${miembro.id}" class="edit-evento-participante-checkbox w-5 h-5 text-pink-600 rounded mr-3" ${checked}>
                <label for="edit_evento_miembro_${miembro.id}" class="flex-1 cursor-pointer">
                    <span class="font-medium text-slate-700">${escapeHtml(miembro.nombre)}</span>
                    <span class="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full ml-2">${escapeHtml(miembro.rol)}</span>
                </label>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function getAsistentesSeleccionadosEdicionEvento() {
    const checkboxes = document.querySelectorAll('.edit-evento-participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const response = await fetch('/api/miembros');
    const miembros = await response.json();
    return miembros.filter(miembro => idsSeleccionados.includes(miembro.id));
}

const formEdicionEvento = document.getElementById('formEdicionEvento');
if (formEdicionEvento) {
    formEdicionEvento.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editEventoId').value);
        const nombre = document.getElementById('editEventoNombre').value.trim();
        const ubicacion = document.getElementById('editEventoUbicacion').value.trim();
        const fecha = document.getElementById('editEventoFecha').value;
        const hora = document.getElementById('editEventoHora').value;
        const tipo = document.getElementById('editEventoTipo').value;
        const descripcion = document.getElementById('editEventoDescripcion').value.trim();
        const asistentes = await getAsistentesSeleccionadosEdicionEvento();
        
        if (!nombre || !ubicacion || !fecha || !hora || !tipo || !descripcion) {
            mostrarModal('Error de validación', 'Todos los campos son obligatorios.');
            return;
        }
        
        if (asistentes.length === 0) {
            mostrarModal('Error de validación', 'Debes seleccionar al menos un asistente.');
            return;
        }

        try {
            const respuesta = await fetch(`/api/eventos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes })
            });

            if (respuesta.ok) {
                cerrarEdicionEvento();
                await cargarEventos();
                await actualizarContadoresDashboard();
                mostrarModal("Actualización", `Evento "${nombre}" actualizado correctamente`);
            } else {
                const error = await respuesta.json();
                mostrarModal("Error", error.error || "No se pudo actualizar el evento");
            }
        } catch (error) {
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}

function cerrarEdicionEvento() {
    document.getElementById('formEdicionEvento').reset();
    document.getElementById('editEventoId').value = '';
    document.getElementById('cardEdicionEvento').style.display = 'none';
}

async function eliminarEvento(id) {
    try {
        const respuesta = await fetch(`/api/eventos/${id}`);
        const evento = await respuesta.json();
        
        if (!respuesta.ok) {
            mostrarModal("Error", "Evento no encontrado");
            return;
        }

        mostrarModal("Confirmar eliminación", `¿Seguro que deseas eliminar el evento "${evento.nombre}"?`, "confirm", async (confirmado) => {
            if (!confirmado) return;

            try {
                const respuesta = await fetch(`/api/eventos/${id}`, { method: 'DELETE' });

                if (respuesta.ok) {
                    await cargarEventos();
                    await actualizarContadoresDashboard();
                    mostrarModal("Eliminado", `Evento "${evento.nombre}" eliminado correctamente`);
                } else {
                    mostrarModal("Error", "No se pudo eliminar el evento");
                }
            } catch (error) {
                mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
            }
        });
    } catch (error) {
        mostrarModal("Error", "No se pudo obtener información del evento");
    }
}

function inicializarModuloEventos() {
    cargarMiembrosParaEventos();
    cargarEventos();
    
    const formEvento = document.getElementById('formEvento');
    if (formEvento) {
        formEvento.removeEventListener('submit', registrarEvento);
        formEvento.addEventListener('submit', registrarEvento);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarModuloEventos, 200);
    });
} else {
    setTimeout(inicializarModuloEventos, 200);
}

window.cerrarEdicion = function() {
    document.getElementById('cardEdicion').style.display = 'none';
};

window.cerrarEdicionProyecto = function() {
    document.getElementById('cardEdicionProyecto').style.display = 'none';
};

window.cerrarEdicionEvento = cerrarEdicionEvento;
window.editarEvento = editarEvento;
window.eliminarEvento = eliminarEvento;
window.actualizarContadores = actualizarContadoresDashboard;
window.editarProyecto = editarProyecto;
window.eliminarProyecto = eliminarProyecto;
window.editarMiembro = editarMiembro;
window.eliminarMiembro = eliminarMiembro;

// ==================== MENÚ HAMBURGUESA ====================

function initMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const menuMobile = document.getElementById('menuMobile');
    const nav = document.querySelector('nav');
    
    if (!menuBtn || !menuMobile) return;
    
    menuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = menuMobile.classList.contains('show');
        
        if (isOpen) {
            menuMobile.classList.remove('show');
            nav.classList.remove('menu-open');
        } else {
            menuMobile.classList.add('show');
            nav.classList.add('menu-open');
        }
    });
    
    const mobileLinks = document.querySelectorAll('#menuMobile a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuMobile.classList.remove('show');
            nav.classList.remove('menu-open');
        });
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            menuMobile.classList.remove('show');
            nav.classList.remove('menu-open');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}