import Phaser from "phaser";

export default class BasicEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, animPrefix, maxHp = 100) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.target = scene.player;
    this.speed = 50;
    this.damage = 10;
    this.isAttacking = false;
    this.animPrefix = animPrefix;
    this.enemyType = animPrefix; // Lưu loại quái để hồi sinh

    // --- HỆ THỐNG MÁU ---
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(15);
    this.updateHealthBar();

    this.setDepth(10);
    this.setScale(3);

    try {
      if (this.animPrefix) this.play(`anim_${this.animPrefix}_idle`);
    } catch (e) {
      console.warn(`Lỗi ảnh Idle của ${this.animPrefix}.`);
    }
  }

  update() {
    if (!this.target || !this.active) return;

    // Cập nhật vị trí thanh máu đi theo đầu quái vật
    if (this.healthBar) {
      this.healthBar.x = this.x - 20;
      this.healthBar.y = this.y - (this.height * this.scaleY) / 2 - 15;
    }

    if (this.isAttacking) return;

    const targetX =
      this.target.x !== undefined ? this.target.x : this.target.sprite?.x;
    const targetY =
      this.target.y !== undefined ? this.target.y : this.target.sprite?.y;

    if (targetX === undefined || targetY === undefined) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      targetX,
      targetY,
    );

    if (distance < 40) {
      this.attack();
    } else {
      this.scene.physics.moveTo(this, targetX, targetY, this.speed);

      if (this.body.velocity.x > 0) {
        this.setFlipX(false);
      } else if (this.body.velocity.x < 0) {
        this.setFlipX(true);
      }

      try {
        if (
          this.animPrefix &&
          this.anims.currentAnim?.key !== `anim_${this.animPrefix}_walk`
        ) {
          this.play(`anim_${this.animPrefix}_walk`);
        }
      } catch (e) {}
    }
  }

  attack() {
    this.isAttacking = true;
    this.setVelocity(0, 0);

    if (this.animPrefix) {
      try {
        this.play(`anim_${this.animPrefix}_attack1`);
      } catch (e) {
        this.isAttacking = false;
        return;
      }

      this.once("animationcomplete", (anim) => {
        if (anim.key === `anim_${this.animPrefix}_attack1` && this.active) {
          this.isAttacking = false;
          if (this.target && typeof this.target.takeDamage === "function") {
            this.target.takeDamage(this.damage);
          }
        }
      });
    }
  }

  // --- LOGIC NHẬN SÁT THƯƠNG VÀ CHẾT ---
  takeDamage(amount) {
    if (this.hp <= 0 || !this.active) return;

    this.hp -= amount;
    this.updateHealthBar();

    // Nhấp nháy đỏ khi bị bắn
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  updateHealthBar() {
    this.healthBar.clear();
    if (this.hp <= 0) return;

    // Viền đen
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(0, 0, 40, 5);

    // Màu máu (Xanh nếu máu > 30%, Đỏ nếu sắp chết)
    const width = (this.hp / this.maxHp) * 40;
    this.healthBar.fillStyle(
      this.hp > this.maxHp * 0.3 ? 0x00ff00 : 0xff0000,
      1,
    );
    this.healthBar.fillRect(0, 0, width, 5);
  }

  die() {
    this.active = false;
    this.setVelocity(0, 0);
    if (this.healthBar) this.healthBar.destroy();

    const deathAnim = `anim_${this.animPrefix}_death`;
    const hurtAnim = `anim_${this.animPrefix}_hurt`;

    if (this.scene.anims.exists(deathAnim)) {
      this.play(deathAnim, true);
    } else if (this.scene.anims.exists(hurtAnim)) {
      this.play(hurtAnim, true);
    }

    // Mờ dần rồi biến mất, sau đó báo cho Scene biết để tăng Kill Count
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        this.disableBody(true, true);
        this.scene.events.emit("enemy_died", this); // Phát sự kiện để GameScene gọi lính mới
        this.destroy();
      },
    });
  }

  destroy(fromScene) {
    if (this.healthBar) this.healthBar.destroy();
    super.destroy(fromScene);
  }
}
