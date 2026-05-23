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

// ============================================================
// PLAYER 1 (Arrow keys) - Hijau
// ============================================================
let snake1 = [{ x: 200, y: 200 }];
let dx1 = 20;
let dy1 = 0;
let score1 = 0;
let gameOver1 = false;

// ============================================================
// PLAYER 2 (WASD keys) - Biru
// ============================================================
let snake2 = [{ x: 180, y: 180 }];
let dx2 = -20;
let dy2 = 0;
let score2 = 0;
let gameOver2 = false;

// ============================================================
// FOOD - 2 makanan dalam canvas
// ============================================================
let foods = [];

// Inisialisasi food setelah semua variabel siap
for (let i = 0; i < 2; i++) {
  foods.push(generateFood());
}

// ============================================================
// GAME STATE
// ============================================================
let gameSpeed = 150;

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
// DRAW SNAKE
// ============================================================
function drawSnake(snake, color) {
  snake.forEach(part => {
    ctx.fillStyle = color;
    ctx.fillRect(part.x, part.y, 20, 20);
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
// DRAW SCORE
// ============================================================
function drawScore() {
  score1Display.innerText = score1;
  score2Display.innerText = score2;

  ctx.fillStyle = "black";
  ctx.font = "14px Arial";
  ctx.fillText("P1: " + score1, 10, 20);
  ctx.fillText("P2: " + score2, 330, 20);
}

// ============================================================
// MOVE SNAKE (dengan wrap dinding)
// ============================================================
function moveSnake(snake, dx, dy, gameOverFlag) {
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
  snake.pop();

  return { snake, dx, dy };
}

// ============================================================
// CHECK FOOD
// ============================================================
function checkFoodFor(snake, score, gameOverFlag) {
  if (gameOverFlag) return score;

  const head = snake[0];

  for (let i = 0; i < foods.length; i++) {
    if (head.x === foods[i].x && head.y === foods[i].y) {
      // Tambah panjang ular
      snake.push({});
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
  ctx.fillText("GAME OVER", 110, 200);

  ctx.font = "16px Arial";
  ctx.fillText("P1: " + score1 + " | P2: " + score2, 120, 230);
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================
document.addEventListener("keydown", (event) => {
  const key = event.key;

  // Cegah scroll
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "s", "S", "a", "A", "d", "D"].includes(key)) {
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

  // ---- PLAYER 2 : WASD ----
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

  // Restart
  if ((gameOver1 && gameOver2) && (key === "Enter" || key === "r" || key === "R")) {
    location.reload();
  }
});

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop() {
  // Bersihkan canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cek apakah semua player mati
  if (gameOver1 && gameOver2) {
    drawGameOver();
    return;
  }

  // ---- GERAKKAN SNAKE ----
  if (!gameOver1) {
    let result1 = moveSnake(snake1, dx1, dy1, gameOver1);
    snake1 = result1.snake;
  }

  if (!gameOver2) {
    let result2 = moveSnake(snake2, dx2, dy2, gameOver2);
    snake2 = result2.snake;
  }

  // ---- CEK MAKANAN ----
  score1 = checkFoodFor(snake1, score1, gameOver1);
  score2 = checkFoodFor(snake2, score2, gameOver2);

  // ---- CEK TABRAKAN ----
  if (!gameOver1) {
    const head1 = snake1[0];
    // Tabrak tubuh sendiri
    if (checkCollision(head1, snake1, true)) gameOver1 = true;
    // Tabrak tubuh player 2
    if (!gameOver1 && checkCollision(head1, snake2, false)) gameOver1 = true;
  }

  if (!gameOver2) {
    const head2 = snake2[0];
    // Tabrak tubuh sendiri
    if (checkCollision(head2, snake2, true)) gameOver2 = true;
    // Tabrak tubuh player 1
    if (!gameOver2 && checkCollision(head2, snake1, false)) gameOver2 = true;
  }

  // ---- GAMBAR OBJEK ----
  drawFood();
  if (!gameOver1) drawSnake(snake1, "green");
  if (!gameOver2) drawSnake(snake2, "blue");
  drawScore();

  // Tampilkan game over per player
  if (gameOver1 && !gameOver2) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 200, 400);
    ctx.fillStyle = "red";
    ctx.font = "bold 20px Arial";
    ctx.fillText("P1 OUT!", 30, 200);
  }

  if (gameOver2 && !gameOver1) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(200, 0, 200, 400);
    ctx.fillStyle = "red";
    ctx.font = "bold 20px Arial";
    ctx.fillText("P2 OUT!", 230, 200);
  }

  // Ulangi loop
  setTimeout(gameLoop, gameSpeed);
}

// ============================================================
// START GAME
// ============================================================
gameLoop();
