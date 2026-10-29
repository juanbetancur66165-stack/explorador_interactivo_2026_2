// Controla la vista de episodios sin interferir con la lógica de personajes.

import {
    URL_EPISODIOS,
    obtenerEpisodios,
    obtenerPersonajesPorIds
} from './api.js';

const campoNombre = document.querySelector('#buscar-episodio');
const filtroTemporada = document.querySelector('#filtro-temporada-episodios');
const grillaEpisodios = document.querySelector('#grilla-episodios');
const contadorEpisodios = document.querySelector('#contador-episodios');
const mensajeEpisodios = document.querySelector('#mensaje-episodios');
const btnMasEpisodios = document.querySelector('#btn-mas-episodios');

const modalEpisodio = document.querySelector('#modal-episodio');
const modalCodigo = document.querySelector('#modal-episodio-codigo');
const modalNombre = document.querySelector('#modal-episodio-nombre');
const modalFecha = document.querySelector('#modal-episodio-fecha');
const modalCantidad = document.querySelector('#modal-episodio-cantidad');
const modalEstadoPersonajes = document.querySelector('#modal-episodio-estado');
const modalPersonajes = document.querySelector('#modal-episodio-personajes');

const menu = document.querySelector('#menu');
const enlaceEpisodios = document.querySelector('#enlace-episodios');
const enlaceInicio = document.querySelector('#enlace-inicio');
const presentacionPersonajes = document.querySelector('#presentacion-personajes');
const buscadorPersonajes = document.querySelector('#buscador-personajes');
const seccionPersonajes = document.querySelector('#personajes');
const seccionEpisodios = document.querySelector('#episodios');

const TAMANO_LOTE = 8;

let episodios = [];
let totalEpisodios = 0;
let limiteVisible = TAMANO_LOTE;
let cargando = false;
let errorCarga = null;
let temporizadorBusqueda;
let solicitudDetalle = 0;

const cachePersonajes = new Map();

// Evita que los nombres se interpreten como HTML.
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

// Obtiene S01 de S01E01, S02 de S02E03, etc.
const obtenerTemporada = (codigo = '') => {
    return codigo.match(/^S\d{2}/i)?.[0].toUpperCase() ?? '';
};

const nombreTemporada = (codigo) => {
    const numero = Number(codigo.slice(1));
    return Number.isFinite(numero) ? `Temporada ${numero}` : codigo;
};

// Crea el filtro de temporadas a partir de la API.
const llenarTemporadas = () => {
    const temporadas = [...new Set(
        episodios
            .map((episodio) => obtenerTemporada(episodio.episode))
            .filter(Boolean)
    )].sort();

    const seleccionAnterior = filtroTemporada.value;

    filtroTemporada.innerHTML =
        '<option value="">Todas las temporadas</option>';

    temporadas.forEach((temporada) => {
        const opcion = document.createElement('option');

        opcion.value = temporada;
        opcion.textContent = nombreTemporada(temporada);

        filtroTemporada.appendChild(opcion);
    });

    if (temporadas.includes(seleccionAnterior)) {
        filtroTemporada.value = seleccionAnterior;
    }
};

// Filtra localmente los episodios cargados.
const filtrarEpisodios = () => {
    const texto = campoNombre.value.trim().toLocaleLowerCase('es');
    const temporada = filtroTemporada.value;

    return episodios.filter((episodio) => {
        const coincideTexto =
            episodio.name.toLocaleLowerCase('es').includes(texto) ||
            episodio.episode.toLowerCase().includes(texto);

        const coincideTemporada =
            !temporada ||
            obtenerTemporada(episodio.episode) === temporada;

        return coincideTexto && coincideTemporada;
    });
};

// Crea tarjetas compactas de episodios.
const tarjetaEpisodioHTML = (episodio) => {
    const codigo = escaparHTML(episodio.episode);
    const nombre = escaparHTML(episodio.name);
    const fecha = escaparHTML(episodio.air_date || 'Fecha desconocida');

    const cantidadPersonajes = Array.isArray(episodio.characters)
        ? episodio.characters.length
        : 0;

    return `
        <article class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#97CE4C]/60 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#97CE4C] hover:shadow-md dark:border-slate-700 dark:bg-slate-800">

            <div class="flex items-center justify-between gap-2 border-b border-[#97CE4C]/30 bg-[#081923] px-3 py-2.5">
                <span class="rounded-full border border-[#97CE4C]/50 bg-[#97CE4C]/10 px-2.5 py-1 text-[11px] font-bold text-[#B8E986]">
                    ${codigo}
                </span>

                <span class="text-right text-[11px] font-medium text-slate-300">
                    ${fecha}
                </span>
            </div>

            <div class="flex flex-1 flex-col p-3.5">

                <h3 class="line-clamp-2 min-h-10 break-words text-[15px] font-bold leading-5 text-slate-900 dark:text-white">
                    ${nombre}
                </h3>

                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span class="font-semibold text-[#476B1C] dark:text-[#97CE4C]">
                        Personajes:
                    </span>
                    ${cantidadPersonajes}
                </p>

                <button
                    type="button"
                    data-episodio-id="${Number(episodio.id)}"
                    class="mt-3 w-full rounded-lg bg-[#081923] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#103444] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]"
                >
                    Ver detalle
                </button>

            </div>
        </article>
    `;
};

// Actualiza la paginación.
const actualizarBotonMas = (cantidadFiltrada) => {
    const quedanEpisodios = limiteVisible < cantidadFiltrada;

    btnMasEpisodios.classList.toggle('hidden', !quedanEpisodios);
    btnMasEpisodios.disabled = cargando;

    btnMasEpisodios.textContent = cargando
        ? 'Cargando episodios…'
        : 'Más episodios';
};

// Renderiza tarjetas y mensajes.
const renderEpisodios = () => {
    mensajeEpisodios.classList.add('hidden');
    mensajeEpisodios.replaceChildren();

    if (cargando && episodios.length === 0) {
        grillaEpisodios.innerHTML = `
            <p class="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Cargando episodios…
            </p>
        `;

        contadorEpisodios.textContent = 'Consultando API…';
        btnMasEpisodios.classList.add('hidden');

        return;
    }

    if (errorCarga && episodios.length === 0) {
        grillaEpisodios.replaceChildren();
        contadorEpisodios.textContent = 'No disponibles';

        mensajeEpisodios.innerHTML = `
            <p class="font-medium text-rose-700 dark:text-rose-300">
                No se pudieron cargar los episodios. Revisa tu conexión e inténtalo de nuevo.
            </p>

            <button
                type="button"
                data-reintentar-episodios
                class="mt-3 rounded-lg bg-[#081923] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#103444] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]"
            >
                Reintentar
            </button>
        `;

        mensajeEpisodios.classList.remove('hidden');
        btnMasEpisodios.classList.add('hidden');

        return;
    }

    const filtrados = filtrarEpisodios();
    const visibles = filtrados.slice(0, limiteVisible);

    grillaEpisodios.innerHTML = visibles
        .map(tarjetaEpisodioHTML)
        .join('');

    contadorEpisodios.textContent =
        filtrados.length === totalEpisodios
            ? `${visibles.length} de ${totalEpisodios} episodios`
            : `${visibles.length} de ${filtrados.length} encontrados`;

    actualizarBotonMas(filtrados.length);

    if (filtrados.length === 0) {
        mensajeEpisodios.textContent =
            'No encontramos episodios con esos criterios. Prueba otro nombre o temporada.';

        mensajeEpisodios.classList.remove('hidden');
    }
};

// Carga todas las páginas de episodios para filtrar los resultados localmente.
const cargarTodosEpisodios = async () => {
    if (cargando) {
        return;
    }

    cargando = true;
    errorCarga = null;

    renderEpisodios();

    try {
        const primeraPagina = await obtenerEpisodios(URL_EPISODIOS);
        const paginasRestantes = Number(primeraPagina.info.pages) - 1;

        const peticiones = Array.from(
            { length: Math.max(0, paginasRestantes) },
            (_, indice) => obtenerEpisodios(
                `${URL_EPISODIOS}?page=${indice + 2}`
            )
        );

        const resultadosRestantes = await Promise.all(peticiones);
        const todasLasPaginas = [primeraPagina, ...resultadosRestantes];

        episodios = todasLasPaginas
            .flatMap((pagina) => pagina.results)
            .sort((a, b) => a.id - b.id);

        totalEpisodios =
            Number(primeraPagina.info.count) || episodios.length;

        llenarTemporadas();
        limiteVisible = TAMANO_LOTE;

    } catch (fallo) {
        errorCarga = fallo instanceof Error
            ? fallo.message
            : 'Error inesperado al consultar la API.';

        console.error('Error al cargar episodios:', fallo);

    } finally {
        cargando = false;
        renderEpisodios();
    }
};

// Convierte las URL de personajes de la API en identificadores.
const obtenerIdsPersonajes = (episodio) => {
    return (episodio.characters ?? [])
        .map((url) => Number(url.match(/\/(\d+)\/?$/)?.[1]))
        .filter((id) => Number.isInteger(id) && id > 0);
};

// Obtiene los personajes y los muestra en una cuadrícula legible.
const cargarPersonajesDelEpisodio = async (episodio, idSolicitud) => {
    modalEstadoPersonajes.textContent = 'Cargando personajes…';
    modalPersonajes.replaceChildren();

    try {
        let personajesDelEpisodio = cachePersonajes.get(episodio.id);

        if (!personajesDelEpisodio) {
            personajesDelEpisodio = await obtenerPersonajesPorIds(
                obtenerIdsPersonajes(episodio)
            );

            cachePersonajes.set(episodio.id, personajesDelEpisodio);
        }

        if (idSolicitud !== solicitudDetalle) {
            return;
        }

        if (personajesDelEpisodio.length === 0) {
            modalEstadoPersonajes.textContent =
                'Este episodio no tiene personajes disponibles.';

            return;
        }

        modalEstadoPersonajes.textContent =
            `${personajesDelEpisodio.length} personajes en este episodio`;

        modalPersonajes.innerHTML = personajesDelEpisodio
            .map((personaje) => {
                const estado = personaje.status === 'Alive'
                    ? 'Vivo'
                    : personaje.status === 'Dead'
                        ? 'Muerto'
                        : 'Desconocido';

                const colorEstado = personaje.status === 'Alive'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : personaje.status === 'Dead'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

                return `
                    <article class="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">

                        <img
                            src="${escaparHTML(personaje.image)}"
                            alt=""
                            loading="lazy"
                            class="h-12 w-12 shrink-0 rounded-lg border border-[#97CE4C]/40 bg-[#F1FADB] object-contain"
                        >

                        <div class="min-w-0 flex-1">
                            <p class="break-words text-sm font-semibold leading-snug text-[#081923] dark:text-white">
                                ${escaparHTML(personaje.name)}
                            </p>

                            <div class="mt-1 flex flex-wrap items-center gap-1.5">
                                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorEstado}">
                                    ${estado}
                                </span>

                                <span class="max-w-full truncate text-[11px] text-slate-500 dark:text-slate-400">
                                    ${escaparHTML(personaje.species || 'Especie desconocida')}
                                </span>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join('');

    } catch (fallo) {
        if (idSolicitud !== solicitudDetalle) {
            return;
        }

        modalEstadoPersonajes.textContent =
            'No se pudieron cargar los personajes. Cierra el detalle e inténtalo de nuevo.';

        console.error(
            'Error al cargar los personajes del episodio:',
            fallo
        );
    }
};

// Abre la ventana de detalles del episodio.
const abrirDetalleEpisodio = async (id) => {
    const episodio = episodios.find((item) => item.id === id);

    if (!episodio) {
        return;
    }

    const idSolicitud = ++solicitudDetalle;

    modalCodigo.textContent = episodio.episode;
    modalNombre.textContent = episodio.name;
    modalFecha.textContent = episodio.air_date || 'Fecha desconocida';
    modalCantidad.textContent = String(episodio.characters?.length ?? 0);

    modalEstadoPersonajes.textContent = 'Cargando personajes…';
    modalPersonajes.replaceChildren();

    if (!modalEpisodio.open) {
        modalEpisodio.showModal();
    }

    await cargarPersonajesDelEpisodio(episodio, idSolicitud);
};

// Búsqueda sin peticiones nuevas por cada tecla.
campoNombre.addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);

    temporizadorBusqueda = setTimeout(() => {
        limiteVisible = TAMANO_LOTE;
        renderEpisodios();
    }, 120);
});

// Filtro de temporada.
filtroTemporada.addEventListener('change', () => {
    limiteVisible = TAMANO_LOTE;
    renderEpisodios();
});

// Más episodios.
btnMasEpisodios.addEventListener('click', () => {
    limiteVisible += TAMANO_LOTE;
    renderEpisodios();
});

// Abrir detalles del episodio.
grillaEpisodios.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-episodio-id]');

    if (boton) {
        abrirDetalleEpisodio(Number(boton.dataset.episodioId));
    }
});

// Reintentar una consulta fallida.
mensajeEpisodios.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-reintentar-episodios]')) {
        cargarTodosEpisodios();
    }
});

// Cerrar el modal haciendo clic sobre el fondo.
modalEpisodio.addEventListener('click', (evento) => {
    if (evento.target === modalEpisodio) {
        modalEpisodio.close();
    }
});

// Navegación entre personajes y episodios dentro del mismo index.html.
const claseEnlaceEpisodiosActivo =
    'block rounded-xl border border-[#97CE4C]/50 bg-[#97CE4C]/15 px-4 py-2.5 font-bold text-[#97CE4C] shadow-sm transition hover:bg-[#97CE4C]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]';

const claseEnlaceEpisodiosInactivo =
    'block rounded-xl border border-transparent px-4 py-2.5 font-semibold text-[#97CE4C] transition hover:border-[#97CE4C]/40 hover:bg-[#97CE4C]/10 hover:text-[#B8E986] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#97CE4C]';

const mostrarVista = (vista) => {
    const verEpisodios = vista === 'episodios';

    presentacionPersonajes.classList.toggle('hidden', verEpisodios);
    buscadorPersonajes.classList.toggle('hidden', verEpisodios);
    seccionPersonajes.classList.toggle('hidden', verEpisodios);
    seccionEpisodios.classList.toggle('hidden', !verEpisodios);

    enlaceEpisodios.className = verEpisodios
        ? claseEnlaceEpisodiosActivo
        : claseEnlaceEpisodiosInactivo;

    if (verEpisodios) {
        enlaceEpisodios.setAttribute('aria-current', 'page');

        seccionEpisodios.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        enlaceEpisodios.removeAttribute('aria-current');

        seccionPersonajes.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};

menu.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('a');

    if (!enlace) {
        return;
    }

    if (enlace.id === 'enlace-episodios') {
        evento.preventDefault();
        mostrarVista('episodios');
        return;
    }

    if (enlace.hasAttribute('data-vista')) {
        mostrarVista('personajes');
    }

    if (
        enlace.getAttribute('href') === '#inicio' ||
        enlace.getAttribute('href') === '#acerca'
    ) {
        mostrarVista('personajes');
    }
});

// El logotipo también regresa a la vista de personajes.
enlaceInicio.addEventListener('click', () => {
    mostrarVista('personajes');
});

// Cerrar el menú móvil al seleccionar una opción.
const btnMenu = document.querySelector('#btn-menu');

menu.addEventListener('click', (evento) => {
    if (window.innerWidth < 768 && evento.target.closest('a')) {
        menu.classList.add('hidden');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.setAttribute('aria-label', 'Abrir menú');
    }
});

// Carga inicial.
cargarTodosEpisodios();