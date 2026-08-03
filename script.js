// Reaify Tech - 3D 星軌 + Lupi Basics + 轉灣與呼吸動態魚鱗閃光 Sardine Engine 5.6 (Mobile RWD 版)
document.addEventListener('DOMContentLoaded', () => {
  console.log('Reaify Tech Mobile RWD Sardine Engine 5.6 Initialized.');

  // ==========================================================================
  // 1. 轉灣與擺尾呼吸動態魚鱗閃光 Engine 5.6 (安詳慢速 + 轉彎/呼吸瞬間反光)
  // ==========================================================================
  const canvas = document.getElementById('sardine-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0, active: false, lastX: width / 2, lastY: height / 2 };
    window.addEventListener('mousemove', (e) => {
      mouse.vx = e.clientX - mouse.lastX;
      mouse.vy = e.clientY - mouse.lastY;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.active = true;
    });

    // 觸控移動適配
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.vx = touch.clientX - mouse.lastX;
        mouse.vy = touch.clientY - mouse.lastY;
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
        mouse.lastX = touch.clientX;
        mouse.lastY = touch.clientY;
        mouse.active = true;
      }
    });

    // ------------------------------------------------------------------------
    // 飼料粒子系統 (Feed Pellets System)
    // ------------------------------------------------------------------------
    const feedPellets = [];
    
    class FeedPellet {
      constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 16;
        this.y = y + (Math.random() - 0.5) * 16;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = Math.random() * 0.4 + 0.2;
        this.radius = 2.2 + Math.random() * 1.2;
        this.life = 180;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.98;
        this.life--;
      }

      draw(ctx) {
        const alpha = Math.min(1, this.life / 30);
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFE099';
        ctx.fillStyle = `rgba(255, 224, 153, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 點擊/觸控撒飼料事件 (不影響按鈕點擊)
    window.addEventListener('pointerdown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('.holo-modal-overlay') || e.target.closest('.glance-switcher')) return;

      for (let i = 0; i < 5; i++) {
        feedPellets.push(new FeedPellet(e.clientX, e.clientY));
      }
    });

    // ------------------------------------------------------------------------
    // 基礎魚體點陣紋理 (5 層景深)
    // ------------------------------------------------------------------------
    function createBaseTexture(scale, glowBlur, alpha) {
      const texCanvas = document.createElement('canvas');
      const texSize = Math.ceil(52 * scale);
      texCanvas.width = texSize;
      texCanvas.height = texSize;
      const tCtx = texCanvas.getContext('2d');

      tCtx.translate(texSize / 2, texSize / 2);
      tCtx.scale(scale, scale);

      tCtx.shadowBlur = glowBlur;
      tCtx.shadowColor = `rgba(200, 100, 0, ${alpha * 0.5})`;

      // 魚頭
      tCtx.fillStyle = `rgba(215, 125, 20, ${alpha})`;
      tCtx.fillRect(6, -1.5, 3, 3);

      // 魚身暗底
      tCtx.fillStyle = `rgba(175, 80, 0, ${alpha * 0.9})`;
      tCtx.fillRect(2, -2, 4, 4);
      tCtx.fillRect(-2, -2, 4, 4);
      tCtx.fillRect(-6, -1.5, 4, 3);

      // 魚尾
      tCtx.fillStyle = `rgba(180, 85, 0, ${alpha * 0.6})`;
      tCtx.fillRect(-9, -1, 3, 2);

      return texCanvas;
    }

    const baseTextures = [
      createBaseTexture(0.45, 3, 0.40),
      createBaseTexture(0.65, 5, 0.58),
      createBaseTexture(0.85, 7, 0.75),
      createBaseTexture(1.05, 9, 0.90),
      createBaseTexture(1.25, 12, 1.00)
    ];

    // ------------------------------------------------------------------------
    // 轉彎與呼吸動態魚鱗閃光生態魚個體
    // ------------------------------------------------------------------------
    class DynamicFlashSardine {
      constructor(typeId) {
        this.typeId = typeId;
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        this.independence = (typeId === 2) ? 0.85 : (0.1 + Math.random() * 0.3);
        this.tierIndex = Math.floor(Math.random() * 5);
        this.depth = 0.45 + this.tierIndex * 0.2;
        this.scale = 0.45 + this.tierIndex * 0.2;
        this.texture = baseTextures[this.tierIndex];
        
        this.baseMaxSpeed = 0.75 + this.depth * 0.45;
        this.maxSpeed = this.baseMaxSpeed;

        const startAngle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(startAngle) * 0.8;
        this.vy = Math.sin(startAngle) * 0.8;
        this.currentHeading = startAngle;

        this.ax = 0;
        this.ay = 0;
        this.phase = Math.random() * Math.PI * 2;
        this.turnIntensity = 0;
      }

      update() {
        this.vx += this.ax;
        this.vy += this.ay;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
          this.vx = (this.vx / speed) * this.maxSpeed;
          this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        const accelMag = Math.hypot(this.ax, this.ay);
        this.turnIntensity += (accelMag * 15 - this.turnIntensity) * 0.15;

        if (speed > 0.05) {
          const targetHeading = Math.atan2(this.vy, this.vx);
          let diff = targetHeading - this.currentHeading;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.currentHeading += diff * 0.14;
        }

        if (this.x < -40) this.x = width + 40;
        if (this.x > width + 40) this.x = -40;
        if (this.y < -40) this.y = height + 40;
        if (this.y > height + 40) this.y = -40;

        this.ax = 0;
        this.ay = 0;
        this.phase += 0.09;
      }

      applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
      }

      flock(allFish, pellets) {
        let nearestPellet = null;
        let minDist = 340;

        pellets.forEach(pellet => {
          const d = Math.hypot(pellet.x - this.x, pellet.y - this.y);
          if (d < minDist) {
            minDist = d;
            nearestPellet = pellet;
          }
        });

        if (nearestPellet) {
          this.maxSpeed = this.baseMaxSpeed * 2.5;
          const fx = (nearestPellet.x - this.x) / minDist;
          const fy = (nearestPellet.y - this.y) / minDist;
          const pull = (340 - minDist) / 340 * 0.2;
          this.applyForce(fx * pull, fy * pull);

          if (minDist < 14) {
            nearestPellet.life -= 40;
          }
        } else {
          this.maxSpeed = this.baseMaxSpeed;
        }

        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0, aliCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;

        const neighborDist = (this.typeId === 2) ? 55 : 90;
        const desiredSep = 22;

        allFish.forEach(other => {
          if (other === this) return;
          const d = Math.hypot(this.x - other.x, this.y - other.y);

          if (d > 0 && d < desiredSep) {
            sepX += (this.x - other.x) / d;
            sepY += (this.y - other.y) / d;
            sepCount++;
          }

          if (d > 0 && d < neighborDist && (other.typeId === this.typeId || Math.random() > this.independence)) {
            aliX += other.vx;
            aliY += other.vy;
            aliCount++;

            cohX += other.x;
            cohY += other.y;
            cohCount++;
          }
        });

        if (sepCount > 0) {
          sepX /= sepCount;
          sepY /= sepCount;
          this.applyForce(sepX * 0.05, sepY * 0.05);
        }

        if (aliCount > 0) {
          aliX /= aliCount;
          aliY /= aliCount;
          this.applyForce((aliX - this.vx) * 0.03 * (1 - this.independence * 0.5), (aliY - this.vy) * 0.03 * (1 - this.independence * 0.5));
        }

        if (cohCount > 0) {
          cohX /= cohCount;
          cohY /= cohCount;
          this.applyForce((cohX - this.x) * 0.001 * (1 - this.independence * 0.5), (cohY - this.y) * 0.001 * (1 - this.independence * 0.5));
        }

        if (mouse.active && !nearestPellet) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);

          if (mouseSpeed > 14 && dist < 130) {
            this.applyForce(-(dx / dist) * 1.2, -(dy / dist) * 1.2);
          } else if (dist < 220 && dist > 40) {
            this.applyForce((dx / dist) * 0.015 * this.depth, (dy / dist) * 0.015 * this.depth);
          }
        }
      }

      draw(ctx) {
        const tailOffset = Math.sin(this.phase) * 1.2;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.currentHeading);

        const tWidth = this.texture.width;
        const tHeight = this.texture.height;
        ctx.drawImage(this.texture, -tWidth / 2, -tHeight / 2 + tailOffset * 0.2);

        const breathPulse = Math.max(0, Math.sin(this.phase));
        const turnFlash = Math.min(1.0, this.turnIntensity);
        const flashAlpha = Math.min(1.0, (breathPulse * 0.65) + (turnFlash * 0.85));

        if (flashAlpha > 0.1) {
          ctx.shadowBlur = Math.round(8 * this.depth);
          ctx.shadowColor = `rgba(255, 255, 255, ${flashAlpha * 0.9})`;

          ctx.fillStyle = `rgba(255, 250, 220, ${flashAlpha * 0.95})`;
          ctx.fillRect(1.5 * this.scale, -1.2 * this.scale, 2.5 * this.scale, 1.8 * this.scale);

          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0 * this.scale, -0.5 * this.scale, 2.0 * this.scale, 1.5 * this.scale);
        }

        ctx.restore();
      }
    }

    const totalSardines = (window.innerWidth <= 768) ? 60 : 90; // 手機版自動省電降至 60 隻
    const oceanEcosystem = [];
    for (let i = 0; i < totalSardines; i++) {
      let typeId = 0;
      if (i >= 25 && i < 50) typeId = 1;
      else if (i >= 50) typeId = 2;
      oceanEcosystem.push(new DynamicFlashSardine(typeId));
    }

    function renderEcosystemLoopRWD() {
      ctx.clearRect(0, 0, width, height);

      for (let i = feedPellets.length - 1; i >= 0; i--) {
        const pellet = feedPellets[i];
        pellet.update();
        pellet.draw(ctx);
        if (pellet.life <= 0) {
          feedPellets.splice(i, 1);
        }
      }

      oceanEcosystem.sort((a, b) => a.tierIndex - b.tierIndex);

      oceanEcosystem.forEach(fish => {
        fish.flock(oceanEcosystem, feedPellets);
        fish.update();
        fish.draw(ctx);
      });

      requestAnimationFrame(renderEcosystemLoopRWD);
    }

    renderEcosystemLoopRWD();
  }

  // ==========================================================================
  // 2. 4 大核心功能模組 (3D 星軌舞台 - 手機自適應動態半徑)
  // ==========================================================================
  const modulesData = [
    {
      mod: "[模組 01]",
      title: "AI GAME MASTER",
      sub: "智慧主持與規則指引引擎",
      tag: "AI 主持",
      svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 2" opacity="0.4"/></svg>`,
      desc: [
        "&gt; AI 規則教學: 動態圖像與語音分解複雜規則，新人小白看一眼就能懂。",
        "&gt; AI 流程引導: 即時提醒當前玩家的回合動作與輪次，開桌再也不卡頓。",
        "&gt; AI 勝負判定: 準確裁判勝負條件與得分結算，防爭議更公平。"
      ],
      detail: "<p><strong>【店家痛點救星】</strong> 過去客滿時店員光是教一桌《Catan》或《璀璨寶石》就耗掉 30 分鐘，後面客人只能乾等。Reaify AI Game Master 就像專屬語音主持人，24 小時隨叫隨到分解規則，讓店員省下重複教牌時間，專注於親切服務！</p>"
    },
    {
      mod: "[模組 02]",
      title: "VISION AI (HAND TRACKING)",
      sub: "高精度多模態視覺與手部追蹤系統",
      tag: "60 幀/秒",
      svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v9"/><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-16 0v-2"/><circle cx="12" cy="12" r="10" stroke-dasharray="3 3" opacity="0.3"/></svg>`,
      desc: [
        "&gt; 手部自動追蹤: 60FPS 極速手體定位與動態軌跡辨識。",
        "&gt; 直觀手勢辨識: 出牌、出拳與動作手勢觸發，伸手就能開玩。",
        "&gt; 棋盤玩家辨識: 精準追蹤棋子位置與座位輪次。"
      ],
      detail: "<p><strong>【極致直觀體驗】</strong> 玩家無需配對複雜按鈕，系統鏡頭會自動捕捉手部出牌與擺放配件動作，瞬間進行判定與錄影戰績，帶來最酷炫的沉浸互動體驗！</p>"
    },
    {
      mod: "[模組 03]",
      title: "NFC SENSOR MATRIX",
      sub: "零延遲實體感應通訊",
      tag: "NFC 感應",
      svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><rect x="8" y="2" width="8" height="4" rx="1" stroke-dasharray="2 2"/></svg>`,
      desc: [
        "&gt; 玩家一秒登入: 感應卡/手機 1 秒載入戰績卡與個人稱號。",
        "&gt; 實體道具識別: 特製實體卡牌/棋子觸碰感應即刻觸發。",
        "&gt; 快速配對連線: 桌號與遊戲配件快速同步配對。"
      ],
      detail: "<p><strong>【1 秒開桌開玩】</strong> 玩家入座拿手機或感應卡逼一下，瞬間載入歷史勝率與個人稱號；特製實體配件一放即刻自動進入遊戲階段，大幅提升開桌率與翻桌效率！</p>"
    },
    {
      mod: "[模組 04]",
      title: "CLOUD DASHBOARD",
      sub: "雲端店家管理與數據後台",
      tag: "雲端後台",
      svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="8 14 12 10 16 14"/><line x1="12" y1="10" x2="12" y2="18"/></svg>`,
      desc: [
        "&gt; 全店即時掌控: 實時掌控全店桌面連線狀態與時數開銷。",
        "&gt; 經營數據分析: 自動統計熱門桌遊排行與開桌高峰期。",
        "&gt; 遠端一鍵更新: 全新桌遊規則與語音自動遠端派送。"
      ],
      detail: "<p><strong>【老闆經營神器】</strong> 所有桌面的開桌時數、遊戲熱門度與人事節省成本全數視覺化呈現在後台。新桌遊上市免更新說明書，雲端一鍵派送全館同步！</p>"
    }
  ];

  const orbitContainer = document.getElementById('orbit-container');
  const orbitStage = document.getElementById('orbit-stage');
  const toggleSpinBtn = document.getElementById('toggle-spin-btn');

  const holoModal = document.getElementById('holo-modal');
  const closeHoloBtn = document.getElementById('close-holo-btn');
  const modalModTag = document.getElementById('modal-mod-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalSub = document.getElementById('modal-sub');
  const modalIconBox = document.getElementById('modal-icon-box');
  const modalExplainContent = document.getElementById('modal-explain-content');

  let orbitAngle = 0;
  let autoRotateSpeed = 0.25;
  let targetSpeed = 0.25;
  let hoveredIndex = null;

  function renderOrbitCards() {
    if (!orbitContainer) return;
    orbitContainer.innerHTML = modulesData.map((item, index) => `
      <div class="mini-card-3d nothing-card glyph-led-interactive" data-index="${index}" onclick="openModal(${index})">
        <div class="led-top-strip"></div>
        <div class="model-icon-badge-orbit">
          <div class="icon-svg-wrapper">${item.svgIcon}</div>
          <span class="badge-tag-mono font-dot">${item.tag}</span>
        </div>
        <div class="feat-code-head font-mono">${item.mod} ${item.title}</div>
        <div class="feat-code-sub font-mono">${item.sub}</div>
        <div class="click-hint-tag font-dot text-center">&lt; 點擊了解模組細節 &gt;</div>
      </div>
    `).join('');

    bindEvents();
    updateOrbitPositions();
  }

  function updateOrbitPositions() {
    const cards = orbitContainer.querySelectorAll('.mini-card-3d');
    const count = cards.length;
    if (count === 0) return;

    const angleStep = 360 / count;
    // 【手機版 3D 星軌動態半徑自適應】
    const isMobile = window.innerWidth <= 768;
    const radiusX = isMobile ? 145 : 340;
    const radiusZ = isMobile ? 90 : 180;

    cards.forEach((card, index) => {
      const cardAngle = (orbitAngle + index * angleStep) % 360;
      const rad = cardAngle * (Math.PI / 180);

      const posX = Math.cos(rad) * radiusX;
      const posZ = Math.sin(rad) * radiusZ;

      const isHovered = (hoveredIndex === index);
      let posY = isHovered ? -25 : 0;
      let scale = isHovered ? (isMobile ? 1.05 : 1.15) : (isMobile ? 0.88 : 0.95);

      if (isHovered) card.classList.add('is-hovered');
      else card.classList.remove('is-hovered');

      const zIndex = Math.round(posZ + 300);
      const opacity = Math.max(0.6, (posZ + radiusZ) / (radiusZ * 2) * 0.65 + 0.35);

      card.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = zIndex;
    });
  }

  function animateOrbit() {
    autoRotateSpeed += (targetSpeed - autoRotateSpeed) * 0.1;
    orbitAngle = (orbitAngle + autoRotateSpeed) % 360;
    updateOrbitPositions();
    requestAnimationFrame(animateOrbit);
  }

  function bindEvents() {
    const cards = orbitContainer.querySelectorAll('.mini-card-3d');
    cards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => {
        hoveredIndex = index;
        targetSpeed = 0;
      });
      card.addEventListener('mouseleave', () => {
        hoveredIndex = null;
        if (!holoModal.classList.contains('active')) targetSpeed = 0.25;
      });
    });
  }

  if (orbitStage) {
    orbitStage.addEventListener('mouseenter', () => {
      if (!holoModal.classList.contains('active')) targetSpeed = 0;
    });
    orbitStage.addEventListener('mouseleave', () => {
      if (!holoModal.classList.contains('active')) targetSpeed = 0.25;
      hoveredIndex = null;
    });
  }

  window.openModal = function(index) {
    const item = modulesData[index];
    if (!item) return;

    targetSpeed = 0;
    modalModTag.textContent = item.mod;
    modalTitle.textContent = item.title;
    modalSub.textContent = item.sub;
    if (modalIconBox) modalIconBox.innerHTML = item.svgIcon;
    
    let html = `<p style="color:var(--c-amber); font-weight:700;">${item.sub}</p>`;
    html += `<ul>${item.desc.map(d => `<li>${d}</li>`).join('')}</ul>`;
    html += item.detail;
    modalExplainContent.innerHTML = html;

    holoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    holoModal.classList.remove('active');
    document.body.style.overflow = '';
    targetSpeed = 0.25;
  }

  if (closeHoloBtn) closeHoloBtn.addEventListener('click', closeModal);
  if (holoModal) {
    holoModal.addEventListener('click', (e) => {
      if (e.target === holoModal) closeModal();
    });
  }

  if (toggleSpinBtn) {
    toggleSpinBtn.addEventListener('click', () => {
      if (targetSpeed === 0) {
        targetSpeed = 0.25;
        toggleSpinBtn.textContent = '⏸ 暫停旋轉';
      } else {
        targetSpeed = 0;
        toggleSpinBtn.textContent = '▶ 繼續旋轉';
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ==========================================================================
  // 3. lieflat-charts Lupi Basics 大白話動態邏輯
  // ==========================================================================
  const f4SvgDonut = document.getElementById('f4-svg-donut');
  let f4Ticks = [];
  if (f4SvgDonut) {
    const cx = 80, cy = 80;
    const innerR = 64, outerR = 76;
    let svgHtml = '';

    for (let i = 0; i < 100; i++) {
      const angle = (i * 3.6) * (Math.PI / 180);
      const x1 = cx + innerR * Math.cos(angle);
      const y1 = cy + innerR * Math.sin(angle);
      const x2 = cx + outerR * Math.cos(angle);
      const y2 = cy + outerR * Math.sin(angle);

      svgHtml += `<line class="f4-tick" id="f4-tick-${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }
    f4SvgDonut.innerHTML = svgHtml;
    f4Ticks = f4SvgDonut.querySelectorAll('.f4-tick');
  }

  const f4Datasets = {
    month: { pct: 68, label: "單月平均人事開支節減" },
    quarter: { pct: 75, label: "單季累計人事開支節減" },
    year: { pct: 82, label: "全年度預期營運開支節減" }
  };

  window.switchF4Data = function(type, btnEl) {
    const parent = btnEl.parentElement;
    parent.querySelectorAll('.glance-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');

    const data = f4Datasets[type];
    if (!data) return;

    f4Ticks.forEach((tick, index) => {
      setTimeout(() => {
        if (index < data.pct) {
          tick.classList.add('active');
        } else {
          tick.classList.remove('active');
        }
      }, index * 4);
    });

    const bigNumEl = document.getElementById('f4-big-num');
    const subLblEl = document.getElementById('f4-sub-lbl');
    const savedValEl = document.getElementById('f4-ai-saved-val');

    if (bigNumEl) animateCounter(bigNumEl, data.pct, '%');
    if (subLblEl) subLblEl.textContent = data.label;
    if (savedValEl) savedValEl.textContent = `${data.pct}% 人力成本已自動化節省`;
  };

  const f12Datasets = {
    weekday: {
      left: [18, 20, 22, 25, 24],
      right: [65, 70, 75, 85, 80],
      tags: ["2.4 倍", "2.6 倍", "2.8 倍", "3.1 倍", "2.9 倍"],
      summary: "翻桌率提升 2.4 ~ 3.1 倍"
    },
    weekend: {
      left: [25, 28, 30, 35, 32],
      right: [78, 85, 90, 96, 92],
      tags: ["3.1 倍", "3.3 倍", "3.6 倍", "4.0 倍", "3.8 倍"],
      summary: "翻桌率提升 3.1 ~ 4.0 倍 (尖峰期)"
    },
    month: {
      left: [20, 22, 24, 28, 25],
      right: [70, 75, 80, 88, 84],
      tags: ["2.5 倍", "2.7 倍", "2.9 倍", "3.2 倍", "3.0 倍"],
      summary: "月均翻桌率提升 2.8 倍"
    }
  };

  window.switchF12Data = function(type, btnEl) {
    const parent = btnEl.parentElement;
    parent.querySelectorAll('.glance-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');

    const data = f12Datasets[type];
    if (!data) return;

    for (let i = 0; i < 5; i++) {
      const line = document.getElementById(`db-line-${i}`);
      const bLeft = document.getElementById(`db-bead-l-${i}`);
      const bRight = document.getElementById(`db-bead-r-${i}`);
      const tag = document.getElementById(`db-tag-${i}`);

      const lPct = data.left[i];
      const rPct = data.right[i];
      const wPct = rPct - lPct;

      if (line) {
        line.style.left = `${lPct}%`;
        line.style.width = `${wPct}%`;
      }
      if (bLeft) bLeft.style.left = `${lPct}%`;
      if (bRight) bRight.style.left = `${rPct}%`;
      if (tag) tag.textContent = data.tags[i];
    }

    const summaryTagEl = document.getElementById('f12-summary-tag');
    if (summaryTagEl) summaryTagEl.textContent = data.summary;
  };

  function animateCounter(el, targetVal, suffix = '') {
    const startVal = parseInt(el.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + (targetVal - startVal) * easeProgress);
      
      el.textContent = `${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  renderOrbitCards();
  animateOrbit();
  switchF4Data('month', document.querySelector('.glance-switcher .glance-btn'));
  switchF12Data('weekday', document.querySelectorAll('.glance-switcher')[1].querySelector('.glance-btn'));
});
