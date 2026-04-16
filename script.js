document.addEventListener('DOMContentLoaded', function() {
    cargarMiembros();
});

document.getElementById('formRegistro').addEventListener('submit', async function(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const rol = document.getElementById('rol').value;

    try {
        const respuesta = await fetch('/api/miembros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre, correo: correo, rol: rol })
        });

        if (respuesta.ok) {
            alert('¡Miembro registrado correctamente!');
            document.getElementById('formRegistro').reset();
            cargarMiembros();
        } else {
            alert('ERROR: No se pudo registrar el miembro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ERROR: Error de conexión con el servidor');
    }
});

async function cargarMiembros() {
    try {
        const respuesta = await fetch('/api/miembros');
        const miembros = await respuesta.json();

        const tableBody = document.getElementById('tableBody');

        if (miembros.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">No hay miembros registrados</td></tr>';
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
                </tr>
            `;
        }
        tableBody.innerHTML = contenido;
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-message" style="color: red;">Error al cargar los miembros</td></tr>';
    }
}