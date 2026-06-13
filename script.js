const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const volumeControl = document.getElementById("volume-control");

// Dimensiones fijas del juego
canvas.width = 400;
canvas.height = 600;

// IMÁGENES
const bg = new Image();
bg.src = "images/background.png.jpg";

const birdImg = new Image();
birdImg.src = "images/bird.png.png";

const pipeImg = new Image();
pipeImg.src = "images/pipe.png.png";

// AUDIO (Tu música de Super Mario World)
const bgMusic = new Audio();
bgMusic.src = "Overworld Theme - Super Mario_ World.mp3"; 
bgMusic.loop = true;              // Hace que la canción se repita infinitamente
bgMusic.volume = 0.5;             // Volumen inicial al 50%

// ESTADOS DEL JUEGO ('START' = Pantalla de inicio, 'PLAYING' = Jugando)
let gameState = "START";

// PÁJARO
let birdY = 250;
let velocity = 0;
const gravity = 0.4;
const jump = -7;

const birdX = 60;
const birdWidth = 40;
const birdHeight = 30;

// CONFIGURACIÓN DE TUBERÍAS
const pipeWidth = 70;
const gap = 150; 
const pipes = [];

// JUEGO
let score = 0;
let gameOver = false;

// COMODIDAD: Cargar la puntuación más alta guardada (si no existe, empieza en 0)
let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;

// Actualizar el volumen de la música cuando mueves la barra deslizante
volumeControl.addEventListener("input", (e) => {
    bgMusic.volume = e.target.value;
});

// CREAR TUBERÍA
function createPipe() {
    const minHeight = 60;
    const maxHeight = canvas.height - gap - 120; 
    const randomTopHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: randomTopHeight,
        passed: false
    });
}

// PRIMERA TUBERÍA
createPipe();

// MÁS TUBERÍAS CADA 2.5 SEGUNDOS
setInterval(() => {
    if (gameState === "PLAYING" && !gameOver) {
        createPipe();
    }
}, 2500);


// ==========================================
// CONTROLES UNIFICADOS (PC Y CELULAR)
// ==========================================

function handleAction() {
    if (gameState === "START") {
        // Iniciar el juego
        gameState = "PLAYING";
        volumeControl.style.display = "none"; // Escondemos el control de volumen al jugar
        bgMusic.play().catch(err => console.log("Error al reproducir audio:", err));
    } else if (gameOver) {
        // Reiniciar si perdiste
        location.reload();
    } else {
        // Saltar
        velocity = jump;
    }
}

// Control para Computadora (Barra Espaciadora)
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault(); // Evita que la página web se mueva hacia abajo al presionar espacio
        handleAction();
    }
});

// Control para Celulares y Tablets (Toques en la pantalla)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Evita el zoom molesto del navegador al tocar rápido el celular
    handleAction();
});

// ==========================================


// ACTUALIZAR LÓGICA
function update() {
    if (gameState !== "PLAYING") return; // Si no está jugando, no actualiza físicas

    velocity += gravity;
    birdY += velocity;

    // Si choca con el techo o el suelo
    if (birdY < 0 || birdY + birdHeight > canvas.height) {
        triggerGameOver();
    }

    pipes.forEach(pipe => {
        pipe.x -= 3;

        // Colisión con las tuberías
        if (birdX + birdWidth > pipe.x && birdX < pipe.x + pipeWidth) {
            if (birdY < pipe.topHeight || birdY + birdHeight > pipe.topHeight + gap) {
                triggerGameOver();
            }
        }

        // Sumar puntos
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            score++;
            pipe.passed = true;
        }
    });

    if (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
    }
}

// NUEVA FUNCIÓN: Se ejecuta al perder para revisar y guardar el récord
function triggerGameOver() {
    gameOver = true;
    bgMusic.pause(); // Pausa la música al morir
    
    // Si la puntuación actual supera al récord, se guarda el nuevo récord
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
}

// DIBUJAR EN PANTALLA
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // FONDO (Se dibuja siempre)
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    if (gameState === "START") {
        // --- PANTALLA DE INICIO ---
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)"; // Fondo oscuro para resaltar textos
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FFD700"; // Color Dorado para la bienvenida
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("¡Bienvenido al primer juego", canvas.width / 2, 80);
        ctx.fillText("de Erick!", canvas.width / 2, 110);

        // Mostrar Récord Máximo en la pantalla de inicio
        ctx.fillStyle = "#FFA500"; // Color naranja/oro
        ctx.font = "bold 18px Arial";
        ctx.fillText("Puntuación Máxima: " + highScore, canvas.width / 2, 160);

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText("Ajustar Volumen:", canvas.width / 2, 340);

        // Botón visual de iniciar
        ctx.fillStyle = "#28a745"; // Verde
        ctx.fillRect(80, 440, 240, 50);
        
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText("PRESIONA ESPACIO O TOCA", canvas.width / 2, 470);

        // Dibujar el pájaro quieto de adorno en el centro
        ctx.drawImage(birdImg, canvas.width / 2 - 20, 210, birdWidth, birdHeight);

    } else if (gameState === "PLAYING") {
        // --- PANTALLA DE JUEGO ACTIVO ---
        
        // TUBERÍAS
        pipes.forEach(pipe => {
            ctx.save();
            ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.topHeight / 2, pipeWidth, pipe.topHeight);
            ctx.restore();

            ctx.drawImage(pipeImg, pipe.x, pipe.topHeight + gap, pipeWidth, canvas.height - (pipe.topHeight + gap));
        });

        // PÁJARO
        ctx.drawImage(birdImg, birdX, birdY, birdWidth, birdHeight);

        // MARCADOR DE PUNTOS (Puntuación en tiempo real)
        ctx.textAlign = "start";
        ctx.fillStyle = "white";
        ctx.font = "bold 25px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        
        ctx.strokeText("Puntuación: " + score, 20, 40);
        ctx.fillText("Puntuación: " + score, 20, 40);

        // GAME OVER
        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "red";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);

            // Mostrar el puntaje final obtenido y el récord al perder
            ctx.fillStyle = "white";
            ctx.font = "bold 20px Arial";
            ctx.fillText("Tu Puntuación: " + score, canvas.width / 2, canvas.height / 2);
            
            ctx.fillStyle = "#FFD700";
            ctx.fillText("Puntuación Máxima: " + highScore, canvas.width / 2, canvas.height / 2 + 35);

            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText("Espacio o Toca para reiniciar", canvas.width / 2, canvas.height / 2 + 90);
        }
    }
}

// BUCLE PRINCIPAL DEL JUEGO
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// CONTROL DE CARGA DE IMÁGENES
let loadedImagesCount = 0;
function imageLoaded() {
    loadedImagesCount++;
    if (loadedImagesCount === 3) {
        gameLoop();
    }
}

bg.onload = imageLoaded;
birdImg.onload = imageLoaded;
pipeImg.onload = imageLoaded;