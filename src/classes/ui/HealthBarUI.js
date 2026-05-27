import Phaser from "phaser";

export default class HealthBarUI {
  constructor(scene, x = 12, y = 12, width = 160, height = 18) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(120);
  }

  update(currentHp, maxHp) {
    const ratio = Phaser.Math.Clamp(currentHp / maxHp, 0, 1);
    const fillWidth = Math.round(this.width * ratio);
    const fillColor = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xfacc15 : 0xef4444;

    this.graphics.clear();

    // Draw a compact HUD-style health bar without text.
    this.graphics.fillStyle(0x000000, 0.6);
    this.graphics.fillRoundedRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4, 6);
    this.graphics.fillStyle(0x3f1111, 0.9);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 4);
    this.graphics.fillStyle(fillColor, 1);
    this.graphics.fillRoundedRect(this.x, this.y, fillWidth, this.height, 4);
    this.graphics.lineStyle(2, 0xffffff, 0.65);
    this.graphics.strokeRoundedRect(this.x, this.y, this.width, this.height, 4);
  }

  destroy() {
    this.graphics.destroy();
  }
}
