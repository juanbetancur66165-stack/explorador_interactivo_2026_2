// Este módulo centraliza las consultas a la API de Rick and Morty.

export const URL_PERSONAJES =
    'https://rickandmortyapi.com/api/character';

export const URL_EPISODIOS =
    'https://rickandmortyapi.com/api/episode';

export const pedirJSON = async (url) => {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
};

// Obtiene una página de personajes.
export const obtenerPersonajes = (url = URL_PERSONAJES) => {
    return pedirJSON(url);
};

// Obtiene una página de episodios.
export const obtenerEpisodios = (url = URL_EPISODIOS) => {
    return pedirJSON(url);
};

// Obtiene varios personajes para mostrar los detalles de un episodio.
export const obtenerPersonajesPorIds = async (ids) => {
    const idsValidos = [...new Set(ids.map(Number))]
        .filter((id) => Number.isInteger(id) && id > 0);

    if (idsValidos.length === 0) {
        return [];
    }

    const datos = await pedirJSON(
        `${URL_PERSONAJES}/${idsValidos.join(',')}`
    );

    return Array.isArray(datos) ? datos : [datos];
};