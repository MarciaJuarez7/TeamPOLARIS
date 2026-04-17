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
