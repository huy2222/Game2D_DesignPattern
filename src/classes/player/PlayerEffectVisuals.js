import Phaser from "phaser";

export default class PlayerEffectVisuals {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.graphics = scene.add.graphics().setDepth(35);
  }

  update(effectManager) {
    this.graphics.clear();
    if (!effectManager) return;

    if (effectManager.hasEffect("shield")) {
      this.drawShield();
    }
    if (effectManager.hasEffect("speed")) {
      this.drawWind();
    }
    if (effectManager.hasEffect("damage")) {
      this.drawDamageAura();
    }
  }

  drawShield() {
    const pulse = Math.sin(this.scene.time.now / 180) * 3;
    this.graphics.lineStyle(3, 0xffffff, 0.82);
    this.graphics.strokeCircle(this.player.x, this.player.y + 4, 42 + pulse);
    this.graphics.lineStyle(1, 0x93c5fd, 0.6);
    this.graphics.strokeCircle(this.player.x, this.player.y + 4, 35 - pulse * 0.4);
  }

  drawWind() {
    const velocity = this.player.body.velocity;
    if (Math.abs(velocity.x) < 1 && Math.abs(velocity.y) < 1) return;

    const angle = Math.atan2(velocity.y, velocity.x);
    const behind = angle + Math.PI;
    const side = angle + Math.PI / 2;

    this.graphics.lineStyle(2, 0x7dd3fc, 0.75);
    for (let i = -1; i <= 1; i += 1) {
      const offset = i * 12;
      const startX = this.player.x + Math.cos(behind) * 20 + Math.cos(side) * offset;
      const startY = this.player.y + Math.sin(behind) * 20 + Math.sin(side) * offset;
      const endX = startX + Math.cos(behind) * 28;
      const endY = startY + Math.sin(behind) * 28;
      this.graphics.lineBetween(startX, startY, endX, endY);
    }
  }

  drawDamageAura() {
    const time = this.scene.time.now / 150;
    const pulse = Math.sin(this.scene.time.now / 120) * 4;

    // Clear power aura: rotating red-orange ring plus rising energy sparks.
    this.graphics.lineStyle(4, 0xff7a00, 0.72);
    this.graphics.strokeCircle(this.player.x, this.player.y + 6, 32 + pulse);
    this.graphics.lineStyle(2, 0xff2200, 0.55);
    this.graphics.strokeCircle(this.player.x, this.player.y + 6, 24 - pulse * 0.25);

    for (let i = 0; i < 8; i += 1) {
      const angle = time + i * 0.78;
      const radius = 30 + Math.sin(time + i) * 3;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius + 6;
      const sparkHeight = 12 + Math.sin(time * 2 + i) * 4;

      this.graphics.lineStyle(2, i % 2 === 0 ? 0xffc400 : 0xff3300, 0.8);
      this.graphics.lineBetween(x, y + sparkHeight / 2, x, y - sparkHeight / 2);
      this.graphics.fillStyle(0xfff1a8, 0.85);
      this.graphics.fillCircle(x, y - sparkHeight / 2, 2);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
