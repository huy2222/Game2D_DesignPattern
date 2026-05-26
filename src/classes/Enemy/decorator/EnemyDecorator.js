export default class EnemyDecorator {
  constructor(enemy) {
    this.enemy = enemy;
  }

  // Các hàm này sẽ gọi trực tiếp xuống đối tượng bị bọc
  update() {
    this.enemy.update();
  }

  attack() {
    this.enemy.attack();
  }
}
