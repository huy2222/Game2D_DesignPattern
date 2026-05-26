import PlayerStatsDecorator from "./PlayerStatsDecorator";

export default class BurnAttackDecorator extends PlayerStatsDecorator {
  hasBurnAttack() {
    return true;
  }

  getBurnDamage() {
    return Math.max(this.stats.getBurnDamage(), 4);
  }

  getBurnTicks() {
    return Math.max(this.stats.getBurnTicks(), 3);
  }
}
