
import { personajes } from './datos.js';
import { filtrarPersonajes, contarVivos, buscarPorId } from './logica.js';

const filtros = {
    texto: '',
    estado: '',
    especie: '',
    genero: ''
};

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

const GENEROS = {
    Male: 'Masculino',
    Female: 'Femenino',
    Genderless: 'Sin género',
    unknown: 'Desconocido'
};

const grilla = document.querySelector('#grilla');
const contador = document.querySelector('#contador');
const mensajeVacio = document.querySelector('#mensaje-vacio');
const formulario = document.querySelector('#form-busqueda');
const busqueda = document.querySelector('#busqueda');
const filtroEstado = document.querySelector('#filtro-estado');
const filtroEspecie = document.querySelector('#filtro-especie');
const filtroGenero = document.querySelector('#filtro-genero');
const modal = document.querySelector('#modal-detalle');
const btnMenu = document.querySelector('#btn-menu');
const menu = document.querySelector('#menu');

const tarjetaHTML = (personaje) => {
    const estado = ESTADOS[personaje.status] || ESTADOS.unknown;

    const especie = personaje.type
        ? `${personaje.species} (${personaje.type})`
        : personaje.species;

    return `
        <article class="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div class="overflow-hidden">
                <img
                    src="${personaje.image}"
                    alt="${personaje.name}"
                    class="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-105">
            </div>

            <div class="flex flex-1 flex-col gap-3 p-4">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                    ${personaje.name}
                </h3>

                <span class="w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.clases}">
                    ● ${estado.texto}
                </span>

                <p class="text-sm text-slate-500 dark:text-slate-400">
                    ${especie} · ${GENEROS[personaje.gender] || personaje.gender}
                </p>

                <p class="text-sm text-slate-600 dark:text-slate-300">
                    Origen: ${personaje.origin.name}
                </p>

                <button
                    type="button"
                    data-id="${personaje.id}"
                    class="btn-detalle mt-auto rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    Ver detalle
                </button>
            </div>
        </article>
    `;
};

const render = () => {
    const visibles = filtrarPersonajes(personajes, filtros);

    if (visibles.length === 0) {
        grilla.innerHTML = '';
        mensajeVacio.classList.remove('hidden');
    } else {
        mensajeVacio.classList.add('hidden');
        grilla.innerHTML = visibles.map(tarjetaHTML).join('');
    }

    contador.textContent =
        `${visibles.length} de ${personajes.length} personajes · ${contarVivos(visibles)} vivos`;
};

const abrirDetalle = (personaje) => {
    if (!personaje) return;

    const estado = ESTADOS[personaje.status] || ESTADOS.unknown;

    const especie = personaje.type
        ? `${personaje.species} (${personaje.type})`
        : personaje.species;

    document.querySelector('#modal-nombre').textContent = personaje.name;

    const imagen = document.querySelector('#modal-img');
    imagen.src = personaje.image;
    imagen.alt = personaje.name;

    document.querySelector('#modal-estado').textContent = estado.texto;
    document.querySelector('#modal-especie').textContent = especie;
    document.querySelector('#modal-genero').textContent =
        GENEROS[personaje.gender] || personaje.gender;
    document.querySelector('#modal-origen').textContent = personaje.origin.name;
    document.querySelector('#modal-ubicacion').textContent = personaje.location.name;

    modal.showModal();
};

btnMenu.addEventListener('click', () => {
    menu.classList.toggle('hidden');

    const abierto = !menu.classList.contains('hidden');

    btnMenu.setAttribute('aria-expanded', String(abierto));
    btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});

menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            menu.classList.add('hidden');
            btnMenu.setAttribute('aria-expanded', 'false');
            btnMenu.setAttribute('aria-label', 'Abrir menú');
        }
    });
});

busqueda.addEventListener('input', (evento) => {
    filtros.texto = evento.target.value;
    render();
});

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

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
});

grilla.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-id]');

    if (!boton) return;

    const personaje = buscarPorId(personajes, Number(boton.dataset.id));

    abrirDetalle(personaje);
});

modal.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.close();
    }
});

render();
