export default class PlayerStatsDecorator {
  constructor(stats) {
    this.stats = stats;
  }

  getMoveSpeed() {
    return this.stats.getMoveSpeed();
  }

  getAttackDamage() {
    return this.stats.getAttackDamage();
  }

  getDamageReduction() {
    return this.stats.getDamageReduction();
  }

  getCriticalChance() {
    return this.stats.getCriticalChance();
  }

  hasBurnAttack() {
    return this.stats.hasBurnAttack();
  }

  getBurnDamage() {
    return this.stats.getBurnDamage();
  }

  getBurnTicks() {
    return this.stats.getBurnTicks();
  }
}
