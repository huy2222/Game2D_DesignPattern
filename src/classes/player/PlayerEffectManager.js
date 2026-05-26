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

export default class PlayerEffectManager {
  constructor(scene, player, hpText, onChange) {
    this.scene = scene;
    this.player = player;
    this.hpText = hpText;
    this.onChange = onChange;
    this.baseStats = new BasePlayerStats(player);
    this.activeEffects = new Map();
    this.currentStats = this.baseStats;
  }

  applyItemEffect(effect) {
    if (effect.type === "health") {
      this.heal(effect.amount);
      this.onChange?.();
      return;
    }

    const Decorator = DECORATORS[effect.type];
    if (!Decorator) return;

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
    this.updateHpText();
  }

  updateHpText() {
    this.hpText?.setText(`HP: ${this.player.hp}`);
  }

  getActiveEffectLabels() {
    return EFFECT_ORDER.map((type) => this.activeEffects.get(type)?.label).filter(Boolean);
  }
}
