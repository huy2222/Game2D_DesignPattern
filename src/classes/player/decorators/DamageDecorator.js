import PlayerStatsDecorator from "./PlayerStatsDecorator";

export default class DamageDecorator extends PlayerStatsDecorator {
  getAttackDamage() {
    return this.stats.getAttackDamage() + 10;
  }
}
