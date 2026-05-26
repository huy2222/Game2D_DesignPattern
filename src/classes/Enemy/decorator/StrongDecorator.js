import EnemyDecorator from "./EnemyDecorator";

export default class StrongDecorator extends EnemyDecorator {
  constructor(enemy) {
    super(enemy);
    this.baseDamage = this.enemy.damage;
    this.hasAttacked = false;

    // Bơm máu cho Boss (Gấp 5 lần quái thường)
    this.enemy.maxHp = 500;
    this.enemy.hp = 500;
    this.enemy.updateHealthBar(); // Vẽ lại thanh máu dài hơn

    // Ép kích thước Golem (vì frame gốc 256px khá to)
    this.enemy.setScale(1.5);
  }

  attack() {
    if (!this.hasAttacked) {
      this.enemy.damage = this.baseDamage * 5; // Đòn đầu x5
      this.hasAttacked = true;
    } else {
      this.enemy.damage = this.baseDamage;
    }

    this.enemy.attack();
  }
}
