const express = require('express');
const app = express();
const port = 3000;

// MIDDLEWARE
app.use(express.json());
app.use(express.static(__dirname));  // Usamos 'dirname' porque registro.html está en la carpeta raíz.

// BASE DE DATOS TEMPORAL (EN MEMORIA)
let miembros = [];
let idActual = 1;

// RUTA PARA OBTENER TODOS LOS MIEMBROS (GET)
app.get('/api/miembros', (req, res) => {
    res.json(miembros);
});

// RUTA PARA GUARDAR UN NUEVO MIEMBRO (POST)
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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// RUTA PARA INICIAR EL SERVIDOR
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});