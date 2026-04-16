const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Sirve index.html, script.js y styles.css

// Base de datos temporal en memoria
let miembros = [];
let idActual = 1;

// RUTA: Obtener todos los miembros (READ)
app.get('/api/miembros', (req, res) => {
    res.json(miembros);
});

// RUTA: Registrar nuevo miembro (CREATE)
app.post('/api/miembros', (req, res) => {
    const { nombre, correo, rol } = req.body;

    if (!nombre || !correo || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const nuevoMiembro = {
        id: idActual++,
        nombre,
        correo,
        rol
    };

    miembros.push(nuevoMiembro);
    res.status(201).json(nuevoMiembro);
});

// RUTA: Actualizar miembro existente (UPDATE)
app.put('/api/miembros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, correo, rol } = req.body;

    const miembro = miembros.find(m => m.id === id);
    if (!miembro) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    if (!nombre || !correo || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    miembro.nombre = nombre;
    miembro.correo = correo;
    miembro.rol = rol;

    res.json({ mensaje: 'Miembro actualizado correctamente', miembro });
});

// RUTA: Eliminar miembro (DELETE)
app.delete('/api/miembros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const indice = miembros.findIndex(m => m.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    miembros.splice(indice, 1);
    res.json({ mensaje: 'Miembro eliminado correctamente' });
});

// RUTA: Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
