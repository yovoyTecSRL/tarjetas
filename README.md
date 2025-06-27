# Prescreening Web App (prescrn)

**Prescrn** es un proyecto de front-end para la preselección de solicitudes de tarjeta de crédito de **Banco Validación**. Proporciona una interfaz sencilla donde los usuarios pueden iniciar el proceso de solicitud, ejecutar pruebas automáticas y consultar reportes.

---

## 📂 Estructura del repositorio

```
prescrn/
├─ css/                      # Archivos de estilos CSS
│   └─ ...                   # Estilos globales y específicos de páginas
├─ js/                       # Scripts JavaScript
│   └─ ...                   # Funcionalidad de pruebas, validaciones, etc.
├─ index.html                # Página principal de solicitud
├─ pruebas-automaticas.html  # Página de ejecución de pruebas automáticas
├─ reporte-pruebas.html      # Página de reporte de resultados de pruebas
└─ README.md                 # Documentación del proyecto (este archivo)
```

---

## 📝 Descripción de páginas

1. **index.html**

   * Encabezado con logo de Banco Validación.
   * Título y subtítulo: “Solicita tu tarjeta de crédito en minutos”.
   * Botones de navegación: “Ver Pruebas” y “Ver Reportes”.
   * Formulario principal con imagen de Visa y botón “Enviar”.

2. **pruebas-automaticas.html**

   * Página destinada a lanzar pruebas automáticas de validación de datos.
   * Incluye elementos para visualizar el progreso de las pruebas.

3. **reporte-pruebas.html**

   * Muestra resultados y reportes tras la ejecución de pruebas automáticas.
   * Permite al usuario revisar errores o advertencias detectadas.

---

## 🚀 Requisitos previos

* Un servidor web local o remoto (Apache, Nginx, etc.).
* Navegador moderno con soporte para HTML5 y JavaScript.

---

## 🔧 Instalación y despliegue

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/yovoyTecSRL/prescrn.git
   cd prescrn
   ```

2. **Copiar archivos al servidor**

   * Mover todo el contenido de la carpeta `prescrn/` al directorio raíz de tu servidor web (por ejemplo, `www/` o `public_html/`).

3. **Ajustar rutas de recursos**

   * Verificar que las rutas a `css/`, `js/` e imágenes sean correctas según tu configuración.

4. **Abrir en el navegador**

   * Navegar a `http://tu-servidor/index.html` para iniciar la aplicación.

---

## ⚙️ Uso

* **Inicio**: Desde la página principal (`index.html`), el usuario puede:

  * Iniciar el envío de datos para la solicitud de tarjeta.
  * Acceder a las pruebas automáticas.
  * Consultar reportes de pruebas.

* **Pruebas automáticas**: La página `pruebas-automaticas.html` ejecuta scripts de validación de campos y presenta el estado en tiempo real.

* **Reporte**: La página `reporte-pruebas.html` agrega los resultados para facilitar la corrección de errores.

---

## 🤝 Contribuciones

1. Crear un *fork* del repositorio.
2. Crear una rama con tu mejora: `git checkout -b feature/nueva-funcionalidad`.
3. Hacer *commit* de tus cambios: `git commit -m "Agregar nueva funcionalidad"`.
4. Hacer *push* a la rama: `git push origin feature/nueva-funcionalidad`.
5. Abrir un *pull request* detallando los cambios realizados.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para detalles.

---

## 📬 Contacto

Para dudas o soporte, contactar a **yovoyTecSRL** o al administrador del repositorio.



# Manual de Usuario - Página Principal (`index.html`)

Este manual describe paso a paso la interfaz y la funcionalidad de la página principal de **Prescreening Web App** de Banco Validación.

---

## 1. Acceso a la Interfaz

1. **Ubicación:** Copiar los archivos del proyecto al directorio de tu servidor web.
2. **URL de acceso:** `http://<tu-servidor>/index.html`.
3. **Requisitos:** Navegador moderno con soporte HTML5 y JavaScript.

---

## 2. Flujo de Uso

1. El usuario abre la página en el navegador.
2. Completa los campos obligatorios del formulario:

   * Nombre (`#nombre`)
   * Apellido (`#apellido`)
   * Cédula/DNI (`#dni`)
   * Correo Electrónico (`#email`)

   <!-- Agregar otros campos según el negocio -->
3. Hace clic en **Enviar** (`#btnEnviar`).
4. El script ejecuta `validarFormulario()`, que:

   * Verifica campos no vacíos.
   * Valida formato de correo (`regexEmail`).
   * Comprueba longitud y caracteres del DNI.
5. **Errores**: Se muestran en `<span class="error" id="error-[campo]">` y se detiene el envío.
6. **Éxito**: Se muestra `alert("Solicitud enviada correctamente")` y se envían los datos al endpoint configurado.

---

## 3. Funcionalidades y Scripts (JS)

### 3.1. Validación de Formulario

* Archivo: `js/validaciones.js`
* Función principal: `validarFormulario()`
* Asociada al `onsubmit` del formulario:

  ```js
  document.getElementById('formSolicitud').onsubmit = function(e) {
    e.preventDefault();
    validarFormulario();
  };
  ```

### 3.2. Navegación entre Páginas

* Archivo: `js/main.js`
* Función: `redireccionar(destino)`

  ```js
  function redireccionar(destino) {
    window.location.href = destino;
  }
  document.getElementById('btnPruebas').onclick = () => redireccionar('pruebas-automaticas.html');
  document.getElementById('btnReportes').onclick = () => redireccionar('reporte-pruebas.html');
  ```

### 3.3. Feedback de Usuario

* Mensajes de error usando `<span class="error" ...>`.
* Alerta de éxito con `alert()`.

---

# Manual de Usuario - Pruebas Automáticas Visuales (`pruebas-automaticas.html`)

Este documento describe cómo interactuar con la interfaz de **Pruebas Automáticas Visuales** y detalla la funcionalidad de los scripts asociados.

---

## 1. Acceso a la Interfaz

1. **Ubicación:** `pruebas-automaticas.html` debe estar junto a `index.html` y `reporte-pruebas.html`.
2. **URL de acceso:** `http://<tu-servidor>/pruebas-automaticas.html`.
3. **Requisitos:** Navegador moderno con JavaScript habilitado.

---

## 2. Flujo de Uso y Funcionalidad

### 2.1. Al Cargar la Página

Se invoca automáticamente `ejecutarPruebas()`:

```js
// Inicio de pruebas al cargar la página
ejecutarPruebas();
```

### 2.2. Función `ejecutarPruebas()`

1. Inicializa `exitos = 0`.
2. Bucle de 1 a 10:

   * Llama a `simularSolicitud(i)`.
   * Incrementa exitos y actualiza `#resumen`:

     ```html
     <b>Pruebas ejecutadas: {i}/10</b>
     <span style="color:green;">Éxitos: {exitos}</span>
     ```
3. Tras 10 iteraciones:

   * Guarda en `localStorage` el reporte bajo `reportePruebasBCR`.
   * Muestra botones “Ver detalles” (abre `reporte-pruebas.html`) y “Ver recomendaciones”.

### 2.3. Función `simularSolicitud(num)`

1. Limpia chat: `chat.innerHTML = '';`.
2. Agrega mensaje de inicio: `agregarMensaje(`--- Prueba automática #\${num} ---`, 'bot');`.
3. Para cada campo (nombre, cédula, teléfono, correo, dirección, ocupación, ingresos):

   * Banco pregunta (`'bot'`).
   * Respuesta generada (`'user'`).
   * Pausas con `setTimeout`.
4. Validaciones visuales de paso por CCSS, Protectora, BCR y Hacienda.
5. Mensaje final con número de solicitud, monto, dirección y transportista.

### 2.4. Generadores de Datos Aleatorios

* `randomNombre()`
* `randomCedula()`
* `randomTelefono()`
* `randomCorreo(nombre)`
* `randomDireccion()`
* `randomOcupacion()`
* `randomIngresos()`

### 2.5. Función `agregarMensaje(texto, clase)`

Crea un `div`, asigna la clase (`user` o `bot`), y añade al chat:

```js
function agregarMensaje(texto, clase) {
  const div = document.createElement('div');
  div.className = clase;
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
```

---

# Manual de Usuario - Reporte de Pruebas (`reporte-pruebas.html`)

Este manual detalla la interfaz y funcionalidad de la página de reporte de pruebas automáticas.

---

## 1. Acceso a la Interfaz

1. **Ubicación:** `reporte-pruebas.html` debe estar junto a `index.html` y `pruebas-automaticas.html`.
2. **URL de acceso:** `http://<tu-servidor>/reporte-pruebas.html`.
3. **Requisitos:** Navegador moderno con JavaScript habilitado.

---

## 2. Flujo de Uso y Funcionalidad

1. La página lee el objeto `reportePruebasBCR` de `localStorage`:

   ```js
   const reporte = JSON.parse(localStorage.getItem('reportePruebasBCR') || '{"total":0,"fallos":0,"detalles":[]}');
   ```
2. Muestra estadísticas en `#estadistica`:

   * **Total de pruebas:** `reporte.total`
   * **Éxitos:** `reporte.total - reporte.fallos`
   * **Fallos:** `reporte.fallos`
3. Botones de interacción:

   * **Ver detalles:** llama a `mostrarDetalles()`.
   * **Ver recomendaciones:** llama a `mostrarRecomendaciones()`.
4. Función `mostrarDetalles()`:

   * Despliega el contenedor `#detalles` y oculta `#recomendaciones`.
   * Si `reporte.detalles.length > 0`, itera y muestra cada detalle:

     ```js
     reporte.detalles.map((d,i) => `<b>Prueba ${i+1}:</b> ${d}`).join('<br>')
     ```
   * En caso contrario, muestra "No hay detalles individuales disponibles."
5. Función `mostrarRecomendaciones()`:

   * Despliega `#recomendaciones` y oculta `#detalles`.
   * Inserta lista de recomendaciones:

     ```html
     <ul>
       <li>Verifica que todos los campos del formulario estén correctamente validados.</li>
       <li>Mejora la experiencia visual en dispositivos móviles.</li>
       <li>Implementa validación real en el backend para producción.</li>
       <li>Agrega logs de auditoría para cada solicitud.</li>
       <li>Conecta el estado de la tarjeta a un backend real.</li>
     </ul>
     ```

---

Para más detalles o soporte, abre un *issue* en el repositorio o contacta al equipo de **yovoyTecSRL**.
