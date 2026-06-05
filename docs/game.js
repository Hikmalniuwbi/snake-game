// ============================================================
// Snake Game - Phase 2 (Enhanced Edition)
// Fitur: Single/Double/AI, sistem level, special food,
//        popup modal, MATI DULUAN, kustom warna, audio
// ============================================================

// ============================================================
// CANVAS & DOM REFS
// ============================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const score1Display = document.getElementById("score1Display");
const score2Display = document.getElementById("score2Display");
const levelDisplay = document.getElementById("levelDisplay");
const speedDisplay = document.getElementById("speedDisplay");
const p1Label = document.getElementById("p1Label");
const p2Label = document.getElementById("p2Label");
const p2ScoreBox = document.getElementById("p2ScoreBox");

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const startOverlay = document.getElementById("startOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const startTitle = document.getElementById("startTitle");
const startInfo = document.getElementById("startInfo");
const startDiff = document.getElementById("startDiff");
const pauseBtn = document.getElementById("pauseBtn");
const gameTitle = document.getElementById("gameTitle");
const p2Controls = document.getElementById("p2Controls");

const gameOverPopup = document.getElementById("gameOverPopup");
const goScore = document.getElementById("goScore");
const goLevel = document.getElementById("goLevel");
const goFood = document.getElementById("goFood");
const goTime = document.getElementById("goTime");
const goWinner = document.getElementById("goWinner");
const gameOverTitle = document.getElementById("gameOverTitle");

const levelPopup = document.getElementById("levelPopup");
const levelUpInfo = document.getElementById("levelUpInfo");
const levelUpSpeed = document.getElementById("levelUpSpeed");

// ============================================================
// AUDIO SYSTEM
// ============================================================
let audioCtx = null;
let isAudioMuted = false;

// // BGM states
let bgmAudio = new Audio("bgm.mp3");
bgmAudio.loop = true;
bgmAudio.volume = 0.25; // Volume 25% agar efek makan tetap terdengar jelas

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startBGM() {
  if (isAudioMuted) return;
  try {
    bgmAudio.currentTime = 0;
    bgmAudio.play().catch(function (e) {
      console.log("BGM play prevented:", e);
    });
  } catch (e) { }
}

function resumeBGM() {
  if (isAudioMuted) return;
  try {
    bgmAudio.play().catch(function (e) {
      console.log("BGM play prevented:", e);
    });
  } catch (e) { }
}

function stopBGM() {
  try {
    bgmAudio.pause();
  } catch (e) { }
}

function playTone(freq, duration, type, volume) {
  if (isAudioMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) { /* Silently fail */ }
}

function playEatSound() {
  playTone(880, 0.08, "square", 0.08);
  setTimeout(function () { playTone(1100, 0.08, "square", 0.06); }, 60);
}

function playSpecialEatSound() {
  playTone(1100, 0.08, "square", 0.08);
  setTimeout(function () { playTone(1320, 0.08, "square", 0.08); }, 60);
  setTimeout(function () { playTone(1540, 0.1, "square", 0.06); }, 120);
}

function playLevelUpSound() {
  playTone(660, 0.1, "square", 0.08);
  setTimeout(function () { playTone(880, 0.1, "square", 0.08); }, 100);
  setTimeout(function () { playTone(1100, 0.15, "square", 0.08); }, 200);
}

function playGameOverSound() {
  playTone(440, 0.15, "sawtooth", 0.06);
  setTimeout(function () { playTone(330, 0.15, "sawtooth", 0.06); }, 150);
  setTimeout(function () { playTone(220, 0.3, "sawtooth", 0.06); }, 300);
}

function playCollisionSound() {
  playTone(200, 0.2, "sawtooth", 0.08);
}

function playMenuSound() {
  playTone(600, 0.06, "square", 0.05);
}

function toggleAudio() {
  initAudio();
  isAudioMuted = !isAudioMuted;
  var btn = document.getElementById("audioToggle");
  btn.textContent = isAudioMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
  btn.classList.toggle("muted", isAudioMuted);
  if (!isAudioMuted) {
    playMenuSound();
    if (gamePhase === "playing") {
      resumeBGM();
    }
  } else {
    stopBGM();
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
let toastTimeout = null;

function showToast(message, type) {
  var toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast-" + (type || "info") + " show";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

// ============================================================
// CONFIGURATION
// ============================================================
const GAME_LEVELS = [
  { name: "Easy", maxScore: 3, baseSpeed: 350, speedLabel: "Lambat" },
  { name: "Medium", maxScore: 7, baseSpeed: 250, speedLabel: "Sedang" },
  { name: "Hard", maxScore: Infinity, baseSpeed: 150, speedLabel: "Cepat" }
];

const SNAKE_COLORS = {
  "#00ff88": { name: "Hijau Neon", head: "#33ff99" },
  "#00d4ff": { name: "Biru Neon", head: "#33ddff" },
  "#ff6b35": { name: "Oranye", head: "#ff8844" },
  "#ffcc00": { name: "Kuning", head: "#ffdd44" },
  "#ff33aa": { name: "Pink", head: "#ff55bb" },
  "#aa66ff": { name: "Ungu", head: "#bb77ff" }
};

const P2_COLOR = "#00ff88";
const P2_HEAD = "#33ff99";
const AI_COLOR = "#ff3355";
const AI_HEAD = "#ff5577";

const SPECIAL_FOOD_INTERVAL = 5;
const SPECIAL_FOOD_DURATION = 10000;
const SPECIAL_FOOD_POINTS = 3;

const GRID_SIZE = 20;
const CELLS = 25; // 500 / 20 = 25

// ============================================================
// GAME STATE
// ============================================================
let gameMode = null;       // 'single' | 'double' | 'ai'
let snakeColor = "#00d4ff";
let snake2Color = "#00ff88";
let gamePhase = "menu";    // 'menu' | 'ready' | 'playing' | 'paused' | 'levelup' | 'gameover'

// Player 1
let snake1 = [];
let dx1 = 0, dy1 = 0;
let score1 = 0;
let gameOver1 = false;
let grow1 = false;
let prevSnake1 = [];

// Player 2 (double) / AI
let snake2 = [];
let dx2 = 0, dy2 = 0;
let score2 = 0;
let gameOver2 = false;
let grow2 = false;
let prevSnake2 = [];

let aiDir = { dx: -20, dy: 0 };

// Food
let foods = [];
let specialFood = null;
let specialFoodTimer = 0;
let foodsEatenSinceSpecial = 0;

// Game Level (Easy / Medium / Hard)
let gameLevelIndex = 0; // 0=Easy, 1=Medium, 2=Hard
let gameSpeed = 350;
let wallSolid = false;
let pendingGameLevelUp = false;
let pendingNewGameLevel = null;
let declinedLevelIndex = -1; // track declined level to avoid re-asking
let paused = false;

// Timing
let accumulator = 0;
let lastFrameTime = 0;
let gameStartTime = 0;
let totalFoodsEaten = 0;

// Grid cache
const gridCanvas = document.createElement("canvas");
gridCanvas.width = canvas.width;
gridCanvas.height = canvas.height;
let gridCtx = gridCanvas.getContext("2d");
let gridDrawn = false;

let animFrameId = null;
let levelUpFlash = 0;

// ============================================================
// GAME LEVEL SYSTEM (Easy / Medium / Hard)
// ============================================================
function getGameLevelIndex(score) {
  if (score <= GAME_LEVELS[0].maxScore) return 0; // Easy
  if (score <= GAME_LEVELS[1].maxScore) return 1; // Medium
  return 2; // Hard
}

function getGameLevelName(index) {
  return GAME_LEVELS[index].name;
}

function checkGameLevelUp() {
  if (pendingGameLevelUp) return false;
  var maxScore = (gameMode === "double") ? Math.max(score1, score2) : score1;
  var targetLevel = getGameLevelIndex(maxScore);
  // Skip if already at or above target, or player already declined this level
  if (targetLevel <= gameLevelIndex || targetLevel === declinedLevelIndex) return false;
  pendingGameLevelUp = true;
  pendingNewGameLevel = targetLevel;
  gamePhase = "levelup";
  playLevelUpSound();
  showGameLevelPopup(targetLevel);
  return true;
}

function applyGameLevel() {
  if (pendingNewGameLevel !== null) {
    gameLevelIndex = pendingNewGameLevel;
    gameSpeed = GAME_LEVELS[gameLevelIndex].baseSpeed;
    wallSolid = (gameLevelIndex >= 2); // Hard = solid walls
    pendingNewGameLevel = null;
  }
  pendingGameLevelUp = false;
  updateLevelDisplay();
  levelUpFlash = 12;
}

function updateLevelDisplay() {
  var gl = GAME_LEVELS[gameLevelIndex];
  levelDisplay.innerText = gl.name;
  speedDisplay.innerText = gl.speedLabel;
}

// ============================================================
// SNAKE INIT
// ============================================================
function initSnakes() {
  // Player 1 - starts at left-center, moving right
  snake1 = [
    { x: 240, y: 240 },
    { x: 220, y: 240 },
    { x: 200, y: 240 }
  ];
  dx1 = 20; dy1 = 0;
  score1 = 0; gameOver1 = false; grow1 = false;
  prevSnake1 = [];

  // Player 2 / AI - starts at right-center, moving left
  snake2 = [
    { x: 240, y: 220 },
    { x: 260, y: 220 },
    { x: 280, y: 220 }
  ];
  dx2 = -20; dy2 = 0;
  score2 = 0; gameOver2 = false; grow2 = false;
  prevSnake2 = [];
  aiDir = { dx: -20, dy: 0 };
}

// ============================================================
// FOOD GENERATION
// ============================================================
function generateFood(excludeList) {
  var ex = excludeList || [];
  var attempts = 0;
  var allSegments = [];
  // Collect all occupied cells
  for (var i = 0; i < snake1.length; i++) {
    allSegments.push(snake1[i]);
  }
  for (var i = 0; i < snake2.length; i++) {
    allSegments.push(snake2[i]);
  }
  for (var i = 0; i < ex.length; i++) {
    allSegments.push(ex[i]);
  }
  if (specialFood) {
    allSegments.push(specialFood);
  }

  var result;
  do {
    result = {
      x: Math.floor(Math.random() * CELLS) * GRID_SIZE,
      y: Math.floor(Math.random() * CELLS) * GRID_SIZE
    };
    var occupied = false;
    for (var i = 0; i < allSegments.length; i++) {
      if (allSegments[i].x === result.x && allSegments[i].y === result.y) {
        occupied = true;
        break;
      }
    }
    attempts++;
    if (attempts > 300) break;
  } while (occupied);
  return result;
}

function initFood() {
  foods = [];
  for (var i = 0; i < 2; i++) {
    foods.push(generateFood([]));
  }
  specialFood = null;
  specialFoodTimer = 0;
  foodsEatenSinceSpecial = 0;
}

function spawnSpecialFood() {
  var pos = generateFood([]);
  specialFood = pos;
  specialFoodTimer = SPECIAL_FOOD_DURATION;
}

// ============================================================
// SNAKE MOVEMENT
// ============================================================
function moveSnake(snake, dx, dy, gameOverFlag, growFlag, wallWrap) {
  if (gameOverFlag) return;

  var head = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  if (wallWrap) {
    // Wrap around edges
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - GRID_SIZE;
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - GRID_SIZE;
  } else {
    // Solid wall - check if out of bounds
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      // Out of bounds = game over for this snake
      return "collision_wall";
    }
  }

  snake.unshift(head);
  if (!growFlag) {
    snake.pop();
  }
  return true;
}

// ============================================================
// COLLISION DETECTION
// ============================================================
function checkCollision(head, body, excludeSelf) {
  var startFrom = excludeSelf ? 1 : 0;
  for (var i = startFrom; i < body.length; i++) {
    if (head.x === body[i].x && head.y === body[i].y) {
      return true;
    }
  }
  return false;
}

function checkFoodCollision(snake, isPlayer1) {
  var head = snake[0];
  var ate = false;
  // Check regular foods
  for (var i = 0; i < foods.length; i++) {
    if (head.x === foods[i].x && head.y === foods[i].y) {
      if (isPlayer1) { grow1 = true; } else { grow2 = true; }
      foods[i] = generateFood(foods);
      if (isPlayer1) { score1 += 1; } else { score2 += 1; }
      totalFoodsEaten++;
      foodsEatenSinceSpecial++;
      playEatSound();
      // Score pop animation
      var display = isPlayer1 ? score1Display : score2Display;
      display.classList.remove("score-pop");
      void display.offsetWidth;
      display.classList.add("score-pop");
      ate = true;
      // Check special food spawn
      if (foodsEatenSinceSpecial >= SPECIAL_FOOD_INTERVAL && !specialFood) {
        spawnSpecialFood();
        foodsEatenSinceSpecial = 0;
        showToast("Makanan spesial muncul! Ambil cepat!", "info");
      }
      // Check game level up
      checkGameLevelUp();
    }
  }
  // Check special food
  if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
    if (isPlayer1) { grow1 = true; } else { grow2 = true; }
    if (isPlayer1) { score1 += SPECIAL_FOOD_POINTS; } else { score2 += SPECIAL_FOOD_POINTS; }
    totalFoodsEaten++;
    specialFood = null;
    specialFoodTimer = 0;
    playSpecialEatSound();
    var d = isPlayer1 ? score1Display : score2Display;
    d.classList.remove("score-pop");
    void d.offsetWidth;
    d.classList.add("score-pop");
    showToast("+3 poin spesial!", "success");
    checkGameLevelUp();
  }
  return ate;
}

// ============================================================
// AI LOGIC
// ============================================================
function updateAI() {
  if (gameOver2 || gamePhase !== "playing") return;

  // Find nearest food (including special)
  var head = snake2[0];
  var target = null;
  var minDist = Infinity;

  // Check regular foods
  for (var i = 0; i < foods.length; i++) {
    var f = foods[i];
    var dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
    if (dist < minDist) { minDist = dist; target = f; }
  }
  // Check special food (higher priority)
  if (specialFood) {
    var sDist = Math.abs(specialFood.x - head.x) + Math.abs(specialFood.y - head.y);
    if (sDist < minDist + 40) { // Small bonus to prioritize special
      target = specialFood;
      minDist = sDist;
    }
  }

  if (!target) return;

  // Determine preferred direction
  var preferredDirs = [];
  var dx = target.x - head.x;
  var dy = target.y - head.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Prefer horizontal
    if (dx > 0) preferredDirs.push({ dx: GRID_SIZE, dy: 0 });
    if (dx < 0) preferredDirs.push({ dx: -GRID_SIZE, dy: 0 });
    if (dy > 0) preferredDirs.push({ dx: 0, dy: GRID_SIZE });
    if (dy < 0) preferredDirs.push({ dx: 0, dy: -GRID_SIZE });
  } else {
    // Prefer vertical
    if (dy > 0) preferredDirs.push({ dx: 0, dy: GRID_SIZE });
    if (dy < 0) preferredDirs.push({ dx: 0, dy: -GRID_SIZE });
    if (dx > 0) preferredDirs.push({ dx: GRID_SIZE, dy: 0 });
    if (dx < 0) preferredDirs.push({ dx: -GRID_SIZE, dy: 0 });
  }

  // Try preferred directions first
  var chosen = null;
  for (var i = 0; i < preferredDirs.length; i++) {
    var d = preferredDirs[i];
    // Can't reverse direction
    if (d.dx === -aiDir.dx && d.dy === -aiDir.dy) continue;
    var nx = head.x + d.dx;
    var ny = head.y + d.dy;
    // Check safety
    var safe = true;
    // Wall check
    if (wallSolid) {
      if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) safe = false;
    }
    // Self collision check
    if (safe) {
      for (var j = 1; j < snake2.length; j++) {
        if (nx === snake2[j].x && ny === snake2[j].y) { safe = false; break; }
      }
    }
    // P1 collision check
    if (safe && gameMode === "ai") {
      for (var j = 0; j < snake1.length; j++) {
        if (nx === snake1[j].x && ny === snake1[j].y) { safe = false; break; }
      }
    }
    if (safe) { chosen = d; break; }
  }

  // Fallback: try any non-reverse direction
  if (!chosen) {
    var fallbacks = [
      { dx: GRID_SIZE, dy: 0 },
      { dx: -GRID_SIZE, dy: 0 },
      { dx: 0, dy: GRID_SIZE },
      { dx: 0, dy: -GRID_SIZE }
    ];
    for (var i = 0; i < fallbacks.length; i++) {
      var d = fallbacks[i];
      if (d.dx === -aiDir.dx && d.dy === -aiDir.dy) continue;
      var nx = head.x + d.dx;
      var ny = head.y + d.dy;
      var safe = true;
      if (wallSolid) {
        if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height) safe = false;
      }
      if (safe) {
        for (var j = 1; j < snake2.length; j++) {
          if (nx === snake2[j].x && ny === snake2[j].y) { safe = false; break; }
        }
      }
      if (safe) { chosen = d; break; }
    }
  }

  if (chosen) {
    aiDir.dx = chosen.dx;
    aiDir.dy = chosen.dy;
    dx2 = chosen.dx;
    dy2 = chosen.dy;
  }
}

// ============================================================
// DRAW GRID (cached)
// ============================================================
function drawGrid() {
  if (!gridDrawn) {
    gridCtx.strokeStyle = "rgba(0,255,136,0.04)";
    gridCtx.lineWidth = 1;
    for (var i = 0; i <= CELLS; i++) {
      gridCtx.beginPath();
      gridCtx.moveTo(i * GRID_SIZE, 0);
      gridCtx.lineTo(i * GRID_SIZE, canvas.height);
      gridCtx.stroke();
      gridCtx.beginPath();
      gridCtx.moveTo(0, i * GRID_SIZE);
      gridCtx.lineTo(canvas.width, i * GRID_SIZE);
      gridCtx.stroke();
    }
    gridDrawn = true;
  }
  ctx.drawImage(gridCanvas, 0, 0);
}

// ============================================================
// DRAW SNAKE (smooth interpolation)
// ============================================================
function drawSnake(snake, color, prevSnake, t, headColor, sdx, sdy) {
  var segSize = 18;
  var offset = (GRID_SIZE - segSize) / 2;

  snake.forEach(function (segment, i) {
    var x, y;
    if (i < prevSnake.length) {
      var prev = prevSnake[i];
      if (Math.abs(segment.x - prev.x) > GRID_SIZE || Math.abs(segment.y - prev.y) > GRID_SIZE) {
        x = segment.x;
        y = segment.y;
      } else {
        x = prev.x + (segment.x - prev.x) * t;
        y = prev.y + (segment.y - prev.y) * t;
      }
    } else {
      x = segment.x;
      y = segment.y;
    }

    var isHead = (i === 0);

    if (isHead) {
      ctx.shadowColor = headColor || color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = headColor || color;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, segSize, segSize, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = "white";
      var eyeSize = 4;
      var ex1, ey1, ex2, ey2;

      if (sdx === GRID_SIZE) { // Right
        ex1 = x + 13; ey1 = y + 4; ex2 = x + 13; ey2 = y + 13;
      } else if (sdx === -GRID_SIZE) { // Left
        ex1 = x + 4; ey1 = y + 4; ex2 = x + 4; ey2 = y + 13;
      } else if (sdy === -GRID_SIZE) { // Up
        ex1 = x + 4; ey1 = y + 4; ex2 = x + 13; ey2 = y + 4;
      } else { // Down
        ex1 = x + 4; ey1 = y + 13; ex2 = x + 13; ey2 = y + 13;
      }
      ctx.fillRect(ex1, ey1, eyeSize, eyeSize);
      ctx.fillRect(ex2, ey2, eyeSize, eyeSize);
    } else {
      var darken = Math.max(0.5, 1 - i * 0.02);
      ctx.fillStyle = color;
      ctx.globalAlpha = darken;
      ctx.beginPath();
      ctx.roundRect(x + offset + 1, y + offset + 1, segSize - 2, segSize - 2, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}

// ============================================================
// DRAW FOOD
// ============================================================
function drawFood() {
  var time = Date.now() / 300;
  // Regular food
  foods.forEach(function (f, i) {
    var pulse = Math.sin(time + i * 2) * 0.15 + 0.85;
    var size = 16 * pulse;
    var off = (GRID_SIZE - size) / 2;

    ctx.shadowColor = "#ff3355";
    ctx.shadowBlur = 12;

    var gradient = ctx.createRadialGradient(f.x + 10, f.y + 8, 0, f.x + 10, f.y + 10, 12);
    gradient.addColorStop(0, "#ff6666");
    gradient.addColorStop(0.6, "#ff3355");
    gradient.addColorStop(1, "#cc0022");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(f.x + off, f.y + off, size, size, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Leaf
    if (pulse > 0.9) {
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.ellipse(f.x + 14, f.y + 2, 3, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Special food (golden, pulsing)
  if (specialFood) {
    var sp = Math.sin(time * 2) * 0.2 + 0.8;
    var sSize = 18 * sp;
    var sOff = (GRID_SIZE - sSize) / 2;

    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 18;

    var grad = ctx.createRadialGradient(
      specialFood.x + 10, specialFood.y + 8, 0,
      specialFood.x + 10, specialFood.y + 10, 14
    );
    grad.addColorStop(0, "#ffee66");
    grad.addColorStop(0.5, "#ffcc00");
    grad.addColorStop(1, "#ff9900");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(specialFood.x + sOff, specialFood.y + sOff, sSize, sSize, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Star shape in center
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u2605", specialFood.x + 10, specialFood.y + 10);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Timer bar below
    var remaining = Math.max(0, specialFoodTimer / SPECIAL_FOOD_DURATION);
    ctx.fillStyle = "rgba(255,204,0,0.3)";
    ctx.fillRect(specialFood.x + 2, specialFood.y + GRID_SIZE - 3, GRID_SIZE - 4, 3);
    ctx.fillStyle = "rgba(255,204,0,0.8)";
    ctx.fillRect(specialFood.x + 2, specialFood.y + GRID_SIZE - 3, (GRID_SIZE - 4) * remaining, 3);
  }
}

// ============================================================
// DRAW SCORE / HUD
// ============================================================
function drawScore() {
  score1Display.innerText = score1;
  if (gameMode === "double" || gameMode === "ai") {
    score2Display.innerText = score2;
  }
  updateLevelDisplay();

  // Level up flash
  if (levelUpFlash > 0) {
    var alpha = levelUpFlash > 6 ? 1 : levelUpFlash / 6;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(0,255,136," + alpha + ")";
    ctx.font = "700 28px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.fillText("GOKIL NAIK LEVEL!", canvas.width / 2, 70);
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// GAME LEVEL TRANSITION POPUP
// ============================================================
function showGameLevelPopup(targetIndex) {
  var gl = GAME_LEVELS[targetIndex];
  var prevGl = GAME_LEVELS[gameLevelIndex];
  document.getElementById("levelPopupTitle").textContent = "GOKIL NAIK LEVEL!";
  levelUpInfo.innerHTML = "Skor kamu kencang banget sampe melompat ke level <strong>" + gl.name + "</strong>!";
  var wallNote = (targetIndex >= 2) ? " <br><span style='color:var(--danger);font-weight:600'>&#x26A0; Tembok sekarang tidak dapat ditembus, jangan asal seruduk!</span>" : "";
  levelUpSpeed.innerHTML = "Kecepatan: " + prevGl.speedLabel + " &rarr; " + gl.speedLabel + ". Berani lanjut gak bos?" + wallNote;
  levelPopup.style.display = "flex";
}

function proceedNextLevel() {
  levelPopup.style.display = "none";
  applyGameLevel();
  gamePhase = "playing";
  lastFrameTime = 0;
  pauseBtn.disabled = false;
  pauseBtn.textContent = "Pause";
}

function declineNextLevel() {
  declinedLevelIndex = pendingNewGameLevel;
  pendingNewGameLevel = null;
  pendingGameLevelUp = false;
  gamePhase = "playing";
  levelPopup.style.display = "none";
  lastFrameTime = 0;
  pauseBtn.disabled = false;
  pauseBtn.textContent = "Pause";
  updateLevelDisplay();
  showToast("Cupu jir, tetep bertahan di level " + GAME_LEVELS[gameLevelIndex].name, "info");
}

// ============================================================
// GAME OVER
// ============================================================
function showGameOverPopup() {
  stopBGM(); // Stop music on game over

  var elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  var timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";

  var finalScore, winnerText = "";

  if (gameMode === "single") {
    finalScore = score1;
    gameOverTitle.textContent = "GAME OVER";
    goWinner.innerHTML = ""; // Hapus skor akhir ganda di atas button
    goScore.textContent = score1;
  } else if (gameMode === "double") {
    // MATI DULUAN system
    if (gameOver1 && !gameOver2) {
      finalScore = score2;
      winnerText = "🏆 <strong>Player 2 menang, player 1 telah mati !</strong>";
      gameOverTitle.textContent = "GAME OVER";
    } else if (gameOver2 && !gameOver1) {
      finalScore = score1;
      winnerText = "🏆 <strong>Player 1 menang, player 2 telah mati !</strong>";
      gameOverTitle.textContent = "GAME OVER";
    } else {
      finalScore = Math.max(score1, score2);
      winnerText = "🤝 <strong>Seri! Dua-duanya kompak mati, wkwk!</strong>";
      gameOverTitle.textContent = "GAME OVER";
    }
    // Ganti skor di box dengan label 'player 1 score' dan 'player 2 score'
    goScore.innerHTML = "<div style='font-size: 15px; margin-bottom: 4px; color: " + snakeColor + "'>player 1 score: " + score1 + "</div><div style='font-size: 15px; color: " + snake2Color + "'>player 2 score: " + score2 + "</div>";
    goWinner.innerHTML = winnerText;
  } else if (gameMode === "ai") {
    finalScore = score1;
    if (gameOver1 && !gameOver2) {
      gameOverTitle.textContent = "GAME OVER";
      winnerText = "🤖 <strong>AI Menang! Kamu kalah, belajar lagi gih!</strong>";
    } else if (gameOver2 && !gameOver1) {
      gameOverTitle.textContent = "GAME OVER";
      winnerText = "🏆 <strong>Kamu Menang! AI-nya kena mental!</strong>";
    } else {
      gameOverTitle.textContent = "GAME OVER";
      winnerText = "🤝 <strong>Seri! Skill kamu setara komputer!</strong>";
    }
    // Ganti skor di box dengan label 'player saja score' dan 'AI score'
    goScore.innerHTML = "<div style='font-size: 15px; margin-bottom: 4px; color: " + snakeColor + "'>player saja score: " + score1 + "</div><div style='font-size: 15px; color: " + AI_COLOR + "'>AI score: " + score2 + "</div>";
    goWinner.innerHTML = winnerText;
  }

  goLevel.textContent = GAME_LEVELS[gameLevelIndex].name;
  goFood.textContent = totalFoodsEaten;
  goTime.textContent = timeStr;

  // Play sound
  playGameOverSound();

  // Show popup
  gameOverPopup.style.display = "flex";
}

// ============================================================
// NAVIGATION
// ============================================================
function selectMode(mode) {
  if (gamePhase !== "menu") return;
  playMenuSound();
  var modeName, instrHTML;

  if (mode === "single") {
    modeName = "Single Player";
    instrHTML = "<h3>\uD83C\uDFAE Kontrol</h3>" +
      "<table class='controls-table'>" +
      "<tr><td><strong>Gerak</strong></td><td><kbd>\u2191</kbd> <kbd>\u2193</kbd> <kbd>\u2190</kbd> <kbd>\u2192</kbd></td></tr>" +
      "<tr><td><strong>Jeda</strong></td><td><kbd>P</kbd></td></tr>" +
      "</table>" +
      "<h3>\uD83C\uDFAF Tujuan</h3>" +
      "<p>Makan apel sebanyak-banyaknya biar makin melar, cuy! Tapi inget, hindari menabrak tubuh sendiri! <br><strong>HATI-HATI</strong> : saat mencapai level \"Hard\", tembok tidak akan bisa ditembus oleh ular! Jadi jangan asal seruduk ya bro!</p>" +
      "<h3>\uD83D\uDCCA Level Game</h3>" +
      "<p>Skor menentukan level: <strong>Easy</strong> (0\u201325, nyantai cuy), <strong>Medium</strong> (26\u201350, mulai seru nih), <strong>Hard</strong> (&gt;50, ngebut abis!).</p>";
  } else if (mode === "double") {
    modeName = "Double Player";
    instrHTML = "<h3>\uD83C\uDFAE Kontrol</h3>" +
      "<table class='controls-table'>" +
      "<tr><th>Pemain</th><th>Tombol</th></tr>" +
      "<tr><td><strong>Player 1</strong></td><td><kbd>\u2191</kbd> <kbd>\u2193</kbd> <kbd>\u2190</kbd> <kbd>\u2192</kbd></td></tr>" +
      "<tr><td><strong>Player 2</strong></td><td><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd><br><small>(W: Gerak Ke Atas, A: Gerak Ke Kiri, S: Gerak Ke Bawah, D: Gerak Ke Kanan)</small></td></tr>" +
      "<tr><td><strong>Jeda</strong></td><td><kbd>P</kbd></td></tr>" +
      "</table>" +
      "<h3>\uD83C\uDFC6 Aturan</h3>" +
      "<p>Dua pemain dalam satu arena. Bertahanlah, Player yang mati terlebih dahulu akan kalah ! Senggol dong bos!</p>" +
      "<h3>\uD83D\uDCCA Level Game</h3>" +
      "<p>Skor menentukan level: <strong>Easy</strong> (0\u201325), <strong>Medium</strong> (26\u201350), <strong>Hard</strong> (&gt;50).</p>";
  } else {
    modeName = "VS AI";
    instrHTML = "<h3>\uD83C\uDFAE Kontrol</h3>" +
      "<table class='controls-table'>" +
      "<tr><td><strong>Gerak</strong></td><td><kbd>\u2191</kbd> <kbd>\u2193</kbd> <kbd>\u2190</kbd> <kbd>\u2192</kbd></td></tr>" +
      "<tr><td><strong>Jeda</strong></td><td><kbd>P</kbd></td></tr>" +
      "</table>" +
      "<h3>\uD83E\uDD16 Aturan</h3>" +
      "<p>Lawan AI pinter yang otomatis nyari makanan. Kumpulkan skor lebih banyak dari AI biar dia kena mental!</p>" +
      "<h3>\uD83D\uDCCA Level Game</h3>" +
      "<p>Skor menentukan level: <strong>Easy</strong> (0\u201325), <strong>Medium</strong> (26\u201350), <strong>Hard</strong> (&gt;50).</p>";
  }

  document.getElementById("modeInstrTitle").textContent = modeName;
  document.getElementById("modeInstrBody").innerHTML = instrHTML;
  // Store selected mode for confirmation
  document.getElementById("modeInstrModal").dataset.mode = mode;
  document.getElementById("modeInstrModal").style.display = "flex";
}

function confirmMode() {
  var mode = document.getElementById("modeInstrModal").dataset.mode;
  if (!mode) return;
  gameMode = mode;
  playMenuSound();
  document.getElementById("modeInstrModal").style.display = "none";
  // Update button highlights
  document.querySelectorAll(".mode-btn").forEach(function (btn) {
    btn.classList.remove("selected");
  });
  var btns = document.querySelectorAll(".mode-btn");
  var idx = (mode === "single") ? 0 : (mode === "double") ? 1 : 2;
  if (btns[idx]) btns[idx].classList.add("selected");

  // Toggle color picker display based on mode
  const pSingle = document.getElementById("colorPickerSingle");
  const pDouble = document.getElementById("colorPickerDouble");
  if (gameMode === "double") {
    pSingle.style.display = "none";
    pDouble.style.display = "block";
  } else {
    pSingle.style.display = "block";
    pDouble.style.display = "none";
  }

  var modeNameText = (mode === "single") ? "Single Player" : (mode === "double") ? "Double Player" : "VS AI";
  showToast("Mantap! Mode " + modeNameText + " siap digaskan, bos!", "info");
}

function cancelModeSelection() {
  document.getElementById("modeInstrModal").style.display = "none";
  playMenuSound();
}

function setSnakeColor(color) {
  snakeColor = color;
  playMenuSound();
  document.querySelectorAll("#colorPickerSingle .color-btn").forEach(function (btn) {
    btn.classList.remove("active-color");
    if (btn.dataset.color === color) {
      btn.classList.add("active-color");
    }
  });
  document.querySelectorAll("#colorPickerP1 .color-btn").forEach(function (btn) {
    btn.classList.remove("active-color");
    if (btn.dataset.color === color) {
      btn.classList.add("active-color");
    }
  });
}

function setSnake2Color(color) {
  snake2Color = color;
  playMenuSound();
  document.querySelectorAll("#colorPickerP2 .color-btn").forEach(function (btn) {
    btn.classList.remove("active-color");
    if (btn.dataset.color === color) {
      btn.classList.add("active-color");
    }
  });
}

function showAbout() {
  playMenuSound();
  document.getElementById("aboutModal").style.display = "flex";
}

function hideAbout() {
  document.getElementById("aboutModal").style.display = "none";
}

// Close modals on click outside
document.getElementById("aboutModal").addEventListener("click", function (e) {
  if (e.target === this) hideAbout();
});
document.getElementById("modeInstrModal").addEventListener("click", function (e) {
  if (e.target === this) cancelModeSelection();
});
document.getElementById("gameOverPopup").addEventListener("click", function (e) {
  if (e.target === this) { } // Prevent accidental close
});

// ============================================================
// START GAME (from START overlay button)
// ============================================================
function startGame() {
  if (!gameMode) {
    showToast("Eits, pilih modenya dulu dong bos!", "error");
    return;
  }

  initAudio();
  playMenuSound();
  startBGM(); // Start background music loop

  // Reset state
  gamePhase = "playing";
  gameLevelIndex = 0;
  gameSpeed = GAME_LEVELS[0].baseSpeed;
  wallSolid = false;
  pendingGameLevelUp = false;
  pendingNewGameLevel = null;
  declinedLevelIndex = -1;
  totalFoodsEaten = 0;
  accumulator = 0;
  lastFrameTime = 0;
  levelUpFlash = 0;
  gridDrawn = false;

  initSnakes();
  initFood();

  updateLevelDisplay();

  // Hide start overlay
  startOverlay.style.display = "none";

  // Enable pause button
  pauseBtn.disabled = false;
  pauseBtn.textContent = "Pause";

  // Score display setup
  if (gameMode === "single") {
    p2ScoreBox.style.display = "none";
    p2Controls.style.display = "none";
    p1Label.textContent = "Score";
    p1Label.style.color = snakeColor;
  } else {
    p2ScoreBox.style.display = "flex";
    p2Controls.style.display = "inline";
    if (gameMode === "ai") {
      p2Label.textContent = "AI";
      p2Label.style.color = AI_COLOR;
      p1Label.textContent = "Player Saja";
      p1Label.style.color = snakeColor;
    } else {
      p2Label.textContent = "Player 2";
      p2Label.style.color = snake2Color;
      p1Label.textContent = "Player 1";
      p1Label.style.color = snakeColor;
    }
  }

  gameStartTime = Date.now();
  showToast("Gaskeun! Level Easy dulu biar ga kaget!", "info");
  animFrameId = requestAnimationFrame(gameLoop);
}

// ============================================================
// START GAME FLOW (from home screen → game screen)
// ============================================================
function transitionToGame() {
  if (!gameMode) {
    showToast("Eits, pilih modenya dulu dong bos!", "error");
    return;
  }

  initAudio();
  playMenuSound();

  // Switch screens
  homeScreen.style.display = "none";
  gameScreen.style.display = "flex";

  // Set title and start overlay info
  var modeName = (gameMode === "single") ? "Single Player" : (gameMode === "double") ? "Double Player" : "VS AI";
  gameTitle.textContent = "Snake - " + modeName;
  startTitle.textContent = "Siap Bermain?";
  startInfo.textContent = "Mode: " + modeName;
  startDiff.textContent = "Level: " + GAME_LEVELS[0].name + " (" + GAME_LEVELS[0].speedLabel + ")";

  // Reset visual state for game
  startOverlay.style.display = "flex";
  pauseOverlay.style.display = "none";
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";

  // Hide game over popup if visible
  gameOverPopup.style.display = "none";
  levelPopup.style.display = "none";

  // Initialize game state (but don't start loop yet)
  gamePhase = "ready";
  gameLevelIndex = 0;
  gameSpeed = GAME_LEVELS[0].baseSpeed;
  wallSolid = false;
  pendingGameLevelUp = false;
  pendingNewGameLevel = null;
  declinedLevelIndex = -1;
  totalFoodsEaten = 0;
  accumulator = 0;
  lastFrameTime = 0;
  levelUpFlash = 0;
  gridDrawn = false;

  initSnakes();
  initFood();

  // Score display setup & control text setup
  if (gameMode === "single") {
    p2ScoreBox.style.display = "none";
    p2Controls.style.display = "none";
    p1Label.textContent = "Score";
    p1Label.style.color = snakeColor;
    document.getElementById("controls").innerHTML = "<p><strong>Control:</strong> Arrow &uarr; &darr; &larr; &rarr;</p>";
  } else {
    p2ScoreBox.style.display = "flex";
    p2Controls.style.display = "inline";
    if (gameMode === "ai") {
      p2Label.textContent = "AI";
      p2Label.style.color = AI_COLOR;
      p1Label.textContent = "Player Saja";
      p1Label.style.color = snakeColor;
      document.getElementById("controls").innerHTML = "<p><strong>Player Saja:</strong> Arrow &uarr; &darr; &larr; &rarr;</p>";
    } else {
      p2Label.textContent = "Player 2";
      p2Label.style.color = snake2Color;
      p1Label.textContent = "Player 1";
      p1Label.style.color = snakeColor;
      document.getElementById("controls").innerHTML = "<p><strong>Player 1:</strong> Arrow &uarr; &darr; &larr; &rarr;</p><p><strong>Player 2:</strong> W A S D</p>";
    }
  }

  score1Display.innerText = "0";
  score2Display.innerText = "0";
  updateLevelDisplay();

  gameStartTime = Date.now();
}

// Override: Start button now transitions first then starts
document.addEventListener("click", function (e) {
  if (e.target.id === "startBtn" || e.target.closest("#startBtn")) {
    // Already handled by onclick=startGame
  }
});

// ============================================================
// BACK TO MENU
// ============================================================
function backToMenu() {
  // Cancel game loop
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  stopBGM(); // Stop BGM on return to menu

  // Hide all popups
  gameOverPopup.style.display = "none";
  levelPopup.style.display = "none";

  // Switch screens
  gameScreen.style.display = "none";
  homeScreen.style.display = "flex";

  // Reset state
  gamePhase = "menu";
  gameLevelIndex = 0;
  gameSpeed = GAME_LEVELS[0].baseSpeed;
  pendingGameLevelUp = false;
  pendingNewGameLevel = null;
  declinedLevelIndex = -1;
  paused = false;
  pauseBtn.classList.remove("paused");
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";

  playMenuSound();
}

// ============================================================
// RESTART GAME
// ============================================================
function restartGame() {
  gameOverPopup.style.display = "none";
  levelPopup.style.display = "none";
  transitionToGame();
}

// ============================================================
// PAUSE / RESUME
// ============================================================
function togglePause() {
  if (gamePhase !== "playing" && gamePhase !== "paused") return;
  if (pendingGameLevelUp) return;

  paused = !paused;
  gamePhase = paused ? "paused" : "playing";
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  pauseBtn.classList.toggle("paused", paused);
  pauseOverlay.style.display = paused ? "flex" : "none";

  if (paused) {
    stopBGM(); // Stop music when paused
  } else {
    lastFrameTime = 0;
    startBGM(); // Resume music on resume
  }
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================
document.addEventListener("keydown", function (event) {
  var key = event.key;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "s", "S", "a", "A", "d", "D", "p", "P", "r", "R"].includes(key)) {
    event.preventDefault();
  }

  // Pause toggle
  if (key === "p" || key === "P") {
    togglePause();
    return;
  }

  // Only process game controls during playing phase
  if (gamePhase !== "playing") return;

  // Player 1: Arrow keys
  if (!gameOver1) {
    if (key === "ArrowUp" && dy1 === 0) { dx1 = 0; dy1 = -GRID_SIZE; }
    else if (key === "ArrowDown" && dy1 === 0) { dx1 = 0; dy1 = GRID_SIZE; }
    else if (key === "ArrowLeft" && dx1 === 0) { dx1 = -GRID_SIZE; dy1 = 0; }
    else if (key === "ArrowRight" && dx1 === 0) { dx1 = GRID_SIZE; dy1 = 0; }
  }

  // Player 2: WASD (only in double mode, not AI)
  if (gameMode === "double" && !gameOver2) {
    if ((key === "w" || key === "W") && dy2 === 0) { dx2 = 0; dy2 = -GRID_SIZE; }
    else if ((key === "s" || key === "S") && dy2 === 0) { dx2 = 0; dy2 = GRID_SIZE; }
    else if ((key === "a" || key === "A") && dx2 === 0) { dx2 = -GRID_SIZE; dy2 = 0; }
    else if ((key === "d" || key === "D") && dx2 === 0) { dx2 = GRID_SIZE; dy2 = 0; }
  }
});

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  if (gamePhase === "menu" || gamePhase === "gameover") return;

  // Initialize timestamp
  if (!lastFrameTime) lastFrameTime = timestamp;

  // Delta time with cap
  var deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  if (deltaTime > 200) deltaTime = 200;

  // Handle paused
  if (gamePhase === "paused") {
    animFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  // Handle levelup wait
  if (pendingGameLevelUp) {
    // Still render but don't update
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    if (!gameOver1) drawSnake(snake1, getP1Color(), prevSnake1, 1, getP1HeadColor(), dx1, dy1);
    if (!gameOver2 && gameMode !== "single") drawSnake(snake2, getP2Color(), prevSnake2, 1, getP2HeadColor(), dx2, dy2);
    drawScore();
    animFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  // Handle game over
  if (gamePhase === "gameover") {
    // Freeze frame
    return;
  }

  // Update AI direction
  if (gameMode === "ai") {
    updateAI();
  }

  // Accumulate time for fixed-timestep
  accumulator += deltaTime;

  var maxSteps = 5;
  var steps = 0;

  while (accumulator >= gameSpeed && steps < maxSteps && gamePhase === "playing" && !pendingGameLevelUp) {
    // Save previous positions for interpolation
    prevSnake1 = snake1.map(function (s) { return { x: s.x, y: s.y }; });
    if (gameMode !== "single") {
      prevSnake2 = snake2.map(function (s) { return { x: s.x, y: s.y }; });
    }

    // Move player 1
    if (!gameOver1) {
      var result1 = moveSnake(snake1, dx1, dy1, gameOver1, grow1, !wallSolid);
      if (result1 === "collision_wall") {
        gameOver1 = true;
        playCollisionSound();
      }
      grow1 = false;
    }

    // Move player 2 / AI
    if (!gameOver2 && gameMode !== "single") {
      var result2 = moveSnake(snake2, dx2, dy2, gameOver2, grow2, !wallSolid);
      if (result2 === "collision_wall") {
        gameOver2 = true;
        playCollisionSound();
      }
      grow2 = false;
    }

    // Check food
    checkFoodCollision(snake1, true);
    if (gameMode !== "single") {
      checkFoodCollision(snake2, false);
    }

    // ---- COLLISION CHECKS ----
    // P1 self-collision
    if (!gameOver1) {
      if (checkCollision(snake1[0], snake1, true)) {
        gameOver1 = true;
        playCollisionSound();
      }
    }

    // P1 vs P2
    if (!gameOver1 && gameMode !== "single") {
      if (checkCollision(snake1[0], snake2, false)) {
        gameOver1 = true;
        playCollisionSound();
      }
    }

    // P2 self-collision
    if (!gameOver2 && gameMode !== "single") {
      if (checkCollision(snake2[0], snake2, true)) {
        gameOver2 = true;
        playCollisionSound();
      }
    }

    // P2 vs P1
    if (!gameOver2 && gameMode !== "single") {
      if (checkCollision(snake2[0], snake1, false)) {
        gameOver2 = true;
        playCollisionSound();
      }
    }

    // ---- GAME OVER CHECK ----
    if (gameMode === "single" && gameOver1) {
      gamePhase = "gameover";
      showGameOverPopup();
      accumulator = 0;
      break;
    }

    if (gameMode === "double") {
      if (gameOver1 || gameOver2) {
        gamePhase = "gameover";
        showGameOverPopup();
        accumulator = 0;
        break;
      }
    }

    if (gameMode === "ai") {
      if (gameOver1 || gameOver2) {
        gamePhase = "gameover";
        showGameOverPopup();
        accumulator = 0;
        break;
      }
    }

    accumulator -= gameSpeed;
    steps++;
  }

  // Clamp accumulator
  if (accumulator > gameSpeed) accumulator = gameSpeed;

  // ---- RENDER ----
  var t = Math.min(accumulator / gameSpeed, 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();

  // Special food timer
  if (specialFood) {
    specialFoodTimer -= deltaTime;
    if (specialFoodTimer <= 0) {
      specialFood = null;
      specialFoodTimer = 0;
      showToast("Makanan spesial habis!", "info");
    }
  }

  // Level up flash timer
  if (levelUpFlash > 0) levelUpFlash--;

  // Draw snakes
  if (!gameOver1) drawSnake(snake1, getP1Color(), prevSnake1, t, getP1HeadColor(), dx1, dy1);
  if (!gameOver2 && gameMode !== "single") drawSnake(snake2, getP2Color(), prevSnake2, t, getP2HeadColor(), dx2, dy2);

  drawScore();

  // Continue loop if still playing
  if (gamePhase === "playing" || gamePhase === "paused" || pendingGameLevelUp) {
    animFrameId = requestAnimationFrame(gameLoop);
  }
}

// ============================================================
// HELPER: Get colors for snakes
// ============================================================
function getP1Color() {
  return snakeColor;
}

function getP1HeadColor() {
  return SNAKE_COLORS[snakeColor] ? SNAKE_COLORS[snakeColor].head : "#33ddff";
}

function getP2Color() {
  return (gameMode === "ai") ? AI_COLOR : snake2Color;
}

function getP2HeadColor() {
  return (gameMode === "ai") ? AI_HEAD : (SNAKE_COLORS[snake2Color] ? SNAKE_COLORS[snake2Color].head : "#33ff99");
}

// ============================================================
// POLYFILL: roundRect for older browsers
// ============================================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === "number") r = [r];
    var radii = r.map(function (v) { return Math.min(v, Math.min(w, h) / 2); });
    var tl = radii[0] || 0;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tl, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tl);
    this.lineTo(x + w, y + h - tl);
    this.quadraticCurveTo(x + w, y + h, x + w - tl, y + h);
    this.lineTo(x + tl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - tl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

// ============================================================
// STARTUP: Hide game over popup, show home screen
// ============================================================
gameOverPopup.style.display = "none";
levelPopup.style.display = "none";
homeScreen.style.display = "flex";
gameScreen.style.display = "none";

// Make transitionToGame callable from the START button
// The start button in the overlay calls startGame()
// But we need it to first transition from home to game screen
// Override: The home screen's start is now the "START" overlay button
// which appears after transitionToGame

// Connect the home screen play buttons to transitionToGame
// We'll use the mode-btn click as both selection and indicator
// The actual "play" trigger is the START button on the game screen

// Provide a function to start playing from home directly
window.transitionToGame = transitionToGame;
window.startGame = startGame;
window.backToMenu = backToMenu;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.proceedNextLevel = proceedNextLevel;
window.declineNextLevel = declineNextLevel;
window.selectMode = selectMode;
window.confirmMode = confirmMode;
window.cancelModeSelection = cancelModeSelection;
window.setSnakeColor = setSnakeColor;
window.setSnake2Color = setSnake2Color;
window.showAbout = showAbout;
window.hideAbout = hideAbout;
window.toggleAudio = toggleAudio;

// Log loaded
console.log("Snake Game Phase 2 loaded");
