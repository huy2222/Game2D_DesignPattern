import BasePlayerStats from "./BasePlayerStats";
import SpeedDecorator from "./decorators/SpeedDecorator";
import DamageDecorator from "./decorators/DamageDecorator";
import ShieldDecorator from "./decorators/ShieldDecorator";
import CriticalDecorator from "./decorators/CriticalDecorator";
import BurnAttackDecorator from "./decorators/BurnAttackDecorator";

const DECORATORS = {
  speed: SpeedDecorator,
  damage: DamageDecorator,
  shield: ShieldDecorator,
  critical: CriticalDecorator,
  burn: BurnAttackDecorator,
};

const EFFECT_ORDER = ["speed", "damage", "shield", "critical", "burn"];
const INSTANT_PICKUP_DISPLAY_DURATION = 3000;

export default class PlayerEffectManager {
  constructor(scene, player, healthUI, onChange) {
    this.scene = scene;
    this.player = player;
    this.healthUI = healthUI;
    this.onChange = onChange;
    this.baseStats = new BasePlayerStats(player);
    this.activeEffects = new Map();
    this.currentStats = this.baseStats;
  }

  applyItemEffect(effect) {
    const beforeStats = this.getStatSnapshot();
    const wasActive = effect.type !== "health" && this.hasEffect(effect.type);

    if (effect.type === "health") {
      this.heal(effect.amount);
      this.onChange?.();
      return this.createPickupChange(effect, beforeStats, this.getStatSnapshot());
    }

    const Decorator = DECORATORS[effect.type];
    if (!Decorator) return null;

    const expiresAt = this.scene.time.now + effect.duration;
    const oldEffect = this.activeEffects.get(effect.type);
    oldEffect?.timer?.remove(false);

    const activeEffect = { ...effect, Decorator, expiresAt };
    this.activeEffects.set(effect.type, activeEffect);

    // Same effect resets time instead of stacking stats.
    activeEffect.timer = this.scene.time.delayedCall(effect.duration, () => {
      const current = this.activeEffects.get(effect.type);
      if (current?.expiresAt === expiresAt) {
        this.activeEffects.delete(effect.type);
        this.rebuildStats();
        this.onChange?.();
      }
    });

    this.rebuildStats();
    this.onChange?.();
    return this.createPickupChange(
      effect,
      beforeStats,
      this.getStatSnapshot(),
      wasActive,
    );
  }

  rebuildStats() {
    this.currentStats = EFFECT_ORDER.reduce((stats, type) => {
      const effect = this.activeEffects.get(type);
      return effect ? new effect.Decorator(stats) : stats;
    }, this.baseStats);
  }

  getMoveSpeed() {
    return this.currentStats.getMoveSpeed();
  }

  rollAttackDamage() {
    const baseDamage = this.currentStats.getAttackDamage();
    const isCritical = Math.random() < this.currentStats.getCriticalChance();
    return {
      amount: isCritical ? baseDamage * 2 : baseDamage,
      isCritical,
    };
  }

  hasBurnAttack() {
    return this.currentStats.hasBurnAttack();
  }

  getBurnDamage() {
    return this.currentStats.getBurnDamage();
  }

  getBurnTicks() {
    return this.currentStats.getBurnTicks();
  }

  takeDamage(amount) {
    const reduction = this.currentStats.getDamageReduction();
    return Math.max(0, Math.ceil(amount * (1 - reduction)));
  }

  heal(amount) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
    this.updateHealthUI();
  }

  updateHealthUI() {
    this.healthUI?.update(this.player.hp, this.player.maxHp);
  }

  updateHpText() {
    this.updateHealthUI();
  }

  getActiveEffectLabels() {
    return EFFECT_ORDER.map((type) => this.activeEffects.get(type)?.label).filter(Boolean);
  }

  getActiveEffects() {
    return EFFECT_ORDER.map((type) => this.activeEffects.get(type)).filter(Boolean);
  }

  hasEffect(type) {
    return this.activeEffects.has(type);
  }

  getStatSnapshot() {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      moveSpeed: this.currentStats.getMoveSpeed(),
      attackDamage: this.currentStats.getAttackDamage(),
      damageReduction: this.currentStats.getDamageReduction(),
      criticalChance: this.currentStats.getCriticalChance(),
      hasBurnAttack: this.currentStats.hasBurnAttack(),
      burnDamage: this.currentStats.getBurnDamage(),
      burnTicks: this.currentStats.getBurnTicks(),
    };
  }

  createPickupChange(effect, before, after, wasActive = false) {
    const durationText = effect.duration
      ? `${Math.round(effect.duration / 1000)}s`
      : null;
    const statusText = wasActive ? "Gia han" : "Tang chi so";
    const activeEffect = this.activeEffects.get(effect.type);
    const baseChange = {
      type: effect.type,
      durationText,
      statusText,
      expiresAt:
        activeEffect?.expiresAt ||
        this.scene.time.now + INSTANT_PICKUP_DISPLAY_DURATION,
      duration: effect.duration || INSTANT_PICKUP_DISPLAY_DURATION,
    };

    switch (effect.type) {
      case "speed":
        return {
          ...baseChange,
          title: "Tang toc",
          statLine: `Toc do: ${before.moveSpeed} -> ${after.moveSpeed}`,
        };
      case "damage":
        return {
          ...baseChange,
          title: "Tang sat thuong",
          statLine: `Sat thuong: ${before.attackDamage} -> ${after.attackDamage}`,
        };
      case "shield":
        return {
          ...baseChange,
          title: "Khien bao ve",
          statLine: `Giam sat thuong: ${this.formatPercent(before.damageReduction)} -> ${this.formatPercent(after.damageReduction)}`,
        };
      case "health":
        return {
          ...baseChange,
          title: "Hoi mau",
          statLine: `Mau: ${before.hp}/${before.maxHp} -> ${after.hp}/${after.maxHp}`,
          durationText: `+${effect.amount} HP`,
          statusText: "Hoi phuc",
        };
      case "critical":
        return {
          ...baseChange,
          title: "Chi mang",
          statLine: `Ti le crit: ${this.formatPercent(before.criticalChance)} -> ${this.formatPercent(after.criticalChance)}`,
        };
      case "burn":
        return {
          ...baseChange,
          title: "Mui ten lua",
          statLine: `Dot: ${this.formatBurn(before)} -> ${this.formatBurn(after)}`,
        };
      default:
        return null;
    }
  }

  formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  formatBurn(stats) {
    if (!stats.hasBurnAttack) return "Tat";
    return `${stats.burnDamage} x ${stats.burnTicks}`;
  }
}
