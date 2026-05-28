import Phaser from "phaser";

const ITEM_COLORS = {
  speed: 0x38bdf8,
  damage: 0xf97316,
  shield: 0x60a5fa,
  health: 0x22c55e,
  critical: 0xfacc15,
  burn: 0xef4444,
};

export default class BaseItem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, config.textureKey);

    this.config = config;
    this.itemType = config.type;
    this.baseY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const color = ITEM_COLORS[this.itemType] || 0xffffff;

    // Small ground shadow makes the icon feel like it sits on the map.
    this.shadow = scene.add.ellipse(x, y + 11, 22, 8, 0x000000, 0.25);
    this.shadow.setDepth(28);

    // Soft ring helps the item stay visible without looking like a huge square.
    this.aura = scene.add.circle(x, y, 17, color, 0.14);
    this.aura.setStrokeStyle(1, color, 0.35);
    this.aura.setDepth(29);

    this.setDisplaySize(28, 28);
    this.setDepth(30);
    this.setAlpha(0.95);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    // Pickup range is larger than the icon so running across it feels responsive.
    this.body.setSize(72, 72);
    this.body.setOffset(92, 92);

    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.auraTween = scene.tweens.add({
      targets: this.aura,
      scale: 1.18,
      alpha: 0.08,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  collect(effectManager) {
    this.scene.events.emit("item_collected", this.config);
    effectManager.applyItemEffect(this.config.effect);
    this.floatTween?.stop();
    this.auraTween?.stop();
    this.shadow?.destroy();
    this.aura?.destroy();
    this.disableBody(true, true);
    this.destroy();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.aura) {
      this.aura.setPosition(this.x, this.baseY);
    }
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.baseY + 11);
    }
  }

  destroy(fromScene) {
    this.floatTween?.stop();
    this.auraTween?.stop();
    this.shadow?.destroy();
    this.aura?.destroy();
    super.destroy(fromScene);
  }
}
