import EnemyDecorator from "./EnemyDecorator";

export default class FastDecorator extends EnemyDecorator {
  constructor(enemy) {
    super(enemy);

    // Thay đổi thuộc tính của enemy gốc
<<<<<<< HEAD:src/classes/decorator/FastDecorator.js
    this.enemy.speed = 50;
=======
    this.enemy.speed = 100;
>>>>>>> b53850fd44f24dfc0b8f10769fdb6f13259394ab:src/classes/Enemy/decorator/FastDecorator.js
    this.enemy.setTint(0xff0000);
  }

  attack() {
    console.log("Cắn tốc độ cao! Chảy máu liên tục");
    this.enemy.attack();
  }
}
