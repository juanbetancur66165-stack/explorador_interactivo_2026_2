// js/app.js
// Controla la interfaz, la API, los filtros y los favoritos.

import { URL_PERSONAJES, obtenerPersonajes } from './api.js';

import {
    filtrarPersonajes,
    contarVivos,
    buscarPorId
} from './logica.js';

import {
    leerFavoritos,
    guardarFavoritos,
    alternarFavorito,
    esFavorito
} from './favoritos.js';

// Estado de la aplicación.
const filtros = {
    texto: '',
    estado: '',
    especie: '',
    genero: ''
};

let personajes = [];
let siguiente = URL_PERSONAJES;
let cargando = false;
let error = null;
let favoritos = leerFavoritos();
let vista = 'todos';

// Elementos HTML.
const grilla = document.querySelector('#grilla');
const contador = document.querySelector('#contador');
const mensajeVacio = document.querySelector('#mensaje-vacio');
const mensajeError = document.querySelector('#mensaje-error');
const formulario = document.querySelector('#form-busqueda');
const busqueda = document.querySelector('#busqueda');
const filtroEstado = document.querySelector('#filtro-estado');
const filtroEspecie = document.querySelector('#filtro-especie');
const filtroGenero = document.querySelector('#filtro-genero');
const tituloLista = document.querySelector('#titulo-lista');
const btnMas = document.querySelector('#btn-mas');
const modal = document.querySelector('#modal-detalle');
const btnMenu = document.querySelector('#btn-menu');
const menu = document.querySelector('#menu');

// Estados que devuelve la API.
const ESTADOS = {
    Alive: {
        texto: 'Vivo',
        clases: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    },
    Dead: {
        texto: 'Muerto',
        clases: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
    },
    unknown: {
        texto: 'Desconocido',
        clases: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }
};

// Traducción de géneros.
const GENEROS = {
    Male: 'Masculino',
    Female: 'Femenino',
    Genderless: 'Sin género',
    unknown: 'Desconocido'
};

// Estilos de los enlaces del menú.
const CLASES_ENLACE = {
    activo: 'block rounded-lg px-3 py-2 font-medium text-indigo-600 hover:bg-slate-100 md:p-0 md:hover:bg-transparent dark:text-indigo-400 dark:hover:bg-slate-800',
    inactivo: 'block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 md:p-0 md:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800'
};

// Evita insertar caracteres HTML como si fueran etiquetas.
const escaparHTML = (valor = '') => {
    return String(valor).replace(/[&<>"']/g, (caracter) => {
        const equivalencias = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return equivalencias[caracter];
    });
};

// Devuelve la lista que corresponde a la vista seleccionada.
const listaActual = () => {
    return vista === 'favoritos' ? favoritos : personajes;
};

// Genera una tarjeta con su corazón y botón de detalle.

const tarjetaHTML = (personaje) => {
    const estado = ESTADOS[personaje.status] ?? ESTADOS.unknown;
    const favorito = esFavorito(favoritos, personaje.id);

    return `
        <article class="relative group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div class="overflow-hidden">
                <img
                    src="${personaje.image}"
                    alt="${personaje.name}"
                    class="aspect-square w-full object-cover transition duration-300 group-hover:scale-105">
            </div>

            <button
                type="button"
                data-fav="${personaje.id}"
                aria-pressed="${favorito}"
                aria-label="${favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                class="absolute top-2 right-2 grid size-10 place-items-center rounded-full bg-white/90 text-2xl text-rose-600 shadow transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-slate-900/80">
                ${favorito ? '♥' : '♡'}
            </button>

            <div class="flex flex-1 flex-col gap-2 p-4">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                    ${personaje.name}
                </h3>

                <span class="w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.clases}">
                    ● ${estado.texto}
                </span>

                <p class="text-sm text-slate-500 dark:text-slate-400">
                    ${personaje.species} · ${personaje.origin.name}
                </p>

                <button
                    type="button"
                    data-id="${personaje.id}"
                    class="mt-auto rounded-lg bg-indigo-600 py-2 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    Ver detalle
                </button>
            </div>
        </article>
    `;
};


// Abre el modal con los datos del personaje.
const abrirDetalle = (personaje) => {
    if (!personaje) {
        return;
    }

    const estado =
        ESTADOS[personaje.status] || ESTADOS.unknown;

    const especie = personaje.type
        ? `${personaje.species} (${personaje.type})`
        : personaje.species;

    document.querySelector('#modal-nombre').textContent =
        personaje.name;

    const imagen = document.querySelector('#modal-img');

    imagen.src = personaje.image;
    imagen.alt = personaje.name;

    document.querySelector('#modal-estado').textContent =
        estado.texto;

    document.querySelector('#modal-especie').textContent =
        especie;

    document.querySelector('#modal-genero').textContent =
        GENEROS[personaje.gender] ||
        personaje.gender ||
        'Desconocido';

    document.querySelector('#modal-origen').textContent =
        personaje.origin?.name || 'Desconocido';

    document.querySelector('#modal-ubicacion').textContent =
        personaje.location?.name || 'Desconocido';

    modal.showModal();
};

// Actualiza el título y el enlace activo.
const actualizarNavegacion = () => {
    tituloLista.textContent = vista === 'favoritos'
        ? 'Tus personajes favoritos'
        : 'Personajes de Rick and Morty';

    menu.querySelectorAll('[data-vista]').forEach((enlace) => {
        const activo = enlace.dataset.vista === vista;

        enlace.className = activo
            ? CLASES_ENLACE.activo
            : CLASES_ENLACE.inactivo;

        if (activo) {
            enlace.setAttribute('aria-current', 'page');
        } else {
            enlace.removeAttribute('aria-current');
        }
    });
};

// Controla el botón de paginación.
const actualizarBotonMas = () => {
    const puedeCargarMas =
        vista === 'todos' &&
        personajes.length > 0 &&
        (siguiente !== null || error !== null);

    btnMas.classList.toggle('hidden', !puedeCargarMas);
    btnMas.disabled = cargando;

    if (cargando && personajes.length > 0) {
        btnMas.textContent = 'Cargando…';
    } else if (error && personajes.length > 0) {
        btnMas.textContent = 'No se pudo cargar. Reintentar';
    } else {
        btnMas.textContent = 'Cargar más';
    }
};

// Actualiza la interfaz a partir del estado de la aplicación.
const render = () => {
    actualizarNavegacion();
    actualizarBotonMas();

    mensajeVacio.classList.add('hidden');
    mensajeError.classList.add('hidden');
    mensajeError.textContent = '';

    const sinDatosAPI =
        vista === 'todos' && personajes.length === 0;

    // Estado 1: cargando.
    if (sinDatosAPI && cargando) {
        grilla.innerHTML = `
            <p class="col-span-full animate-pulse rounded-2xl bg-white p-8 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Cargando personajes…
            </p>
        `;

        contador.textContent = '';
        return;
    }

    // Estado 2: error inicial con opción para reintentar.
    if (sinDatosAPI && error) {
        grilla.innerHTML = `
            <div class="col-span-full rounded-2xl bg-white p-8 text-center dark:bg-slate-800">

                <p class="font-semibold text-rose-600 dark:text-rose-400">
                    No pudimos cargar los personajes.
                </p>

                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Revisa tu conexión e inténtalo de nuevo.
                </p>

                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    ${escaparHTML(error)}
                </p>

                <button
                    type="button"
                    data-reintentar
                    class="mt-4 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-700"
                >
                    Reintentar
                </button>

            </div>
        `;

        contador.textContent = '';
        return;
    }

    // Si falla una página adicional, conserva los resultados anteriores.
    if (vista === 'todos' && error && personajes.length > 0) {
        mensajeError.textContent =
            'No pudimos cargar más personajes. Tus resultados anteriores siguen disponibles. Pulsa el botón de paginación para reintentar.';

        mensajeError.classList.remove('hidden');
    }

    const lista = listaActual();
    const visibles = filtrarPersonajes(lista, filtros);

    // Estado vacío.
    if (visibles.length === 0) {
        grilla.innerHTML = '';

        mensajeVacio.textContent =
            vista === 'favoritos' && favoritos.length === 0
                ? 'Aún no tienes favoritos. Entra en Personajes y marca el corazón de los que quieras guardar.'
                : 'Ningún personaje coincide con los filtros seleccionados.';

        mensajeVacio.classList.remove('hidden');
    } else {
        grilla.innerHTML = visibles
            .map(tarjetaHTML)
            .join('');
    }

    const tipoLista =
        vista === 'favoritos' ? 'favoritos' : 'personajes';

    contador.textContent =
        `${visibles.length} de ${lista.length} ${tipoLista} · ${contarVivos(visibles)} vivos`;
};

// Consulta la API y administra la paginación.
const cargar = async () => {
    if (cargando || !siguiente) {
        return;
    }

    const urlSolicitada = siguiente;

    cargando = true;
    error = null;
    render();

    try {
        const datos = await obtenerPersonajes(urlSolicitada);

        personajes = [...personajes, ...datos.results];
        siguiente = datos.info.next;
    } catch (fallo) {
        error = fallo instanceof Error
            ? fallo.message
            : 'Ocurrió un error inesperado.';

        console.error('Error al cargar personajes:', fallo);
    } finally {
        cargando = false;
        render();
    }
};

// Delegación: un solo evento controla los botones de la grilla.
grilla.addEventListener('click', (evento) => {
    // Reintentar cuando falla la primera petición.
    const botonReintentar =
        evento.target.closest('[data-reintentar]');

    if (botonReintentar) {
        cargar();
        return;
    }

    // AGREGAR O QUITAR FAVORITOS.
    const botonFavorito = evento.target.closest('[data-fav]');

    if (botonFavorito) {
        const id = Number(botonFavorito.dataset.fav);

        const personaje = buscarPorId(
            [...personajes, ...favoritos],
            id
        );

        if (personaje) {
            favoritos = alternarFavorito(
                favoritos,
                personaje
            );

            guardarFavoritos(favoritos);

            // Actualiza el corazón y la vista de inmediato.
            render();
        }

        return;
    }

    // Abrir el modal.
    const botonDetalle = evento.target.closest('[data-id]');

    if (botonDetalle) {
        const id = Number(botonDetalle.dataset.id);

        const personaje = buscarPorId(
            [...personajes, ...favoritos],
            id
        );

        abrirDetalle(personaje);
    }
});

// Cambiar entre Personajes y Favoritos.
menu.addEventListener('click', (evento) => {
    const enlaceVista = evento.target.closest('[data-vista]');

    if (enlaceVista) {
        evento.preventDefault();

        vista = enlaceVista.dataset.vista;
        render();
    }

    if (
        window.innerWidth < 768 &&
        evento.target.closest('a')
    ) {
        menu.classList.add('hidden');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.setAttribute('aria-label', 'Abrir menú');
    }
});

// Abrir y cerrar el menú móvil.
btnMenu.addEventListener('click', () => {
    menu.classList.toggle('hidden');

    const abierto = !menu.classList.contains('hidden');

    btnMenu.setAttribute('aria-expanded', String(abierto));

    btnMenu.setAttribute(
        'aria-label',
        abierto ? 'Cerrar menú' : 'Abrir menú'
    );
});

// Buscador.
busqueda.addEventListener('input', (evento) => {
    filtros.texto = evento.target.value;
    render();
});

// Filtro de estado.
filtroEstado.addEventListener('change', (evento) => {
    filtros.estado = evento.target.value;
    render();
});

// Filtro de especie.
filtroEspecie.addEventListener('change', (evento) => {
    filtros.especie = evento.target.value;
    render();
});

// Filtro de género.
filtroGenero.addEventListener('change', (evento) => {
    filtros.genero = evento.target.value;
    render();
});

// Impide que el formulario recargue la página.
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
});

// Cargar otra página.
btnMas.addEventListener('click', () => {
    cargar();
});

// Cerrar el modal al pulsar el fondo.
modal.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.close();
    }
});

// Iniciar la aplicación.
cargar();