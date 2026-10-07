Bitácora de IA

2026-10-03 · Modal de detalle
Herramienta: ChatGPT
Spec que usé:
QUÉ:
Modal de detalle de un personaje de Rick and Morty para mi Explorador.

ESTRUCTURA
- Usar el elemento nativo <dialog id="modal-detalle"> y abrirlo con showModal().
- Mostrar una imagen cuadrada del personaje en la parte superior.
- Mostrar un <h2> con el nombre del personaje.
- Usar una lista <dl> para mostrar estado, especie, origen y ubicación.
- Incluir un botón "Cerrar".

ESTILO
- Usar Tailwind CSS v4.
- No usar CSS propio ni style="".
- Usar rounded-2xl, max-w-md, una sombra grande y un backdrop oscuro semitransparente.
- Incluir dark mode con variantes dark:.

COMPORTAMIENTO
- Cualquier botón "Ver detalle" debe abrir el modal.
- El modal debe abrirse con showModal().
- Debe cerrarse con Esc.
- Debe cerrarse con el botón "Cerrar" usando <form method="dialog">.
- Debe cerrarse también al hacer clic sobre el fondo oscuro.

RESTRICCIONES
- HTML y JavaScript vanilla en el mismo archivo.
- Sin librerías externas para el comportamiento.
- Usar aria-labelledby apuntando al <h2> del modal.
- La imagen debe tener alt.

CONTEXTO (datos reales de mi API)
{
  "name": "Rick Sanchez",
  "status": "Alive",
  "species": "Human",
  "origin": {
    "name": "Earth (C-137)"
  },
  "location": {
    "name": "Citadel of Ricks"
  },
  "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg"
}

Auditoría contra la spec:
Usa <dialog id="modal-detalle">.
Usa showModal() para abrir el modal.
Muestra imagen, nombre, estado, especie, origen y ubicación.
Usa <form method="dialog"> para el botón "Cerrar".
Usa aria-labelledby apuntando al título del modal.
La imagen tiene alt y el JavaScript actualiza ese alt según el personaje.
Se cierra con Esc mediante el comportamiento nativo de <dialog> cuando se usa showModal().

Se cierra con el botón "Cerrar".
Se agregó el cierre al hacer clic en el fondo con if (evento.target === modal) { modal.close(); }.
Un mismo modal sirve para las 8 tarjetas usando los atributos data-* de cada botón.
El estilo usa clases de Tailwind v4 y no CSS propio para el modal.
El modal tiene variantes dark: para fondo, texto y botón.
La spec de ejemplo del material usa id="ver-detalle", pero en mi proyecto hay 8 botones. Repetir un mismo id no sería apropiado, por eso lo adapté a la clase .btn-detalle y uso querySelectorAll().

Clases o sintaxis inventadas que encontré:
No encontré una clase inventada en la versión final del modal. Sí verifiqué las clases principales con IntelliSense/Tailwind antes de dejarlas en el código.

El material advierte especialmente sobre clases como shadow-3xl, que no existe en Tailwind 4; por eso mantuve shadow-2xl, que sí corresponde a la escala usada en el proyecto.

Qué no entendí y cómo lo resolví:
backdrop:bg-slate-900/60 me confundía porque backdrop: no modifica directamente el <dialog>. Lo entendí como una variante que estiliza el pseudo-elemento ::backdrop, que es la capa que aparece detrás del modal.

data-nombre, data-estado, etc. se usan para guardar datos en cada botón y luego boton.dataset permite leerlos desde JavaScript.

¿Puedo explicar cada línea? Sí.
2026-10-03 · Dark mode
Herramienta: ChatGPT

Spec que usé:

QUÉ:
Agregar modo oscuro al Explorador de Rick and Morty sin usar CSS propio ni JavaScript para cambiar el tema.

ESTRUCTURA
- Mantener la estructura actual del Explorador.
- Aplicar variantes dark: directamente a body, header, navegación, formulario, tarjetas, chips de estado, footer y modal.

ESTILO
- Usar Tailwind CSS v4.
- Fondo de la página: bg-slate-100 / dark:bg-slate-900.
- Superficies como tarjetas y modal: bg-white / dark:bg-slate-800.
- Texto principal: text-slate-900 / dark:text-white.
- Texto secundario: text-slate-500 / dark:text-slate-400.
- Bordes: border-slate-300 / dark:border-slate-600.
- Mantener los colores indigo de los botones y agregar variantes dark donde hagan falta.

COMPORTAMIENTO
- El modo oscuro debe responder a prefers-color-scheme: dark.
- No usar JavaScript para detectar o cambiar el tema.
- El select, los inputs y el modal deben seguir siendo legibles en oscuro.

RESTRICCIONES
- Usar solamente clases de Tailwind.
- No crear un CSS adicional para el dark mode.
- Revisar que ningún componente quede con fondo blanco y texto ilegible.

CONTEXTO
Mi Explorador usa Tailwind CSS v4 y tiene 8 tarjetas de personajes de Rick and Morty, un formulario de búsqueda, navegación y un modal de detalle.

Auditoría contra la spec:
body tiene bg-slate-100 y dark:bg-slate-900.
Las tarjetas tienen bg-white y dark:bg-slate-800.
Los títulos tienen text-slate-900 y dark:text-white.
Los textos secundarios tienen text-slate-500 y dark:text-slate-400.
El input tiene fondo, texto y borde para claro y oscuro.
El select tiene bg-white / dark:bg-slate-800 y texto claro/oscuro.
Los bordes de los campos tienen border-slate-300 / dark:border-slate-600.
El footer tiene borde y texto adaptados al modo oscuro.
El modal tiene bg-white / dark:bg-slate-800 y colores de texto adecuados.
El botón "Cerrar" tiene variantes dark: para borde, texto y hover.
Los chips de estado fueron revisados y se les agregaron variantes oscuras para no quedar demasiado claros sobre el fondo oscuro.
No se usa JavaScript para cambiar entre claro y oscuro.

Hallazgo de la auditoría: los chips de estado originalmente solo tenían clases claras, por ejemplo bg-emerald-100 text-emerald-700. Agregué dark:bg-emerald-900/40 dark:text-emerald-300 y equivalentes para otros estados.
Hallazgo de la auditoría: en los datos del <dl> del modal faltaban clases explícitas de texto oscuro. Agregué dark:text-slate-100 a los valores para dejar claro el contraste en modo oscuro.

Clases o sintaxis inventadas que encontré:
No encontré clases inventadas en la versión final.
Verifiqué que la sintaxis usada para transparencias, cuando fue necesaria, corresponde a Tailwind v4 y no a la forma antigua bg-opacity-*.

Qué no entendí y cómo lo resolví:
dark: significa que la segunda clase se aplica cuando está activo el modo oscuro según la configuración de Tailwind. En esta práctica se comprueba emulando prefers-color-scheme: dark en DevTools.
Entendí la idea de las parejas: no se diseña otra página desde cero; se añade una alternativa oscura a cada superficie, texto y borde importante.