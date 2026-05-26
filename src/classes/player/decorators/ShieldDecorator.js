import PlayerStatsDecorator from "./PlayerStatsDecorator";

export default class ShieldDecorator extends PlayerStatsDecorator {
  getDamageReduction() {
    return Math.min(this.stats.getDamageReduction() + 0.5, 0.8);
  }
}
