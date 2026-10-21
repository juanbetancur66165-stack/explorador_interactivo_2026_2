
// Este modulo es el unico responsable de consultar la API.

export const URL_PERSONAJES =
    'https://rickandmortyapi.com/api/character';

export const pedirJSON = async (url) => {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
};

// Obtiene una pagina de personajes.
// La URL puede ser la inicial o info.next.
export const obtenerPersonajes = (url = URL_PERSONAJES) => {
    return pedirJSON(url);
};