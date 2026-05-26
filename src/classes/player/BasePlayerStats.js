export default class BasePlayerStats {
  constructor(player) {
    this.player = player;

    this.player.maxHp ??= 100;
    this.player.hp ??= this.player.maxHp;
    this.player.baseMoveSpeed ??= 150;
    this.player.baseAttackDamage ??= 10;
  }

  getMoveSpeed() {
    return this.player.baseMoveSpeed;
  }

  getAttackDamage() {
    return this.player.baseAttackDamage;
  }

  getDamageReduction() {
    return 0;
  }

  getCriticalChance() {
    return 0;
  }

  hasBurnAttack() {
    return false;
  }

  getBurnDamage() {
    return 0;
  }

  getBurnTicks() {
    return 0;
  }
}
