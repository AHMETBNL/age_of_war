import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
canvas.width  = 1200;
canvas.height = 700;

const game = new Game(canvas);

document.getElementById('btn-train-melee').addEventListener('click', () => {
  game.spawnUnit(true, 'melee');
});

document.getElementById('btn-train-ranged').addEventListener('click', () => {
  game.spawnUnit(true, 'ranged');
});

document.getElementById('btn-buy-turret').addEventListener('click', () => {
  game.buyTurret(true);
});

document.getElementById('btn-meteor').addEventListener('click', () => {
  game.activateMeteor();
});

document.getElementById('btn-evolve').addEventListener('click', () => {
  if (game.playerXP >= 4000) {
    game.playerXP -= 4000;
    alert('Sonraki çağa geçildi! (yakında eklenecek)');
  } else {
    alert('Yeterli XP yok!');
  }
});

let lastTime = 0;
function animate(timeStamp) {
  const delta = timeStamp - lastTime;
  lastTime = timeStamp;

  game.update();
  game.draw();

  if (!game.gameOver) requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
