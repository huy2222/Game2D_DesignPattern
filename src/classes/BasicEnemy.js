import Phaser from "phaser";

export default class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
  // Thêm tham số animPrefix (ví dụ: "orc" hoặc "soldier")
  constructor(scene, x, y, texture, animPrefix) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3);

    this.target = scene.player;
    this.speed = 50;
    this.damage = 10;
    this.hp = 30; // Máu của enemy

    // Cờ trạng thái: Khóa di chuyển khi đang vung vũ khí chém
    this.isAttacking = false;

    // Lưu lại tiền tố để gọi đúng bộ animation (ví dụ: anim_orc_walk, anim_soldier_walk)
    this.animPrefix = animPrefix;

    // Đảm bảo quái vật luôn nổi lên trên cùng, không bị cây cối hay hồ nước đè lên
    this.setDepth(10);

    // Gọi animation đứng yên khi vừa sinh ra
    if (this.animPrefix) {
      this.play(`anim_${this.animPrefix}_idle`);
    }
  }

  update() {
    // Không làm gì nếu không có mục tiêu, đã chết, hoặc ĐANG trong tư thế tấn công
    if (!this.target || !this.active || this.isAttacking) return;

    // Tính khoảng cách tới player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y,
    );

    if (distance < 40) {
      this.attack();
    } else {
      // 1. Di chuyển về phía người chơi
      this.scene.physics.moveToObject(this, this.target, this.speed);

      // 2. Lật ảnh (xoay mặt) theo hướng di chuyển
      if (this.body.velocity.x > 0) {
        this.setFlipX(false); // Mặt hướng sang phải
      } else if (this.body.velocity.x < 0) {
        this.setFlipX(true); // Mặt hướng sang trái
      }

      // 3. Chạy animation đi bộ (chỉ gọi nếu nó chưa chạy để tránh giật lag)
      if (
        this.animPrefix &&
        this.anims.currentAnim?.key !== `anim_${this.animPrefix}_walk`
      ) {
        this.play(`anim_${this.animPrefix}_walk`);
      }
    }
  }

  attack() {
    this.isAttacking = true; // Khóa không cho update() chạy lệnh đi bộ nữa
    this.setVelocity(0, 0); // Dừng hẳn lại khi vung vũ khí

    if (this.animPrefix) {
      // Phát animation chém
      this.play(`anim_${this.animPrefix}_attack1`);

      // Bắt sự kiện khi animation chém xong 1 vòng
      this.once("animationcomplete", (anim) => {
        if (anim.key === `anim_${this.animPrefix}_attack1`) {
          this.isAttacking = false; // Mở khóa để tiếp tục đi bộ/đuổi theo
          
          // Kiểm tra nếu quái còn sống và player còn ở trong tầm đánh thì trừ máu
          if (this.active && this.target && this.target.active) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
            if (dist < 60 && this.target.takeDamage) {
              this.target.takeDamage(this.damage);
            }
          }
        }
      });
    } else {
      // Fallback an toàn nếu lỡ không truyền animPrefix
      this.scene.time.delayedCall(500, () => {
        this.isAttacking = false;
        if (this.active && this.target && this.target.takeDamage) {
            this.target.takeDamage(this.damage);
        }
      });
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    
    // Đổi màu đỏ chớp chớp khi bị hit
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
        this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.active = false;
    this.setVelocity(0, 0);
    if (this.animPrefix) {
      this.play(`anim_${this.animPrefix}_death`);
      this.once("animationcomplete", () => {
        this.destroy();
      });
    } else {
      this.destroy();
    }
  }
}
