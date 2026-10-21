# Notas de la API — Explorador de Rick and Morty

## 1. URL del listado

`https://rickandmortyapi.com/api/character`

La primera solicitud se hace desde `js/api.js`. La función
`obtenerPersonajes(url)` acepta la URL inicial o la URL de
la siguiente página que devuelve la API.

## 2. ¿Dónde está el array de personajes?

Los personajes están en la propiedad `results` de la respuesta JSON:

```js
datos.results
```

Cada petición de listado devuelve hasta 20 personajes.

## 3. ¿Dónde está el total y cómo se avanza de página?

La información de paginación se encuentra en `info`:

- `datos.info.count`: cantidad total de personajes que informa la API.
- `datos.info.pages`: cantidad total de páginas.
- `datos.info.next`: URL de la próxima página o `null` cuando no hay otra.
- `datos.info.prev`: URL de la página anterior o `null` si no existe.

El proyecto guarda `datos.info.next` en la variable `siguiente`.
Al pulsar **Cargar más**, solicita esa URL y concatena los nuevos
resultados con el operador spread:

```js
personajes = [...personajes, ...datos.results];
siguiente = datos.info.next;
```

## 4. ¿Cada elemento trae los datos de la tarjeta y del modal?

Sí. Cada personaje contiene los campos que usa la interfaz;
no es necesario hacer otra petición por personaje.

| Campo | Uso en el Explorador |
|---|---|
| `id` | Identificar el personaje, abrir el modal y guardar favoritos. |
| `name` | Nombre y búsqueda. |
| `status` | Estado y contador de vivos. |
| `species` | Filtro y tarjeta. |
| `type` | Subtipo opcional que se presenta junto a la especie. |
| `gender` | Filtro, tarjeta y modal. |
| `origin.name` | Origen del personaje. |
| `location.name` | Ubicación en el modal. |
| `image` | Imagen de la tarjeta y del modal. |

Ejemplo reducido de un personaje:

```json
{
  "id": 1,
  "name": "Rick Sanchez",
  "status": "Alive",
  "species": "Human",
  "type": "",
  "gender": "Male",
  "origin": {
    "name": "Earth (C-137)"
  },
  "location": {
    "name": "Citadel of Ricks"
  },
  "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg"
}
```

## 5. ¿Cómo se detectan los errores?

`js/api.js` ejecuta `fetch(url)` y revisa `respuesta.ok`.
Si la respuesta HTTP no es exitosa, lanza un error con el código HTTP.
`js/app.js` captura fallos de red o HTTP con `try/catch` y presenta
un mensaje y una opción para reintentar.

## 6. Fuente de la documentación

- API: <https://rickandmortyapi.com/api/character>
- Documentación oficial: <https://rickandmortyapi.com/documentation>