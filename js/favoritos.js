// js/favoritos.js
// Este es el único archivo que accede a localStorage.

const CLAVE = 'multiverso:favoritos';

// Lee los favoritos guardados.
// Siempre devuelve una lista, incluso si el JSON está dañado.
export const leerFavoritos = () => {
    try {
        const texto = localStorage.getItem(CLAVE) ?? '[]';
        const datos = JSON.parse(texto);

        if (!Array.isArray(datos)) {
            return [];
        }

        return datos.filter((personaje) =>
            personaje !== null &&
            typeof personaje === 'object' &&
            Number.isFinite(Number(personaje.id)) &&
            typeof personaje.name === 'string' &&
            typeof personaje.image === 'string'
        ).map((personaje) => ({
            ...personaje,
            id: Number(personaje.id)
        }));
    } catch (error) {
        console.warn(
            'No se pudieron leer los favoritos guardados.',
            error
        );

        return [];
    }
};

// Guarda la lista completa en formato JSON.
export const guardarFavoritos = (lista) => {
    try {
        localStorage.setItem(
            CLAVE,
            JSON.stringify(lista)
        );

        return true;
    } catch (error) {
        console.error(
            'No se pudieron guardar los favoritos:',
            error
        );

        return false;
    }
};

// Comprueba si un personaje está guardado.
export const esFavorito = (lista, id) => {
    return lista.some(
        (personaje) => Number(personaje.id) === Number(id)
    );
};

// Agrega un personaje o lo quita si ya estaba guardado.
export const alternarFavorito = (lista, personaje) => {
    if (!personaje) {
        return lista;
    }

    const id = Number(personaje.id);

    if (esFavorito(lista, id)) {
        return lista.filter(
            (favorito) => Number(favorito.id) !== id
        );
    }

    return [...lista, personaje];
};