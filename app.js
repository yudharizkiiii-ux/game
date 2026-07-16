/* ============================================================
   GAMEHUB — APP.JS (Router, State, Navigation, Features)
   ============================================================ */

// ===== GAME REGISTRY =====
const GAMES = [
  {
    id: 'snake', name: 'Snake', icon: '🐍',
    desc: 'Makan makanan, hindari dinding dan dirimu sendiri!',
    category: 'arcade', color: '#10b981',
    gradient: 'linear-gradient(135deg, #064e3b, #10b981)',
    isNew: true
  },
  {
    id: 'tetris', name: 'Tetris', icon: '🟦',
    desc: 'Susun balok jatuh dengan sempurna untuk menghapus baris!',
    category: 'puzzle', color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0c4a6e, #06b6d4)',
    isNew: true
  },
  {
    id: '2048', name: '2048', icon: '🔢',
    desc: 'Gabungkan angka-angka untuk mencapai ubin 2048!',
    category: 'puzzle', color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #78350f, #f59e0b)',
    isNew: true
  },
  {
    id: 'sudoku', name: 'Sudoku', icon: '🧩',
    desc: 'Isi kotak 9×9 dengan angka 1-9 tanpa pengulangan!',
    category: 'puzzle', color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #3b0764, #8b5cf6)',
    isNew: true
  },
  {
    id: 'tictactoe', name: 'Tic Tac Toe', icon: '⭕',
    desc: 'Lawan AI cerdas dalam permainan strategi klasik!',
    category: 'puzzle', color: '#ec4899',
    gradient: 'linear-gradient(135deg, #831843, #ec4899)',
    isNew: true
  },
  {
    id: 'shooter', name: 'Space Shooter', icon: '🚀',
    desc: 'Musnahkan alien gelombang demi gelombang di luar angkasa!',
    category: 'action', color: '#ef4444',
    gradient: 'linear-gradient(135deg, #450a0a, #ef4444)',
    isNew: true
  },
  {
    id: 'flappy', name: 'Flappy Bird', icon: '🐦',
    desc: 'Terbang melewati pipa-pipa tanpa menyentuh apapun!',
    category: 'arcade', color: '#84cc16',
    gradient: 'linear-gradient(135deg, #1a2e05, #84cc16)',
    isNew: true
  },
  {
    id: 'dino', name: 'Dino Run', icon: '🦕',
    desc: 'Lompati rintangan dan berlari sejauh mungkin!',
    category: 'arcade', color: '#d97706',
    gradient: 'linear-gradient(135deg, #431407, #d97706)',
    isNew: true
  },
  {
    id: 'chess', name: 'Catur', icon: '👑',
    desc: 'Uji strategi dan taktikmu dalam duel catur klasik melawan AI!',
    category: 'puzzle', color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #2e1065, #8b5cf6)',
    isNew: true
  },
  {
    id: 'ludo', name: 'Ludo', icon: '🎲',
    desc: 'Putar dadu dan jalankan bidakmu menuju garis finis sebelum lawan!',
    category: 'arcade', color: '#10b981',
    gradient: 'linear-gradient(135deg, #064e3b, #10b981)',
    isNew: true
  }
];

const AVATARS = ['🎮','🕹️','👾','🦊','🐉','🤖','🦄','🐺','🦅','🐸','🦁','🐯','🦊','👻','💀','🤡','🐧','🦋','🐬','🦖','🌟','⚡','🔥','💎'];

// ===== STATE =====
let state = {
  currentPage: 'home',
  currentGame: null,
  settings: { sound: true, difficulty: 'medium', fps: false, particles: true, darkMode: true },
  profile: { username: 'Pemain', avatar: '🎮', joinDate: new Date().toLocaleDateString('id-ID') },
  scores: {},
  gamesPlayed: 0,
  activeFilter: 'all',
  currentLbTab: 'snake'
};

// ===== STORAGE =====
function saveState() {
  const toSave = {
    settings: state.settings,
    profile: state.profile,
    scores: state.scores,
    gamesPlayed: state.gamesPlayed
  };
  localStorage.setItem('gamehub_state', JSON.stringify(toSave));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('gamehub_state') || '{}');
    if (saved.settings) state.settings = { ...state.settings, ...saved.settings };
    if (saved.profile) state.profile = { ...state.profile, ...saved.profile };
    if (saved.scores) state.scores = saved.scores;
    if (saved.gamesPlayed) state.gamesPlayed = saved.gamesPlayed;
  } catch(e) { console.warn('Failed to load state:', e); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applySettings();
  renderAllPages();
  setupNavigation();
  setupTopbar();
  setupSearch();
  setupProfile();
  setupChat();
  setupSettings();
  setupGameModal();
  initParticles();
  initFpsCounter();
  updateStats();
});

// ===== APPLY SETTINGS =====
function applySettings() {
  document.documentElement.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
  document.getElementById('dark-toggle') && (document.getElementById('dark-toggle').checked = state.settings.darkMode);
  document.getElementById('sound-toggle') && (document.getElementById('sound-toggle').checked = state.settings.sound);
  document.getElementById('fps-toggle') && (document.getElementById('fps-toggle').checked = state.settings.fps);
  document.getElementById('particles-toggle') && (document.getElementById('particles-toggle').checked = state.settings.particles);
  document.getElementById('difficulty-select') && (document.getElementById('difficulty-select').value = state.settings.difficulty);
  updateThemeToggle();
  updateTopbarAvatar();
  const fpsCounter = document.getElementById('fps-counter');
  if (fpsCounter) fpsCounter.style.display = state.settings.fps ? 'block' : 'none';
  const canvas = document.getElementById('particles-canvas');
  if (canvas) canvas.style.display = state.settings.particles ? 'block' : 'none';
}

function updateThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const icon = toggle.querySelector('.theme-icon');
  const label = toggle.querySelector('.theme-label');
  if (state.settings.darkMode) {
    icon.textContent = '🌙';
    label.textContent = 'Dark Mode';
  } else {
    icon.textContent = '☀️';
    label.textContent = 'Light Mode';
  }
}

function updateTopbarAvatar() {
  const el = document.getElementById('topbar-avatar');
  if (el) el.textContent = state.profile.avatar;
}

// ===== NAVIGATION =====
function setupNavigation() {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Buttons with data-page
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-page]');
    if (el && !el.classList.contains('nav-item')) {
      e.preventDefault();
      navigateTo(el.dataset.page);
    }
  });

  // Sidebar toggle
  document.getElementById('hamburger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Hero play btn
  document.getElementById('hero-play-btn')?.addEventListener('click', () => navigateTo('games'));
}

function navigateTo(page) {
  state.currentPage = page;
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById(`nav-${page}`);
  if (navItem) navItem.classList.add('active');
  // Update topbar title
  const titles = { home: '🏠 Home', games: '🎮 Daftar Game', new: '🔥 Game Terbaru', leaderboard: '🏆 Leaderboard', profile: '👤 Profil', chat: '💬 Chat', settings: '⚙️ Pengaturan' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  // Special inits
  if (page === 'leaderboard') renderLeaderboard();
  if (page === 'profile') renderProfileStats();
  if (page === 'home') updateStats();
  closeSidebar();
  window.scrollTo(0, 0);
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

function toggleTheme() {
  state.settings.darkMode = !state.settings.darkMode;
  document.documentElement.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle) darkToggle.checked = state.settings.darkMode;
  updateThemeToggle();
  saveState();
}

// ===== TOPBAR =====
function setupTopbar() {
  document.getElementById('topbar-avatar')?.addEventListener('click', () => navigateTo('profile'));
}

// ===== SEARCH =====
function setupSearch() {
  document.getElementById('search-input')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    navigateTo('games');
    setTimeout(() => filterGames(q), 0);
  });
}

function filterGames(query) {
  const cards = document.querySelectorAll('#all-games-grid .game-card');
  cards.forEach(card => {
    const name = card.dataset.name?.toLowerCase() || '';
    const cat = card.dataset.category?.toLowerCase() || '';
    card.style.display = (!query || name.includes(query) || cat.includes(query)) ? 'block' : 'none';
  });
}

// ===== RENDER PAGES =====
function renderAllPages() {
  renderHomeGames();
  renderAllGames();
  renderNewGames();
  renderLeaderboard();
  renderProfileSetup();
}

function createGameCard(game, showNewBadge = false) {
  const highScore = getBestScore(game.id);
  const card = document.createElement('div');
  card.className = 'game-card';
  card.dataset.gameId = game.id;
  card.dataset.name = game.name.toLowerCase();
  card.dataset.category = game.category;
  card.innerHTML = `
    ${showNewBadge || game.isNew ? '<div class="game-card-new">🔥 New</div>' : ''}
    ${highScore > 0 ? `<div class="game-card-score">⭐ ${highScore.toLocaleString()}</div>` : ''}
    <div class="game-card-thumb" style="background:${game.gradient}">
      <span style="filter:drop-shadow(0 0 20px ${game.color}66);position:relative;z-index:1">${game.icon}</span>
    </div>
    <div class="game-card-body">
      <div class="game-card-name">${game.name}</div>
      <div class="game-card-desc">${game.desc}</div>
      <div class="game-card-footer">
        <div class="game-card-tags">
          <span class="game-tag ${game.category}">${game.category}</span>
        </div>
        <button class="game-play-btn" data-game-id="${game.id}">▶ Main</button>
      </div>
    </div>
  `;
  card.addEventListener('click', e => {
    if (!e.target.classList.contains('game-play-btn')) {
      openGame(game.id);
    }
  });
  card.querySelector('.game-play-btn').addEventListener('click', e => {
    e.stopPropagation();
    openGame(game.id);
  });
  return card;
}

function renderHomeGames() {
  const grid = document.getElementById('home-games-grid');
  if (!grid) return;
  grid.innerHTML = '';
  GAMES.slice(0, 4).forEach(game => grid.appendChild(createGameCard(game)));
}

function renderAllGames(filter = 'all') {
  const grid = document.getElementById('all-games-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const filtered = filter === 'all' ? GAMES : GAMES.filter(g => g.category === filter);
  filtered.forEach(game => grid.appendChild(createGameCard(game)));

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderAllGames(state.activeFilter);
    });
  });
}

function renderNewGames() {
  const list = document.getElementById('new-games-list');
  if (!list) return;
  list.innerHTML = '';
  GAMES.forEach((game, i) => {
    const item = document.createElement('div');
    item.className = 'new-game-item';
    item.innerHTML = `
      <div class="new-game-rank">${String(i+1).padStart(2,'0')}</div>
      <div class="new-game-icon">${game.icon}</div>
      <div class="new-game-info">
        <div class="new-game-name">${game.name}</div>
        <div class="new-game-desc">${game.desc}</div>
      </div>
      <div class="new-game-badge">🔥 Baru</div>
    `;
    item.addEventListener('click', () => openGame(game.id));
    list.appendChild(item);
  });
}

// ===== LEADERBOARD =====
function renderLeaderboard() {
  const tabs = document.getElementById('lb-tabs');
  const content = document.getElementById('lb-content');
  if (!tabs || !content) return;

  // Render tabs
  tabs.innerHTML = '';
  GAMES.forEach(game => {
    const tab = document.createElement('button');
    tab.className = `lb-tab${state.currentLbTab === game.id ? ' active' : ''}`;
    tab.innerHTML = `${game.icon} ${game.name}`;
    tab.addEventListener('click', () => {
      state.currentLbTab = game.id;
      document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLbContent(game.id);
    });
    tabs.appendChild(tab);
  });

  renderLbContent(state.currentLbTab);
}

function renderLbContent(gameId) {
  const content = document.getElementById('lb-content');
  if (!content) return;
  const scores = getScoresForGame(gameId);

  if (scores.length === 0) {
    content.innerHTML = `
      <div class="lb-table">
        <div class="lb-empty">
          <div class="lb-empty-icon">🏆</div>
          <div>Belum ada skor untuk game ini.</div>
          <div style="margin-top:8px;font-size:12px">Mulai bermain untuk masuk leaderboard!</div>
        </div>
      </div>
    `;
    return;
  }

  const rankSymbols = ['🥇','🥈','🥉'];
  let html = `
    <div class="lb-table">
      <div class="lb-row header">
        <div>#</div>
        <div>Pemain</div>
        <div style="text-align:center">Skor</div>
        <div style="text-align:right">Tanggal</div>
      </div>
  `;
  scores.slice(0, 10).forEach((s, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const animDelay = `animation-delay:${i * 0.05}s`;
    html += `
      <div class="lb-row" style="${animDelay}">
        <div class="lb-rank ${rankClass}">${rankSymbols[i] || i+1}</div>
        <div class="lb-player">
          <span class="lb-avatar">${s.avatar || '🎮'}</span>
          <span class="lb-name">${s.username || 'Pemain'}</span>
        </div>
        <div class="lb-score">${s.score.toLocaleString()}</div>
        <div class="lb-date">${s.date || '—'}</div>
      </div>
    `;
  });
  html += '</div>';
  content.innerHTML = html;
}

function getScoresForGame(gameId) {
  return (state.scores[gameId] || []).sort((a, b) => b.score - a.score);
}

function getBestScore(gameId) {
  const scores = getScoresForGame(gameId);
  return scores.length > 0 ? scores[0].score : 0;
}

function addScore(gameId, score) {
  if (!state.scores[gameId]) state.scores[gameId] = [];
  state.scores[gameId].push({
    score,
    username: state.profile.username,
    avatar: state.profile.avatar,
    date: new Date().toLocaleDateString('id-ID')
  });
  // Keep top 50
  state.scores[gameId].sort((a, b) => b.score - a.score);
  if (state.scores[gameId].length > 50) state.scores[gameId] = state.scores[gameId].slice(0, 50);
  state.gamesPlayed++;
  saveState();
  updateStats();
}

// ===== STATS =====
function updateStats() {
  const played = document.getElementById('stat-games-played');
  if (played) played.textContent = state.gamesPlayed.toLocaleString();

  const bestScore = document.getElementById('stat-best-score');
  if (bestScore) {
    let max = 0;
    Object.values(state.scores).forEach(arr => arr.forEach(s => { if (s.score > max) max = s.score; }));
    bestScore.textContent = max.toLocaleString();
  }

  const achievements = document.getElementById('stat-achievements');
  if (achievements) {
    let count = 0;
    if (state.gamesPlayed >= 1) count++;
    if (state.gamesPlayed >= 10) count++;
    if (state.gamesPlayed >= 50) count++;
    Object.values(state.scores).forEach(arr => {
      if (arr.some(s => s.score >= 100)) count++;
      if (arr.some(s => s.score >= 1000)) count++;
    });
    achievements.textContent = count;
  }
}

// ===== PROFILE =====
function setupProfile() {
  renderProfileSetup();
}

function renderProfileSetup() {
  const avatarDisplay = document.getElementById('avatar-display');
  const usernameInput = document.getElementById('username-input');
  const joinDate = document.getElementById('join-date');
  const avatarGrid = document.getElementById('avatar-grid');

  if (avatarDisplay) avatarDisplay.textContent = state.profile.avatar;
  if (usernameInput) usernameInput.value = state.profile.username;
  if (joinDate) joinDate.textContent = state.profile.joinDate;

  if (avatarGrid) {
    avatarGrid.innerHTML = '';
    AVATARS.forEach(a => {
      const el = document.createElement('div');
      el.className = `avatar-option${a === state.profile.avatar ? ' selected' : ''}`;
      el.textContent = a;
      el.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        state.profile.avatar = a;
        avatarDisplay.textContent = a;
        updateTopbarAvatar();
        saveState();
        showToast('Avatar diperbarui! ' + a, 'success');
      });
      avatarGrid.appendChild(el);
    });
  }

  document.getElementById('save-username')?.addEventListener('click', () => {
    const val = document.getElementById('username-input')?.value.trim();
    if (!val) return showToast('Username tidak boleh kosong!', 'error');
    state.profile.username = val;
    saveState();
    showToast('Username disimpan!', 'success');
  });

  updateProfileRank();
  updateTopbarAvatar();
}

function updateProfileRank() {
  const el = document.getElementById('profile-rank');
  if (!el) return;
  const played = state.gamesPlayed;
  if (played >= 100) el.textContent = '💎 Legenda';
  else if (played >= 50) el.textContent = '🥇 Master';
  else if (played >= 20) el.textContent = '🥈 Veteran';
  else if (played >= 5) el.textContent = '🥉 Pemain';
  else el.textContent = '🔰 Pemula';
}

function renderProfileStats() {
  const grid = document.getElementById('game-stats-grid');
  if (!grid) return;
  grid.innerHTML = '';
  GAMES.forEach(game => {
    const scores = getScoresForGame(game.id);
    const best = scores.length ? scores[0].score : 0;
    const played = scores.length;
    const card = document.createElement('div');
    card.className = 'game-stat-card';
    card.innerHTML = `
      <div class="game-stat-header">
        <span class="game-stat-icon">${game.icon}</span>
        <span class="game-stat-name">${game.name}</span>
      </div>
      <div class="game-stat-row"><span class="label">Best Score</span><span class="value">${best.toLocaleString()}</span></div>
      <div class="game-stat-row"><span class="label">Dimainkan</span><span class="value">${played}x</span></div>
    `;
    grid.appendChild(card);
  });
  updateProfileRank();
}

// ===== CHAT =====
const BOT_RESPONSES = {
  'snake': 'Snake adalah game klasik! Gunakan tombol panah untuk bergerak. Makan apel merah untuk menambah panjang tubuhmu. Hindari menabrak dinding dan tubuhmu sendiri! 🐍',
  'tetris': 'Di Tetris, blok jatuh dari atas. Gunakan ← → untuk gerak, ↑ untuk rotasi, ↓ untuk jatuh cepat. Hapus baris penuh untuk dapat poin! 🟦',
  '2048': 'Di 2048, gunakan tombol panah untuk menggeser semua ubin. Ubin dengan angka sama akan bergabung! Targetkan ubin 2048. Tips: selalu taruh ubin terbesar di pojok! 🔢',
  'leaderboard': 'Leaderboard menampilkan skor tertinggi untuk setiap game. Main lebih banyak untuk masuk daftar teratas! 🏆',
  'seru': 'Menurutku semua game seru! Tapi Space Shooter dan Snake paling adiktif karena makin lama makin cepat dan susah! 🎮',
  'flappy': 'Flappy Bird: tekan Space atau klik untuk terbang ke atas. Jangan sentuh pipa! Makin jauh makin susah karena kecepatannya meningkat! 🐦',
  'dino': 'Dino Run: tekan Space atau ↑ untuk melompat. Hindari kaktus dan burung! Semakin lama berlari, semakin cepat dinosaurnya! 🦕',
  'sudoku': 'Sudoku: isi grid 9×9 dengan angka 1-9. Setiap baris, kolom, dan kotak 3×3 harus berisi angka 1-9 tanpa pengulangan! 🧩',
  'tictactoe': 'Tic Tac Toe: kalahkan AI! Buat 3 simbol berurutan secara horizontal, vertikal, atau diagonal. AI menggunakan minimax jadi cukup sulit! ⭕',
  'shooter': 'Space Shooter: gunakan ← → untuk bergerak, Space untuk menembak. Hindari tembakan musuh dan musnahkan semua alien! 🚀',
  'default': 'Hmm, aku belum tahu tentang itu! Tapi aku bisa membantu dengan tips game, cara bermain, atau info leaderboard. Coba tanya tentang game tertentu! 😊'
};

function getBotResponse(msg) {
  const lower = msg.toLowerCase();
  for (const [key, response] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  if (lower.includes('halo') || lower.includes('hi') || lower.includes('hey')) {
    return `Halo ${state.profile.username}! 👋 Senang ketemu kamu! Ada yang bisa aku bantu tentang game?`;
  }
  if (lower.includes('tips') || lower.includes('cara')) {
    return 'Butuh tips? Tanyakan game spesifik! Misalnya: "Tips Snake?" atau "Cara main Tetris?" 💡';
  }
  if (lower.includes('skor') || lower.includes('score')) {
    const best = getBestScore(state.currentGame || 'snake');
    return `Skor terbaikmu adalah ${best.toLocaleString()}! Terus berlatih untuk meningkatkannya! 🎯`;
  }
  return BOT_RESPONSES.default;
}

function setupChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  function sendMessage(msg) {
    if (!msg.trim()) return;
    // User bubble
    addChatMessage(msg, 'user');
    input.value = '';
    // Typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg bot msg-typing';
    typingEl.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(typingEl);
    scrollChat();
    // Bot response after delay
    setTimeout(() => {
      typingEl.remove();
      addChatMessage(getBotResponse(msg), 'bot');
    }, 1000 + Math.random() * 800);
  }

  function addChatMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerHTML = `
      ${type === 'bot' ? '<div class="msg-avatar">🤖</div>' : `<div class="msg-avatar">${state.profile.avatar}</div>`}
      <div class="msg-bubble">${text}</div>
    `;
    messages.appendChild(div);
    scrollChat();
  }

  function scrollChat() {
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  sendBtn?.addEventListener('click', () => sendMessage(input.value));
  input?.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(input.value); });

  // Quick replies
  document.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
  });
}

// ===== SETTINGS =====
function setupSettings() {
  document.getElementById('dark-toggle')?.addEventListener('change', e => {
    state.settings.darkMode = e.target.checked;
    document.documentElement.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
    updateThemeToggle();
    saveState();
  });

  document.getElementById('sound-toggle')?.addEventListener('change', e => {
    state.settings.sound = e.target.checked;
    saveState();
  });

  document.getElementById('fps-toggle')?.addEventListener('change', e => {
    state.settings.fps = e.target.checked;
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) fpsCounter.style.display = state.settings.fps ? 'block' : 'none';
    saveState();
  });

  document.getElementById('particles-toggle')?.addEventListener('change', e => {
    state.settings.particles = e.target.checked;
    const canvas = document.getElementById('particles-canvas');
    if (canvas) canvas.style.display = state.settings.particles ? 'block' : 'none';
    saveState();
  });

  document.getElementById('difficulty-select')?.addEventListener('change', e => {
    state.settings.difficulty = e.target.value;
    saveState();
  });

  document.getElementById('reset-data-btn')?.addEventListener('click', () => {
    showConfirm('Reset Semua Data', 'Semua skor, profil, dan pengaturan akan dihapus permanen. Lanjutkan?', () => {
      localStorage.removeItem('gamehub_state');
      location.reload();
    });
  });
}

// ===== GAME MODAL =====
let currentGameInstance = null;

function setupGameModal() {
  document.getElementById('game-close-btn')?.addEventListener('click', closeGame);
  document.getElementById('game-modal-overlay')?.addEventListener('click', closeGame);
  document.getElementById('game-restart-btn')?.addEventListener('click', restartGame);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('game-modal').classList.contains('active')) {
      closeGame();
    }
  });
}

function openGame(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;

  state.currentGame = gameId;
  document.getElementById('game-modal-icon').textContent = game.icon;
  document.getElementById('game-modal-name').textContent = game.name;
  document.getElementById('modal-score').textContent = '0';

  const modal = document.getElementById('game-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Launch game
  launchGame(gameId);
}

function closeGame() {
  const modal = document.getElementById('game-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';

  // Stop current game
  if (currentGameInstance && currentGameInstance.destroy) {
    currentGameInstance.destroy();
  }
  currentGameInstance = null;
  document.getElementById('game-area').innerHTML = '';
  document.getElementById('game-instructions').textContent = '';
}

function restartGame() {
  if (state.currentGame) {
    const gameId = state.currentGame;
    if (currentGameInstance && currentGameInstance.destroy) {
      currentGameInstance.destroy();
    }
    currentGameInstance = null;
    document.getElementById('game-area').innerHTML = '';
    launchGame(gameId);
  }
}

function launchGame(gameId) {
  const launchers = {
    snake: () => window.SnakeGame?.launch(),
    tetris: () => window.TetrisGame?.launch(),
    '2048': () => window.Game2048?.launch(),
    sudoku: () => window.SudokuGame?.launch(),
    tictactoe: () => window.TicTacToeGame?.launch(),
    shooter: () => window.ShooterGame?.launch(),
    flappy: () => window.FlappyGame?.launch(),
    dino: () => window.DinoGame?.launch(),
    chess: () => window.ChessGame?.launch(),
    ludo: () => window.LudoGame?.launch(),
  };
  const launcher = launchers[gameId];
  if (launcher) {
    currentGameInstance = launcher() || {};
  }
}

// ===== SCORE UPDATE (called by games) =====
window.updateScore = function(score) {
  document.getElementById('modal-score').textContent = score.toLocaleString();
};

window.gameOver = function(score) {
  if (state.currentGame) {
    addScore(state.currentGame, score);
    if (state.currentPage === 'leaderboard') renderLeaderboard();
    if (state.currentPage === 'home') renderHomeGames();
  }
  showToast(`Game selesai! Skor: ${score.toLocaleString()} 🎯`, 'info');
};

window.getGameSettings = function() { return state.settings; };

// ===== PARTICLES =====
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? `rgba(124,58,237,${p.opacity})` : `rgba(124,58,237,${p.opacity * 0.5})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    animId = requestAnimationFrame(draw);
  }
  draw();
}

// ===== FPS COUNTER =====
function initFpsCounter() {
  const el = document.createElement('div');
  el.id = 'fps-counter';
  el.textContent = '60 FPS';
  document.body.appendChild(el);

  let lastTime = performance.now();
  let frames = 0;
  function tick() {
    frames++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      el.textContent = frames + ' FPS';
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  el.style.display = state.settings.fps ? 'block' : 'none';
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = `toast ${type}`; }, 3000);
}

// ===== CONFIRM MODAL =====
function showConfirm(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  const modal = document.getElementById('confirm-modal');
  modal.classList.add('active');

  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  function cleanup() { modal.classList.remove('active'); okBtn.onclick = null; cancelBtn.onclick = null; }
  okBtn.onclick = () => { cleanup(); onConfirm(); };
  cancelBtn.onclick = cleanup;
}

// Expose helpers to games
window.showToast = showToast;
window.GameRegistry = { GAMES, getBestScore, addScore };
