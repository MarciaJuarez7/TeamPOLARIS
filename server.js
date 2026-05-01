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

app.put('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    console.log('PUT recibido:', { id, nombre, tipo, fecha, descripcion, participantes });
    
    db.run(
        `UPDATE proyectos SET nombre = ?, tipo = ?, fecha = ?, descripcion = ? WHERE id = ?`,
        [nombre, tipo, fecha, descripcion, id],
        function(err) {
            if (err) {
                console.error('Error UPDATE:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Eliminar participantes anteriores
            db.run(`DELETE FROM proyecto_participantes WHERE proyecto_id = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (participantes && participantes.length > 0) {
                    const stmt = db.prepare(`INSERT INTO proyecto_participantes (proyecto_id, miembro_id) VALUES (?, ?)`);
                    participantes.forEach(miembroId => {
                        stmt.run(id, miembroId);
                    });
                    stmt.finalize();
                }
                
                res.json({ message: 'Proyecto actualizado exitosamente' });
            });
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

// Obtener todos los proyectos con sus participantes
app.get('/api/proyectos', (req, res) => {
    const sql = `
        SELECT p.*, 
               GROUP_CONCAT(pp.miembro_id) as participantes_ids
        FROM proyectos p
        LEFT JOIN proyecto_participantes pp ON p.id = pp.proyecto_id
        GROUP BY p.id
        ORDER BY p.id DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const proyectos = rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            fecha: row.fecha,
            descripcion: row.descripcion,
            participantes: row.participantes_ids ? row.participantes_ids.split(',').map(Number) : []
        }));
        
        res.json(proyectos);
    });
});

// Obtener un proyecto por ID
app.get('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    const sql = `
        SELECT p.*, 
               GROUP_CONCAT(pp.miembro_id) as participantes_ids
        FROM proyectos p
        LEFT JOIN proyecto_participantes pp ON p.id = pp.proyecto_id
        WHERE p.id = ?
        GROUP BY p.id
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Proyecto no encontrado' });
        
        const proyecto = {
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            fecha: row.fecha,
            descripcion: row.descripcion,
            participantes: row.participantes_ids ? row.participantes_ids.split(',').map(Number) : []
        };
        
        res.json(proyecto);
    });
});

// Crear proyecto
app.post('/api/proyectos', (req, res) => {
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    if (!nombre || !tipo || !fecha || !descripcion) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    if (!participantes || participantes.length === 0) {
        return res.status(400).json({ error: 'Debe haber al menos un participante' });
    }
    
    db.run(
        `INSERT INTO proyectos (nombre, tipo, fecha, descripcion) VALUES (?, ?, ?, ?)`,
        [nombre, tipo, fecha, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const proyectoId = this.lastID;
            let inserts = 0;
            
            participantes.forEach(miembroId => {
                db.run(`INSERT INTO proyecto_participantes (proyecto_id, miembro_id) VALUES (?, ?)`,
                    [proyectoId, miembroId],
                    (err) => {
                        if (err) console.error('Error insertando participante:', err);
                        inserts++;
                        if (inserts === participantes.length) {
                            res.json({ 
                                id: proyectoId, 
                                message: 'Proyecto creado exitosamente',
                                participantes: participantes.length
                            });
                        }
                    });
            });
        }
    );
});

// Actualizar proyecto
app.put('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    db.run(
        `UPDATE proyectos SET nombre = ?, tipo = ?, fecha = ?, descripcion = ? WHERE id = ?`,
        [nombre, tipo, fecha, descripcion, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Eliminar participantes anteriores
            db.run(`DELETE FROM proyecto_participantes WHERE proyecto_id = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (participantes && participantes.length > 0) {
                    participantes.forEach(miembroId => {
                        db.run(`INSERT INTO proyecto_participantes (proyecto_id, miembro_id) VALUES (?, ?)`,
                            [id, miembroId]);
                    });
                }
                
                res.json({ message: 'Proyecto actualizado exitosamente' });
            });
        }
    );
});

// Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Los participantes se eliminan automáticamente por ON DELETE CASCADE
    db.run(`DELETE FROM proyectos WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
        res.json({ message: 'Proyecto eliminado exitosamente' });
    });
});

// ==================== CRUD DE EVENTOS ====================

// Obtener todos los eventos con sus asistentes
app.get('/api/eventos', (req, res) => {
    const sql = `
        SELECT e.*, 
               GROUP_CONCAT(ea.miembro_id) as asistentes_ids
        FROM eventos e
        LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
        GROUP BY e.id
        ORDER BY e.fecha DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const eventos = rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            ubicacion: row.ubicacion,
            fecha: row.fecha,
            hora: row.hora,
            tipo: row.tipo,
            descripcion: row.descripcion,
            asistentes: row.asistentes_ids ? row.asistentes_ids.split(',').map(Number) : []
        }));
        
        res.json(eventos);
    });
});

// Obtener un evento por ID
app.get('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    const sql = `
        SELECT e.*, 
               GROUP_CONCAT(ea.miembro_id) as asistentes_ids
        FROM eventos e
        LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
        WHERE e.id = ?
        GROUP BY e.id
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Evento no encontrado' });
        
        const evento = {
            id: row.id,
            nombre: row.nombre,
            ubicacion: row.ubicacion,
            fecha: row.fecha,
            hora: row.hora,
            tipo: row.tipo,
            descripcion: row.descripcion,
            asistentes: row.asistentes_ids ? row.asistentes_ids.split(',').map(Number) : []
        };
        
        res.json(evento);
    });
});

// Crear evento
app.post('/api/eventos', (req, res) => {
    const { nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes } = req.body;
    
    if (!nombre || !ubicacion || !fecha || !hora || !tipo || !descripcion) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    if (!asistentes || asistentes.length === 0) {
        return res.status(400).json({ error: 'Debe haber al menos un asistente' });
    }
    
    db.run(
        `INSERT INTO eventos (nombre, ubicacion, fecha, hora, tipo, descripcion) VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, ubicacion, fecha, hora, tipo, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const eventoId = this.lastID;
            let inserts = 0;
            
            asistentes.forEach(miembroId => {
                db.run(`INSERT INTO evento_asistentes (evento_id, miembro_id) VALUES (?, ?)`,
                    [eventoId, miembroId],
                    (err) => {
                        if (err) console.error('Error insertando asistente:', err);
                        inserts++;
                        if (inserts === asistentes.length) {
                            res.json({ 
                                id: eventoId, 
                                message: 'Evento creado exitosamente',
                                asistentes: asistentes.length
                            });
                        }
                    });
            });
        }
    );
});

// Actualizar evento
app.put('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, ubicacion, fecha, hora, tipo, descripcion, asistentes } = req.body;
    
    db.run(
        `UPDATE eventos SET nombre = ?, ubicacion = ?, fecha = ?, hora = ?, tipo = ?, descripcion = ? WHERE id = ?`,
        [nombre, ubicacion, fecha, hora, tipo, descripcion, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Eliminar asistentes anteriores
            db.run(`DELETE FROM evento_asistentes WHERE evento_id = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (asistentes && asistentes.length > 0) {
                    asistentes.forEach(miembroId => {
                        db.run(`INSERT INTO evento_asistentes (evento_id, miembro_id) VALUES (?, ?)`,
                            [id, miembroId]);
                    });
                }
                
                res.json({ message: 'Evento actualizado exitosamente' });
            });
        }
    );
});

// Eliminar evento
app.delete('/api/eventos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    db.run(`DELETE FROM eventos WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Evento no encontrado' });
        res.json({ message: 'Evento eliminado exitosamente' });
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

// Obtener participantes de un proyecto
app.get('/api/proyecto_participantes', (req, res) => {
    const { proyectoId } = req.query;
    db.all(
        "SELECT miembroId FROM proyecto_participantes WHERE proyectoId = ?",
        [proyectoId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Al crear proyecto, guardar participantes
// Modifica tu POST /api/proyectos
app.post('/api/proyectos', (req, res) => {
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    db.run(
        "INSERT INTO proyectos (nombre, tipo, fecha, descripcion) VALUES (?, ?, ?, ?)",
        [nombre, tipo, fecha, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const proyectoId = this.lastID;
            
            // Guardar participantes
            if (participantes && participantes.length) {
                const stmt = db.prepare("INSERT INTO proyecto_participantes (proyectoId, miembroId) VALUES (?, ?)");
                participantes.forEach(miembroId => {
                    stmt.run(proyectoId, miembroId);
                });
                stmt.finalize();
            }
            
            res.json({ id: proyectoId, message: "Proyecto creado" });
        }
    );
});

// Al actualizar proyecto, actualizar participantes
app.put('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    db.run(
        "UPDATE proyectos SET nombre = ?, tipo = ?, fecha = ?, descripcion = ? WHERE id = ?",
        [nombre, tipo, fecha, descripcion, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Eliminar participantes anteriores
            db.run("DELETE FROM proyecto_participantes WHERE proyectoId = ?", [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Insertar nuevos participantes
                if (participantes && participantes.length) {
                    const stmt = db.prepare("INSERT INTO proyecto_participantes (proyectoId, miembroId) VALUES (?, ?)");
                    participantes.forEach(miembroId => {
                        stmt.run(id, miembroId);
                    });
                    stmt.finalize();
                }
                
                res.json({ message: "Proyecto actualizado" });
            });
        }
    );
});

// Al eliminar proyecto, eliminar también sus participantes
app.delete('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM proyecto_participantes WHERE proyectoId = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run("DELETE FROM proyectos WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Proyecto eliminado" });
        });
    });
});

// ========== PROYECTOS ==========

// Obtener todos los proyectos con sus participantes
app.get('/api/proyectos', (req, res) => {
    const sql = `
        SELECT p.*, 
               GROUP_CONCAT(pp.miembroId) as participantes_ids
        FROM proyectos p
        LEFT JOIN proyecto_participantes pp ON p.id = pp.proyectoId
        GROUP BY p.id
        ORDER BY p.id DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Convertir participantes_ids de string a array
        const proyectos = rows.map(row => ({
            ...row,
            participantes: row.participantes_ids ? row.participantes_ids.split(',').map(Number) : []
        }));
        
        res.json(proyectos);
    });
});

// Obtener un proyecto por ID
app.get('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT p.*, 
               GROUP_CONCAT(pp.miembroId) as participantes_ids
        FROM proyectos p
        LEFT JOIN proyecto_participantes pp ON p.id = pp.proyectoId
        WHERE p.id = ?
        GROUP BY p.id
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Proyecto no encontrado' });
        
        const proyecto = {
            ...row,
            participantes: row.participantes_ids ? row.participantes_ids.split(',').map(Number) : []
        };
        
        res.json(proyecto);
    });
});

// Crear proyecto
app.post('/api/proyectos', (req, res) => {
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    if (!nombre || !tipo || !fecha || !descripcion) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    db.run(
        `INSERT INTO proyectos (nombre, tipo, fecha, descripcion) VALUES (?, ?, ?, ?)`,
        [nombre, tipo, fecha, descripcion],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const proyectoId = this.lastID;
            
            // Insertar participantes en tabla pivote
            if (participantes && participantes.length > 0) {
                const stmt = db.prepare(`INSERT INTO proyecto_participantes (proyectoId, miembroId) VALUES (?, ?)`);
                participantes.forEach(miembroId => {
                    stmt.run(proyectoId, miembroId);
                });
                stmt.finalize();
            }
            
            res.json({ id: proyectoId, message: 'Proyecto creado exitosamente' });
        }
    );
});

// Actualizar proyecto
app.put('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, fecha, descripcion, participantes } = req.body;
    
    db.run(
        `UPDATE proyectos SET nombre = ?, tipo = ?, fecha = ?, descripcion = ? WHERE id = ?`,
        [nombre, tipo, fecha, descripcion, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Eliminar participantes anteriores
            db.run(`DELETE FROM proyecto_participantes WHERE proyectoId = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Insertar nuevos participantes
                if (participantes && participantes.length > 0) {
                    const stmt = db.prepare(`INSERT INTO proyecto_participantes (proyectoId, miembroId) VALUES (?, ?)`);
                    participantes.forEach(miembroId => {
                        stmt.run(id, miembroId);
                    });
                    stmt.finalize();
                }
                
                res.json({ message: 'Proyecto actualizado exitosamente' });
            });
        }
    );
});

// Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
    const { id } = req.params;
    
    // Primero eliminar participantes
    db.run(`DELETE FROM proyecto_participantes WHERE proyectoId = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Luego eliminar proyecto
        db.run(`DELETE FROM proyectos WHERE id = ?`, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Proyecto eliminado exitosamente' });
        });
    });
});