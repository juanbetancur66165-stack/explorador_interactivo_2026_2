// js/logica.js
// Funciones puras: reciben datos y devuelven datos.
// No manipulan el DOM.

export const filtrarPersonajes = (lista, filtros) => {
    const texto = filtros.texto.trim().toLowerCase();

    return lista
        .filter((personaje) =>
            personaje.name.toLowerCase().includes(texto)
        )
        .filter((personaje) =>
            filtros.estado === '' ||
            personaje.status.toLowerCase() === filtros.estado.toLowerCase()
        )
        .filter((personaje) =>
            filtros.especie === '' ||
            personaje.species.toLowerCase() === filtros.especie.toLowerCase()
        )
        .filter((personaje) =>
            filtros.genero === '' ||
            personaje.gender.toLowerCase() === filtros.genero.toLowerCase()
        );
};

export const contarVivos = (lista) => {
    return lista.reduce((total, personaje) => {
        return personaje.status === 'Alive' ? total + 1 : total;
    }, 0);
};

export const buscarPorId = (lista, id) => {
    return lista.find((personaje) => personaje.id === id);
};