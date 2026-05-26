import EnemyDecorator from "./EnemyDecorator";
import Phaser from "phaser";

export default class StealthDecorator extends EnemyDecorator {
  constructor(enemy) {
    super(enemy);
    this.enemy.damage = 30;

    // Khởi tạo ban đầu màu đen
    this.enemy.setTint(0x000000);
  }

  update() {
    // Vẫn gọi update gốc để quái vật di chuyển và tìm đường
    super.update();

    // Kiểm tra xem quái có mục tiêu không
    if (!this.enemy.target) return;

    // Tính khoảng cách giữa con quái này và người chơi
    const distance = Phaser.Math.Distance.Between(
      this.enemy.x,
      this.enemy.y,
      this.enemy.target.x,
      this.enemy.target.y,
    );

    // Logic đổi màu theo khoảng cách:
    // - Xa hơn 150px: Nhuộm màu đen (0x000000)
    // - Gần hơn 150px (từ 150px trở xuống): Nhuộm màu xanh lá (0x00ff00)
    if (distance > 100) {
      this.enemy.alpha = 0.2;
    } else {
      this.enemy.alpha = 1;

      this.enemy.setTint(0x00ff00);
    }
  }

  attack() {
    this.enemy.attack(); // Giữ nguyên logic tấn công
  }
}
