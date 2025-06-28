// Chat mejorado para BCR Form
let bcr_chat = null; // Variable global para acceso desde botones

class BCRChat {
    constructor() {
        console.log('🎯 Inicializando BCRChat...');
        this.chatContainer = document.getElementById('chat');
        this.form = document.getElementById('chatForm');
        this.input = document.getElementById('input');
        if (!this.chatContainer || !this.form || !this.input) {
            console.error('❌ Faltan elementos requeridos en el DOM');
            return;
        }
        this.userData = {};
        this.currentStep = 1;
        this.conversationId = this.generateId();
        this.waitingFor = 'nombre';
        this.init();
        console.log('✅ BCRChat inicializado correctamente');
    }

    init() {
        this.form.addEventListener('submit', e => this.handleSubmit(e));
        const welcome = "¡Hola! Bienvenido al Banco de Costa Rica. Para solicitar tu tarjeta de crédito, necesito tu nombre completo.";
        this.addMessage(welcome, 'bot');
        // Nota: la síntesis de voz automática en init se ha eliminado para cumplir con políticas de origen seguro
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.innerHTML = `
            <div class="message-content">
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <p>${text}</p>
            </div>`;
        this.chatContainer.appendChild(div);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'es-ES';
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const msg = this.input.value.trim();
        if (!msg) return;
        this.addMessage(msg, 'user');
        this.input.value = '';
        await this.processUserInput(msg);
    }

    async processUserInput(msg) {
        this.showTypingIndicator();
        try {
            let resp;
            switch (this.waitingFor) {
                case 'nombre':
                    if (this.validateNombre(msg)) {
                        this.userData.nombre = msg;
                        this.waitingFor = 'cedula';
                        resp = { bot_message: `Perfecto ${msg}. Ahora tu número de cédula (9-10 dígitos).`, paso: 2 };
                    } else {
                        resp = { bot_message: "Ingresa nombre y apellidos completos.", paso: 1 };
                    }
                    break;
                case 'cedula':
                    if (this.validateCedula(msg)) {
                        this.userData.cedula = msg;
                        this.waitingFor = 'telefono';
                        resp = { bot_message: "Excelente. ¿Teléfono? (8 dígitos, inicia con 2,6,7,8)", paso: 3 };
                    } else {
                        resp = { bot_message: "Cédula inválida, ingrésala de nuevo.", paso: 2 };
                    }
                    break;
                case 'telefono':
                    if (this.validateTelefono(msg)) {
                        this.userData.telefono = msg;
                        this.waitingFor = 'direccion';
                        resp = { bot_message: "Perfecto. ¿Dirección para entrega?", paso: 4 };
                    } else {
                        resp = { bot_message: "Teléfono inválido, ingresa 8 dígitos válidos.", paso: 3 };
                    }
                    break;
                case 'direccion':
                    if (this.validateDireccionCompleta(msg)) {
                        this.userData.direccion = msg;
                        this.waitingFor = 'gps';
                        this.showGPSOptions();
                        resp = { bot_message: "¿Quieres validar esta dirección con GPS?", paso: 4.5 };
                    } else {
                        const sug = this.getSugerenciaDireccion(msg);
                        resp = { bot_message: `Dirección incompleta. ${sug}`, paso: 4 };
                    }
                    break;
                default:
                    resp = { bot_message: "No entendí, ¿puedes repetirlo?", paso: this.currentStep };
            }
            this.hideTypingIndicator();
            if (resp.bot_message) {
                this.processResponse(resp);
            }
        } catch (err) {
            console.error('Error en processUserInput:', err);
            this.hideTypingIndicator();
            this.addMessage('Error interno, intenta de nuevo.', 'bot');
        }
    }

    showTypingIndicator() {
        const ind = document.createElement('div');
        ind.className = 'typing-indicator';
        ind.id = 'typing-indicator';
        ind.innerHTML = `<div class="message bot"><div class="message-content"><p>escribiendo...</p><div class="typing-animation"><span></span><span></span><span></span></div></div></div>`;
        this.chatContainer.appendChild(ind);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
    }

    processResponse(res) {
        this.addMessage(res.bot_message, 'bot');
        // Solo hablar después de interacción del usuario (speak en respuesta a submit)
        this.speak(res.bot_message);
        if (res.paso) this.currentStep = res.paso;
        this.waitingFor = this.mapPasoToField(res.paso);
    }

    mapPasoToField(paso) {
        const map = { 1: 'nombre', 2: 'cedula', 3: 'telefono', 4: 'direccion', 4.5: 'gps' };
        return map[paso] || this.waitingFor;
    }

    showGPSOptions() {
        const cont = document.createElement('div');
        cont.className = 'gps-container';
        cont.innerHTML = `
            <h4>📍 Usar GPS para validar dirección</h4>
            <button class="gps-btn" id="gps-yes">Obtener ubicación GPS</button>
            <button class="gps-btn" id="gps-no">Continuar sin GPS</button>
            <div id="gps-status" class="gps-status"></div>`;
        this.chatContainer.appendChild(cont);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        document.getElementById('gps-yes').addEventListener('click', () => this.getGPSLocation());
        document.getElementById('gps-no').addEventListener('click', () => this.continueWithoutGPS());
    }

    async getGPSLocation() {
        const status = document.getElementById('gps-status');
        status.textContent = '🔄 Solicitando permiso GPS...';
        if (!navigator.geolocation) {
            status.textContent = '❌ Geolocalización no soportada';
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => this.handleGPSSuccess(pos),
            err => this.handleGPSError(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    handleGPSSuccess(position) {
        const { latitude, longitude, accuracy } = position.coords;
        const status = document.getElementById('gps-status');
        status.innerHTML = `✅ Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`;
        this.userData.gps = { latitude, longitude };
        setTimeout(() => this.continueWithValidation(), 1000);
    }

    handleGPSError(error) {
        console.error('Geolocation error', error.code, error.message);
        const status = document.getElementById('gps-status');
        let msg;
        switch (error.code) {
            case 1: msg = '❌ Permiso denegado'; break;
            case 2: msg = '❌ Posición no disponible'; break;
            case 3: msg = '⏰ Tiempo de espera agotado'; break;
            default: msg = '❌ Error desconocido';
        }
        status.textContent = msg;
        setTimeout(() => this.continueWithoutGPS(), 1500);
    }

    continueWithoutGPS() {
        this.addMessage('Continuando sin GPS. Usaremos la dirección ingresada.', 'bot');
        this.continueWithValidation();
    }

    continueWithValidation() {
        this.addMessage('Validando datos...', 'bot');
        // Aquí invocarías startValidation()
    }

    // (Resto de validaciones y utilidades...) 
}

// Inicializar chat al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    bcr_chat = new BCRChat();
    window.bcr_chat = bcr_chat;
});
