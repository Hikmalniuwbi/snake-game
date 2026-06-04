// ============================================================
// Snake Game - Multiplayer 2 Player dalam 1 Canvas
// Player 1 : Arrow ( , , , )
// Player 2 : W, A, S, D
// ============================================================

// ============================================================
// CANVAS
// ============================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ============================================================
// SCORE DISPLAY
// ============================================================
const score1Display = document.getElementById("score1Display");
const score2Display = document.getElementById("score2Display");
const levelDisplay = document.getElementById("levelDisplay");
const p2Label = document.getElementById("p2Label");

// ============================================================
// GAME MODE
// ============================================================
let gameMode = null; // 'single' atau 'multi'

// ============================================================
// LEVEL SYSTEM
// ============================================================
const LEVEL_CONFIG = [
  { level: 1, threshold: 0,   speed: 250 },
  { level: 2, threshold: 25,  speed: 200 },
  { level: 3, threshold: 50,  speed: 150 },
  { level: 4, threshold: 75,  speed: 100 },
  { level: 5, threshold: 100, speed: 50 }
];

let currentLevel = 1;
let gameSpeed = LEVEL_CONFIG[0].speed;
let levelUpFlash = 0; // counter untuk flash "LEVEL UP!"

// ============================================================
// PLAYER 1 (Arrow keys) - Hijau
// ============================================================
let snake1 = [
  { x: 200, y: 200 },
  { x: 180, y: 200 },
  { x: 160, y: 200 }
];
let dx1 = 20;
let dy1 = 0;
let score1 = 0;
let gameOver1 = false;
let grow1 = false;

// ============================================================
// PLAYER 2 (WASD keys) - Biru
// ============================================================
let snake2 = [
  { x: 180, y: 180 },
  { x: 200, y: 180 },
  { x: 220, y: 180 }
];
let dx2 = -20;
let dy2 = 0;
let score2 = 0;
let gameOver2 = false;
let grow2 = false;

// ============================================================
// FOOD - 2 makanan dalam canvas
// ============================================================
let foods = [];

// Inisialisasi food setelah semua variabel siap
for (let i = 0; i < 2; i++) {
  foods.push(generateFood());
}

// ============================================================
// SMOOTH MOVEMENT VARIABLES
// ============================================================
let prevSnake1 = snake1.map(s => ({ ...s }));
let prevSnake2 = snake2.map(s => ({ ...s }));
let accumulator = 0;
let lastFrameTime = 0;
let p1OutTimer = 0;
let p2OutTimer = 0;
let paused = false;

// ============================================================
// GAME STATE
// ============================================================
// (gameSpeed diatur oleh LEVEL SYSTEM di atas)

// ============================================================
// GENERATE FOOD
// ============================================================
function generateFood() {
  let newFood;
  let valid;
  do {
    valid = true;
    newFood = {
      x: Math.floor(Math.random() * 20) * 20,
      y: Math.floor(Math.random() * 20) * 20
    };
    // Jangan spawn di atas snake1
    snake1.forEach(seg => {
      if (seg.x === newFood.x && seg.y === newFood.y) valid = false;
    });
    // Jangan spawn di atas snake2
    snake2.forEach(seg => {
      if (seg.x === newFood.x && seg.y === newFood.y) valid = false;
    });
    // Jangan spawn di atas food lain
    foods.forEach(f => {
      if (f.x === newFood.x && f.y === newFood.y) valid = false;
    });
  } while (!valid);
  return newFood;
}

// ============================================================
// UPDATE LEVEL
// ============================================================
function updateLevel() {
  const maxScore = Math.max(score1, score2);
  let newLevel = 1;
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (maxScore >= LEVEL_CONFIG[i].threshold) {
      newLevel = LEVEL_CONFIG[i].level;
      break;
    }
  }
  if (newLevel !== currentLevel) {
    currentLevel = newLevel;
    gameSpeed = LEVEL_CONFIG[currentLevel - 1].speed;
    levelUpFlash = 8; // flash "LEVEL UP!" selama 8 game tick
    // Update display
    levelDisplay.innerText = currentLevel;
  }

  // Decrement levelUpFlash (per game tick, bukan per frame)
  if (levelUpFlash > 0) levelUpFlash--;
}

// ============================================================
// DRAW SNAKE (dengan interpolasi untuk gerakan smooth)
// ============================================================
function drawSnake(snake, color, prevSnake, t) {
  snake.forEach((segment, i) => {
    let x, y;
    if (i < prevSnake.length) {
      const prev = prevSnake[i];
      // Deteksi wrapping (lompatan besar karena tembus dinding)
      if (Math.abs(segment.x - prev.x) > 20 || Math.abs(segment.y - prev.y) > 20) {
        x = segment.x;
        y = segment.y;
      } else {
        x = prev.x + (segment.x - prev.x) * t;
        y = prev.y + (segment.y - prev.y) * t;
      }
    } else {
      // Segmen baru (baru tumbuh)
      x = segment.x;
      y = segment.y;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 20, 20);
  });
}

// ============================================================
// DRAW FOOD
// ============================================================
function drawFood() {
  foods.forEach(f => {
    ctx.fillStyle = "red";
    ctx.fillRect(f.x, f.y, 20, 20);
  });
}

// ============================================================
// DRAW SCORE & LEVEL
// ============================================================
function drawScore() {
  score1Display.innerText = score1;
  score2Display.innerText = score2;
  levelDisplay.innerText = currentLevel;

  ctx.fillStyle = "black";
  ctx.font = "14px Arial";
  if (gameMode === "single") {
    ctx.fillText("Skor: " + score1, 10, 20);
  } else {
    ctx.fillText("P1: " + score1, 10, 20);
    ctx.fillText("P2: " + score2, 330, 20);
  }

  // Tampilkan level di tengah canvas atas
  ctx.font = "bold 14px Arial";
  ctx.fillText("Level: " + currentLevel, 175, 20);

  // Flash "LEVEL UP!" (render saja, decrement di updateLevel)
  if (levelUpFlash > 0) {
    ctx.fillStyle = levelUpFlash % 2 === 0 ? "orange" : "#ff6600";
    ctx.font = "bold 24px Arial";
    ctx.fillText("LEVEL UP!", 110, 60);
  }
}

// ============================================================
// MOVE SNAKE (dengan wrap dinding)
// ============================================================
function moveSnake(snake, dx, dy, gameOverFlag, growFlag) {
  if (gameOverFlag) return { snake, dx, dy };

  let head = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  // Wrap dinding
  if (head.x >= canvas.width) head.x = 0;
  if (head.x < 0) head.x = canvas.width - 20;
  if (head.y >= canvas.height) head.y = 0;
  if (head.y < 0) head.y = canvas.height - 20;

  snake.unshift(head);

  // Hanya pop jika tidak sedang tumbuh (setelah makan)
  if (!growFlag) {
    snake.pop();
  }

  return { snake, dx, dy };
}

// ============================================================
// CHECK FOOD
// ============================================================
function checkFoodFor(snake, score, gameOverFlag, isPlayer1) {
  if (gameOverFlag) return score;

  const head = snake[0];

  for (let i = 0; i < foods.length; i++) {
    if (head.x === foods[i].x && head.y === foods[i].y) {
      // Tandai ular akan tumbuh (pop tidak dilakukan di moveSnake)
      if (isPlayer1) {
        grow1 = true;
      } else {
        grow2 = true;
      }
      // Ganti food yang dimakan
      foods[i] = generateFood();
      // Tambah skor
      score += 1;
    }
  }

  return score;
}

// ============================================================
// CHECK COLLISION
// ============================================================
function checkCollision(head, body, excludeSelf) {
  let startFrom = excludeSelf ? 1 : 0;
  for (let i = startFrom; i < body.length; i++) {
    if (head.x === body[i].x && head.y === body[i].y) {
      return true;
    }
  }
  return false;
}

// ============================================================
// GAME OVER TEXT
// ============================================================
function drawGameOver() {
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("GAME OVER", 110, 180);

  ctx.font = "16px Arial";
  if (gameMode === "single") {
    ctx.fillText("Skor: " + score1, 170, 215);
  } else {
    ctx.fillText("P1: " + score1 + " | P2: " + score2, 130, 215);

    // Tampilkan pemenang
    ctx.font = "bold 18px Arial";
    let winnerText = "";
    if (score1 > score2) winnerText = "P1 WIN!";
    else if (score2 > score1) winnerText = "P2 WIN!";
    else winnerText = "SERI!";
    ctx.fillText(winnerText, 150, 245);
  }
  ctx.fillText("Final Level: " + currentLevel, 150, 270);
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================
document.addEventListener("keydown", (event) => {
  const key = event.key;

  // Cegah scroll
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "s", "S", "a", "A", "d", "D", "p", "P"].includes(key)) {
    event.preventDefault();
  }

  // ---- PLAYER 1 : Arrow Keys ----
  if (key === "ArrowUp" && dy1 === 0 && !gameOver1) {
    dx1 = 0;
    dy1 = -20;
  } else if (key === "ArrowDown" && dy1 === 0 && !gameOver1) {
    dx1 = 0;
    dy1 = 20;
  } else if (key === "ArrowLeft" && dx1 === 0 && !gameOver1) {
    dx1 = -20;
    dy1 = 0;
  } else if (key === "ArrowRight" && dx1 === 0 && !gameOver1) {
    dx1 = 20;
    dy1 = 0;
  }

  // ---- PLAYER 2 : WASD (hanya di multiplayer) ----
  if (gameMode === "multi") {
    if ((key === "w" || key === "W") && dy2 === 0 && !gameOver2) {
      dx2 = 0;
      dy2 = -20;
    } else if ((key === "s" || key === "S") && dy2 === 0 && !gameOver2) {
      dx2 = 0;
      dy2 = 20;
    } else if ((key === "a" || key === "A") && dx2 === 0 && !gameOver2) {
      dx2 = -20;
      dy2 = 0;
    } else if ((key === "d" || key === "D") && dx2 === 0 && !gameOver2) {
      dx2 = 20;
      dy2 = 0;
    }
  }

  // Restart
  if ((gameOver1 && gameOver2) && (key === "Enter" || key === "r" || key === "R")) {
    location.reload();
  }

  // Pause toggle
  if (key === "p" || key === "P") {
    togglePause();
  }
});

// ============================================================
// GAME LOOP (smooth dengan requestAnimationFrame)
// ============================================================
function gameLoop(timestamp) {
  // Inisialisasi timestamp pertama
  if (!lastFrameTime) lastFrameTime = timestamp;

  // Hitung delta time, cap untuk mencegah spiral of death
  let deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  if (deltaTime > 200) deltaTime = 200;

  // Jika paused, gambar overlay dan lanjutkan loop
  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    requestAnimationFrame(gameLoop);
    return;
  }

  // Jika semua player mati (atau P1 mati di singleplayer), stop loop
  if (gameOver1 && (gameMode === "single" || gameOver2)) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGameOver();
    drawScore();
    return;
  }

  // Akumulasi waktu untuk fixed-timestep game logic
  accumulator += deltaTime;

  // Game logic update pada interval tetap (tidak tergantung fps)
  while (accumulator >= gameSpeed && !(gameOver1 && (gameMode === "single" || gameOver2))) {
    // Simpan posisi sebelumnya untuk interpolasi
    prevSnake1 = snake1.map(s => ({ ...s }));
    prevSnake2 = snake2.map(s => ({ ...s }));

    // ---- GERAKKAN SNAKE 1 ----
    if (!gameOver1) {
      let result1 = moveSnake(snake1, dx1, dy1, gameOver1, grow1);
      snake1 = result1.snake;
      grow1 = false;
    }

    // ---- GERAKKAN SNAKE 2 (hanya di multiplayer) ----
    if (!gameOver2 && gameMode !== "single") {
      let result2 = moveSnake(snake2, dx2, dy2, gameOver2, grow2);
      snake2 = result2.snake;
      grow2 = false;
    }

    // ---- CEK MAKANAN ----
    score1 = checkFoodFor(snake1, score1, gameOver1, true);
    if (gameMode !== "single") {
      score2 = checkFoodFor(snake2, score2, gameOver2, false);
    }

    // ---- CEK TABRAKAN P1 ----
    if (!gameOver1) {
      const head1 = snake1[0];
      if (checkCollision(head1, snake1, true)) {
        gameOver1 = true;
        p1OutTimer = 3000;
      }
      // Tabrak P2 hanya jika ada P2
      if (gameMode !== "single" && !gameOver1 && checkCollision(head1, snake2, false)) {
        gameOver1 = true;
        p1OutTimer = 3000;
      }
    }

    // ---- CEK TABRAKAN P2 (hanya di multiplayer) ----
    if (!gameOver2 && gameMode !== "single") {
      const head2 = snake2[0];
      if (checkCollision(head2, snake2, true)) {
        gameOver2 = true;
        p2OutTimer = 3000;
      }
      if (!gameOver2 && checkCollision(head2, snake1, false)) {
        gameOver2 = true;
        p2OutTimer = 3000;
      }
    }

    // ---- CEK LEVEL UP ----
    updateLevel();

    accumulator -= gameSpeed;
  }

  // ---- RENDER dengan interpolasi ----
  const t = Math.min(accumulator / gameSpeed, 1); // 0.0 - 1.0

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFood();

  // Kurangi out notification timer
  if (p1OutTimer > 0) p1OutTimer -= deltaTime;
  if (p2OutTimer > 0) p2OutTimer -= deltaTime;

  // Gambar snake sesuai mode
  if (!gameOver1) drawSnake(snake1, "green", prevSnake1, t);
  if (!gameOver2 && gameMode !== "single") drawSnake(snake2, "blue", prevSnake2, t);
  drawScore();

  // Tampilkan "P1 OUT!" 3 detik saja
  if (gameOver1 && gameMode !== "single" && !gameOver2 && p1OutTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 200, 400);
    ctx.fillStyle = "red";
    ctx.font = "bold 20px Arial";
    ctx.fillText("P1 OUT!", 30, 200);
  }

  // Tampilkan "P2 OUT!" 3 detik saja
  if (gameOver2 && !gameOver1 && gameMode !== "single" && p2OutTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(200, 0, 200, 400);
    ctx.fillStyle = "red";
    ctx.font = "bold 20px Arial";
    ctx.fillText("P2 OUT!", 230, 200);
  }

  // Lanjutkan loop dengan requestAnimationFrame (60fps)
  requestAnimationFrame(gameLoop);
}

// ============================================================
// START GAME (dipanggil dari tombol mode)
// ============================================================
function startSingle() {
  gameMode = "single";
  document.getElementById("modeOverlay").style.display = "none";
  document.getElementById("gameTitle").innerText = "Snake Game - Single Player";
  document.getElementById("controls").innerHTML = `
    <p><strong>Panduan:</strong> Arrow &uarr; &darr; &larr; &rarr; untuk bergerak</p>
  `;
  // Sembunyikan label Player 1 di scoreboard
  document.querySelector(".p1-color .player-label").style.display = "none";
  // Sembunyikan score P2
  document.querySelector(".p2-color").style.display = "none";
  requestAnimationFrame(gameLoop);
}

function startMulti() {
  gameMode = "multi";
  document.getElementById("modeOverlay").style.display = "none";
  document.getElementById("gameTitle").innerText = "Snake Game - Multiplayer";
  document.getElementById("controls").innerHTML = `
    <p><strong>Player 1:</strong> Arrow &uarr; &darr; &larr; &rarr;</p>
    <p><strong>Player 2:</strong> W A S D</p>
  `;
  // Tampilkan kembali label Player 1
  document.querySelector(".p1-color .player-label").style.display = "inline";
  p2Label.innerText = "Player 2";
  document.querySelector(".p2-color").style.display = "flex";
  requestAnimationFrame(gameLoop);
}

// ============================================================
// PAUSE / RESUME
// ============================================================
function togglePause() {
  if (!gameMode || (gameOver1 && (gameMode === "single" || gameOver2))) return;
  paused = !paused;
  const btn = document.getElementById("pauseBtn");
  if (paused) {
    btn.textContent = "Resume";
    btn.classList.add("paused");
  } else {
    btn.textContent = "Pause";
    btn.classList.remove("paused");
    // Reset lastFrameTime agar tidak lompat setelah pause
    lastFrameTime = 0;
  }
}
