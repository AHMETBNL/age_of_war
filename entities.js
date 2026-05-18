export class Base {
  constructor(x, isPlayer) {
    this.x = x;
    this.y = 390;
    this.width = 150;
    this.height = 170;
    this.isPlayer = isPlayer;
    this.maxHealth = 500;
    this.health = 500;
    this.hasTurret = false;
    this.turretTimer = 0;
  }

  update(units, projectiles) {
    if (!this.hasTurret) return;
    this.turretTimer++;
    if (this.turretTimer > 100) {
      let targetInRange = null;
      let closestDist = Infinity;
      for (let u of units) {
        if (u.markedForDeletion || u.isPlayer === this.isPlayer) continue;
        let dist = this.isPlayer
          ? (u.x - (this.x + this.width))
          : (this.x - (u.x + u.width));
        if (dist >= 0 && dist < 500 && dist < closestDist) {
          closestDist = dist;
          targetInRange = u;
        }
      }
      if (targetInRange) {
        this.turretTimer = 0;
        projectiles.push(new Projectile(
          this.x + this.width / 2,
          this.y - 20,
          this.isPlayer,
          20
        ));
      }
    }
  }

  draw(ctx, image, turretImg) {
    // Görsel zaten doğru yönde (game.js'de pre-flipped)
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.isPlayer ? '#4169E1' : '#B22222';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Turret görseli
    if (this.hasTurret && turretImg && turretImg.complete && turretImg.naturalWidth > 0) {
      const tx = this.x + this.width / 2 - 35;
      const ty = this.y - 55;
      ctx.drawImage(turretImg, tx, ty, 70, 70);
    }

    // Can barı
    const barW = this.width;
    const barH = 12;
    const barY = this.y - 22;
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(this.x, barY, barW, barH);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(this.x, barY, barW * (this.health / this.maxHealth), barH);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  /** Mağara çıkış noktası (sağ kenari player için, sol kenar enemy için) */
  get spawnX() {
    return this.isPlayer ? this.x + this.width : this.x - 1;
  }
}

export class Unit {
  constructor(x, isPlayer, type) {
    this.x = x;
    this.isPlayer = isPlayer;
    this.type = type;
    this.markedForDeletion = false;
    this.actionTimer = 0;
    this.attackFrame = 0;

    if (type === 'melee') {
      this.width = 60;
      this.height = 80;
      this.maxHealth = 250;
      this.damage = 10;
      this.range = 45;
      this.speed = isPlayer ? 0.35 : -0.35;
      this.attackCooldown = 60;
      this.cost = 15;
    } else if (type === 'ranged') {
      this.width = 50;
      this.height = 75;
      this.maxHealth = 120;
      this.damage = 15;
      this.range = 280;
      this.speed = isPlayer ? 0.28 : -0.28;
      this.attackCooldown = 80;
      this.cost = 25;
    }

    this.y = 560 - this.height;
    this.health = this.maxHealth;
  }

  update(allUnits, projectiles) {
    if (this.attackFrame > 0) this.attackFrame--;

    let targetInRange = null;
    let closestEnemyDist = Infinity;
    let blockedInFront = false;   // önünde herhangi biri var mı (dur)
    let friendlyRangedAhead = false; // önünde dost sapanlı var mı

    for (let other of allUnits) {
      if (other === this || other.markedForDeletion) continue;

      // Önümüzdeki mesafeyi hesapla (+ = ilerde, - = arkamda)
      const dist = this.isPlayer
        ? (other.x - (this.x + this.width))
        : (this.x - (other.x + other.width));

      // — Önünde engel var mı? (dost ya da düşman, çok yakın)
      if (dist >= -5 && dist < 8) {
        blockedInFront = true;
      }

      // — Dost sapanlı önümüzde mi? (yalnızca ranged birimi için önemli)
      if (
        this.type === 'ranged' &&
        other.isPlayer === this.isPlayer &&
        other.type === 'ranged' &&
        dist > 0 && dist < this.range
      ) {
        friendlyRangedAhead = true;
      }

      // — Düşman en yakın hedef mi?
      if (other.isPlayer !== this.isPlayer && dist >= 0 && dist < closestEnemyDist) {
        closestEnemyDist = dist;
        if (dist <= this.range) {
          targetInRange = other;
        }
      }
    }

    // Sapanlı ateş mantığı:
    // Eğer sapanlıysa VE önünde dost sapanlı varsa → ateş etme
    // Ama önündeki ilk düşman melee ise (hedef melee) → ateş edebilir
    if (this.type === 'ranged' && targetInRange && friendlyRangedAhead) {
      // Dost sapanlı önünde olsa bile, hedef melee ise ateş et
      if (targetInRange.type !== 'melee') {
        targetInRange = null; // melee değilse ateş etme
      }
    }

    if (targetInRange) {
      this.actionTimer++;
      if (this.actionTimer >= this.attackCooldown) {
        this.attackFrame = 12;
        if (this.type === 'melee') {
          targetInRange.takeDamage(this.damage);
        } else {
          // ranged: mermi fırlat
          projectiles.push(new Projectile(
            this.isPlayer ? this.x + this.width : this.x,
            this.y + this.height / 2 - 5,
            this.isPlayer,
            this.damage
          ));
        }
        this.actionTimer = 0;
      }
      // Saldırırken hareket etme
    } else if (!blockedInFront) {
      this.x += this.speed;
      this.actionTimer = 0;
    }

    if (this.health <= 0) this.markedForDeletion = true;
  }

  draw(ctx, image) {
    ctx.save();

    // Saldırı animasyonu: hafif eğim
    if (this.attackFrame > 0) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height;
      ctx.translate(cx, cy);
      const rot = (this.attackFrame / 12) * (this.isPlayer ? 0.28 : -0.28);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);
    }

    if (image && image.complete && image.naturalWidth > 0) {
      // Görsel zaten doğru yönde (game.js'de pre-flipped)
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.isPlayer ? '#87CEFA' : '#FA8072';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    ctx.restore();

    // Can barı (image transform dışında çiziyoruz, her zaman doğru konumda)
    const barW = this.width;
    const barH = 7;
    const barY = this.y - 13;
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(this.x, barY, barW, barH);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(this.x, barY, barW * Math.max(0, this.health / this.maxHealth), barH);
  }

  takeDamage(amount) {
    this.health -= amount;
  }
}

export class Projectile {
  constructor(x, y, isPlayer, damage) {
    this.x = x;
    this.y = y;
    this.isPlayer = isPlayer;
    this.damage = damage;
    this.speed = isPlayer ? 6 : -6;
    this.radius = 7;
    this.markedForDeletion = false;
  }

  update(targets) {
    this.x += this.speed;

    for (let t of targets) {
      if (t.isPlayer === this.isPlayer || t.markedForDeletion) continue;
      if (
        this.x < t.x + t.width &&
        this.x + this.radius * 2 > t.x &&
        this.y < t.y + t.height &&
        this.y + this.radius * 2 > t.y
      ) {
        t.takeDamage(this.damage);
        this.markedForDeletion = true;
        break;
      }
    }

    if (this.x < -20 || this.x > 1250) this.markedForDeletion = true;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a020';
    ctx.fill();
    ctx.strokeStyle = '#5a3800';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** ============================================================
 *  METEOR - özel güç: gökten inen ateş topu
 * ============================================================ */
export class Meteor {
  constructor(targetX) {
    // Yukarıdan rastgele açıyla geliyor
    this.targetX = targetX;
    this.targetY = 555;  // zemin
    this.x = targetX - 250 + Math.random() * 80; // sol üstten
    this.y = -120;
    this.radius = 16;
    this.damage = 120;
    this.markedForDeletion = false;
    this.exploded = false;
    this.explosionTimer = 0;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const spd = 9;
    this.vx = (dx / dist) * spd;
    this.vy = (dy / dist) * spd;

    // iz (trail) noktaları
    this.trail = [];
  }

  update(units, bases) {
    if (this.exploded) {
      this.explosionTimer++;
      if (this.explosionTimer > 18) this.markedForDeletion = true;
      return;
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

    // Zemine çarptı mı?
    if (this.y >= this.targetY) {
      this.y = this.targetY;
      this.exploded = true;

      // Alan hasarı: etraftaki düşman birimlerine
      const aoeRadius = 90;
      for (let u of units) {
        if (u.isPlayer || u.markedForDeletion) continue;
        const cx = u.x + u.width / 2;
        const dist = Math.abs(cx - this.targetX);
        if (dist < aoeRadius) {
          const falloff = 1 - dist / aoeRadius;
          u.takeDamage(Math.floor(this.damage * falloff));
        }
      }
      // Düşman üssüne de vurabilir
      for (let b of bases) {
        if (b.isPlayer) continue;
        const cx = b.x + b.width / 2;
        const dist = Math.abs(cx - this.targetX);
        if (dist < aoeRadius) {
          const falloff = 1 - dist / aoeRadius;
          b.takeDamage(Math.floor(this.damage * 0.4 * falloff));
        }
      }
    }
  }

  draw(ctx) {
    if (this.exploded) {
      // Patlama dairesi
      const progress = this.explosionTimer / 18;
      const r = 30 + progress * 70;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      const grad = ctx.createRadialGradient(this.targetX, this.targetY, 0, this.targetX, this.targetY, r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, '#ff8800');
      grad.addColorStop(1, 'rgba(200, 50, 0, 0)');
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();

    // Ateş izi (trail)
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.6;
      const r = this.radius * (i / this.trail.length);
      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 140, 0, ${alpha})`;
      ctx.fill();
    }

    // Meteor gövdesi
    const grd = ctx.createRadialGradient(
      this.x - 4, this.y - 4, 1,
      this.x, this.y, this.radius
    );
    grd.addColorStop(0, '#fff9e0');
    grd.addColorStop(0.35, '#ff9900');
    grd.addColorStop(0.75, '#cc2200');
    grd.addColorStop(1, '#660000');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Parlama efekti
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 120, 0, 0.25)';
    ctx.fill();

    ctx.restore();
  }
}
