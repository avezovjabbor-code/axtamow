const gameContainer = document.getElementById('game-container');
const gameWrapper = document.getElementById('game-wrapper');
const playerCar = document.getElementById('player-car');
const road = document.getElementById('road');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const carOptions = document.querySelectorAll('.car-option');

let isGameRunning = false;
let score = 0;
let gameSpeed = 5;
let animationId;
let enemySpawnTimer;
let enemies = [];

// Game boundaries
let wrapperWidth = gameWrapper.clientWidth || 400;
const carWidth = 50;
let laneWidth = wrapperWidth / 3;

// Default player car
let selectedCarClass = 'car-malibu';
playerCar.classList.add(selectedCarClass);

// Car Types for Enemies
const enemyCarTypes = ['car-gentra', 'car-spark', 'car-cobalt', 'car-malibu'];

// Handle car selection
carOptions.forEach(option => {
    option.addEventListener('click', () => {
        carOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        const carType = option.getAttribute('data-car');
        playerCar.className = 'car player'; // reset
        selectedCarClass = `car-${carType}`;
        playerCar.classList.add(selectedCarClass);
    });
});

// Controls
let currentLane = 1; // 0: left, 1: center, 2: right

function updatePlayerPosition() {
    wrapperWidth = gameWrapper.clientWidth || 400;
    laneWidth = wrapperWidth / 3;
    const laneCenterX = (currentLane * laneWidth) + (laneWidth / 2) - (carWidth / 2);
    playerCar.style.left = `${laneCenterX}px`;
}

function moveLeft() {
    if (!isGameRunning) return;
    if (currentLane > 0) {
        currentLane--;
        updatePlayerPosition();
    }
}

function moveRight() {
    if (!isGameRunning) return;
    if (currentLane < 2) {
        currentLane++;
        updatePlayerPosition();
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        moveRight();
    }
});

// Touch/Click controls
gameWrapper.addEventListener('pointerdown', (e) => {
    if (!isGameRunning) return;
    const rect = gameWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < wrapperWidth / 2) {
        moveLeft();
    } else {
        moveRight();
    }
});

function spawnEnemy() {
    if (!isGameRunning) return;

    const enemy = document.createElement('div');
    const type = enemyCarTypes[Math.floor(Math.random() * enemyCarTypes.length)];
    enemy.className = `car enemy-car ${type}`;
    enemy.innerHTML = '<div class="lights"></div>';
    
    // Select a lane (0, 1, or 2)
    const lane = Math.floor(Math.random() * 3);
    const laneCenterX = (lane * laneWidth) + (laneWidth / 2) - (carWidth / 2);
    
    enemy.style.left = `${laneCenterX}px`;
    enemy.style.top = '-120px';
    
    gameContainer.appendChild(enemy);
    
    enemies.push({
        element: enemy,
        y: -120,
        x: laneCenterX,
        passed: false
    });
}

let lastTime = 0;

function update(time) {
    if (!isGameRunning) return;
    
    if (lastTime === 0) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;

    // Increase speed over time (max cap to keep it playable)
    if (gameSpeed < 15) {
        gameSpeed += 0.001;
    }
    road.style.animationDuration = `${10 / gameSpeed}s`;

    // Movement calculation independent of frame rate slightly
    const movement = gameSpeed * (dt / 16.66);

    // Update enemies
    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        enemy.y += movement;
        enemy.element.style.top = `${enemy.y}px`;

        // Check collision
        const pRect = playerCar.getBoundingClientRect();
        const eRect = enemy.element.getBoundingClientRect();

        // Shrink hitboxes slightly for fairer gameplay
        const marginX = 8;
        const marginY = 15;
        if (
            pRect.left + marginX < eRect.right - marginX &&
            pRect.right - marginX > eRect.left + marginX &&
            pRect.top + marginY < eRect.bottom - marginY &&
            pRect.bottom - marginY > eRect.top + marginY
        ) {
            gameOver();
            return;
        }

        // Score points
        if (enemy.y > gameContainer.clientHeight && !enemy.passed) {
            enemy.passed = true;
            score++;
            scoreElement.innerText = score;
        }
    }

    // Cleanup old enemies
    enemies = enemies.filter(enemy => {
        if (enemy.y > gameContainer.clientHeight + 150) {
            enemy.element.remove();
            return false;
        }
        return true;
    });

    animationId = requestAnimationFrame(update);
}

function startGame() {
    // Reset state
    score = 0;
    gameSpeed = 5;
    scoreElement.innerText = score;
    currentLane = 1; // Center lane
    
    // UI
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    road.classList.add('road-animation');
    playerCar.style.transform = 'none';
    
    // Clear enemies
    enemies.forEach(e => e.element.remove());
    enemies = [];
    
    // Ensure accurate sizing
    updatePlayerPosition();
    
    isGameRunning = true;
    lastTime = 0;
    
    // Spawn enemies periodically
    clearInterval(enemySpawnTimer);
    enemySpawnTimer = setInterval(spawnEnemy, 1200);
    
    // Start loop
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(animationId);
    clearInterval(enemySpawnTimer);
    road.classList.remove('road-animation');
    
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
    
    // Add visual crash effect
    playerCar.style.transform = 'rotate(15deg) scale(0.9)';
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
window.addEventListener('resize', updatePlayerPosition);

// Initial setup
setTimeout(updatePlayerPosition, 100);
