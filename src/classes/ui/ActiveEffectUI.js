import Phaser from "phaser";
import { ITEM_TEXTURE_KEYS } from "../items/ItemFactory";

const EFFECT_ORDER = ["speed", "damage", "shield", "critical", "burn"];

export default class ActiveEffectUI {
  constructor(scene, x = 12, y = 58) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.slotSize = 36;
    this.gap = 8;
    this.slots = new Map();
  }

  sync(effectManager) {
    const activeEffects = effectManager?.getActiveEffects?.() || [];
    const activeTypes = new Set(activeEffects.map((effect) => effect.type));

    Array.from(this.slots.keys()).forEach((type) => {
      if (!activeTypes.has(type)) {
        this.destroySlot(type);
      }
    });

    activeEffects.forEach((effect, index) => {
      const slot = this.slots.get(effect.type) || this.createSlot(effect.type);
      slot.effect = effect;
      this.positionSlot(slot, index);
    });
  }

  update() {
    EFFECT_ORDER.forEach((type) => {
      const slot = this.slots.get(type);
      if (!slot?.effect) return;

      const remaining = Math.max(0, slot.effect.expiresAt - this.scene.time.now);
      const ratio = Phaser.Math.Clamp(remaining / slot.effect.duration, 0, 1);
      this.drawCooldown(slot, ratio);
    });
  }

  createSlot(type) {
    const background = this.scene.add.graphics().setScrollFactor(0).setDepth(110);
    const icon = this.scene.add
      .image(0, 0, ITEM_TEXTURE_KEYS[type])
      .setDisplaySize(24, 24)
      .setScrollFactor(0)
      .setDepth(111);
    const ring = this.scene.add.graphics().setScrollFactor(0).setDepth(112);

    const slot = { type, background, icon, ring, effect: null };
    this.slots.set(type, slot);
    return slot;
  }

  positionSlot(slot, index) {
    const x = this.x + index * (this.slotSize + this.gap);
    const y = this.y;

    slot.x = x;
    slot.y = y;
    slot.background.clear();
    slot.background.fillStyle(0x000000, 0.55);
    slot.background.fillRoundedRect(x, y, this.slotSize, this.slotSize, 6);
    slot.background.lineStyle(1, 0xffffff, 0.22);
    slot.background.strokeRoundedRect(x, y, this.slotSize, this.slotSize, 6);
    slot.icon.setPosition(x + this.slotSize / 2, y + this.slotSize / 2);
  }

  drawCooldown(slot, ratio) {
    const centerX = slot.x + this.slotSize / 2;
    const centerY = slot.y + this.slotSize / 2;
    const radius = 18;
    const start = -Math.PI / 2;
    const end = start + Math.PI * 2 * ratio;

    slot.ring.clear();
    slot.ring.lineStyle(3, 0x000000, 0.45);
    slot.ring.strokeCircle(centerX, centerY, radius);

    if (ratio > 0) {
      slot.ring.lineStyle(3, 0xfacc15, 0.95);
      slot.ring.beginPath();
      slot.ring.arc(centerX, centerY, radius, start, end, false);
      slot.ring.strokePath();
    }
  }

  destroySlot(type) {
    const slot = this.slots.get(type);
    if (!slot) return;

    slot.background.destroy();
    slot.icon.destroy();
    slot.ring.destroy();
    this.slots.delete(type);
  }

  destroy() {
    Array.from(this.slots.keys()).forEach((type) => this.destroySlot(type));
  }
}
