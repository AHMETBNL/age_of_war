import { Base, Unit, Projectile, Meteor } from './entities.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Görseller - bg düz yükle, diğerleri beyaz arkaplan temizle
    this.images = {
      bg: new Image(),
      base: null,
      baseEnemy: null,
      clubman: null,
      clubmanEnemy: null,
      slinger: null,
      slingerEnemy: null,
      catapult: null
    };
    this.images.bg.src = '/assets/bg.png';

    // Normal (sağa bakan) görseller - oyuncu
    this.removeWhiteBg('/assets/base.png',    img => this.images.base = img);
    this.removeWhiteBg('/assets/clubman.png', img => this.images.clubman = img);
    this.removeWhiteBg('/assets/slinger.png', img => this.images.slinger = img);
    this.removeWhiteBg('/assets/catapult.png',img => this.images.catapult = img);

    // Ters çevrilmiş (sola bakan) görseller - düşman
    this.removeWhiteBgFlip('/assets/base.png',    img => { this.images.baseEnemy    = img; });
    this.removeWhiteBgFlip('/assets/clubman.png', img => { this.images.clubmanEnemy = img; });
    this.removeWhiteBgFlip('/assets/slinger.png', img => { this.images.slingerEnemy = img; });

    // Oyun durumu
    this.playerGold = 15;
    this.playerXP = 0;
    this.enemyGold = 15;
    this.enemyXP = 0;
    this.frameCount = 0;

    // Birimler, mermiler, üsler
    this.units = [];
    this.projectiles = [];
    this.bases = [
      new Base(20, true),        // Oyuncu üssü (sol)
      new Base(1030, false)      // Düşman üssü (sağ)
    ];

    // Spawn kuyruğu: mağara çıkışı doluysa sıraya al
    this.playerQueue = [];  // [{type}]
    this.enemyQueue = [];

    // UI elementleri
    this.uiPlayerGold = document.getElementById('player-gold');
    this.uiPlayerXP   = document.getElementById('player-xp');
    this.uiEnemyGold  = document.getElementById('enemy-gold');
    this.uiEnemyXP    = document.getElementById('enemy-xp');

    // Meteor sistemi
    this.meteors = [];
    this.meteorCharge = 0;        // 0-1800 (30 saniye = 1800 frame)
    this.meteorMax = 1800;
    this.meteorReady = false;
    this.meteorBtn = document.getElementById('btn-meteor');

    // Düşman yapay zekası
    this.aiDelay = 600;   // 10 saniye başlangıç gecikmesi (600 frame)
    this.aiTimer = 0;
    this.gameOver = false;
  }

  /** Beyaz/açık gri arka planı şeffaf yap */
  removeWhiteBg(src, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      try {
        const data = x.getImageData(0, 0, c.width, c.height);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          // Beyaz, açık gri ve krem tonlarını şeffaf yap
          if (r > 200 && g > 200 && b > 200) {
            d[i+3] = 0;
          }
        }
        x.putImageData(data, 0, 0);
        const out = new Image();
        out.src = c.toDataURL();
        callback(out);
      } catch(e) {
        console.warn('removeWhiteBg fallback:', e);
        callback(img);
      }
    };
    img.onerror = () => callback(img);
  }

  /** Beyaz arka planı temizle VE yatay flip uygula (düşman görselleri için) */
  removeWhiteBgFlip(src, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      // Adım 1: beyaz temizle
      const c1 = document.createElement('canvas');
      c1.width = img.width; c1.height = img.height;
      const x1 = c1.getContext('2d');
      x1.drawImage(img, 0, 0);
      try {
        const data = x1.getImageData(0, 0, c1.width, c1.height);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 200 && d[i+1] > 200 && d[i+2] > 200) d[i+3] = 0;
        }
        x1.putImageData(data, 0, 0);

        // Adım 2: yatay flip
        const c2 = document.createElement('canvas');
        c2.width = c1.width; c2.height = c1.height;
        const x2 = c2.getContext('2d');
        x2.translate(c2.width, 0);
        x2.scale(-1, 1);
        x2.drawImage(c1, 0, 0);

        const out = new Image();
        out.src = c2.toDataURL();
        callback(out);
      } catch(e) {
        // Fallback: sadece flip yap
        const c2 = document.createElement('canvas');
        c2.width = img.width; c2.height = img.height;
        const x2 = c2.getContext('2d');
        x2.translate(c2.width, 0); x2.scale(-1, 1);
        x2.drawImage(img, 0, 0);
        const out = new Image(); out.src = c2.toDataURL();
        callback(out);
      }
    };
    img.onerror = () => callback(img);
  }

  /** Görseli senkron canvas ile yatay çevir */
  makeFlipped(src) {
    const c = document.createElement('canvas');
    c.width  = src.naturalWidth  || src.width  || 128;
    c.height = src.naturalHeight || src.height || 128;
    const x = c.getContext('2d');
    x.translate(c.width, 0);
    x.scale(-1, 1);
    x.drawImage(src, 0, 0);
    const out = new Image();
    out.src = c.toDataURL();
    return out;
  }

  /** Mağara çıkışı boş mu kontrol et, doluysa kuyruğa al */
  trySpawnFromQueue() {
    // Oyuncu kuyruğu
    if (this.playerQueue.length > 0) {
      const next = this.playerQueue[0];
      const spawnX = this.bases[0].x + this.bases[0].width;
      const blocked = this.units.some(u =>
        u.isPlayer &&
        u.x < spawnX + 65 &&
        u.x + u.width > spawnX - 5
      );
      if (!blocked) {
        this.playerQueue.shift();
        this.units.push(new Unit(spawnX, true, next.type));
      }
    }

    // Düşman kuyruğu
    if (this.enemyQueue.length > 0) {
      const next = this.enemyQueue[0];
      const spawnX = this.bases[1].x - 65;
      const blocked = this.units.some(u =>
        !u.isPlayer &&
        u.x < spawnX + 65 &&
        u.x + u.width > spawnX - 5
      );
      if (!blocked) {
        this.enemyQueue.shift();
        this.units.push(new Unit(spawnX, false, next.type));
      }
    }
  }

  update() {
    if (this.gameOver) return;

    this.frameCount++;

    // Pasif altın artışı: saniyede 1
    if (this.frameCount % 60 === 0) {
      this.playerGold += 1;
      this.enemyGold += 1;
    }

    // Meteor güncelle
    this.meteors.forEach(m => m.update(this.units, this.bases));
    this.meteors = this.meteors.filter(m => !m.markedForDeletion);

    // Meteor şarjı doldur (30 saniye)
    if (!this.meteorReady && this.meteorCharge < this.meteorMax) {
      this.meteorCharge++;
      if (this.meteorCharge >= this.meteorMax) {
        this.meteorReady = true;
        if (this.meteorBtn) this.meteorBtn.classList.add('ready');
      }
    }
    if (this.meteorBtn) {
      this.meteorBtn.style.setProperty('--charge', `${(this.meteorCharge / this.meteorMax) * 100}%`);
    }

    // Kuyruktan spawn dene (her frame)
    this.trySpawnFromQueue();

    // Düşman yapay zekası - 10 saniye gecikme
    if (this.aiDelay > 0) {
      this.aiDelay--;
    } else {
      this.aiTimer++;
      if (this.aiTimer > 150) {
        this.aiTimer = 0;
        if (this.enemyGold >= 25 && Math.random() > 0.45) {
          this.spawnUnit(false, 'ranged');
        } else if (this.enemyGold >= 15) {
          this.spawnUnit(false, 'melee');
        }
      }
    }

    // Tüm hedefler (birimler + üsler)
    const allTargets = [...this.units, ...this.bases];

    // Üs turret güncellemesi
    this.bases.forEach(b => b.update(this.units, this.projectiles));

    // Mermiler
    this.projectiles.forEach(p => p.update(allTargets));
    this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

    // Birimler
    this.units.forEach(u => u.update(allTargets, this.projectiles));

    // Ölü birimler: öldürme başına 5 altın
    this.units.forEach(u => {
      if (u.health <= 0 && !u.markedForDeletion) {
        u.markedForDeletion = true;
        if (u.isPlayer) {
          // Düşman oyuncunun askerini öldürdü → düşmana 5 altın
          this.enemyGold += 5;
          this.enemyXP += 10;
        } else {
          // Oyuncu düşmanın askerini öldürdü → oyuncuya 5 altın
          this.playerGold += 5;
          this.playerXP += 10;
        }
      }
    });

    this.units = this.units.filter(u => !u.markedForDeletion);

    // UI güncelle
    this.uiPlayerGold.innerText = this.playerGold;
    this.uiPlayerXP.innerText   = this.playerXP;
    this.uiEnemyGold.innerText  = this.enemyGold;
    this.uiEnemyXP.innerText    = this.enemyXP;

    // Oyun bitiş kontrolü
    if (this.bases[0].health <= 0) {
      this.gameOver = true;
      setTimeout(() => alert('💀 Kaybettin! Düşman kazandı!'), 200);
    } else if (this.bases[1].health <= 0) {
      this.gameOver = true;
      setTimeout(() => alert('🏆 Kazandın!'), 200);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Arka plan
    if (this.images.bg.complete && this.images.bg.naturalWidth > 0) {
      this.ctx.drawImage(this.images.bg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#654321';
      this.ctx.fillRect(0, 580, this.width, 120);
    }

    // Üsler - kendi yönlerine bakan görseller
    this.bases.forEach(b => {
      const img = b.isPlayer ? this.images.base : this.images.baseEnemy;
      b.draw(this.ctx, img, this.images.catapult);
    });

    // Birimler - kendi yönlerine bakan görseller
    this.units.forEach(u => {
      let img;
      if (u.isPlayer) {
        img = u.type === 'melee' ? this.images.clubman : this.images.slinger;
      } else {
        img = u.type === 'melee' ? this.images.clubmanEnemy : this.images.slingerEnemy;
      }
      u.draw(this.ctx, img);
    });

    // Mermiler
    this.projectiles.forEach(p => p.draw(this.ctx));

    // Meteorlar
    this.meteors.forEach(m => m.draw(this.ctx));
  }

  /** Meteor güç aktivasyonu - 7 meteor yağdırır */
  activateMeteor() {
    if (!this.meteorReady) return;
    this.meteorReady = false;
    this.meteorCharge = 0;
    if (this.meteorBtn) this.meteorBtn.classList.remove('ready');

    // Düşman tarafına 7 meteor gönder
    const count = 7;
    for (let i = 0; i < count; i++) {
      const delay = i * 18; // Her meteor biraz farklı zamanda
      setTimeout(() => {
        const targetX = 600 + Math.random() * 430; // Düşman alanı
        this.meteors.push(new Meteor(targetX));
      }, delay * (1000 / 60)); // frame delay -> ms
    }
  }

  buyTurret(isPlayer) {
    if (isPlayer && this.playerGold >= 200 && !this.bases[0].hasTurret) {
      this.playerGold -= 200;
      this.bases[0].hasTurret = true;
    }
  }

  spawnUnit(isPlayer, type) {
    const dummy = new Unit(0, true, type);
    const cost = dummy.cost;

    if (isPlayer) {
      if (this.playerGold < cost) return;
      this.playerGold -= cost;

      const spawnX = this.bases[0].x + this.bases[0].width;
      const blocked = this.units.some(u =>
        u.isPlayer &&
        u.x < spawnX + 65 &&
        u.x + u.width > spawnX - 5
      );
      if (blocked) {
        this.playerQueue.push({ type });
      } else {
        this.units.push(new Unit(spawnX, true, type));
      }
    } else {
      if (this.enemyGold < cost) return;
      this.enemyGold -= cost;

      const spawnX = this.bases[1].x - 65;
      const blocked = this.units.some(u =>
        !u.isPlayer &&
        u.x < spawnX + 65 &&
        u.x + u.width > spawnX - 5
      );
      if (blocked) {
        this.enemyQueue.push({ type });
      } else {
        this.units.push(new Unit(spawnX, false, type));
      }
    }
  }
}
