// Al cargar la página, se muestran los miembros
document.addEventListener('DOMContentLoaded', function() {
    cargarMiembros();
});

// Función para mostrar modal
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

// Registrar nuevo miembro
document.getElementById('formRegistro').addEventListener('submit', async function(evento) {
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
            cargarMiembros();
            cargarMiembrosParaCheckboxes(); // Actualizar checkboxes de participantes
            mostrarModal("Registro exitoso", "¡Miembro registrado correctamente!");
        } else {
            mostrarModal("Error", "No se pudo registrar el miembro");
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
    }
});

// Cargar miembros en la tabla
async function cargarMiembros() {
    try {
        const respuesta = await fetch('/api/miembros');
        const miembros = await respuesta.json();

        const tableBody = document.getElementById('tableBody');

        if (miembros.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-message">No hay miembros registrados</td></tr>';
            return;
        }

        let contenido = '';
        for (let miembro of miembros) {
            contenido += `
                <tr class="row">
                    <td class="table-cell">${miembro.id}</td>
                    <td class="table-cell">${miembro.nombre}</td>
                    <td class="table-cell">${miembro.correo}</td>
                    <td class="table-cell">${miembro.rol}</td>
                    <td class="table-cell">
                        <button class="btn-edit" onclick="editarMiembro(${miembro.id})">Editar</button>
                        <button class="btn-delete" onclick="eliminarMiembro(${miembro.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }
        tableBody.innerHTML = contenido;
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-message" style="color: red;">Error al cargar los miembros</td></tr>';
    }
}

// Mostrar formulario de edición con datos del miembro
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

        document.getElementById('cardEdicion').style.display = 'block';
    } catch (error) {
        console.error("Error al cargar miembro:", error);
        mostrarModal("Error", "No se pudo cargar el miembro");
    }
}

// Guardar cambios desde el formulario de edición
document.getElementById('formEdicion').addEventListener('submit', async function(e) {
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
            cargarMiembros();
            mostrarModal("Actualización", "Miembro actualizado correctamente");
        } else {
            mostrarModal("Error", "No se pudo actualizar el miembro");
        }
    } catch (error) {
        console.error("Error al editar miembro:", error);
        mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
    }
});

// Cancelar edición sin guardar cambios
function cancelarEdicion() {
    document.getElementById('formEdicion').reset();
    document.getElementById('editId').value = '';
    document.getElementById('cardEdicion').style.display = 'none';
}

document.getElementById('btnCancelarEdicion').addEventListener('click', cancelarEdicion);

// Eliminar miembro
async function eliminarMiembro(id) {
    mostrarModal("Confirmar eliminación", "¿Seguro que deseas eliminar este miembro?", "confirm", async (confirmado) => {
        if (!confirmado) return;

        try {
            const respuesta = await fetch(`/api/miembros/${id}`, { method: 'DELETE' });

            if (respuesta.ok) {
                cargarMiembros();
                mostrarModal("Eliminado", "Miembro eliminado correctamente");
            } else {
                mostrarModal("Error", "No se pudo eliminar el miembro");
            }
        } catch (error) {
            console.error("Error al eliminar miembro:", error);
            mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
        }
    });
}

// ==================== MODULO DE PROYECTOS/EVENTOS/ACTIVIDADES ====================

// Variables globales para proyectos
let proyectos = [];
let miembrosParaProyectos = [];

// Cargar miembros desde el servidor para los checkboxes
async function cargarMiembrosParaCheckboxes() {
    try {
        const response = await fetch('/api/miembros');
        if (response.ok) {
            miembrosParaProyectos = await response.json();
            renderCheckboxesParticipantes();
        } else {
            document.getElementById('participantesCheckboxes').innerHTML = 
                '<p class="empty-message" style="color: red;">Error al cargar miembros</p>';
        }
    } catch (error) {
        console.error('Error cargando miembros:', error);
        document.getElementById('participantesCheckboxes').innerHTML = 
            '<p class="empty-message" style="color: red;">No se pudo conectar con el servidor</p>';
    }
}

// Renderizar checkboxes de participantes
function renderCheckboxesParticipantes() {
    const container = document.getElementById('participantesCheckboxes');
    
    if (!miembrosParaProyectos || miembrosParaProyectos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p class="empty-message">No hay miembros registrados.</p>
                <p style="font-size: 0.8rem; color: #64748b;">Registra miembros primero en el formulario superior.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = miembrosParaProyectos.map(miembro => `
        <div class="checkbox-item">
            <input type="checkbox" id="miembro_${miembro.id}" value="${miembro.id}" class="participante-checkbox">
            <label for="miembro_${miembro.id}">
                ${escapeHtml(miembro.nombre)}
                <span class="rol-badge">${escapeHtml(miembro.rol)}</span>
                <span style="font-size: 0.7rem; color: #94a3b8;"> ${escapeHtml(miembro.correo)}</span>
            </label>
        </div>
    `).join('');
}

// Obtener lista completa de participantes seleccionados
function getParticipantesSeleccionados() {
    const checkboxes = document.querySelectorAll('.participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    return miembrosParaProyectos.filter(miembro => idsSeleccionados.includes(miembro.id));
}

// Registrar nuevo proyecto/evento/actividad
async function registrarProyecto(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('proyectoNombre').value.trim();
    const tipo = document.getElementById('proyectoTipo').value;
    const fecha = document.getElementById('proyectoFecha').value.trim();
    const descripcion = document.getElementById('proyectoDescripcion').value.trim();
    const participantes = getParticipantesSeleccionados();
    
    // Validaciones
    if (!nombre) {
        mostrarModal('Error de validacion', 'Por favor ingresa el nombre del proyecto/evento.');
        return;
    }
    
    if (!tipo) {
        mostrarModal('Error de validacion', 'Por favor selecciona un tipo.');
        return;
    }
    
    if (!fecha) {
        mostrarModal('Error de validacion', 'Por favor ingresa la fecha o periodo.');
        return;
    }
    
    if (!descripcion) {
        mostrarModal('Error de validacion', 'Por favor ingresa una descripcion breve.');
        return;
    }
    
    if (participantes.length === 0) {
        mostrarModal('Error de validacion', 'Debes seleccionar al menos un participante inicial.');
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
            const guardado = await response.json();
            mostrarModal('Exito', `${tipo} "${nombre}" registrado correctamente con ${participantes.length} participante(s).`);
            
            // Resetear formulario
            document.getElementById('formProyecto').reset();
            
            // Desmarcar todos los checkboxes
            document.querySelectorAll('.participante-checkbox').forEach(cb => cb.checked = false);
            
            // Recargar lista de proyectos
            await cargarProyectos();
            
            // Recargar checkboxes
            await cargarMiembrosParaCheckboxes();
        } else {
            const error = await response.json();
            mostrarModal('Error', error.error || 'No se pudo registrar el proyecto.');
        }
    } catch (error) {
        console.error('Error registrando proyecto:', error);
        mostrarModal('Error de conexion', 'No se pudo conectar con el servidor.');
    }
}

// Cargar todos los proyectos desde el backend
async function cargarProyectos() {
    try {
        const response = await fetch('/api/proyectos');
        if (response.ok) {
            proyectos = await response.json();
            renderListaProyectos();
        } else {
            document.getElementById('listaProyectos').innerHTML = 
                '<p class="empty-message" style="color: red;">Error al cargar proyectos</p>';
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        document.getElementById('listaProyectos').innerHTML = 
            '<p class="empty-message" style="color: red;">No se pudo conectar con el servidor</p>';
    }
}

// Renderizar la lista de proyectos en tarjetas
function renderListaProyectos() {
    const container = document.getElementById('listaProyectos');
    
    if (!proyectos || proyectos.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay proyectos, eventos o actividades registrados aun. Crea el primero usando el formulario!</p>';
        return;
    }
    
    // Ordenar por id (mas reciente primero)
    const proyectosOrdenados = [...proyectos].reverse();
    
    container.innerHTML = proyectosOrdenados.map(proyecto => {
        return `
            <div class="proyecto-card">
                <h3>${getIconoPorTipo(proyecto.tipo)} ${escapeHtml(proyecto.nombre)}</h3>
                <div class="proyecto-tipo">${escapeHtml(proyecto.tipo)}</div>
                <div class="proyecto-fecha">Fecha: ${escapeHtml(proyecto.fecha)}</div>
                <div class="proyecto-descripcion">${escapeHtml(proyecto.descripcion)}</div>
                <div class="proyecto-participantes">
                    <h4>Participantes (${proyecto.participantes.length})</h4>
                    ${proyecto.participantes.map(p => 
                        `<span class="participante-tag">${escapeHtml(p.nombre)} (${escapeHtml(p.rol)})</span>`
                    ).join('')}
                </div>
                <div class="proyecto-acciones">
                    <button class="btn-edit" onclick="editarProyecto(${proyecto.id})">Editar</button>
                    <button class="btn-delete" onclick="eliminarProyecto(${proyecto.id})">Eliminar</button>
                </div>
                <div style="margin-top: 12px; font-size: 0.7rem; color: #94a3b8; text-align: right;">
                    ID: ${proyecto.id}
                </div>
            </div>
        `;
    }).join('');
}

// Helper: obtener icono segun tipo
function getIconoPorTipo(tipo) {
    const iconos = {
        'Proyecto': '📁',
        'Competencia': '🏆',
        'Evento': '🎉',
        'Actividad': '📝',
        'Hackathon': '💻',
        'Feria': '🎪',
        'Prototipo': '🔧'
    };
    return iconos[tipo] || '📌';
}

// Helper: escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== FUNCIONES PARA EDITAR PROYECTOS ====================

// Mostrar formulario de edición con datos del proyecto
async function editarProyecto(id) {
    try {
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

        // Marcar los participantes actuales
        renderCheckboxesEdicionParticipantes(proyecto.participantes);

        document.getElementById('cardEdicionProyecto').style.display = 'block';
        // Scroll to the edit form
        document.getElementById('cardEdicionProyecto').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("Error al cargar proyecto:", error);
        mostrarModal("Error", "No se pudo cargar el proyecto");
    }
}

// Renderizar checkboxes de participantes para edición
function renderCheckboxesEdicionParticipantes(participantesActuales) {
    const container = document.getElementById('editParticipantesCheckboxes');
    
    if (!miembrosParaProyectos || miembrosParaProyectos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p class="empty-message">No hay miembros registrados.</p>
            </div>
        `;
        return;
    }
    
    const idsParticipantes = participantesActuales.map(p => p.id);
    
    container.innerHTML = miembrosParaProyectos.map(miembro => {
        const checked = idsParticipantes.includes(miembro.id) ? 'checked' : '';
        return `
            <div class="checkbox-item">
                <input type="checkbox" id="edit_miembro_${miembro.id}" value="${miembro.id}" class="edit-participante-checkbox" ${checked}>
                <label for="edit_miembro_${miembro.id}">
                    ${escapeHtml(miembro.nombre)}
                    <span class="rol-badge">${escapeHtml(miembro.rol)}</span>
                    <span style="font-size: 0.7rem; color: #94a3b8;"> ${escapeHtml(miembro.correo)}</span>
                </label>
            </div>
        `;
    }).join('');
}

// Obtener lista completa de participantes seleccionados en edición
function getParticipantesSeleccionadosEdicion() {
    const checkboxes = document.querySelectorAll('.edit-participante-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    return miembrosParaProyectos.filter(miembro => idsSeleccionados.includes(miembro.id));
}

// Guardar cambios desde el formulario de edición de proyecto
document.getElementById('formEdicionProyecto').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editProyectoId').value;
    const nombre = document.getElementById('editProyectoNombre').value.trim();
    const tipo = document.getElementById('editProyectoTipo').value;
    const fecha = document.getElementById('editProyectoFecha').value.trim();
    const descripcion = document.getElementById('editProyectoDescripcion').value.trim();
    const participantes = getParticipantesSeleccionadosEdicion();

    // Validaciones
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
            cargarProyectos();
            mostrarModal("Actualización", `${tipo} "${nombre}" actualizado correctamente`);
        } else {
            const error = await respuesta.json();
            mostrarModal("Error", error.error || "No se pudo actualizar el proyecto");
        }
    } catch (error) {
        console.error("Error al editar proyecto:", error);
        mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
    }
});

// Cancelar edición de proyecto sin guardar cambios
function cancelarEdicionProyecto() {
    document.getElementById('formEdicionProyecto').reset();
    document.getElementById('editProyectoId').value = '';
    document.getElementById('cardEdicionProyecto').style.display = 'none';
}

document.getElementById('btnCancelarEdicionProyecto').addEventListener('click', cancelarEdicionProyecto);

// Eliminar proyecto
async function eliminarProyecto(id) {
    // Primero obtener el proyecto para mostrar su nombre en la confirmación
    try {
        const respuesta = await fetch(`/api/proyectos/${id}`);
        const proyecto = await respuesta.json();
        
        if (!respuesta.ok) {
            mostrarModal("Error", "Proyecto no encontrado");
            return;
        }

        mostrarModal(`${proyecto.tipo}: ${proyecto.nombre}`, `¿Seguro que deseas eliminar "${proyecto.nombre}"? Esta acción no se puede deshacer.`, "confirm", async (confirmado) => {
            if (!confirmado) return;

            try {
                const respuesta = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });

                if (respuesta.ok) {
                    cargarProyectos();
                    mostrarModal("Eliminado", `${proyecto.tipo} "${proyecto.nombre}" eliminado correctamente`);
                } else {
                    mostrarModal("Error", "No se pudo eliminar el proyecto");
                }
            } catch (error) {
                console.error("Error al eliminar proyecto:", error);
                mostrarModal("Error de conexión", "No se pudo conectar con el servidor");
            }
        });
    } catch (error) {
        console.error("Error al obtener proyecto para eliminación:", error);
        mostrarModal("Error", "No se pudo obtener información del proyecto");
    }
}

// Inicializar el modulo de proyectos
function inicializarModuloProyectos() {
    cargarMiembrosParaCheckboxes();
    cargarProyectos();
    
    const formProyecto = document.getElementById('formProyecto');
    if (formProyecto) {
        formProyecto.addEventListener('submit', registrarProyecto);
    }
}

// Inicializar cuando el DOM este listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarModuloProyectos, 500);
    });
} else {
    setTimeout(inicializarModuloProyectos, 500);
}