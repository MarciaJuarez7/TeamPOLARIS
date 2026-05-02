// home.js
const toggleMenu = () => {
    const menuBtn = document.getElementById('menuBtn');
    const menuMobile = document.getElementById('menuMobile');

    if (menuBtn && menuMobile) {
        menuBtn.addEventListener('click', () => {
            menuMobile.classList.toggle('hidden');
            menuBtn.classList.toggle('menu-open');
        });
    }
};

// Esto equivale a poner el script al final del body
document.addEventListener('DOMContentLoaded', toggleMenu);
/////////////////

async function cargarMiembros() {
    try {
        const res = await fetch('/api/miembros');
        const miembros = await res.json();
        const contenedor = document.getElementById('miembros-container');
        const totalHero = document.getElementById('totalMiembrosHero');
        if (totalHero) totalHero.textContent = miembros.length;

        if (!miembros.length) {
            contenedor.innerHTML = '<div class="col-span-full text-center text-blue-300">No hay miembros registrados aún.</div>';
            return;
        }

        const miembrosMostrar = miembros.slice(0, 3);
        contenedor.innerHTML = miembrosMostrar.map(m => `
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/10 transition w-full">
                        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl shadow-lg">
                            ${m.nombre ? m.nombre.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1">${m.nombre || 'Miembro'}</h3>
                        <p class="text-blue-300 text-sm">${m.rol || 'Participante'}</p>
                    </div>
                `).join('');
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        document.getElementById('miembros-container').innerHTML = '<div class="col-span-full text-center text-red-400">Error al cargar miembros</div>';
    }
}

// Función para cargar proyectos (máximo 3)
async function cargarProyectos() {
    try {
        const res = await fetch('/api/proyectos');
        const proyectos = await res.json();
        const contenedor = document.getElementById('proyectos-container');
        const totalHero = document.getElementById('totalProyectosHero');
        if (totalHero) totalHero.textContent = proyectos.length;

        if (!proyectos.length) {
            contenedor.innerHTML = '<div class="col-span-full text-center text-blue-300">No hay proyectos registrados aún.</div>';
            return;
        }

        const proyectosMostrar = proyectos.slice(0, 3);
        contenedor.innerHTML = proyectosMostrar.map(p => `
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/10 transition w-full">
                        <h3 class="text-xl font-bold text-white mb-2">${p.nombre || 'Proyecto'}</h3>
                        <p class="text-blue-200">${p.descripcion || 'Sin descripción'}</p>
                    </div>
                `).join('');
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        document.getElementById('proyectos-container').innerHTML = '<div class="col-span-full text-center text-red-400">Error al cargar proyectos</div>';
    }
}

// Función para cargar eventos en la sección (máximo 3)
async function cargarEventos() {
    try {
        const res = await fetch('/api/eventos');
        const eventos = await res.json();
        const contenedor = document.getElementById('eventos-container');

        if (!eventos.length) {
            contenedor.innerHTML = '<div class="col-span-full text-center text-blue-300">No hay eventos registrados aún.</div>';
            return;
        }

        const eventosMostrar = eventos.slice(0, 3);
        contenedor.innerHTML = eventosMostrar.map(e => `
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/10 transition w-full">
                        <h3 class="text-xl font-bold text-white mb-2">${e.nombre || 'Evento'}</h3>
                        <p class="text-pink-600 text-sm mb-3 font-semibold">${e.fecha || 'Próximamente'}</p>
                        <p class="text-blue-200 text-sm">${e.descripcion || 'Sin descripción'}</p>
                    </div>
                `).join('');
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        document.getElementById('eventos-container').innerHTML = '<div class="col-span-full text-center text-red-400">Error al cargar eventos</div>';
    }
}

// Función para cargar el evento más reciente en el hero
async function cargarEventoReciente() {
    try {
        const res = await fetch('/api/eventos');
        const eventos = await res.json();

        if (!eventos.length) {
            document.getElementById('eventoHeroNombre').textContent = 'No hay eventos';
            document.getElementById('eventoHeroFecha').textContent = 'Próximamente';
            return;
        }

        const eventosOrdenados = [...eventos].sort((a, b) => {
            if (!a.fecha) return 1;
            if (!b.fecha) return -1;
            return new Date(a.fecha) - new Date(b.fecha);
        });

        const eventoReciente = eventosOrdenados[0];

        document.getElementById('eventoHeroNombre').textContent = eventoReciente.nombre || 'Evento próximo';

        let fechaMostrar = 'Próximamente';
        if (eventoReciente.fecha) {
            try {
                const fechaObj = new Date(eventoReciente.fecha);
                if (!isNaN(fechaObj.getTime())) {
                    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
                    fechaMostrar = fechaObj.toLocaleDateString('es-ES', opciones);
                } else {
                    fechaMostrar = eventoReciente.fecha;
                }
            } catch (e) {
                fechaMostrar = eventoReciente.fecha;
            }
        }

        if (eventoReciente.ubicacion) {
            fechaMostrar += ` · ${eventoReciente.ubicacion}`;
        }

        document.getElementById('eventoHeroFecha').textContent = fechaMostrar;

    } catch (error) {
        console.error('Error al cargar evento reciente:', error);
        document.getElementById('eventoHeroNombre').textContent = 'Error al cargar';
        document.getElementById('eventoHeroFecha').textContent = 'Intenta más tarde';
    }
}

// Cargar todos los datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarMiembros();
    cargarProyectos();
    cargarEventos();
    cargarEventoReciente();
});
