const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/src', express.static(path.join(__dirname, 'src')));

// ==================== CONFIGURACIÓN DE SQLITE ====================

const db = new sqlite3.Database('./polaris.db', (err) => {
    if (err) {
        console.error('❌ Error al conectar con SQLite:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite');
        crearTablas();
    }
});

function crearTablas() {
    // Tabla de miembros
    db.run(`CREATE TABLE IF NOT EXISTS miembros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        rol TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de proyectos
    db.run(`CREATE TABLE IF NOT EXISTS proyectos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        fecha TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de participantes de proyectos
    db.run(`CREATE TABLE IF NOT EXISTS proyecto_participantes (
        proyecto_id INTEGER,
        miembro_id INTEGER,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
        FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE,
        PRIMARY KEY (proyecto_id, miembro_id)
    )`);

    // Tabla de eventos
    db.run(`CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        ubicacion TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de asistentes de eventos
    db.run(`CREATE TABLE IF NOT EXISTS evento_asistentes (
        evento_id INTEGER,
        miembro_id INTEGER,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
        FOREIGN KEY (miembro_id) REFERENCES miembros(id) ON DELETE CASCADE,
        PRIMARY KEY (evento_id, miembro_id)
    )`);

    console.log('✅ Tablas creadas/verificadas');
}

// ==================== CRUD DE MIEMBROS ====================

app.get('/api/miembros', (req, res) => {
    db.all('SELECT * FROM miembros ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


app.post('/api/miembros', (req, res) => {

    const { nombre, correo, rol } = req.body;

    if (!nombre || !correo || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    db.run('INSERT INTO miembros (nombre, correo, rol) VALUES (?, ?, ?)',
        [nombre, correo, rol],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'El correo ya está registrado' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, nombre, correo, rol });
        }
    );
});

app.put('/api/miembros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, correo, rol } = req.body;

    db.run('UPDATE miembros SET nombre = ?, correo = ?, rol = ? WHERE id = ?',
        [nombre, correo, rol, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
            res.json({ mensaje: 'Miembro actualizado correctamente' });
        }
    );
});

app.delete('/api/miembros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM miembros WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
        res.json({ mensaje: 'Miembro eliminado correctamente' });
    });
});

// ==================== CRUD DE PROYECTOS ====================

app.get('/api/proyectos', (req, res) => {
    db.all('SELECT * FROM proyectos ORDER BY id DESC', [], (err, proyectos) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (proyectos.length === 0) return res.json([]);
        
        let completados = 0;
        const proyectosConParticipantes = [];
        
        proyectos.forEach((proyecto, index) => {
            db.all(`SELECT m.id, m.nombre, m.correo, m.rol 
                    FROM proyecto_participantes pp
                    JOIN miembros m ON pp.miembro_id = m.id
                    WHERE pp.proyecto_id = ?`, [proyecto.id], (err, participantes) => {
                if (err) return res.status(500).json({ error: err.message });
                proyectosConParticipantes.push({ ...proyecto, participantes });
                completados++;
                if (completados === proyectos.length) res.json(proyectosConParticipantes);
            });
        });
    });
});

app.post('/api/proyectos', (req, res) => {
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    if (!nombre || !tipo || !fecha || !descripcion || !participantes || participantes.length === 0) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios y debe haber al menos un participante' });
    }

    db.run('INSERT INTO proyectos (nombre, tipo, fecha, descripcion) VALUES (?, ?, ?, ?)',
        [nombre, tipo, fecha, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const proyectoId = this.lastID;
            let inserts = 0;
            
            participantes.forEach(p => {
                db.run('INSERT INTO proyecto_participantes (proyecto_id, miembro_id) VALUES (?, ?)',
                    [proyectoId, p.id], (err) => {
                        if (err) console.error('Error insertando participante:', err);
                        inserts++;
                        if (inserts === participantes.length) {
                            res.status(201).json({ id: proyectoId, nombre, tipo, fecha, descripcion, participantes });
                        }
                    });
            });
        });
    });


app.get('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('SELECT * FROM proyectos WHERE id = ?', [id], (err, proyecto) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
        
        db.all(`SELECT m.id, m.nombre, m.correo, m.rol 
                FROM proyecto_participantes pp
                JOIN miembros m ON pp.miembro_id = m.id
                WHERE pp.proyecto_id = ?`, [id], (err, participantes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...proyecto, participantes });
        });
    });
});

app.put('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;

    db.run('UPDATE proyectos SET nombre = ?, tipo = ?, fecha = ?, descripcion = ? WHERE id = ?',
        [nombre, tipo, fecha, descripcion, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
            
            db.run('DELETE FROM proyecto_participantes WHERE proyecto_id = ?', [id], () => {
                participantes.forEach(p => {
                    db.run('INSERT INTO proyecto_participantes (proyecto_id, miembro_id) VALUES (?, ?)', [id, p.id]);
                });
                res.json({ mensaje: 'Proyecto actualizado correctamente' });
            });
        });
    });





app.delete('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM proyectos WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
        res.json({ mensaje: 'Proyecto eliminado correctamente' });
    });
});

// ==================== CRUD DE EVENTOS ====================

app.get('/api/eventos', (req, res) => {
    db.all('SELECT * FROM eventos ORDER BY fecha DESC', [], (err, eventos) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (eventos.length === 0) return res.json([]);
        
        let completados = 0;
        const eventosConAsistentes = [];
        
        eventos.forEach((evento, index) => {
            db.all(`SELECT m.id, m.nombre, m.correo, m.rol 
                    FROM evento_asistentes ea
                    JOIN miembros m ON ea.miembro_id = m.id
                    WHERE ea.evento_id = ?`, [evento.id], (err, asistentes) => {
                if (err) return res.status(500).json({ error: err.message });
                eventosConAsistentes.push({ ...evento, asistentes });
                completados++;
                if (completados === eventos.length) res.json(eventosConAsistentes);
            });
        });
    });
});

app.post('/api/eventos', (req, res) => {
    const { nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes } = req.body;
    if (!nombre || !ubicacion || !fecha || !hora || !tipo || !descripcion || !asistentes || asistentes.length === 0) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios y debe haber al menos un asistente' });
    }

    db.run('INSERT INTO eventos (nombre, ubicacion, fecha, hora, tipo, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, ubicacion, fecha, hora, tipo, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const eventoId = this.lastID;
            let inserts = 0;
            
            asistentes.forEach(a => {
                db.run('INSERT INTO evento_asistentes (evento_id, miembro_id) VALUES (?, ?)',
                    [eventoId, a.id], (err) => {
                        if (err) console.error('Error insertando asistente:', err);
                        inserts++;
                        if (inserts === asistentes.length) {
                            res.status(201).json({ id: eventoId, nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes });
                        }
                    });
            });
        });
    });


app.get('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('SELECT * FROM eventos WHERE id = ?', [id], (err, evento) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
        
        db.all(`SELECT m.id, m.nombre, m.correo, m.rol 
                FROM evento_asistentes ea
                JOIN miembros m ON ea.miembro_id = m.id
                WHERE ea.evento_id = ?`, [id], (err, asistentes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...evento, asistentes });
        });
    });
});

app.put('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes } = req.body;

    db.run('UPDATE eventos SET nombre = ?, ubicacion = ?, fecha = ?, hora = ?, tipo = ?, descripcion = ? WHERE id = ?',
        [nombre, ubicacion, fecha, hora, tipo, descripcion, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Evento no encontrado' });
            
            db.run('DELETE FROM evento_asistentes WHERE evento_id = ?', [id], () => {
                asistentes.forEach(a => {
                    db.run('INSERT INTO evento_asistentes (evento_id, miembro_id) VALUES (?, ?)', [id, a.id]);
                });
                res.json({ mensaje: 'Evento actualizado correctamente' });
            });
        });
    });

app.delete('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM eventos WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Evento no encontrado' });
        res.json({ mensaje: 'Evento eliminado correctamente' });
    });
});

// RUTA: Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'inicio.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`
    ═══════════════════════════════════════
    🚀 Servidor con SQLite corriendo en:
    📡 http://localhost:${port}
    📁 Base de datos: polaris.db
    ═══════════════════════════════════════
    `);
});
