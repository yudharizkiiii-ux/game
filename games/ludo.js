// ===== LUDO 3D MULTIPLAYER (ONLINE & OFFLINE) =====

window.LudoGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '🎮 Ludo 3D Multiplayer | Geser mouse untuk memutar kamera 3D, scroll untuk zoom.';

    // Load CDNs dynamically
    const scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
      'https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.2.8/mqtt.min.js',
      'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
    ];

    let initialized = false;

    Promise.all(scripts.map(url => loadScript(url)))
      .then(() => {
        initGameUI();
      })
      .catch(err => {
        console.error('Failed to load libraries:', err);
        area.innerHTML = '<div style="color:red; text-align:center; padding:20px;">Gagal memuat pustaka Ludo 3D. Harap periksa koneksi internet Anda.</div>';
      });

    function loadScript(url) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Modern Styling for Lobby & Game controls
    const style = document.createElement('style');
    style.textContent = `
      .ludo-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 550px;
        position: relative;
        font-family: 'Outfit', sans-serif;
        color: #f0f0ff;
      }
      .ludo-lobby {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        padding: 30px;
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      }
      .lobby-title {
        font-family: 'Orbitron', monospace;
        font-size: 24px;
        font-weight: 800;
        text-align: center;
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .lobby-tabs {
        display: flex;
        width: 100%;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        padding: 4px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .lobby-tab {
        flex: 1;
        padding: 10px;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-weight: 600;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.3s;
      }
      .lobby-tab.active {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }
      .lobby-pane {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 16px;
      }
      .lobby-pane.active {
        display: flex;
      }
      .player-config-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .player-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
      }
      .color-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor;
      }
      .color-dot.red { color: #ef4444; background: #ef4444; }
      .color-dot.green { color: #10b981; background: #10b981; }
      .color-dot.yellow { color: #eab308; background: #eab308; }
      .color-dot.blue { color: #3b82f6; background: #3b82f6; }
      
      .player-select {
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 6px 12px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        cursor: pointer;
      }
      .ludo-input {
        width: 100%;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px;
        border-radius: 10px;
        color: white;
        font-family: inherit;
      }
      .ludo-input:focus {
        border-color: #38bdf8;
        outline: none;
      }
      .online-btn-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .ludo-room-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 16px;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .room-code-display {
        font-family: 'Orbitron', monospace;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 2px;
        color: #38bdf8;
      }
      
      /* Game View Layout */
      .ludo-game-screen {
        display: none;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
        position: relative;
      }
      .ludo-game-screen.active {
        display: flex;
      }
      .ludo-3d-wrapper {
        width: 100%;
        height: 500px;
        position: relative;
        background: #0f172a;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .ludo-ui-overlay {
        position: absolute;
        top: 16px;
        left: 16px;
        right: 16px;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        z-index: 100;
      }
      .ui-card {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 18px;
        border-radius: 12px;
        pointer-events: auto;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      }
      .status-box {
        font-family: 'Orbitron', monospace;
        font-weight: 700;
        font-size: 14px;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .control-box {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dice-btn-3d {
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        border: none;
        color: white;
        font-weight: 700;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-family: 'Orbitron', monospace;
        transition: all 0.2s;
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
      }
      .dice-btn-3d:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
      }
      .dice-btn-3d:disabled {
        background: #334155;
        color: #64748b;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }
      .player-turn-indicator {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        background: rgba(15, 23, 42, 0.85);
        padding: 8px 16px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 100;
      }
      .turn-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        transition: transform 0.3s, box-shadow 0.3s;
      }
      .turn-dot.active {
        transform: scale(1.3);
        box-shadow: 0 0 10px currentColor;
      }
      
      /* Chat bubble in Room */
      .online-lobby-chat {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 150px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.05);
        overflow: hidden;
      }
      .chat-messages-box {
        flex: 1;
        padding: 8px;
        overflow-y: auto;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .chat-msg-row {
        background: rgba(255,255,255,0.02);
        padding: 4px 8px;
        border-radius: 6px;
      }
      .chat-sender {
        font-weight: 700;
        color: #38bdf8;
      }
      .color-selector-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        width: 100%;
      }
      .color-btn {
        padding: 10px;
        border: 2px solid transparent;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
        text-transform: capitalize;
        color: white;
      }
      .color-btn.red { background-color: rgba(239, 68, 68, 0.3); border-color: #ef4444; }
      .color-btn.green { background-color: rgba(16, 185, 129, 0.3); border-color: #10b981; }
      .color-btn.yellow { background-color: rgba(234, 179, 8, 0.3); border-color: #eab308; }
      .color-btn.blue { background-color: rgba(59, 130, 246, 0.3); border-color: #3b82f6; }
      .color-btn.selected {
        transform: scale(1.05);
        box-shadow: 0 0 15px currentColor;
      }
      .color-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        border-color: transparent;
      }
    `;
    document.head.appendChild(style);

    // Initial HTML wrapper structure
    area.innerHTML = `
      <div class="ludo-container">
        <!-- LOBBY SCREEN -->
        <div class="ludo-lobby" id="ludo-lobby-screen">
          <div class="lobby-title">🚀 LUDO MULTIPLAYER 3D</div>
          
          <div class="lobby-tabs">
            <button class="lobby-tab active" id="tab-offline">OFFLINE (LOCAL / AI)</button>
            <button class="lobby-tab" id="tab-online">ONLINE MULTIPLAYER</button>
          </div>

          <!-- OFFLINE PANEL -->
          <div class="lobby-pane active" id="pane-offline">
            <div style="font-size:14px; color:#94a3b8; text-align:center;">Atur pemain lokal atau bot AI:</div>
            
            <div class="player-config-row">
              <div class="player-badge"><span class="color-dot red"></span> Merah (Red)</div>
              <select class="player-select" id="cfg-p0">
                <option value="human">Pemain Lokal</option>
                <option value="bot">AI (Bot)</option>
              </select>
            </div>

            <div class="player-config-row">
              <div class="player-badge"><span class="color-dot green"></span> Hijau (Green)</div>
              <select class="player-select" id="cfg-p1">
                <option value="bot">AI (Bot)</option>
                <option value="human">Pemain Lokal</option>
                <option value="none">Nonaktif (Kosong)</option>
              </select>
            </div>

            <div class="player-config-row">
              <div class="player-badge"><span class="color-dot yellow"></span> Kuning (Yellow)</div>
              <select class="player-select" id="cfg-p2">
                <option value="bot">AI (Bot)</option>
                <option value="human">Pemain Lokal</option>
                <option value="none">Nonaktif (Kosong)</option>
              </select>
            </div>

            <div class="player-config-row">
              <div class="player-badge"><span class="color-dot blue"></span> Biru (Blue)</div>
              <select class="player-select" id="cfg-p3">
                <option value="bot">AI (Bot)</option>
                <option value="human">Pemain Lokal</option>
                <option value="none">Nonaktif (Kosong)</option>
              </select>
            </div>

            <button class="btn-primary" id="btn-start-offline" style="width:100%; margin-top:10px;">🎮 Mulai Permainan</button>
          </div>

          <!-- ONLINE PANEL -->
          <div class="lobby-pane" id="pane-online">
            <input type="text" class="ludo-input" id="online-name" placeholder="Masukkan Username..." />
            
            <div class="online-btn-grid" id="online-action-grid">
              <button class="btn-primary" id="btn-create-room">Buat Room</button>
              <button class="btn-secondary" id="btn-join-room-prompt">Gabung Room</button>
            </div>

            <div id="join-code-entry" style="display:none; flex-direction:column; gap:10px;">
              <input type="text" class="ludo-input" id="join-room-code" placeholder="Kode Room (LUDO-XXXX)..." />
              <div class="online-btn-grid">
                <button class="btn-primary" id="btn-submit-join">Gabung</button>
                <button class="btn-secondary" id="btn-back-online">Kembali</button>
              </div>
            </div>

            <!-- ONLINE ROOM LOBBY (shown once in room) -->
            <div id="online-room-lobby" style="display:none; width:100%; flex-direction:column; gap:14px;">
              <div class="ludo-room-box">
                <div style="font-size:12px; color:#94a3b8;">KODE ROOM UNTUK TEMAN:</div>
                <div class="room-code-display" id="room-code-val">LUDO-XXXX</div>
              </div>

              <div style="font-size:14px; font-weight:600; text-align:center;">Pilih Warna Pion Anda:</div>
              <div class="color-selector-grid">
                <button class="color-btn red" data-color="0">Merah</button>
                <button class="color-btn green" data-color="1">Hijau</button>
                <button class="color-btn yellow" data-color="2">Kuning</button>
                <button class="color-btn blue" data-color="3">Biru</button>
              </div>

              <div style="font-size:13px; color:#94a3b8;">Pemain Terhubung:</div>
              <div id="online-player-list" style="display:flex; flex-direction:column; gap:6px;"></div>

              <div class="online-lobby-chat">
                <div class="chat-messages-box" id="lobby-chat-messages"></div>
                <div style="display:flex;">
                  <input type="text" class="ludo-input" id="lobby-chat-input" placeholder="Tulis pesan..." style="border-radius:0; border:none; padding:8px 12px; flex:1; font-size:12px;" />
                  <button class="btn-primary" id="btn-send-chat" style="border-radius:0; padding:8px 14px; font-size:12px;">Kirim</button>
                </div>
              </div>

              <button class="btn-primary" id="btn-start-online" style="width:100%;" disabled>Mulai Game (Host Only)</button>
              <button class="btn-secondary" id="btn-leave-room" style="width:100%;">Tinggalkan Room</button>
            </div>
          </div>
        </div>

        <!-- GAME PLAY SCREEN -->
        <div class="ludo-game-screen" id="ludo-game-screen">
          <div class="ludo-ui-overlay">
            <div class="ui-card status-box">
              <span id="game-status-text">Menyiapkan papan 3D...</span>
            </div>
            <div class="ui-card control-box">
              <button class="dice-btn-3d" id="btn-roll-dice">KOCOK DADU 🎲</button>
              <button class="btn-secondary" id="btn-exit-game" style="padding: 10px 14px;">Keluar</button>
            </div>
          </div>

          <div class="player-turn-indicator">
            <span class="turn-dot" style="color:#ef4444; background:#ef4444;" id="dot-0" title="Merah"></span>
            <span class="turn-dot" style="color:#10b981; background:#10b981;" id="dot-1" title="Hijau"></span>
            <span class="turn-dot" style="color:#eab308; background:#eab308;" id="dot-2" title="Kuning"></span>
            <span class="turn-dot" style="color:#3b82f6; background:#3b82f6;" id="dot-3" title="Biru"></span>
          </div>

          <!-- 3D RENDER CANVAS WRAPPER -->
          <div class="ludo-3d-wrapper" id="ludo-canvas-wrap"></div>
        </div>
      </div>
    `;

    // State Variables
    let mode = 'offline'; // 'offline' or 'online'
    let isHost = false;
    let roomCode = '';
    let mqttClient = null;
    let localPlayerName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    
    // Players structure
    // colors: 0=Red, 1=Green, 2=Yellow, 3=Blue
    let players = [
      { id: 0, name: 'Merah', type: 'human', clientId: null },
      { id: 1, name: 'Hijau', type: 'bot', clientId: null },
      { id: 2, name: 'Kuning', type: 'bot', clientId: null },
      { id: 3, name: 'Biru', type: 'bot', clientId: null }
    ];

    let currentTurn = 0; // index of active player
    let diceValue = 0;
    let hasRolled = false;
    let myColorIndex = -1; // For online mode, which color color index did this client select

    // Ludo grid logic mapping
    // Common outer path of 52 squares
    const commonPath = [
      {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
      {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
      {r: 0, c: 7},
      {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
      {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
      {r: 7, c: 14},
      {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
      {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
      {r: 14, c: 7},
      {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
      {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
      {r: 7, c: 0},
      {r: 6, c: 0}
    ];

    // Starting indices on common track for each color
    const startIndices = [0, 13, 26, 39];

    // Home paths for each color (length 6 plus 7th which is finish center (7,7))
    const homePaths = [
      // Red Red-home
      [{r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}, {r: 7, c: 6}, {r: 7, c: 7}],
      // Green Green-home
      [{r: 1, c: 7}, {r: 2, c: 7}, {r: 3, c: 7}, {r: 4, c: 7}, {r: 5, c: 7}, {r: 6, c: 7}, {r: 7, c: 7}],
      // Yellow Yellow-home
      [{r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9}, {r: 7, c: 8}, {r: 7, c: 7}],
      // Blue Blue-home
      [{r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7}, {r: 9, c: 7}, {r: 8, c: 7}, {r: 7, c: 7}]
    ];

    // Home base/yard positions for 4 tokens per player
    const yards = [
      // Red (bottom-left)
      [{r: 2, c: 2}, {r: 2, c: 3}, {r: 3, c: 2}, {r: 3, c: 3}],
      // Green (top-left)
      [{r: 2, c: 11}, {r: 2, c: 12}, {r: 3, c: 11}, {r: 3, c: 12}],
      // Yellow (top-right)
      [{r: 11, c: 11}, {r: 11, c: 12}, {r: 12, c: 11}, {r: 12, c: 12}],
      // Blue (bottom-right)
      [{r: 11, c: 2}, {r: 11, c: 3}, {r: 12, c: 2}, {r: 12, c: 3}]
    ];

    // Game state: tokens locations
    // pos = -1 (in yard), 0 to 50 (on common path), 51 to 57 (on home path where 57 is finished)
    let tokens = [
      // Red (p0)
      [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
      // Green (p1)
      [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
      // Yellow (p2)
      [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
      // Blue (p3)
      [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}]
    ];

    // THREE.JS variables
    let scene, camera, renderer, controls;
    let board3DGroup, pawns3D = [[], [], [], []], dice3D;
    let boardSquares3D = {}; // Key: "r,c" -> Mesh
    let highlightRings = [];

    // Sound Synthesizer
    function playBeep(freq, duration) {
      if (!window.getGameSettings?.().sound) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }

    // Tab switcher
    document.getElementById('tab-offline').addEventListener('click', () => {
      document.getElementById('tab-offline').classList.add('active');
      document.getElementById('tab-online').classList.remove('active');
      document.getElementById('pane-offline').classList.add('active');
      document.getElementById('pane-offline').style.display = 'flex';
      document.getElementById('pane-online').classList.remove('active');
      document.getElementById('pane-online').style.display = 'none';
      mode = 'offline';
    });

    document.getElementById('tab-online').addEventListener('click', () => {
      document.getElementById('tab-online').classList.add('active');
      document.getElementById('tab-offline').classList.remove('active');
      document.getElementById('pane-online').classList.add('active');
      document.getElementById('pane-online').style.display = 'flex';
      document.getElementById('pane-offline').classList.remove('active');
      document.getElementById('pane-offline').style.display = 'none';
      mode = 'online';
      
      const savedUser = localStorage.getItem('gamehub_state');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.profile && parsed.profile.username) {
            document.getElementById('online-name').value = parsed.profile.username;
          }
        } catch(e) {}
      }
    });

    // Offline game setup & launch
    document.getElementById('btn-start-offline').addEventListener('click', () => {
      // Configure players
      players[0] = { id: 0, name: 'Merah (Lokal)', type: document.getElementById('cfg-p0').value, clientId: null };
      players[1] = { id: 1, name: 'Hijau', type: document.getElementById('cfg-p1').value, clientId: null };
      players[2] = { id: 2, name: 'Kuning', type: document.getElementById('cfg-p2').value, clientId: null };
      players[3] = { id: 3, name: 'Biru', type: document.getElementById('cfg-p3').value, clientId: null };

      // Ensure at least 2 players are active
      const activeCount = players.filter(p => p.type !== 'none').length;
      if (activeCount < 2) {
        window.showToast('Butuh minimal 2 pemain aktif!', 'error');
        return;
      }

      startLudo3D();
    });

    // Online game setup & connection (using MQTT pub/sub as real-time messaging)
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinPrompt = document.getElementById('btn-join-room-prompt');
    const btnSubmitJoin = document.getElementById('btn-submit-join');
    const btnBackOnline = document.getElementById('btn-back-online');
    const joinCodeEntry = document.getElementById('join-code-entry');
    const onlineActionGrid = document.getElementById('online-action-grid');
    const onlineLobby = document.getElementById('online-room-lobby');
    const startOnlineBtn = document.getElementById('btn-start-online');

    btnJoinPrompt.addEventListener('click', () => {
      onlineActionGrid.style.display = 'none';
      joinCodeEntry.style.display = 'flex';
    });

    btnBackOnline.addEventListener('click', () => {
      onlineActionGrid.style.display = 'grid';
      joinCodeEntry.style.display = 'none';
    });

    btnCreateRoom.addEventListener('click', () => {
      const nameVal = document.getElementById('online-name').value.trim();
      if (!nameVal) {
        window.showToast('Masukkan username terlebih dahulu!', 'error');
        return;
      }
      localPlayerName = nameVal;
      isHost = true;
      roomCode = 'LUDO-' + Math.floor(1000 + Math.random() * 9000);
      connectMQTT();
    });

    btnSubmitJoin.addEventListener('click', () => {
      const nameVal = document.getElementById('online-name').value.trim();
      const codeVal = document.getElementById('join-room-code').value.trim().toUpperCase();
      if (!nameVal) {
        window.showToast('Masukkan username terlebih dahulu!', 'error');
        return;
      }
      if (!codeVal) {
        window.showToast('Masukkan kode room!', 'error');
        return;
      }
      localPlayerName = nameVal;
      isHost = false;
      roomCode = codeVal;
      connectMQTT();
    });

    document.getElementById('btn-leave-room').addEventListener('click', leaveLobby);
    document.getElementById('btn-exit-game').addEventListener('click', leaveLobby);

    // Color buttons for Online lobby
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const colorIdx = parseInt(btn.dataset.color);
        mqttPublish('select_color', { name: localPlayerName, color: colorIdx });
      });
    });

    // Room chat
    document.getElementById('btn-send-chat').addEventListener('click', sendRoomChat);
    document.getElementById('lobby-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendRoomChat();
    });

    function sendRoomChat() {
      const input = document.getElementById('lobby-chat-input');
      const text = input.value.trim();
      if (!text) return;
      mqttPublish('chat', { sender: localPlayerName, text: text });
      input.value = '';
    }

    function addChatBubble(sender, text) {
      const box = document.getElementById('lobby-chat-messages');
      const div = document.createElement('div');
      div.className = 'chat-msg-row';
      div.innerHTML = `<span class="chat-sender">${sender}:</span> <span>${text}</span>`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }

    // MQTT Room Connection Helper
    function connectMQTT() {
      // Connect to HiveMQ Public broker via WebSocket (completely free and client-side safe)
      const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
      window.showToast('Menghubungkan ke server multiplayer...', 'info');

      mqttClient = mqtt.connect(brokerUrl);

      mqttClient.on('connect', () => {
        window.showToast('Terhubung ke lobi online!', 'success');
        
        // Hide standard configuration panels
        document.getElementById('tab-offline').style.display = 'none';
        document.getElementById('tab-online').style.display = 'none';
        onlineActionGrid.style.display = 'none';
        joinCodeEntry.style.display = 'none';
        document.getElementById('online-name').disabled = true;

        // Show Room screen
        onlineLobby.style.display = 'flex';
        document.getElementById('room-code-val').textContent = roomCode;

        // Subscribe to Room channels
        mqttClient.subscribe(`gamehub/ludo/room/${roomCode}`);

        // Broadcast presence
        mqttPublish('join', { name: localPlayerName });
      });

      mqttClient.on('message', (topic, message) => {
        let payload;
        try {
          payload = JSON.parse(message.toString());
        } catch (e) { return; }

        handleOnlineMessage(payload);
      });

      mqttClient.on('error', (err) => {
        window.showToast('Koneksi terputus/gagal.', 'error');
        leaveLobby();
      });
    }

    function mqttPublish(action, data) {
      if (mqttClient && mqttClient.connected) {
        const msg = JSON.stringify({ action: action, senderId: localPlayerName, ...data });
        mqttClient.publish(`gamehub/ludo/room/${roomCode}`, msg);
      }
    }

    let lobbyPlayers = [];

    function handleOnlineMessage(data) {
      if (data.action === 'join') {
        // Send our state back if we are host
        if (isHost) {
          // Send current list of players and selected colors
          mqttPublish('sync_lobby', { players: lobbyPlayers });
        }
        addChatBubble('System', `${data.name} bergabung ke lobi.`);
      }
      else if (data.action === 'sync_lobby') {
        if (!isHost) {
          lobbyPlayers = data.players;
          updateLobbyUI();
        }
      }
      else if (data.action === 'chat') {
        addChatBubble(data.sender, data.text);
      }
      else if (data.action === 'select_color') {
        // Remove player from existing color
        lobbyPlayers = lobbyPlayers.filter(p => p.name !== data.name);
        
        // Check if color is occupied
        const taken = lobbyPlayers.some(p => p.color === data.color);
        if (!taken) {
          lobbyPlayers.push({ name: data.name, color: data.color, id: data.senderId });
          if (data.senderId === localPlayerName) {
            myColorIndex = data.color;
          }
        }
        
        updateLobbyUI();
        if (isHost) {
          mqttPublish('sync_lobby', { players: lobbyPlayers });
        }
      }
      else if (data.action === 'start_game') {
        // Prepare players array
        players = [
          { id: 0, name: 'Merah (Kosong)', type: 'none' },
          { id: 1, name: 'Hijau (Kosong)', type: 'none' },
          { id: 2, name: 'Kuning (Kosong)', type: 'none' },
          { id: 3, name: 'Biru (Kosong)', type: 'none' }
        ];

        // Map colors chosen by online players
        data.lobbyPlayers.forEach(p => {
          players[p.color] = {
            id: p.color,
            name: p.name,
            type: p.id === localPlayerName ? 'human' : 'online',
            clientId: p.id
          };
        });

        // Set remaining slots to Bot if configured by host
        for (let i = 0; i < 4; i++) {
          if (players[i].type === 'none') {
            players[i] = { id: i, name: `Bot ${getLudoColorName(i)}`, type: 'bot' };
          }
        }

        startLudo3D();
      }
      else if (data.action === 'roll_dice') {
        if (players[data.turn].type === 'online') {
          // Play roll animation and set value
          runDiceRollAnimation(data.value, () => {
            diceValue = data.value;
            hasRolled = true;
            processTurnAfterRoll();
          });
        }
      }
      else if (data.action === 'move_pawn') {
        if (players[data.playerIdx].type === 'online') {
          moveToken(data.playerIdx, data.tokenIdx, data.diceVal);
        }
      }
    }

    function getLudoColorName(idx) {
      return ['Merah', 'Hijau', 'Kuning', 'Biru'][idx];
    }

    function updateLobbyUI() {
      // Reset color buttons selection state
      document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
      });

      // Populate players list
      const listEl = document.getElementById('online-player-list');
      listEl.innerHTML = '';

      lobbyPlayers.forEach(p => {
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.borderRadius = '8px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        
        const colorName = getLudoColorName(p.color);
        item.innerHTML = `
          <span>👤 <strong>${p.name}</strong></span>
          <span style="font-size:12px; font-weight:700; color: ${getHexColor(p.color)}">${colorName}</span>
        `;
        listEl.appendChild(item);

        // Disable selected color buttons
        const colorBtn = document.querySelector(`.color-btn[data-color="${p.color}"]`);
        if (colorBtn) {
          colorBtn.disabled = true;
          if (p.id === localPlayerName) {
            colorBtn.classList.add('selected');
            colorBtn.disabled = false; // keep it active for the user
          }
        }
      });

      // If we are host, allow start button once at least 2 players connected
      if (isHost) {
        startOnlineBtn.disabled = lobbyPlayers.length < 1; // Need at least self + 1 online player or bot option
      }
    }

    // Host starts online game
    startOnlineBtn.addEventListener('click', () => {
      if (lobbyPlayers.length === 0) return;
      mqttPublish('start_game', { lobbyPlayers: lobbyPlayers });
    });

    function leaveLobby() {
      if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
      }
      location.reload();
    }

    // Initial setting of offline config select change to make sure at least one player is local
    function initGameUI() {
      initialized = true;
    }

    function getHexColor(colorIndex) {
      return ['#ef4444', '#10b981', '#eab308', '#3b82f6'][colorIndex];
    }

    // ==========================================
    // THREE.JS 3D ENGINE & SCENE GENERATION
    // ==========================================

    function startLudo3D() {
      // Transition from Lobby to Game Screen
      document.getElementById('ludo-lobby-screen').style.display = 'none';
      document.getElementById('ludo-game-screen').classList.add('active');

      const wrap = document.getElementById('ludo-canvas-wrap');
      
      // Initialize Three.js Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#090d16');
      scene.fog = new THREE.FogExp2('#090d16', 0.035);

      // Camera
      camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
      camera.position.set(0, 15, 12);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      wrap.appendChild(renderer.domElement);

      // OrbitControls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.1; // Don't let users go under the board
      controls.minDistance = 5;
      controls.maxDistance = 25;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 18, 5);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.bias = -0.001;
      scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x818cf8, 1, 15);
      pointLight.position.set(0, 3, 0);
      scene.add(pointLight);

      // Build 3D Ludo board
      build3DBoard();

      // Spawn 3D Pawns
      spawnAllPawns3D();

      // Spawn 3D Dice
      spawnDice3D();

      // Listeners
      window.addEventListener('resize', onWindowResize);
      renderer.domElement.addEventListener('click', onBoardClick);

      // Start Game Play Loops
      currentTurn = 0; // Merah starts
      diceValue = 0;
      hasRolled = false;
      
      // Select first active player
      findNextActiveTurn(true);

      // Render Loop
      animate();
    }

    function onWindowResize() {
      const wrap = document.getElementById('ludo-canvas-wrap');
      if (!wrap) return;
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    }

    function build3DBoard() {
      board3DGroup = new THREE.Group();
      scene.add(board3DGroup);

      // Base plate
      const baseGeo = new THREE.BoxGeometry(15.2, 0.4, 15.2);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.8,
        metalness: 0.2
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.2;
      baseMesh.receiveShadow = true;
      board3DGroup.add(baseMesh);

      // Draw squares on board (15x15)
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          let isYard = false;
          let yardIndex = -1;
          let tileColor = 0xf8fafc; // white path default

          // Color classification
          if (r < 6 && c < 6) { isYard = true; yardIndex = 0; tileColor = 0xef4444; }
          else if (r < 6 && c >= 9) { isYard = true; yardIndex = 1; tileColor = 0x10b981; }
          else if (r >= 9 && c >= 9) { isYard = true; yardIndex = 2; tileColor = 0xeab308; }
          else if (r >= 9 && c < 6) { isYard = true; yardIndex = 3; tileColor = 0x3b82f6; }
          
          // Home paths
          else if (r === 7 && c >= 1 && c <= 6) { tileColor = 0xef4444; } // Red home path
          else if (c === 7 && r >= 1 && r <= 6) { tileColor = 0x10b981; } // Green home path
          else if (r === 7 && c >= 9 && c <= 13) { tileColor = 0xeab308; } // Yellow home path
          else if (c === 7 && r >= 9 && r <= 13) { tileColor = 0x3b82f6; } // Blue home path

          // Special Start Squares
          else if (r === 6 && c === 1) { tileColor = 0xfca5a5; } // Red Start
          else if (r === 1 && c === 8) { tileColor = 0x86efac; } // Green Start
          else if (r === 8 && c === 13) { tileColor = 0xfde047; } // Yellow Start
          else if (r === 13 && c === 6) { tileColor = 0x93c5fd; } // Blue Start
          
          // Center Goal
          else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
            tileColor = 0x818cf8; // center
          }

          // Build the 3D tile
          const w = 0.94;
          const tileGeo = new THREE.BoxGeometry(w, isYard ? 0.2 : 0.1, w);
          const tileMat = new THREE.MeshStandardMaterial({
            color: tileColor,
            roughness: 0.4,
            metalness: 0.1
          });
          const tileMesh = new THREE.Mesh(tileGeo, tileMat);
          
          // Map index: center around (0,0,0)
          // Row 0 to 14 -> Z pos from -7 to 7
          // Col 0 to 14 -> X pos from -7 to 7
          tileMesh.position.set(c - 7, isYard ? 0.1 : 0.05, r - 7);
          tileMesh.receiveShadow = true;
          board3DGroup.add(tileMesh);

          // Save square coordinates
          boardSquares3D[`${r},${c}`] = tileMesh;
        }
      }
    }

    function spawnAllPawns3D() {
      // Clear if exist
      pawns3D.forEach(arr => arr.forEach(m => scene.remove(m)));
      pawns3D = [[], [], [], []];

      for (let pIdx = 0; pIdx < 4; pIdx++) {
        const hexColor = getHexColor(pIdx);
        for (let tIdx = 0; tIdx < 4; tIdx++) {
          // Pawn shape: classic cone with sphere on top
          const pawnGroup = new THREE.Group();

          // Bottom base
          const baseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.15, 16);
          const baseMat = new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.3, metalness: 0.2 });
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.y = 0.075;
          base.castShadow = true;
          pawnGroup.add(base);

          // Body cone
          const bodyGeo = new THREE.ConeGeometry(0.22, 0.6, 16);
          const body = new THREE.Mesh(bodyGeo, baseMat);
          body.position.y = 0.4;
          body.castShadow = true;
          pawnGroup.add(body);

          // Top sphere
          const sphereGeo = new THREE.SphereGeometry(0.16, 16, 16);
          const sphere = new THREE.Mesh(sphereGeo, baseMat);
          sphere.position.y = 0.75;
          sphere.castShadow = true;
          pawnGroup.add(sphere);

          // Store reference
          pawnGroup.userData = { playerIdx: pIdx, tokenIdx: tIdx };
          scene.add(pawnGroup);
          pawns3D[pIdx].push(pawnGroup);
        }
      }
      
      updatePawnsPositions3D();
    }

    function updatePawnsPositions3D() {
      const posOccupiedCount = {};

      for (let pIdx = 0; pIdx < 4; pIdx++) {
        for (let tIdx = 0; tIdx < 4; tIdx++) {
          const tok = tokens[pIdx][tIdx];
          const mesh = pawns3D[pIdx][tIdx];
          let coord;

          if (tok.pos === -1) {
            // yard base
            coord = yards[pIdx][tIdx];
          } else if (tok.pos >= 51) {
            // home track
            const homeIdx = tok.pos - 51;
            coord = homePaths[pIdx][homeIdx];
          } else {
            // common track
            const actualIdx = (startIndices[pIdx] + tok.pos) % 52;
            coord = commonPath[actualIdx];
          }

          // Count players in same slot to stack them nicely if needed
          const key = `${coord.r},${coord.c}`;
          if (!posOccupiedCount[key]) posOccupiedCount[key] = [];
          posOccupiedCount[key].push(mesh);
        }
      }

      // Position pawns with small offsets if overlapping
      Object.keys(posOccupiedCount).forEach(key => {
        const list = posOccupiedCount[key];
        const [r, c] = key.split(',').map(Number);
        const count = list.length;
        
        list.forEach((mesh, idx) => {
          let offsetX = 0;
          let offsetZ = 0;
          
          if (count > 1) {
            // Arranged in small circle or grid offset
            const angle = (idx / count) * Math.PI * 2;
            offsetX = Math.sin(angle) * 0.22;
            offsetZ = Math.cos(angle) * 0.22;
          }

          // Animate position smoothly
          const targetY = 0.05; // rest height
          const targetX = c - 7 + offsetX;
          const targetZ = r - 7 + offsetZ;
          
          // Set position
          mesh.position.set(targetX, targetY, targetZ);
        });
      });
    }

    function spawnDice3D() {
      if (dice3D) scene.remove(dice3D);

      const diceGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      
      // Face textures using HTML Canvas representation (to avoid load assets dependencies)
      const materials = [];
      for (let i = 1; i <= 6; i++) {
        materials.push(new THREE.MeshStandardMaterial({
          map: createDiceTexture(i),
          roughness: 0.2,
          metalness: 0.1
        }));
      }

      dice3D = new THREE.Mesh(diceGeo, materials);
      dice3D.position.set(0, 0.45, 0); // Center of board
      dice3D.castShadow = true;
      scene.add(dice3D);
    }

    function createDiceTexture(number) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);

      // black dots
      ctx.fillStyle = '#0f172a';
      const r = 10;
      const dots = {
        1: [[64, 64]],
        2: [[32, 32], [96, 96]],
        3: [[32, 32], [64, 64], [96, 96]],
        4: [[32, 32], [32, 96], [96, 32], [96, 96]],
        5: [[32, 32], [32, 96], [64, 64], [96, 32], [96, 96]],
        6: [[32, 32], [32, 64], [32, 96], [96, 32], [96, 64], [96, 96]]
      }[number];

      dots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }

    // ==========================================
    // GAME LOGIC & TURN PROCESSOR
    // ==========================================

    function findNextActiveTurn(firstStart = false) {
      if (!firstStart) {
        currentTurn = (currentTurn + 1) % 4;
      }
      
      // If none type, skip
      if (players[currentTurn].type === 'none') {
        findNextActiveTurn(false);
        return;
      }

      hasRolled = false;
      diceValue = 0;
      
      updateTurnIndicatorUI();

      // Camera auto-pan to active player's yard
      focusCameraOnPlayer(currentTurn);

      const activeName = players[currentTurn].name;
      const isMyTurn = mode === 'offline' ? (players[currentTurn].type === 'human') : (currentTurn === myColorIndex);

      if (isMyTurn) {
        document.getElementById('game-status-text').textContent = `Giliran Anda (${activeName})!`;
        document.getElementById('btn-roll-dice').disabled = false;
      } else {
        document.getElementById('game-status-text').textContent = `Giliran ${activeName}...`;
        document.getElementById('btn-roll-dice').disabled = true;

        // If active player is a Bot, roll automatically
        if (players[currentTurn].type === 'bot') {
          setTimeout(triggerAutoBotRoll, 1200);
        }
      }
      
      clearMovableHighlights();
    }

    function focusCameraOnPlayer(pIdx) {
      // Define preset look-at angles for each player color to make board immersive
      // Red (bottom-left): look from south-west
      // Green (top-left): look from north-west
      // Yellow (top-right): look from north-east
      // Blue (bottom-right): look from south-east
      const angles = [
        {x: -8, y: 10, z: 8},  // Red
        {x: -8, y: 10, z: -8}, // Green
        {x: 8, y: 10, z: -8},  // Yellow
        {x: 8, y: 10, z: 8}    // Blue
      ];
      
      const targetCam = angles[pIdx];
      
      // Smoothly tween or instantly set camera to keep player engaged
      let count = 0;
      const steps = 30;
      const interval = setInterval(() => {
        camera.position.x += (targetCam.x - camera.position.x) / 5;
        camera.position.z += (targetCam.z - camera.position.z) / 5;
        camera.position.y += (targetCam.y - camera.position.y) / 5;
        controls.target.set(0, 0, 0);
        controls.update();
        count++;
        if (count >= steps) clearInterval(interval);
      }, 16);
    }

    function updateTurnIndicatorUI() {
      for (let i = 0; i < 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (i === currentTurn) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      }
    }

    // Roll Dice click trigger
    document.getElementById('btn-roll-dice').addEventListener('click', () => {
      if (hasRolled) return;
      const val = Math.floor(Math.random() * 6) + 1;
      
      if (mode === 'online') {
        mqttPublish('roll_dice', { turn: currentTurn, value: val });
      } else {
        runDiceRollAnimation(val, () => {
          diceValue = val;
          hasRolled = true;
          processTurnAfterRoll();
        });
      }
    });

    function triggerAutoBotRoll() {
      const val = Math.floor(Math.random() * 6) + 1;
      runDiceRollAnimation(val, () => {
        diceValue = val;
        hasRolled = true;
        processTurnAfterRoll();
      });
    }

    function runDiceRollAnimation(targetValue, onComplete) {
      playBeep(250, 0.4);
      
      // Define final rotations for each face of the dice
      // Mesh standard orientations
      const faceRotations = {
        1: { x: 0, y: 0, z: 0 },
        2: { x: 0, y: Math.PI / 2, z: 0 },
        3: { x: -Math.PI / 2, y: 0, z: 0 },
        4: { x: Math.PI / 2, y: 0, z: 0 },
        5: { x: 0, y: -Math.PI / 2, z: 0 },
        6: { x: Math.PI, y: 0, z: 0 }
      };

      const targetRot = faceRotations[targetValue];

      // Jump and spin animation loop
      let frame = 0;
      const totalFrames = 35;
      
      function rollLoop() {
        if (frame < totalFrames) {
          dice3D.position.y = 0.45 + Math.sin((frame / totalFrames) * Math.PI) * 2;
          dice3D.rotation.x += 0.4;
          dice3D.rotation.y += 0.5;
          dice3D.rotation.z += 0.3;
          frame++;
          requestAnimationFrame(rollLoop);
        } else {
          // snap to correct face
          dice3D.position.y = 0.45;
          dice3D.rotation.set(targetRot.x, targetRot.y, targetRot.z);
          onComplete();
        }
      }
      rollLoop();
    }

    function processTurnAfterRoll() {
      // Find movable tokens
      const activePawns = tokens[currentTurn];
      const movableIndices = [];

      activePawns.forEach((tok, idx) => {
        if (isPawnMovable(currentTurn, tok, diceValue)) {
          movableIndices.push(idx);
        }
      });

      if (movableIndices.length === 0) {
        document.getElementById('game-status-text').textContent = `Tidak ada gerakan!`;
        setTimeout(() => {
          findNextActiveTurn();
        }, 1500);
      } else {
        const activeName = players[currentTurn].name;
        document.getElementById('game-status-text').textContent = `${activeName} mendapat dadu ${diceValue}. Pilih pion!`;

        // Highlight movable pawns in 3D
        highlightMovablePawns(currentTurn, movableIndices);

        // If bot, let it make selection
        if (players[currentTurn].type === 'bot') {
          setTimeout(() => {
            const chosenTokenIdx = makeBotChoice(movableIndices);
            moveToken(currentTurn, chosenTokenIdx, diceValue);
          }, 1000);
        }
      }
    }

    function isPawnMovable(playerIdx, tok, val) {
      if (tok.pos === -1 && val !== 6) return false;
      if (tok.pos === 57) return false; // already home
      if (tok.pos !== -1 && tok.pos + val > 57) return false; // overshoots home goal
      return true;
    }

    function makeBotChoice(movableIndices) {
      // Heuristic:
      // 1. Prefer exiting yard to common path (exit base)
      // 2. Prefer token closest to goal/home path
      const activePawns = tokens[currentTurn];
      
      const exitBase = movableIndices.find(idx => activePawns[idx].pos === -1);
      if (exitBase !== undefined) return exitBase;

      let bestIdx = movableIndices[0];
      let maxPos = -2;
      movableIndices.forEach(idx => {
        if (activePawns[idx].pos > maxPos) {
          maxPos = activePawns[idx].pos;
          bestIdx = idx;
        }
      });

      return bestIdx;
    }

    function highlightMovablePawns(playerIdx, indices) {
      clearMovableHighlights();

      indices.forEach(idx => {
        const mesh = pawns3D[playerIdx][idx];
        
        mesh.userData.isMovableAnim = true;

        const ringGeo = new THREE.RingGeometry(0.38, 0.42, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: getHexColor(playerIdx),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(mesh.position.x, 0.11, mesh.position.z);
        scene.add(ringMesh);
        highlightRings.push(ringMesh);
      });
    }

    function clearMovableHighlights() {
      for (let p = 0; p < 4; p++) {
        for (let t = 0; t < 4; t++) {
          if (pawns3D[p][t]) {
            pawns3D[p][t].userData.isMovableAnim = false;
            pawns3D[p][t].position.y = 0.05;
          }
        }
      }

      highlightRings.forEach(r => scene.remove(r));
      highlightRings = [];
    }

    function onBoardClick(event) {
      if (!hasRolled) return;
      
      const isMyTurn = mode === 'offline' ? (players[currentTurn].type === 'human') : (currentTurn === myColorIndex);
      if (!isMyTurn) return;

      const wrap = document.getElementById('ludo-canvas-wrap');
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / wrap.clientWidth) * 2 - 1,
        -((event.clientY - rect.top) / wrap.clientHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      pawns3D[currentTurn].forEach(pMesh => {
        const intersects = raycaster.intersectObjects(pMesh.children);
        if (intersects.length > 0) {
          targets.push(pMesh);
        }
      });

      if (targets.length > 0) {
        const clickedMesh = targets[0];
        const { tokenIdx } = clickedMesh.userData;
        
        if (isPawnMovable(currentTurn, tokens[currentTurn][tokenIdx], diceValue)) {
          if (mode === 'online') {
            mqttPublish('move_pawn', { playerIdx: currentTurn, tokenIdx: tokenIdx, diceVal: diceValue });
          } else {
            moveToken(currentTurn, tokenIdx, diceValue);
          }
        }
      }
    }

    function moveToken(pIdx, tIdx, val) {
      clearMovableHighlights();
      const tok = tokens[pIdx][tIdx];
      
      const startPos = tok.pos;
      let targetPos;
      
      if (startPos === -1 && val === 6) {
        targetPos = 0;
      } else {
        targetPos = startPos + val;
      }

      playBeep(450, 0.15);

      let currentStep = startPos === -1 ? 0 : startPos + 1;
      
      function stepLoop() {
        if (currentStep <= targetPos) {
          tok.pos = currentStep;
          updatePawnsPositions3D();
          playBeep(520, 0.08);
          currentStep++;
          setTimeout(stepLoop, 150);
        } else {
          checkCaptures(pIdx, tIdx);
          checkWinningState(pIdx);
          
          if (val === 6) {
            hasRolled = false;
            document.getElementById('btn-roll-dice').disabled = false;
            document.getElementById('game-status-text').textContent = `Dadu 6! Giliran Anda lagi.`;
            if (players[currentTurn].type === 'bot') {
              setTimeout(triggerAutoBotRoll, 1000);
            }
          } else {
            findNextActiveTurn();
          }
        }
      }

      if (startPos === -1 && val === 6) {
        tok.pos = 0;
        updatePawnsPositions3D();
        playBeep(600, 0.2);
        checkCaptures(pIdx, tIdx);
        findNextActiveTurn();
      } else {
        stepLoop();
      }
    }

    function checkCaptures(moverPlayerIdx, moverTokenIdx) {
      const moverTok = tokens[moverPlayerIdx][moverTokenIdx];
      if (moverTok.pos === -1 || moverTok.pos >= 51) return;

      const moverCoord = getAbsoluteCoordinates(moverPlayerIdx, moverTok.pos);

      for (let pIdx = 0; pIdx < 4; pIdx++) {
        if (pIdx === moverPlayerIdx) continue;
        for (let tIdx = 0; tIdx < 4; tIdx++) {
          const enemyTok = tokens[pIdx][tIdx];
          if (enemyTok.pos === -1 || enemyTok.pos >= 51) continue;

          const enemyCoord = getAbsoluteCoordinates(pIdx, enemyTok.pos);
          
          if (moverCoord.r === enemyCoord.r && moverCoord.c === enemyCoord.c) {
            const isSafeZone = (enemyCoord.r === 6 && enemyCoord.c === 1) ||
                               (enemyCoord.r === 1 && enemyCoord.c === 8) ||
                               (enemyCoord.r === 8 && enemyCoord.c === 13) ||
                               (enemyCoord.r === 13 && enemyCoord.c === 6);
            
            if (!isSafeZone) {
              enemyTok.pos = -1;
              playBeep(120, 0.6);
              window.showToast(`${players[moverPlayerIdx].name} memakan pion ${players[pIdx].name}! 💥`, 'info');
            }
          }
        }
      }
      updatePawnsPositions3D();
    }

    function getAbsoluteCoordinates(pIdx, pos) {
      if (pos === -1) return yards[pIdx][0];
      if (pos >= 51) return homePaths[pIdx][pos - 51];
      const actualIdx = (startIndices[pIdx] + pos) % 52;
      return commonPath[actualIdx];
    }

    function checkWinningState(pIdx) {
      const won = tokens[pIdx].every(t => t.pos === 57);
      if (won) {
        try {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch(e) {}

        const winName = players[pIdx].name;
        document.getElementById('game-status-text').textContent = `🏆 ${winName} MENANG LUDO 3D!`;
        window.showToast(`${winName} memenangkan Ludo 3D! 🏆`, 'success');
        
        if (pIdx === 0) {
          window.gameOver(1000);
        } else {
          window.gameOver(100);
        }
      }
    }

    // ==========================================
    // RENDER ANIMATION LOOP
    // ==========================================

    let bounceAngle = 0;
    function animate() {
      if (!initialized) return;
      requestAnimationFrame(animate);

      bounceAngle += 0.08;
      for (let p = 0; p < 4; p++) {
        for (let t = 0; t < 4; t++) {
          const mesh = pawns3D[p][t];
          if (mesh && mesh.userData.isMovableAnim) {
            mesh.position.y = 0.05 + Math.abs(Math.sin(bounceAngle)) * 0.35;
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    return {
      destroy() {
        initialized = false;
        style.remove();
        if (mqttClient) {
          mqttClient.end();
        }
        window.removeEventListener('resize', onWindowResize);
        if (renderer) {
          renderer.dispose();
        }
      }
    };
  }
};
