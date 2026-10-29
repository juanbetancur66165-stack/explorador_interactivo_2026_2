// js/app.js
// Control de la interfaz del explorador.

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

// Información de los estados.
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

// Clases de Tailwind para los enlaces.
// Estilo de la opción seleccionada.
const CLASE_ENLACE_ACTIVO =
    'block rounded-xl border border-[#97CE4C]/50 bg-[#97CE4C]/15 px-4 py-2.5 font-bold text-[#97CE4C] shadow-sm shadow-[#97CE4C]/10 transition hover:bg-[#97CE4C]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]';

// Estilo de las opciones no seleccionadas.
const CLASE_ENLACE_INACTIVO =
    'block rounded-xl border border-transparent px-4 py-2.5 font-semibold text-[#97CE4C] transition hover:border-[#97CE4C]/40 hover:bg-[#97CE4C]/10 hover:text-[#B8E986] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]';
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

// Devuelve la lista según la vista seleccionada.
const listaActual = () => {
    return vista === 'favoritos' ? favoritos : personajes;
};

// Crea las tarjetas utilizando exclusivamente clases de Tailwind.
// Crea las tarjetas con colores turquesa y azul.
// Crea las tarjetas con la identidad visual de Rick and Morty.
const tarjetaHTML = (personaje) => {
    const estado = ESTADOS[personaje.status] ?? ESTADOS.unknown;
    const favorito = esFavorito(favoritos, personaje.id);

    const clasesCorazon = favorito
        ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400'
        : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-400';

    return `
        <article class="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-[#97CE4C]/70 bg-[#F8FCE F] shadow-md shadow-lime-900/10 transition duration-200 hover:-translate-y-1 hover:border-[#97CE4C] hover:shadow-xl dark:border-lime-800 dark:bg-slate-800">

            <div class="grid h-[248px] w-full place-items-center overflow-hidden border-b-2 border-[#97CE4C]/50 bg-gradient-to-br from-[#F1FADB] to-[#D9F99D] p-3 dark:border-lime-900 dark:from-slate-800 dark:to-lime-950">

                <img
                    src="${escaparHTML(personaje.image)}"
                    alt="${escaparHTML(personaje.name)}"
                    loading="lazy"
                    class="block h-full w-full object-contain object-center"
                >

            </div>

            <button
                type="button"
                data-fav="${Number(personaje.id)}"
                aria-pressed="${favorito}"
                aria-label="${favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                title="${favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                class="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border p-0 text-3xl leading-none shadow-md transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${clasesCorazon}"
            >
                ${favorito ? '♥' : '♡'}
            </button>

            <div class="flex flex-1 flex-col gap-3 bg-[#F8FCEF] p-4 dark:bg-slate-800">

                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                    ${escaparHTML(personaje.name)}
                </h3>

                <span class="w-fit rounded-full px-3 py-1 text-xs font-bold ${estado.clases}">
                    ● ${estado.texto}
                </span>

                <div class="text-sm text-slate-600 dark:text-slate-300">
                    <p>
                        <span class="font-semibold text-[#476B1C] dark:text-lime-300">Especie:</span>
                        ${escaparHTML(personaje.species)}
                    </p>

                    <p class="mt-2">
                        <span class="font-semibold text-[#476B1C] dark:text-lime-300">Origen:</span>
                        ${escaparHTML(personaje.origin?.name || 'Desconocido')}
                    </p>
                </div>

            <button
             type="button"
             data-id="${Number(personaje.id)}"
            class="mt-auto w-full rounded-lg bg-[#081923] py-2.5 font-semibold text-white shadow-md shadow-slate-950/20 transition hover:bg-[#103444] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]"
            >
              Ver detalle
              </button>

            </div>
        </article>
    `;
};
// Abre el modal de detalles.
const abrirDetalle = (personaje) => {
    if (!personaje) {
        return;
    }

    const estado = ESTADOS[personaje.status] ?? ESTADOS.unknown;

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
        GENEROS[personaje.gender] || personaje.gender || 'Desconocido';

    document.querySelector('#modal-origen').textContent =
        personaje.origin?.name || 'Desconocido';

    document.querySelector('#modal-ubicacion').textContent =
        personaje.location?.name || 'Desconocido';

    if (!modal.open) {
        modal.showModal();
    }
};

// Actualiza el menú según la vista seleccionada.
const actualizarNavegacion = () => {
    tituloLista.textContent = vista === 'favoritos'
        ? 'Tus personajes favoritos'
        : 'Personajes de Rick and Morty';

    menu.querySelectorAll('[data-vista]').forEach((enlace) => {
        const activo = enlace.dataset.vista === vista;

        enlace.className = activo
            ? CLASE_ENLACE_ACTIVO
            : CLASE_ENLACE_INACTIVO;

        if (activo) {
            enlace.setAttribute('aria-current', 'page');
        } else {
            enlace.removeAttribute('aria-current');
        }
    });
};

// Actualiza el botón de paginación.
// Actualiza el botón para cargar más personajes.
const actualizarBotonMas = () => {
    const puedeCargarMas =
        vista === 'todos' &&
        personajes.length > 0 &&
        (siguiente !== null || error !== null);

    btnMas.classList.toggle('hidden', !puedeCargarMas);
    btnMas.disabled = cargando;

    if (cargando && personajes.length > 0) {
        btnMas.textContent = 'Cargando personajes…';
    } else if (error && personajes.length > 0) {
        btnMas.textContent = 'Reintentar carga';
    } else {
        btnMas.textContent = 'Más personajes';
    }
};

// Dibuja la interfaz.
const render = () => {
    actualizarNavegacion();
    actualizarBotonMas();

    mensajeVacio.classList.add('hidden');
    mensajeError.classList.add('hidden');
    mensajeError.textContent = '';

    const sinDatosAPI =
        vista === 'todos' && personajes.length === 0;

    // Estado de carga inicial.
    if (sinDatosAPI && cargando) {
        grilla.innerHTML = `
            <p class="col-span-full animate-pulse rounded-2xl bg-white p-8 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Cargando personajes…
            </p>
        `;

        contador.textContent = '';
        return;
    }

    // Error durante la primera consulta.
    if (sinDatosAPI && error) {
        grilla.innerHTML = `
            <div class="col-span-full rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-800">

                <p class="font-semibold text-rose-600 dark:text-rose-400">
                    No pudimos cargar los personajes.
                </p>

                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Revisa tu conexión e inténtalo de nuevo.
                </p>

                <button
                    type="button"
                    data-reintentar
                    class="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
                >
                    Reintentar
                </button>

            </div>
        `;

        contador.textContent = '';
        return;
    }

    // Si falla una página adicional, conservamos las anteriores.
    if (vista === 'todos' && error && personajes.length > 0) {
        mensajeError.textContent =
            'No se pudieron cargar más personajes. Pulsa el botón de paginación para reintentar.';

        mensajeError.classList.remove('hidden');
    }

    const lista = listaActual();
    const visibles = filtrarPersonajes(lista, filtros);

    // Cuando no hay resultados.
    if (visibles.length === 0) {
        grilla.innerHTML = '';

        mensajeVacio.textContent =
            vista === 'favoritos' && favoritos.length === 0
                ? 'Aún no tienes favoritos. Entra en Personajes y marca el corazón de los que quieras guardar.'
                : 'Ningún personaje coincide con los filtros seleccionados.';

        mensajeVacio.classList.remove('hidden');
    } else {
        grilla.innerHTML = visibles.map(tarjetaHTML).join('');
    }

    contador.textContent =
        `${visibles.length} de ${lista.length} ${vista === 'favoritos' ? 'favoritos' : 'personajes'} · ${contarVivos(visibles)} vivos`;
};

// Consulta la API y carga la siguiente página.
// Carga una o varias páginas de personajes.
const cargar = async (cantidadPaginas = 1) => {
    if (cargando || !siguiente) {
        return;
    }

    cargando = true;
    error = null;

    render();

    try {
        for (
            let i = 0;
            i < cantidadPaginas && siguiente !== null;
            i++
        ) {
            const datos = await obtenerPersonajes(siguiente);

            personajes = [
                ...personajes,
                ...datos.results
            ];

            siguiente = datos.info.next;
        }
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
// Eventos de la cuadrícula.
grilla.addEventListener('click', (evento) => {
    const botonReintentar = evento.target.closest('[data-reintentar]');

    if (botonReintentar) {
        cargar();
        return;
    }

    // Agregar o quitar favoritos.
    const botonFavorito = evento.target.closest('[data-fav]');

    if (botonFavorito) {
        const id = Number(botonFavorito.dataset.fav);

        const personaje = buscarPorId(
            [...personajes, ...favoritos],
            id
        );

        if (personaje) {
            favoritos = alternarFavorito(favoritos, personaje);

            guardarFavoritos(favoritos);

            render();
        }

        return;
    }

    // Abrir los detalles.
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

// Eventos de navegación.
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

// Búsqueda por nombre.
busqueda.addEventListener('input', (evento) => {
    filtros.texto = evento.target.value;
    render();
});

// Filtros.
filtroEstado.addEventListener('change', (evento) => {
    filtros.estado = evento.target.value;
    render();
});

filtroEspecie.addEventListener('change', (evento) => {
    filtros.especie = evento.target.value;
    render();
});

filtroGenero.addEventListener('change', (evento) => {
    filtros.genero = evento.target.value;
    render();
});

// Evita que el formulario recargue la página.
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
});

// Cargar más personajes.
btnMas.addEventListener('click', () => {
    cargar(2);
});

// Cerrar el modal al pulsar fuera de su contenido.
modal.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.close();
    }
});

// Iniciar el explorador.
cargar();