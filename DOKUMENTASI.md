# Dokumentasi Lengkap Proyek: Snake Game (Enhanced Edition)
Proyek ini dibuat untuk memenuhi tugas **Grafika Komputer - Semester 4**. Game ini mengusung tema klasik yang dimodifikasi dengan visual modern (*neon gaming look*), sistem leveling dinamis, audio latar belakang (BGM), mode mabar (*Double Player*), dan lawan kecerdasan buatan (*VS AI*).

---

## 1. Arsitektur File Proyek
Proyek ini memiliki struktur file yang minimalis namun modular:
* `server.js`: Server web lokal berbasis Node.js dan Express untuk menyajikan game di browser.
* `docs/`: Folder utama yang di-serve ke publik (sekaligus digunakan untuk GitHub Pages).
  * [index.html](file:///C:/Users/hikma/OneDrive/ドキュメント/Semester%204/Grafika%20Komputer/PJBL/snake%20game/docs/index.html): Kerangka antarmuka pengguna (UI), modal, tombol, dan area render game (*canvas*).
  * [style.css](file:///C:/Users/hikma/OneDrive/ドキュメント/Semester%204/Grafika%20Komputer/PJBL/snake%20game/docs/style.css): Lembar gaya tampilan dengan tema *Dark Cyberpunk* dan efek neon.
  * [game.js](file:///C:/Users/hikma/OneDrive/ドキュメント/Semester%204/Grafika%20Komputer/PJBL/snake%20game/docs/game.js): Otak dari keseluruhan logika game, pergerakan ular, audio, AI, dan transisi status game.
  * `bgm.mp3`: File musik latar yang akan diputar berulang secara dinamis selama permainan berlangsung.

---

## 2. Struktur Antarmuka (`index.html`)
HTML bertindak sebagai wadah visual utama yang dibagi menjadi beberapa lapisan bertumpuk:
1. **`homeScreen`**: Halaman awal tempat pemain memilih mode bermain (Single, Double, AI), memilih warna ular, serta tombol **GASKAN!** untuk masuk ke arena.
2. **`gameScreen`**: Halaman utama permainan yang berisi:
   * **Header**: Tombol kembali ke menu utama dan judul game.
   * **Score Board**: Statistik skor Player 1 (atau *Score* jika main sendiri), Player 2 (atau *AI*), Level saat ini, dan status Kecepatan.
   * **Canvas (`<canvas id="game">`)**: Area berukuran 400x400 piksel tempat ular dan makanan digambar menggunakan Javascript.
   * **Overlays**: Lapisan transparan di atas canvas untuk instruksi sebelum mulai (*START*), jeda (*PAUSE*), dan transisi level (*LEVEL UP*).
3. **Modals & Popups**: Modal popup untuk penjelasan cara bermain (* Cara Bermain*), game over (*GAME OVER*), dan pop-up naik level (*Level Tercapai!*).

---

## 3. Sistem Desain & Visual (`style.css`)
Tampilan visual menggunakan teknik modern dalam CSS:
* **Variabel Global (`:root`)**: Berisi palet warna neon gaming seperti `--primary` (`#00ff88` / hijau neon), `--secondary` (`#00d4ff` / biru neon), dan warna dasar gelap seperti `--bg-deep` (`#080c1a`).
* **Latar Belakang Dinamis**: Efek grid transparan 40px dibentuk secara dinamis menggunakan properti `background-image` linear-gradient, memberikan impresi dunia grid retro digital.
* **Glassmorphism**: Kontainer menu utama (`#mainMenu`) dan modal popup menggunakan `backdrop-filter: blur(14px)` dengan transparansi tipis untuk memberi kesan kaca mengapung di atas latar belakang.
* **Micro-Animations**:
  * `titlePulse`: Efek pendaran neon judul utama yang membesar dan mengecil secara halus.
  * `pop`: Efek pembesaran skor sementara ketika ular berhasil memakan apel.
  * `startPulse`: Efek bernapas pada tombol START untuk menarik perhatian pengguna.

---

## 4. Logika Utama Permainan (`game.js`)

### A. Game Loop dengan Fixed Timestep (Smooth Rendering)
Ular dalam game tradisional bergerak kaku per petak. Game ini menggunakan teknik **fixed-timestep accumulator** pada fungsi `gameLoop(timestamp)`:
1. Menyimpan posisi koordinat ular sebelumnya (`prevSnake1` dan `prevSnake2`).
2. Menghitung akumulator waktu berdasarkan *delta time* (jeda waktu antar frame).
3. Memperbarui posisi logika ular secara pasti (*fixed update*) hanya ketika akumulator melebihi nilai `gameSpeed`.
4. Merender posisi ular di kanvas dengan cara menginterpolasi (mencampur secara linear) posisi koordinat lama dan koordinat baru menggunakan rasio sisa waktu (`t`). Hasilnya, pergerakan ular terlihat sangat halus (*smooth movement*) di layar monitor modern (60Hz / 120Hz).

### B. Sistem Audio Ganda
Audio dipisahkan menjadi dua sistem berbeda untuk menghindari gangguan suara:
1. **Efek Suara Makan & Mati (Synthesized Audio)**:
   * Menggunakan **Web Audio API** secara murni. JS membuat oscillator frekuensi gelombang secara langsung lewat *code* (`audioCtx.createOscillator()`).
   * Nada makan buah biasa dibuat dengan nada tinggi 880Hz ke 1100Hz berdurasi sangat singkat (0.08 detik).
   * Efek tabrakan dibuat dengan nada rendah *sawtooth* 200Hz.
   * Suara disintesis langsung dari browser secara real-time tanpa file audio eksternal.
2. **Background Music (BGM)**:
   * Memakai object bawaan `Audio("bgm.mp3")` yang diset meloop (`loop = true`) with volume rendah (`0.25`).
   * Dikendalikan di fase-fase penting: `startGame` (putar musik), `togglePause` (jeda musik), `showGameOverPopup` (matikan musik), dan `backToMenu` (matikan musik).

### C. Pembagian Level (Easy, Medium, Hard)
Tingkat kesulitan diatur secara dinamis berdasarkan skor tertinggi pemain melalui array `GAME_LEVELS`:
* **Level 1 (Easy)**: Skor 0–25. Kecepatan lambat (update per 350ms). Tembok **bisa ditembus** (ular akan menembus ke sisi berlawanan).
* **Level 2 (Medium)**: Skor 26–50. Kecepatan sedang (update per 250ms). Tembok **bisa ditembus**.
* **Level 3 (Hard)**: Skor >50. Kecepatan cepat (update per 150ms). Tembok **SOLID** (ular mati jika menabrak tepi luar canvas).

*Catatan: Saat batas skor terlewati, game akan masuk ke status `levelup` dan memunculkan konfirmasi transisi level. Pemain bisa memilih menolak naik level jika merasa ular sudah bergerak terlalu cepat.*

---

## 5. Logika Mode Multiplayer (Double Player)
Ketika mode Double Player dipilih:
1. **Warna Ular Terpisah**:
   * Sistem mengaktifkan dua color picker di menu utama.
   * Player 1 memilih warna ular pertamanya.
   * Player 2 memilih warna ular keduanya.
   * Logika penentuan warna dilakukan di fungsi `getP1Color()` dan `getP2Color()`.
2. **Kontrol Tombol Mandiri**:
   * **Player 1** digerakkan menggunakan tombol panah (**Arrow Keys**).
   * **Player 2** digerakkan menggunakan tombol huruf (**W, A, S, D**).
3. **Aturan Tabrakan Antar Pemain & Sistem "Mati Duluan"**:
   * Kepala Ular 1 diperiksa apakah menabrak tubuh sendiri atau tubuh Ular 2 (`checkCollision(snake1[0], snake2)`).
   * Kepala Ular 2 diperiksa apakah menabrak tubuh sendiri atau tubuh Ular 1 (`checkCollision(snake2[0], snake1)`).
   * Jika salah satu mati terlebih dahulu dalam putaran logika yang sama, game langsung berakhir dan pemenang ditentukan berdasarkan siapa yang masih hidup (sistem *Mati Duluan*).

---

## 6. Algoritma Pergerakan AI (`VS AI`)
Mode VS AI menggunakan sistem pencarian jalur (*pathfinding*) cerdas berbasis heuristik jarak Manhattan (*Manhattan Distance*):
1. **Penentuan Target Terdekat**:
   * AI menghitung jarak dari kepalanya ke semua apel reguler yang ada di peta menggunakan rumus: `Jarak = |Target.x - Head.x| + |Target.y - Head.y|`.
   * Jika buah spesial berwarna emas muncul, AI akan memberi diskon jarak (bonus prioritas) agar otomatis berbelok memburu buah spesial tersebut karena poinnya lebih besar (+3 poin).
2. **Evaluasi Keamanan Jalur (Avoidance Logic)**:
   * AI akan mengurutkan arah gerakan yang paling mendekati target (Atas, Bawah, Kiri, Kanan).
   * Sebelum memutuskan melangkah, AI akan memproyeksikan posisi kepalanya di koordinat masa depan tersebut untuk memeriksa apakah arah itu **aman**:
     * Apakah koordinat tersebut keluar arena (jika di level Hard / tembok solid)?
     * Apakah koordinat tersebut menabrak tubuh AI itu sendiri?
     * Apakah koordinat tersebut menabrak tubuh Player 1 (ular manusia)?
   * Jika arah terbaik dinilai tidak aman, AI akan membatalkannya dan mencoba arah alternatif lain yang aman secara berurutan. Jika semua jalan buntu, AI baru akan melangkah pasrah.

---

## 7. Tips Menjawab Pertanyaan Dosen Saat Demo
* **Pertanyaan: "Bagaimana ular bisa menembus dinding di level Easy tapi mati di level Hard?"**
  * *Jawaban*: "Di fungsi `moveSnake()`, kami memeriksa boolean parameter `wallWrap`. Jika `wallWrap` bernilai true (di level Easy/Medium), koordinat kepala ular yang melewati lebar kanvas akan di-reset ke `0` atau sebaliknya. Jika bernilai false (di level Hard), program mendeteksi kepala keluar dari batas kanvas dan langsung menetapkan status tabrakan `collision_wall` yang memicu game over."
* **Pertanyaan: "Bagaimana cara mendeteksi ular memakan apel?"**
  * *Jawaban*: "Di dalam fungsi `checkFoodCollision()`, kami membandingkan koordinat `x` dan `y` kepala ular dengan koordinat apel. Jika koordinatnya persis sama, kami mengubah flag `grow` menjadi true agar tubuh ular memanjang pada langkah berikutnya, menambah skor pemain, memutar suara makan, dan memanggil fungsi spawn apel baru di koordinat acak yang tidak ditempati oleh ular."
* **Pertanyaan: "Mengapa pergerakan ularnya bisa sangat halus padahal grid game-nya 20x20?"**
  * *Jawaban*: "Kami menerapkan metode interpolasi linier (lerp) pada fungsi `drawSnake()`. Posisi ular digambar di posisi transisi antara koordinat sebelumnya dan koordinat baru berdasarkan sisa waktu (*fractional delta time*) dari fixed update loop, sehingga pergerakan terlihat mengalir mulus tanpa patah-patah."
