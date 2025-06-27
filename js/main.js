document.addEventListener("DOMContentLoaded", () => {
    const chat = document.getElementById("chat");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("input");
    let paso = 1;
    let datos = {};
    let validando = null;
    let esperando_confirmacion = false;
    let esperando_nueva_direccion = false;

    function agregarMensaje(texto, clase) {
        const div = document.createElement("div");
        div.className = clase;
        div.textContent = texto;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    function reproducirSonido() {
        const audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4c82.mp3');
        audio.play();
    }

    function hablar(texto) {
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(texto);
            utter.lang = 'es-ES';
            window.speechSynthesis.speak(utter);
        }
    }

    function responder(data) {
        // Simula el comportamiento del backend
        if (paso === 1) {
            if (!data.nombre) return { paso: 1, pregunta: "¿Cuál es tu nombre completo?" };
            return { paso: 2, pregunta: "¿Cuál es tu cédula?" };
        }

        if (paso === 2) {
            if (!data.cedula) return { paso: 2, pregunta: "¿Cuál es tu cédula?" };
            return { paso: 3, pregunta: "¿Cuál es tu teléfono?" };
        }

        if (paso === 3) {
            if (!data.telefono) return { paso: 3, pregunta: "¿Cuál es tu teléfono?" };
            return { paso: 4, pregunta: "¿Cuál es la dirección de entrega de la tarjeta?" };
        }

        if (paso === 4) {
            if (!data.direccion) return { paso: 4, pregunta: "¿Cuál es la dirección de entrega de la tarjeta?" };
            validando = "PROTECTORA";
            return { validando: true, mensaje: "Validando en CCSS...", siguiente: "PROTECTORA" };
        }

        if (validando === "PROTECTORA") {
            validando = "BCR";
            return { validando: true, mensaje: "Validando en Protectora de Crédito...", siguiente: "BCR" };
        }

        if (validando === "BCR") {
            validando = "HACIENDA";
            return { validando: true, mensaje: "Validando en Banco de Costa Rica...", siguiente: "HACIENDA" };
        }

        if (validando === "HACIENDA") {
            validando = "FINAL";
            return { validando: true, mensaje: "Validando en Ministerio de Hacienda...", siguiente: "FINAL" };
        }

        if (validando === "FINAL") {
            return { pregunta_final: true, mensaje: `¿La dirección de entrega es la misma que escribiste: "${datos.direccion}"? (Responde sí o no)` };
        }

        if (data.direccion_confirmada === "si") {
            const numero = Math.floor(100000 + Math.random() * 900000);
            return { orden_creada: true, mensaje: `¡Felicidades! Clasificaste para una tarjeta. Tu número de solicitud es: ${numero}.`, numeroSolicitud: numero };
        }

        if (data.direccion_confirmada === "no") {
            esperando_nueva_direccion = true;
            return { pide_nueva_direccion: true, mensaje: "Por favor, indícanos tu nueva dirección de entrega." };
        }

        if (data.nueva_direccion) {
            const numero = Math.floor(100000 + Math.random() * 900000);
            datos.direccion = data.nueva_direccion;
            return { orden_creada: true, mensaje: `¡Gracias! Enviaremos tu tarjeta a: "${data.nueva_direccion}". Tu número de solicitud es: ${numero}.`, numeroSolicitud: numero };
        }

        return { mensaje: "Algo salió mal..." };
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const valor = input.value.trim();
        if (!valor) return;
        agregarMensaje("Tú: " + valor, "user");
        input.value = "";

        if (esperando_confirmacion) {
            esperando_confirmacion = false;
            const r = responder({ direccion_confirmada: valor.toLowerCase() });
            procesarRespuesta(r);
            return;
        }

        if (esperando_nueva_direccion) {
            esperando_nueva_direccion = false;
            const r = responder({ nueva_direccion: valor });
            procesarRespuesta(r);
            return;
        }

        switch (paso) {
            case 1: datos.nombre = valor; break;
            case 2: datos.cedula = valor; break;
            case 3: datos.telefono = valor; break;
            case 4: datos.direccion = valor; break;
        }

        const r = responder(datos);
        if (r.validando) {
            agregarMensaje("Banco: " + r.mensaje, "bot");
            setTimeout(() => {
                const siguiente = responder(datos);
                procesarRespuesta(siguiente);
            }, 1000);
        } else {
            procesarRespuesta(r);
        }

        paso = r.paso || paso;
        validando = r.siguiente || validando;
    });

    function procesarRespuesta(r) {
        if (r.pregunta) {
            agregarMensaje("Banco: " + r.pregunta, "bot");
        }
        if (r.pregunta_final) {
            agregarMensaje("Banco: " + r.mensaje, "bot");
            esperando_confirmacion = true;
        }
        if (r.pide_nueva_direccion) {
            agregarMensaje("Banco: " + r.mensaje, "bot");
            esperando_nueva_direccion = true;
        }
        if (r.orden_creada) {
            agregarMensaje("Banco: " + r.mensaje, "bot");
            reproducirSonido();
            setTimeout(() => {
                hablar(r.mensaje);
            }, 800);
            form.style.display = "none";
        }
    }

    agregarMensaje("Banco: ¡Bienvenido! Vamos a solicitar tu tarjeta de crédito. ¿Cuál es tu nombre completo?", "bot");
});