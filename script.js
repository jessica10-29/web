// URL del backend (cambiar si lo subes a Render/Heroku)
const API_URL = "http://127.0.0.1:5000/api/chat";

// Variables de voz
let synth = window.speechSynthesis;
let utterThis = null;

// Mostrar burbujas en chat
function agregarBurbuja(texto, tipo) {
    const div = document.createElement("div");
    div.className = tipo === "user" ? "bubble-user" : "bubble-soha";
    div.innerText = texto;
    document.getElementById("chat-box").appendChild(div);
    document.getElementById("chat-box").scrollTop = 999999;
}

// Historial

// Limpiar chat
function limpiarChat() {
    document.getElementById("chat-box").innerHTML = "";
}

// Mostrar estado
function mostrarEstado(texto) {
    const estado = document.getElementById("status");
    if (estado) estado.innerText = texto;
}

// Enviar mensaje
async function enviar(mensaje = null) {
    if (mensaje === null) {
        mensaje = document.getElementById("msg").value.trim();
        if (!mensaje) return;
        agregarBurbuja(mensaje, "user");
        agregarHistorial(mensaje);
        document.getElementById("msg").value = "";
    } else {
        agregarBurbuja(mensaje, "user (voz)");
        agregarHistorial(mensaje);
        document.getElementById("msg").value = "";
    }

    mostrarEstado("Pensando... 💭");
    await new Promise(r => setTimeout(r, 50));

    try {
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje })
        });

        const data = await resp.json();
        agregarBurbuja(data.respuesta, "soha");
        hablar(data.respuesta);

    } catch (error) {
        agregarBurbuja("Lo siento, no pude comunicarme con el servidor.", "soha");
        console.error(error);
    } finally {
        mostrarEstado("");
    }
}
// script.js (en cualquier lugar fuera de las funciones existentes)

function toggleMenu(btn) {
    // Busca el menú desplegable (el siguiente hermano del botón)
    const menu = btn.nextElementSibling;

    // Oculta todos los demás menús antes de mostrar el actual
    document.querySelectorAll('.menu-opciones').forEach(m => {
        if (m !== menu) {
            m.classList.remove('visible');
        }
    });

    // Muestra u oculta el menú actual
    menu.classList.toggle('visible');
}

// Oculta el menú si el usuario hace clic fuera de él
document.addEventListener('click', (e) => {
    if (!e.target.matches('.opciones-btn')) {
        document.querySelectorAll('.menu-opciones').forEach(menu => {
            menu.classList.remove('visible');
        });
    }
});

// AÑADE AQUÍ LAS FUNCIONES DE ACCIÓN (eliminar, editar, guardar)
function eliminarMensaje(item) {
    if (confirm("¿Estás seguro de que quieres eliminar este mensaje del historial?")) {
        item.remove(); // Elimina el elemento del DOM
        // Aquí podrías agregar lógica para actualizar si el historial es persistente (base de datos o localStorage)
    }
}



// script.js

async function guardarMensaje(texto) { // <--- ¡Añadir 'async' es crucial!

    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('visible'));

    if (window.showSaveFilePicker) {
        // Método moderno: Permite elegir la carpeta
        const options = {
            suggestedName: 'respuesta_soha.txt',
            types: [{
                description: 'Archivos de Texto',
                accept: { 'text/plain': ['.txt'] },
            }],
        };

        try {
            // Abre la ventana nativa "Guardar como..."
            const fileHandle = await window.showSaveFilePicker(options);
            const writable = await fileHandle.createWritable();
            await writable.write(texto);
            await writable.close();
            mostrarEstado("Archivo guardado en la carpeta seleccionada.");
        } catch (err) {
            // Captura si el usuario cancela la operación
            console.error("Guardado cancelado o error:", err);
            mostrarEstado("Operación de guardado cancelada.");
        }
    } else {
        // Método de descarga por defecto (cae a la carpeta Downloads)
        const blob = new Blob([texto], { type: 'text/plain' });
        const a = document.createElement('a');
        a.download = 'respuesta_soha.txt';
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
        mostrarEstado("Archivo descargado automáticamente (navegador antiguo).");
    }
}



function agregarHistorial(texto) {
    const item = document.createElement("div");
    item.className = "item";

    // Contenido del mensaje
    item.innerHTML = `
        <span class="historial-texto">${texto}</span>
        
        <span class="opciones-btn" onclick="toggleMenu(this)">...</span>
        
        <div class="menu-opciones">
        
            <button onclick="eliminarMensaje(this.closest('.item'))">🗑️ Eliminar</button>
            <button onclick="guardarMensaje('${texto.replace(/'/g, "\\'")}')">💾 Guardar en Archivo</button>
        </div>
    `;

    // Cargar texto en input al hacer clic en el texto (sin usar el menú)
    item.querySelector('.historial-texto').onclick = function () {
        document.getElementById("mensaje").value = texto;
    };

    document.getElementById("historial").appendChild(item);
}

// TTS
function hablar(texto) {
    if ('speechSynthesis' in window) {
        if (synth.speaking) synth.cancel();
        utterThis = new SpeechSynthesisUtterance(texto);
        utterThis.lang = 'es-MX';
        synth.speak(utterThis);
    } else {
        console.warn("La síntesis de voz no es soportada por este navegador.");
    }
}

// STT
function escuchar() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const vozTexto = event.results[0][0].transcript;
        enviar(vozTexto);
    };

    recognition.onerror = (event) => {
        console.error("Error de reconocimiento de voz:", event.error);
    };
}

// Control audio TTS
function audioControl(action) {
    if (!utterThis) return;
    switch (action) {
        case "play":
            if (!synth.speaking) synth.speak(utterThis);
            break;
        case "pause":
            if (synth.speaking) synth.pause();
            break;
        case "resume":
            if (synth.paused) synth.resume();
            break;
        case "stop":
            synth.cancel();
            break;
    }
}

// Cambiar tema
function cambiarTema() {
    // Esto añade la clase 'dark' si no existe, o la quita si ya existe.
    document.body.classList.toggle('dark'); 
}