import PlayerStatsDecorator from "./PlayerStatsDecorator";

export default class CriticalDecorator extends PlayerStatsDecorator {
  getCriticalChance() {
    return Math.min(this.stats.getCriticalChance() + 0.35, 1);
  }
}
