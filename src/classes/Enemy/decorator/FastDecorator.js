import EnemyDecorator from "./EnemyDecorator";

export default class FastDecorator extends EnemyDecorator {
  constructor(enemy) {
    super(enemy);

    // Thay đổi thuộc tính của enemy gốc
    this.enemy.speed = 150;
    this.enemy.setTint(0xff0000);
  }

  attack() {
    console.log("Cắn tốc độ cao! Chảy máu liên tục");
    this.enemy.attack();
  }
}
