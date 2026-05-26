import PlayerStatsDecorator from "./PlayerStatsDecorator";

export default class SpeedDecorator extends PlayerStatsDecorator {
  getMoveSpeed() {
    return Math.round(this.stats.getMoveSpeed() * 1.5);
  }
}
