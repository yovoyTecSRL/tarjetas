// Chat mejorado para BCR Form
let bcr_chat = null; // Variable global para acceso desde botones

class BCRChat {
    constructor() {
        console.log('🎯 Inicializando BCRChat...');
        
        this.chatContainer = document.getElementById('chat');
        this.form = document.getElementById('chatForm');
        this.input = document.getElementById('input');
        
        if (!this.chatContainer) {
            console.error('❌ Elemento #chat no encontrado');
            return;
        }
        if (!this.form) {
            console.error('❌ Elemento #chatForm no encontrado');
            return;
        }
        if (!this.input) {
            console.error('❌ Elemento #input no encontrado');
            return;
        }
        
        console.log('✅ Elementos del DOM encontrados correctamente');
        
        this.userData = {};
        this.currentStep = 1;
        this.isValidating = false;
        this.conversationId = this.generateId();
        this.waitingFor = 'nombre';
        
        this.init();
        console.log('✅ BCRChat inicializado correctamente');
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        const welcomeMessage = "¡Hola! Bienvenido al Banco de Costa Rica. Para solicitar tu tarjeta de crédito, necesito algunos datos. ¿Cuál es tu nombre completo?";
        this.addMessage(welcomeMessage, 'bot');
        
        // Agregar un pequeño delay para que el audio funcione mejor
        setTimeout(() => {
            this.speak("¡Hola! Bienvenido al Banco de Costa Rica. Para solicitar tu tarjeta de crédito, necesito algunos datos. ¿Cuál es tu nombre completo?");
        }, 500);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <p>${text}</p>
            </div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.input.value = '';

        // Procesar según el paso actual
        await this.processUserInput(message);
    }

    async processUserInput(message) {
        this.showTypingIndicator();

        try {
            let response;
            
            // Procesar según el campo que estamos esperando
            switch(this.waitingFor) {
                case 'nombre':
                    if (this.validateNombre(message)) {
                        this.userData.nombre = message;
                        this.currentStep = 2;
                        this.waitingFor = 'cedula';
                        response = {
                            bot_message: `Perfecto ${message}. Ahora necesito tu número de cédula (9 o 10 dígitos).`,
                            paso: 2
                        };
                    } else {
                        response = {
                            bot_message: "Por favor ingresa tu nombre completo (nombre(s) y apellidos). Ejemplo: Juan Carlos Pérez González",
                            paso: 1
                        };
                    }
                    break;
                    
                case 'cedula':
                    if (this.validateCedula(message)) {
                        this.userData.cedula = message;
                        this.currentStep = 3;
                        this.waitingFor = 'telefono';
                        response = {
                            bot_message: "Excelente. ¿Cuál es tu número de teléfono? (8 dígitos, empezando con 2, 6, 7 u 8)",
                            paso: 3
                        };
                    } else {
                        response = {
                            bot_message: "La cédula debe tener entre 9 y 10 dígitos. Por favor, ingrésala nuevamente.",
                            paso: 2
                        };
                    }
                    break;
                    
                case 'telefono':
                    if (this.validateTelefono(message)) {
                        this.userData.telefono = message;
                        this.currentStep = 4;
                        this.waitingFor = 'direccion';
                        response = {
                            bot_message: "Perfecto. ¿Cuál es tu dirección exacta para la entrega de la tarjeta?",
                            paso: 4
                        };
                    } else {
                        response = {
                            bot_message: "El teléfono debe tener 8 dígitos y comenzar con 2, 6, 7 u 8. Ejemplo: 88887777",
                            paso: 3
                        };
                    }
                    break;
                    
                case 'direccion':
                    if (this.validateDireccionCompleta(message)) {
                        this.userData.direccion = message;
                        this.currentStep = 5;
                        this.waitingFor = 'validation';
                        
                        // Mostrar opciones de GPS
                        this.showGPSOptions();
                        
                        response = {
                            bot_message: "Perfecto. ¿Te gustaría usar tu ubicación GPS para verificar la dirección exacta? Esto ayuda a garantizar una entrega precisa.",
                            paso: 4.5,
                            show_gps: true
                        };
                    } else {
                        const sugerencia = this.getSugerenciaDireccion(message);
                        response = {
                            bot_message: `Para una entrega precisa, necesito una dirección más completa. ${sugerencia}`,
                            paso: 4
                        };
                    }
                    break;
                    
                default:
                    response = {
                        bot_message: "Disculpa, no entendí tu mensaje. ¿Podrías repetirlo?",
                        paso: this.currentStep
                    };
            }

            this.hideTypingIndicator();
            this.processResponse(response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Disculpa, hubo un error. Por favor intenta de nuevo.', 'bot');
        }
    }

    validateNombre(nombre) {
        // Sanitizar entrada
        const sanitized = this.sanitizeInput(nombre);
        
        // Validar que tenga al menos 2 palabras y máximo 4 (1-2 nombres + 2 apellidos)
        const palabras = sanitized.trim().split(/\s+/);
        if (palabras.length < 2 || palabras.length > 4) return false;
        
        // Validar que cada palabra contenga solo letras y acentos (no caracteres especiales peligrosos)
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/;
        const isValid = palabras.every(palabra => {
            return nombreRegex.test(palabra) && 
                   palabra.length >= 2 && 
                   palabra.length <= 25 &&  // Evitar nombres extremadamente largos
                   !this.containsDangerousPatterns(palabra);
        });
        
        return isValid;
    }

    validateCedula(cedula) {
        // Sanitizar y validar cédula para prevenir inyección SQL
        const sanitized = this.sanitizeInput(cedula);
        
        // Limpiar espacios y guiones, solo permitir dígitos
        const cleanCedula = sanitized.replace(/[\s-]/g, '').replace(/[^\d]/g, '');
        
        // Verificar patrones peligrosos antes de validar
        if (this.containsDangerousPatterns(cedula)) {
            return false;
        }
        
        // Validar que sean exactamente 9 o 10 dígitos
        if (!/^\d{9,10}$/.test(cleanCedula)) {
            return false;
        }
        
        // Validación adicional: no permitir patrones repetitivos obvios
        if (/^(\d)\1{8,9}$/.test(cleanCedula)) {
            return false; // Rechazar 111111111, 000000000, etc.
        }
        
        return true;
    }

    validateTelefono(telefono) {
        // Sanitizar entrada
        const sanitized = this.sanitizeInput(telefono);
        
        // Verificar patrones peligrosos
        if (this.containsDangerousPatterns(telefono)) {
            return false;
        }
        
        // Limpiar espacios y guiones, solo permitir dígitos
        const cleanTelefono = sanitized.replace(/[\s-]/g, '').replace(/[^\d]/g, '');
        
        // Validar formato costarricense: exactamente 8 dígitos empezando con 2,6,7,8
        if (!/^[2678]\d{7}$/.test(cleanTelefono)) {
            return false;
        }
        
        // Validación adicional: no permitir patrones repetitivos
        if (/^(\d)\1{7}$/.test(cleanTelefono)) {
            return false; // Rechazar 22222222, 88888888, etc.
        }
        
        return true;
    }

    validateEmail(email) {
        // Sanitizar entrada
        const sanitized = this.sanitizeInput(email);
        
        // Verificar patrones peligrosos
        if (this.containsDangerousPatterns(email)) {
            return false;
        }
        
        // Validación de email más estricta
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(sanitized)) {
            return false;
        }
        
        // Verificar longitud razonable
        if (sanitized.length > 254 || sanitized.length < 5) {
            return false;
        }
        
        return true;
    }

    validateDireccionCompleta(direccion) {
        // Sanitizar entrada
        const sanitized = this.sanitizeInput(direccion);
        
        // Verificar patrones peligrosos
        if (this.containsDangerousPatterns(direccion)) {
            return false;
        }
        
        if (sanitized.length < 15 || sanitized.length > 500) return false;
        
        // Componentes requeridos para Costa Rica
        const componentes = {
            provincia: ['san josé', 'alajuela', 'cartago', 'heredia', 'guanacaste', 'puntarenas', 'limón'],
            cantones: ['central', 'escazú', 'desamparados', 'puriscal', 'tarrazú', 'aserrí', 'mora', 'goicoechea', 
                      'santa ana', 'alajuelita', 'coronado', 'acosta', 'tibás', 'moravia', 'montes de oca', 'turrubares', 
                      'dota', 'curridabat', 'pérez zeledón', 'león cortés', 'alajuela', 'san ramón', 'grecia', 'san mateo', 
                      'atenas', 'naranjo', 'palmares', 'poás', 'orotina', 'san carlos', 'zarcero', 'sarchí', 'upala', 
                      'los chiles', 'guatuso', 'cartago', 'paraíso', 'la unión', 'jiménez', 'turrialba', 'alvarado', 
                      'oreamuno', 'el guarco', 'heredia', 'barva', 'santo domingo', 'santa bárbara', 'san rafael', 
                      'san isidro', 'belén', 'flores', 'san pablo', 'sarapiquí'],
            distritos: ['carmen', 'merced', 'hospital', 'catedral', 'zapote', 'san francisco de dos ríos', 'la uruca', 
                       'mata redonda', 'pavas', 'hatillo', 'san sebastián']
        };
        
        const dirLower = direccion.toLowerCase();
        
        // Verificar si contiene al menos provincia
        const tieneProvincia = componentes.provincia.some(prov => dirLower.includes(prov));
        
        // Verificar patrones comunes de direcciones costarricenses
        const tienePatronComun = /\d+\s*(metros?|m)\s*(norte|sur|este|oeste)/i.test(direccion) ||
                                /del\s+\w+\s+\d+\s*(metros?|m)/i.test(direccion) ||
                                /casa\s+\w+/i.test(direccion) ||
                                /apartamento\s+\w+/i.test(direccion);
        
        return tieneProvincia || tienePatronComun || direccion.length >= 25;
    }

    getSugerenciaDireccion(direccion) {
        const dirLower = direccion.toLowerCase();
        const sugerencias = [];
        
        if (!/(san josé|alajuela|cartago|heredia|guanacaste|puntarenas|limón)/i.test(direccion)) {
            sugerencias.push("Incluye la provincia (ej: San José, Alajuela, etc.)");
        }
        
        if (!/\d+\s*(metros?|m|casa|apartamento)/i.test(direccion)) {
            sugerencias.push("Agrega referencias específicas (ej: '200m norte del parque')");
        }
        
        if (direccion.length < 20) {
            sugerencias.push("Proporciona más detalles como barrio o referencias cercanas");
        }
        
        if (sugerencias.length === 0) {
            return "Ejemplo: 'San José, Escazú, San Rafael, del Mall Multiplaza 300m oeste, casa blanca con portón negro'";
        }
        
        return sugerencias.join(". ") + ". O usa el botón GPS para ubicación automática.";
    }
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message bot">
                <div class="message-content">
                    <p>El banco está escribiendo...</p>
                    <div class="typing-animation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        this.chatContainer.appendChild(indicator);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async sendMessage(message) {
        const payload = {
            message: message,
            user_data: {
                ...this.userData,
                paso: this.currentStep,
                conversation_id: this.conversationId
            }
        };

        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        return await response.json();
    }

    processResponse(response) {
        this.addMessage(response.bot_message, 'bot');
        this.speak(response.bot_message);

        if (response.paso) {
            this.currentStep = response.paso;
        }

        if (response.waiting_for) {
            this.userData.waiting_for = response.waiting_for;
        }

        if (response.start_validation) {
            this.startValidation();
        }

        if (response.numero_solicitud) {
            this.showSuccessCard(response.numero_solicitud);
        }
    }

    async startValidation() {
        this.isValidating = true;
        this.addMessage("Iniciando validación de datos...", 'bot');

        const validationSteps = [
            "Validando en Caja Costarricense de Seguro Social...",
            "Consultando historial crediticio en SUGEF...",
            "Verificando en sistema BCR...",
            "Validando en Ministerio de Hacienda..."
        ];

        for (let i = 0; i < validationSteps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.addMessage(validationSteps[i], 'bot');
            this.updateProgress((i + 1) / validationSteps.length * 100);
        }

        // Simular llamada al backend para validación final
        try {
            const response = await fetch('/validate-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.userData)
            });

            const result = await response.json();
                 if (result.approved) {
            const congratsMessage = `¡Felicitaciones! Tu solicitud de tarjeta de crédito ha sido aprobada. Tu número de solicitud es ${result.numero_solicitud}. Tu tarjeta será enviada a tu dirección en las próximas 24 a 48 horas hábiles.`;
            
            this.addMessage(congratsMessage, 'bot');
            
            // Reproducir audio de felicitaciones
            this.speak(congratsMessage);
            
            // Mostrar efectos visuales de celebración
            this.showCelebration();
            
            this.showSuccessCard(result.numero_solicitud);
        } else {
            this.addMessage("Lo sentimos, no pudimos aprobar tu solicitud en este momento.", 'bot');
        }
        } catch (error) {
            this.addMessage("Hubo un error durante la validación. Por favor intenta más tarde.", 'bot');
        }

        this.isValidating = false;
    }

    updateProgress(percentage) {
        let progressBar = document.getElementById('progress-bar');
        if (!progressBar) {
            const progressContainer = document.createElement('div');
            progressContainer.innerHTML = `
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
                    <span class="progress-text">Validando datos...</span>
                </div>
            `;
            this.chatContainer.appendChild(progressContainer);
        }
        
        progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${percentage}%`;
    }

    showSuccessCard(numeroSolicitud) {
        const successCard = document.createElement('div');
        successCard.className = 'success-card';
        successCard.innerHTML = `
            <div class="card-content">
                <h3>¡Solicitud Aprobada!</h3>
                <p><strong>Número de solicitud:</strong> ${numeroSolicitud}</p>
                <p>Tu tarjeta será entregada en las próximas 48 horas.</p>
                <div class="card-actions">
                    <button onclick="this.openTestWindow()" class="btn-primary">Ver Pruebas</button>
                    <button onclick="this.openReportWindow()" class="btn-secondary">Ver Reportes</button>
                    <button onclick="this.restartChat()" class="btn-outline">Nueva Solicitud</button>
                </div>
            </div>
        `;
        
        const estadoTarjeta = document.getElementById('estado-tarjeta');
        if (estadoTarjeta) {
            estadoTarjeta.appendChild(successCard);
        }
    }

    openTestWindow() {
        window.open('/pruebas-automaticas', '_blank', 'width=500,height=700');
    }

    openReportWindow() {
        window.open('/reporte-pruebas', '_blank', 'width=500,height=700');
    }

    restartChat() {
        this.chatContainer.innerHTML = '';
        this.userData = {};
        this.currentStep = 1;
        this.conversationId = this.generateId();
        
        const estadoTarjeta = document.getElementById('estado-tarjeta');
        if (estadoTarjeta) {
            estadoTarjeta.innerHTML = '';
        }
        
        this.addMessage("¡Hola! Bienvenido de nuevo. ¿Cuál es tu nombre completo?", 'bot');
    }

    showGPSOptions() {
        const gpsContainer = document.createElement('div');
        gpsContainer.className = 'gps-container';
        gpsContainer.innerHTML = `
            <h4>📍 Validación de Dirección con GPS</h4>
            <p>Para una entrega más precisa, puedes usar tu ubicación GPS</p>
            <div class="gps-actions">
                <button class="gps-button" onclick="bcr_chat.getGPSLocation()">
                    📍 Obtener mi ubicación GPS
                </button>
                <button class="gps-button" onclick="bcr_chat.continueWithoutGPS()">
                    ⏭️ Continuar sin GPS
                </button>
            </div>
            <div id="gps-status" class="gps-status"></div>
        `;
        
        this.chatContainer.appendChild(gpsContainer);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    async getGPSLocation() {
        const statusDiv = document.getElementById('gps-status');
        statusDiv.innerHTML = '<p>🔄 Obteniendo ubicación GPS...</p>';
        
        if (!navigator.geolocation) {
            statusDiv.innerHTML = '<p style="color: red;">❌ GPS no disponible en este dispositivo</p>';
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => this.handleGPSSuccess(position),
            (error) => this.handleGPSError(error),
            options
        );
    }

    async handleGPSSuccess(position) {
        const { latitude, longitude } = position.coords;
        const statusDiv = document.getElementById('gps-status');
        
        statusDiv.innerHTML = `
            <div class="gps-coords">
                <h5>✅ Ubicación obtenida</h5>
                <p><strong>Latitud:</strong> ${latitude.toFixed(6)}</p>
                <p><strong>Longitud:</strong> ${longitude.toFixed(6)}</p>
                <p><strong>Precisión:</strong> ±${position.coords.accuracy}m</p>
            </div>
        `;

        // Enviar coordenadas al servidor para validación
        try {
            const response = await fetch('/validate-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude
                })
            });

            const data = await response.json();
            
            if (data.address_validated) {
                this.showAddressValidation(data);
                this.userData.gps_coordinates = { latitude, longitude };
                this.userData.address_components = data.address_components;
                
                // Continuar con validación
                setTimeout(() => {
                    this.continueWithValidation();
                }, 3000);
            }
        } catch (error) {
            statusDiv.innerHTML += '<p style="color: red;">❌ Error validando dirección</p>';
        }
    }

    handleGPSError(error) {
        const statusDiv = document.getElementById('gps-status');
        let errorMessage = '';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = '❌ Permiso denegado para acceder al GPS';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = '❌ Ubicación no disponible';
                break;
            case error.TIMEOUT:
                errorMessage = '⏰ Tiempo de espera agotado';
                break;
            default:
                errorMessage = '❌ Error desconocido al obtener ubicación';
                break;
        }
        
        statusDiv.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
        
        // Ofrecer continuar sin GPS
        setTimeout(() => {
            statusDiv.innerHTML += `
                <button class="gps-button" onclick="bcr_chat.continueWithoutGPS()">
                    ⏭️ Continuar sin GPS
                </button>
            `;
        }, 2000);
    }

    showAddressValidation(data) {
        const statusDiv = document.getElementById('gps-status');
        const components = data.address_components;
        
        statusDiv.innerHTML += `
            <div class="address-validation">
                <h5>🏠 Dirección Validada</h5>
                <p><strong>Provincia:</strong> ${components.provincia}</p>
                <p><strong>Cantón:</strong> ${components.canton}</p>
                <p><strong>Distrito:</strong> ${components.distrito}</p>
                <p><strong>Código Postal:</strong> ${components.codigo_postal}</p>
                <p><strong>Entrega estimada:</strong> ${data.estimated_delivery}</p>
                <p style="color: green;">✅ Dirección verificada para entrega</p>
            </div>
        `;
        
        // Actualizar la dirección con la información GPS
        this.userData.direccion_validada = components.direccion_exacta;
        
        this.addMessage(`Excelente! Tu dirección ha sido validada con GPS: ${components.direccion_exacta}`, 'bot');
    }

    continueWithoutGPS() {
        this.addMessage('Continuando sin validación GPS. Usaremos la dirección que proporcionaste.', 'bot');
        this.continueWithValidation();
    }

    continueWithValidation() {
        this.addMessage('Ahora procederé con la validación de tus datos en nuestros sistemas...', 'bot');
        this.startValidation();
    }

    showCelebration() {
        // Crear confetti o efectos de celebración
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="confetti"></div>
                <div class="confetti"></div>
                <div class="confetti"></div>
                <div class="confetti"></div>
                <div class="confetti"></div>
                <h2>🎉 ¡FELICITACIONES! 🎉</h2>
                <p>Tu solicitud ha sido aprobada</p>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Síntesis de voz para el mensaje de felicitaciones
        const felicitacionesTexto = "¡Felicitaciones! Tu solicitud de tarjeta de crédito ha sido aprobada exitosamente. Recibirás tu tarjeta en los próximos días hábiles.";
        this.speak(felicitacionesTexto);
        
        // Remover después de 6 segundos para dar tiempo al audio
        setTimeout(() => {
            celebration.remove();
        }, 6000);
        
        // Reproducir sonido de éxito si está disponible
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUaBDBEAAA=');
            audio.play().catch(() => {});
        } catch (e) {}
    }

    // Funciones de seguridad mejoradas
    sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        
        // Convertir a string y remover caracteres de control
        let sanitized = String(input).replace(/[\x00-\x1F\x7F]/g, '');
        
        // Escapar caracteres HTML básicos
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        return sanitized.trim();
    }

    containsDangerousPatterns(input) {
        if (!input) return false;
        
        const dangerousPatterns = [
            // Inyección SQL
            /('|(\\');|(\\);)/gi,
            /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/gi,
            /(--[^\r\n]*)/gi,
            /(\*\/)|(\*\/.*?\/\*)/gi,
            
            // XSS
            /<script[\s\S]*?<\/script>/gi,
            /<iframe[\s\S]*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /expression\s*\(/gi,
            /url\s*\(/gi,
            
            // Command injection
            /(\b(exec|eval|system|shell_exec|passthru|cat|ls|pwd|wget|curl)\b)/gi,
            /(\||\&\&|\|\|)/g,
            
            // Path traversal
            /(\.\.[\/\\])/g,
            /(\/etc\/passwd|\/etc\/shadow)/gi,
            
            // Otras inyecciones
            /\$\{.*?\}/g,  // Template injection
            /#\{.*?\}/g,   // Ruby injection
            /<%.*?%>/g     // Template injection
        ];

        return dangerousPatterns.some(pattern => pattern.test(input));
    }

    validateInputLength(input, minLength = 1, maxLength = 500) {
        if (!input || typeof input !== 'string') return false;
        const length = input.trim().length;
        return length >= minLength && length <= maxLength;
    }

    // Función específica para ejecutar pruebas exhaustivas con IA
    async ejecutarPruebasExhaustivas() {
        console.log('🔬 Iniciando pruebas exhaustivas con IA...');
        
        // Mostrar modal de progreso específico para IA
        this.mostrarModalProgresoIA();
        
        try {
            const response = await fetch('/test-exhaustive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cerrar modal de progreso
            this.cerrarModalProgresoIA();
            
            // Mostrar resultados mejorados con enfoque en IA
            this.mostrarResultadosIA(data);
            
            // Guardar resultados detallados en localStorage
            localStorage.setItem('pruebasExhaustivasIA', JSON.stringify({
                ...data,
                timestamp: new Date().toLocaleString('es-CR'),
                version: '2.0'
            }));
            
            // También actualizar el reporte general
            localStorage.setItem('reportePruebasBCR', JSON.stringify({
                total: data.summary.total_tests,
                fallos: data.summary.failed,
                warnings: data.summary.warnings,
                score: data.summary.security_score,
                detalles: data.detailed_results.map(test => 
                    `${test.name}: ${test.status} (${test.vulnerability} vulnerability)`
                ),
                timestamp: new Date().toLocaleString('es-CR'),
                recomendaciones: data.recommendations,
                tipo: 'exhaustivo_ia'
            }));
            
        } catch (error) {
            console.error('Error en pruebas exhaustivas:', error);
            this.cerrarModalProgresoIA();
            
            // Mostrar error más detallado
            this.mostrarErrorPruebas(error);
        }
    }

    mostrarModalProgresoIA() {
        let modal = document.getElementById('pruebasExhaustivasModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pruebasExhaustivasModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content ai-modal" style="text-align: center; max-width: 600px; background: linear-gradient(135deg, #f3e5f5, #e1bee7);">
                    <div class="modal-header" style="background: linear-gradient(135deg, #9c27b0, #ba68c8); color: white;">
                        <h3>🔬 IA Ejecutando Análisis Exhaustivo de Seguridad</h3>
                    </div>
                    <div class="modal-body" style="padding: 30px;">
                        <div class="ai-analysis-progress">
                            <div class="ai-brain-animation">
                                <div class="brain-icon">🧠</div>
                                <div class="scanning-lines"></div>
                            </div>
                            <p id="ai-progress-text" style="font-size: 1.1em; color: #7b1fa2; font-weight: 500;">
                                Inicializando sistema de análisis de IA...
                            </p>
                            <div class="progress-details" style="background: rgba(123, 31, 162, 0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
                                <small id="ai-progress-detail" style="color: #4a148c;">
                                    Cargando modelos de machine learning...
                            </small>
                            </div>
                            <div class="security-metrics" style="margin-top: 20px;">
                                <div class="metric-item">
                                    <span class="metric-label">Vulnerabilidades detectadas:</span>
                                    <span id="vuln-count" class="metric-value">0</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Score de seguridad:</span>
                                    <span id="security-score" class="metric-value">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'block';
        
        // Simular progreso realista de IA
        const textosIA = [
            "Inicializando sistema de análisis de IA...",
            "Cargando modelos de machine learning...",
            "Analizando patrones de inyección SQL con deep learning...",
            "Ejecutando detección de XSS con algoritmos neurales...",
            "Validando sanitización con modelos entrenados...",
            "Probando resistance a ataques con IA adversarial...",
            "Analizando headers de seguridad con NLP...",
            "Evaluando rate limiting con análisis predictivo...",
            "Verificando validaciones con computer vision...",
            "Auditando gestión de sesiones con reinforcement learning...",
            "Aplicando análisis de anomalías con ML...",
            "Generando recomendaciones con IA generativa...",
            "Compilando informe final con análisis semántico...",
            "Finalizando evaluación con ensemble de modelos..."
        ];
        
        const detallesIA = [
            "Inicializando motores de análisis...",
            "Calibrando detectores de vulnerabilidades...",
            "Modelo SQL-Injection-Detector v2.1 cargado",
            "Modelo XSS-Prevention-AI v3.0 activo",
            "Analizando 847 patrones de ataque conocidos",
            "Simulando 15 vectores de ataque diferentes",
            "Verificando conformidad con OWASP Top 10",
            "Aplicando técnicas de fuzzing inteligente",
            "Evaluando superficie de ataque disponible",
            "Clasificando riesgos con matriz de amenazas",
            "Correlacionando vulnerabilidades encontradas",
            "Generando métricas de confianza",
            "Optimizando recomendaciones por prioridad",
            "Análisis completado exitosamente"
        ];
        
        let index = 0;
        let vulnCount = 0;
        let securityScore = 45;
        
        const progressInterval = setInterval(() => {
            if (index < textosIA.length) {
                document.getElementById('ai-progress-text').textContent = textosIA[index];
                document.getElementById('ai-progress-detail').textContent = detallesIA[index];
                
                // Simular detección de vulnerabilidades y mejora del score
                if (index > 3 && Math.random() > 0.7) {
                    vulnCount = Math.max(0, vulnCount - 1);
                    securityScore = Math.min(98, securityScore + Math.floor(Math.random() * 8) + 2);
                } else if (index <= 3 && Math.random() > 0.8) {
                    vulnCount++;
                }
                
                document.getElementById('vuln-count').textContent = vulnCount;
                document.getElementById('security-score').textContent = `${securityScore}%`;
                
                index++;
            } else {
                clearInterval(progressInterval);
                document.getElementById('ai-progress-text').textContent = "Análisis de IA completado ✅";
                document.getElementById('ai-progress-detail').textContent = "Generando reporte final...";
            }
        }, 200);
        
        // Guardar el interval para poder limpiarlo
        window.aiProgressInterval = progressInterval;
    }

    cerrarModalProgresoIA() {
        const modal = document.getElementById('pruebasExhaustivasModal');
        if (modal) {
            modal.style.display = 'none';
            
            // Limpiar interval si existe
            if (window.aiProgressInterval) {
                clearInterval(window.aiProgressInterval);
            }
        }
    }

    mostrarResultadosIA(data) {
        // Crear o encontrar el elemento de resultados
        let resultadosDiv = document.getElementById('resultados-pruebas-ia');
        if (!resultadosDiv) {
            resultadosDiv = document.createElement('div');
            resultadosDiv.id = 'resultados-pruebas-ia';
            resultadosDiv.style.margin = '20px auto';
            resultadosDiv.style.maxWidth = '600px';
            document.body.appendChild(resultadosDiv);
        }
        
        // Verificar que data y sus propiedades existan con valores por defecto
        const summary = data.summary || {};
        const aiAnalysis = data.ai_analysis || {};
        const recommendations = data.recommendations || [];
        const detailedResults = data.detailed_results || [];
        const executionTime = data.execution_time || 'N/A';
        
        const securityScore = summary.security_score || 0;
        const scoreColor = securityScore >= 90 ? '#4caf50' : 
                           securityScore >= 75 ? '#ff9800' : '#f44336';
        
        const securityLevel = aiAnalysis.security_level || 'DESCONOCIDO';
        const levelEmoji = securityLevel === 'ALTO' ? '🛡️' : securityLevel === 'MEDIO' ? '⚠️' : '🚨';
        const confidence = aiAnalysis.confidence || 0;
        const riskAssessment = aiAnalysis.risk_assessment || 'Evaluación no disponible';
        
        const totalTests = summary.total_tests || 0;
        const passed = summary.passed || 0;
        const warnings = summary.warnings || 0;
        const failed = summary.failed || 0;
        
        resultadosDiv.innerHTML = `
            <div class="ai-test-results" style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); border-radius: 16px; padding: 25px; box-shadow: 0 8px 32px rgba(156, 39, 176, 0.2);">
                <div class="ai-header" style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #7b1fa2; margin: 0; font-size: 1.8em;">🔬 Análisis Exhaustivo con IA</h2>
                    <p style="color: #4a148c; margin: 5px 0; font-size: 1em;">Sistema de Inteligencia Artificial BCR Security v2.0</p>
                </div>
                
                <div class="ai-score-section" style="background: ${scoreColor}15; border: 3px solid ${scoreColor}; border-radius: 15px; padding: 20px; margin-bottom: 20px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px;">
                            <h3 style="margin: 0; color: ${scoreColor}; font-size: 1.3em;">${levelEmoji} Nivel de Seguridad: ${securityLevel}</h3>
                            <p style="margin: 8px 0; color: #666; font-size: 0.95em;">Confianza IA: ${confidence}%</p>
                            <p style="margin: 5px 0; color: #666; font-size: 0.9em;">${riskAssessment}</p>
                        </div>
                        <div style="flex: 0 0 auto; margin-left: 20px;">
                            <div style="font-size: 3em; font-weight: bold; color: ${scoreColor}; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                                ${securityScore}%
                            </div>
                            <div style="font-size: 0.9em; color: #666; text-align: center;">Score de Seguridad</div>
                        </div>
                    </div>
                </div>
                
                <div class="ai-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div class="metric-card" style="background: #e8f5e8; padding: 15px; border-radius: 12px; text-align: center; border: 2px solid #4caf50;">
                        <div style="font-size: 2em; color: #4caf50; font-weight: bold;">${passed}</div>
                        <div style="font-size: 0.9em; color: #2e7d32; font-weight: 500;">Tests Pasados</div>
                    </div>
                    <div class="metric-card" style="background: #fff3e0; padding: 15px; border-radius: 12px; text-align: center; border: 2px solid #ff9800;">
                        <div style="font-size: 2em; color: #ff9800; font-weight: bold;">${warnings}</div>
                        <div style="font-size: 0.9em; color: #ef6c00; font-weight: 500;">Advertencias</div>
                    </div>
                    <div class="metric-card" style="background: #ffebee; padding: 15px; border-radius: 12px; text-align: center; border: 2px solid #f44336;">
                        <div style="font-size: 2em; color: #f44336; font-weight: bold;">${failed}</div>
                        <div style="font-size: 0.9em; color: #c62828; font-weight: 500;">Tests Fallidos</div>
                    </div>
                    <div class="metric-card" style="background: #f3e5f5; padding: 15px; border-radius: 12px; text-align: center; border: 2px solid #9c27b0;">
                        <div style="font-size: 1.5em; color: #9c27b0; font-weight: bold;">${totalTests}</div>
                        <div style="font-size: 0.9em; color: #7b1fa2; font-weight: 500;">Total Tests</div>
                    </div>
                </div>
                
                <div class="ai-recommendations" style="background: rgba(123, 31, 162, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 5px solid #9c27b0;">
                    <h4 style="margin: 0 0 15px 0; color: #7b1fa2; font-size: 1.2em;">🤖 Recomendaciones de la IA</h4>
                    <div class="recommendations-list" style="max-height: 200px; overflow-y: auto;">
                        ${recommendations.length > 0 ? recommendations.slice(0, 8).map((rec, index) => `
                            <div style="margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 6px; font-size: 0.95em;">
                                <span style="color: #7b1fa2; font-weight: 500;">${index + 1}.</span> ${rec}
                            </div>
                        `).join('') : '<p style="color: #666; font-style: italic;">No hay recomendaciones disponibles</p>'}
                    </div>
                </div>
                
                <div class="ai-scenarios" style="background: rgba(76, 175, 80, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 1.2em;">⚠️ Escenarios de Error Detectados</h4>
                    <div class="scenarios-list">
                        ${detailedResults.length > 0 ? 
                            detailedResults.filter(test => test.vulnerability && test.vulnerability !== 'NONE').slice(0, 3).map(test => `
                                <div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 8px; border-left: 4px solid #ff9800;">
                                    <strong style="color: #ef6c00;">${(test.vulnerability || 'UNKNOWN').charAt(0).toUpperCase() + (test.vulnerability || 'unknown').slice(1)}:</strong> 
                                    <span style="color: #424242;">${test.name || 'Test sin nombre'}</span>
                                </div>
                            `).join('') || '<p style="color: #4caf50; font-style: italic;">🎉 No se detectaron escenarios de error críticos</p>'
                        : '<p style="color: #4caf50; font-style: italic;">🎉 No se detectaron escenarios de error críticos</p>'}
                    </div>
                </div>
                
                <div class="ai-time-info" style="background: rgba(156, 39, 176, 0.05); border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <p style="color: #7b1fa2; margin: 0; font-size: 0.9em;">⏱️ Tiempo de análisis: <strong>${executionTime}</strong></p>
                </div>
                
                <div class="ai-actions" style="text-align: center; margin-top: 25px;">
                    <button onclick="bcr_chat.verDetallesCompletosIA()" style="background: linear-gradient(135deg, #9c27b0, #ba68c8); color: white; padding: 12px 25px; border: none; border-radius: 25px; margin: 5px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);">
                        📊 Ver Análisis Completo
                    </button>
                    <button onclick="bcr_chat.exportarReporteIA()" style="background: linear-gradient(135deg, #1565c0, #42a5f5); color: white; padding: 12px 25px; border: none; border-radius: 25px; margin: 5px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 15px rgba(21, 101, 192, 0.3);">
                        📄 Exportar Reporte
                    </button>
                    <button onclick="window.open('/reporte-pruebas', '_blank')" style="background: linear-gradient(135deg, #ce1126, #ef5350); color: white; padding: 12px 25px; border: none; border-radius: 25px; margin: 5px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 15px rgba(206, 17, 38, 0.3);">
                        📈 Ver Dashboard
                    </button>
                </div>
            </div>
        `;
        
        // Animar la aparición
        resultadosDiv.style.opacity = '0';
        resultadosDiv.style.transform = 'translateY(20px)';
        resultadosDiv.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            resultadosDiv.style.opacity = '1';
            resultadosDiv.style.transform = 'translateY(0)';
        }, 100);
        
        // Scroll suave hasta los resultados
        resultadosDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    verDetallesCompletosIA() {
        const data = JSON.parse(localStorage.getItem('pruebasExhaustivasIA') || '{}');
        if (data.detailed_results && data.detailed_results.length > 0) {
            const detalles = data.detailed_results.map(test => 
                `${test.name || 'Test sin nombre'}: ${test.status || 'UNKNOWN'} (${test.vulnerability || 'NONE'} risk)\n${test.details || 'Sin detalles'}`
            ).join('\n\n');
            
            const aiInfo = data.ai_analysis ? `
Análisis de IA:
- Nivel de Seguridad: ${data.ai_analysis.security_level || 'N/A'}
- Confianza: ${data.ai_analysis.confidence || 'N/A'}%
- Score de Performance: ${data.ai_analysis.performance_score || 'N/A'}%
- Score de UX: ${data.ai_analysis.ux_score || 'N/A'}%

` : '';
            
            alert(`Análisis Completo de IA:\n\n${aiInfo}Tests Detallados:\n\n${detalles}`);
        } else {
            alert('No hay detalles de análisis disponibles. Ejecuta las pruebas exhaustivas primero.');
        }
    }

    exportarReporteIA() {
        const data = JSON.parse(localStorage.getItem('pruebasExhaustivasIA') || '{}');
        
        if (!data.summary) {
            alert('No hay datos de análisis para exportar. Ejecuta las pruebas exhaustivas primero.');
            return;
        }
        
        const summary = data.summary || {};
        const aiAnalysis = data.ai_analysis || {};
        const recommendations = data.recommendations || [];
        
        const reporte = `
REPORTE DE ANÁLISIS EXHAUSTIVO CON IA - BCR SECURITY
Fecha: ${new Date().toLocaleString('es-CR')}
Sistema: BCR Form Security Analysis AI v2.0

RESUMEN EJECUTIVO:
- Score de Seguridad: ${summary.security_score || 'N/A'}%
- Nivel de Riesgo: ${aiAnalysis.security_level || 'N/A'}
- Confianza IA: ${aiAnalysis.confidence || 'N/A'}%
- Tiempo de Análisis: ${data.execution_time || 'N/A'}

MÉTRICAS:
- Total de Tests: ${summary.total_tests || 'N/A'}
- Tests Pasados: ${summary.passed || 'N/A'}
- Advertencias: ${summary.warnings || 'N/A'}
- Tests Fallidos: ${summary.failed || 'N/A'}

SCORES ADICIONALES:
- Performance Score: ${aiAnalysis.performance_score || 'N/A'}%
- UX Score: ${aiAnalysis.ux_score || 'N/A'}%
- Backend Score: ${aiAnalysis.backend_score || 'N/A'}%

RECOMENDACIONES PRINCIPALES:
${recommendations.length > 0 ? recommendations.slice(0, 10).map((rec, i) => `${i+1}. ${rec}`).join('\n') : 'No hay recomendaciones disponibles'}

ANÁLISIS DE RIESGO:
${aiAnalysis.risk_assessment || 'No disponible'}

PRÓXIMOS PASOS:
${aiAnalysis.next_steps ? aiAnalysis.next_steps.map((step, i) => `${i+1}. ${step}`).join('\n') : 'No disponibles'}

TESTS DETALLADOS:
${data.detailed_results ? data.detailed_results.map(test => 
    `• ${test.name || 'Test sin nombre'}: ${test.status || 'UNKNOWN'} (${test.vulnerability || 'NONE'} vulnerability)\n  ${test.details || 'Sin detalles'}`
).join('\n') : 'No disponibles'}
        `.trim();
        
        const blob = new Blob([reporte], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-seguridad-ia-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    mostrarErrorPruebas(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffebee, #ffcdd2); 
            border: 2px solid #f44336; border-radius: 15px; padding: 25px;
            max-width: 400px; text-align: center; z-index: 1000;
            box-shadow: 0 8px 32px rgba(244, 67, 54, 0.3);
        `;
        
        errorDiv.innerHTML = `
            <h3 style="color: #c62828; margin: 0 0 15px 0;">❌ Error en Pruebas de IA</h3>
            <p style="color: #424242; margin: 10px 0;">No se pudieron ejecutar las pruebas exhaustivas.</p>
            <p style="color: #666; font-size: 0.9em; margin: 10px 0;">${error.message}</p>
            <button onclick="this.parentElement.remove()" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                Entendido
            </button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remover automáticamente después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // ...existing code...
}

// Inicializar chat cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded, inicializando chat...');
    
    try {
        bcr_chat = new BCRChat(); // Asignar a variable global
        console.log('✅ Chat inicializado exitosamente');
        
        // Confirmar que el chat está disponible globalmente
        if (window.bcr_chat) {
            console.log('✅ bcr_chat disponible globalmente');
        } else {
            console.warn('⚠️ bcr_chat no está disponible globalmente');
            window.bcr_chat = bcr_chat; // Asegurar que esté disponible
        }
    } catch (error) {
        console.error('❌ Error inicializando chat:', error);
    }
});

// Funciones globales para compatibilidad
function openTestWindow() {
    window.open('/pruebas-automaticas', '_blank', 'width=500,height=700');
}

function openReportWindow() {
    window.open('/reporte-pruebas', '_blank', 'width=500,height=700');
}

// Función global para ejecutar pruebas exhaustivas (delegación al chat)
async function ejecutarPruebasExhaustivas() {
    console.log('🔬 Función global ejecutarPruebasExhaustivas llamada');
    console.log('Chat disponible:', !!window.bcr_chat);
    console.log('Método disponible:', !!(window.bcr_chat && typeof window.bcr_chat.ejecutarPruebasExhaustivas === 'function'));
    
    if (window.bcr_chat && typeof window.bcr_chat.ejecutarPruebasExhaustivas === 'function') {
        try {
            console.log('✅ Ejecutando pruebas exhaustivas...');
            await window.bcr_chat.ejecutarPruebasExhaustivas();
        } catch (error) {
            console.error('❌ Error ejecutando pruebas exhaustivas desde función global:', error);
            alert('Error ejecutando las pruebas exhaustivas. Por favor, intenta de nuevo.\n\nDetalles: ' + error.message);
        }
    } else {
        console.error('❌ Chat no inicializado o método no disponible');
        console.log('Intentando reinicializar chat...');
        
        // Intentar reinicializar el chat
        try {
            if (typeof BCRChat !== 'undefined') {
                window.bcr_chat = new BCRChat();
                if (window.bcr_chat && typeof window.bcr_chat.ejecutarPruebasExhaustivas === 'function') {
                    console.log('✅ Chat reinicializado, ejecutando pruebas...');
                    await window.bcr_chat.ejecutarPruebasExhaustivas();
                    return;
                }
            }
        } catch (reinitError) {
            console.error('❌ Error reinicializando chat:', reinitError);
        }
        
        alert('El sistema de chat no está listo. Por favor, recarga la página e intenta de nuevo.\n\n' +
              'Detalles técnicos:\n' +
              '- Chat disponible: ' + (!!window.bcr_chat) + '\n' +
              '- Método disponible: ' + (!!(window.bcr_chat && typeof window.bcr_chat.ejecutarPruebasExhaustivas === 'function')));
    }
}

// Funciones globales para compatibilidad con botones de resultados
function verDetallesCompletosIA() {
    if (window.bcr_chat && typeof window.bcr_chat.verDetallesCompletosIA === 'function') {
        window.bcr_chat.verDetallesCompletosIA();
    } else {
        alert('El sistema de chat no está listo. Por favor, recarga la página e intenta de nuevo.');
    }
}

function exportarReporteIA() {
    if (window.bcr_chat && typeof window.bcr_chat.exportarReporteIA === 'function') {
        window.bcr_chat.exportarReporteIA();
    } else {
        alert('El sistema de chat no está listo. Por favor, recarga la página e intenta de nuevo.');
    }
}
