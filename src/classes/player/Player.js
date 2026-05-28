import Phaser from "phaser";
import PlayerEffectManager from "./PlayerEffectManager";
import HealthBarUI from "../ui/HealthBarUI";
import PlayerEffectVisuals from "./PlayerEffectVisuals";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    // Thêm sprite vào scene và kích hoạt vật lý
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(3); // Làm player bự bằng enemy

    // Thu nhỏ hitbox (bounding box) để va chạm chuẩn xác hơn
    this.body.setSize(20, 30);
    this.body.setOffset(40, 60);

    // Thêm hệ thống máu cho player
    this.maxHp = 200;
    this.hp = this.maxHp;
    this.baseMoveSpeed = 175;
    this.baseAttackDamage = 25;
    this.healthBarUI = new HealthBarUI(scene, 12, 12);
    this.healthBarUI.update(this.hp, this.maxHp);
    this.effectVisuals = new PlayerEffectVisuals(scene, this);

    // Sự kiện chuyển về idle khi bắn xong
    this.on("animationcomplete-shoot", () => {
      if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        this.play("idle", true);
      }
    });

    // --- THIẾT LẬP PHÍM BẤM ---
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // --- TẠO NHÓM MŨI TÊN ---
    this.arrows = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: "arrow",
    });
    this.lastFired = 0;
    this.fireArrowTrails = new Map();
    this.isDead = false;

    // Sự kiện click chuột để bắn
    this.handlePointerDown = (pointer) => {
      if (scene.time.now > this.lastFired) {
        this.play("shoot", true);
        this.shootArrowPointer(pointer);
        this.lastFired = scene.time.now + 400;
      }
    };
    scene.input.on("pointerdown", this.handlePointerDown);
  }

  initEffects(effectText, onUpdate) {
    this.playerEffects = new PlayerEffectManager(
      this.scene,
      this,
      this.healthBarUI,
      onUpdate,
    );
  }

  takeDamage(amount) {
    if (this.isDead) return;

    let finalDamage = amount;
    if (this.playerEffects) {
      finalDamage = this.playerEffects.takeDamage(amount);
    }
    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      console.log("Player died!");
      this.isDead = true;
      this.setVelocity(0, 0);
      this.scene.events.emit("player_dead", this);
    }

    if (this.playerEffects) {
      this.playerEffects.updateHealthUI();
    } else {
      this.healthBarUI.update(this.hp, this.maxHp);
    }

    // Hiệu ứng chớp đỏ khi bị đánh
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
    });
  }

  update(time) {
    const speed = this.playerEffects
      ? this.playerEffects.getMoveSpeed()
      : this.baseMoveSpeed;
    this.setVelocity(0);

    // Di chuyển
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.setVelocityY(speed);
    }

    // Xử lý animation di chuyển vs đứng yên
    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
      if (this.anims.currentAnim?.key !== "shoot") {
        this.play("walk", true);
      }
    } else {
      if (this.anims.currentAnim?.key !== "shoot") {
        this.play("idle", true);
      }
    }

    // Xóa mũi tên khi bay ra ngoài bản đồ
    this.arrows.getChildren().forEach((arrow) => {
      if (!arrow.active) return;
      this.updateFireArrowTrail(arrow);

      const bounds = this.scene.physics.world.bounds;
      if (
        arrow.x < bounds.x ||
        arrow.x > bounds.right ||
        arrow.y < bounds.y ||
        arrow.y > bounds.bottom
      ) {
        this.clearFireArrowTrail(arrow);
        arrow.destroy();
      }
    });

    this.effectVisuals.update(this.playerEffects);
  }

  shootArrowPointer(pointer) {
    // Tính toán góc giữa player và vị trí chuột trong world
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );

    // Tính toán vị trí xuất phát của mũi tên (cách tâm player 40 pixel)
    // Mục đích: Mũi tên bay ra từ tay nhân vật, tránh việc cái đuôi mũi tên chạm vào quái đang cắn lén sau lưng
    const spawnDistance = 40;
    const startX = this.x + Math.cos(angle) * spawnDistance;
    const startY = this.y + Math.sin(angle) * spawnDistance;

    // Ưu tiên lấy mũi tên đã chết, nếu không có sẽ tự tạo mới
    const arrow = this.scene.physics.add.image(startX, startY, "arrow");
    this.arrows.add(arrow);
    this.scene.events.emit("player_attack", { arrow, player: this });

    // Kích hoạt lại vật lý và hiển thị mũi tên ở vị trí người chơi
    arrow.clearTint();
    arrow.setScale(3); // Phóng to mũi tên
    arrow.setDepth(15); // Đảm bảo mũi tên luôn nổi lên trên cùng
    arrow.setFlipX(false);

    // Make boosted attacks visible, not just stronger in numbers.
    if (this.playerEffects?.hasEffect("damage")) {
      arrow.setTint(0xff7a00);
      arrow.setScale(3.5);
    } else if (this.playerEffects?.hasEffect("burn")) {
      arrow.setTint(0xff3300);
      arrow.setScale(3.8);
      this.createFireArrowTrail(arrow);
    } else if (this.playerEffects?.hasEffect("critical")) {
      arrow.setTint(0xfacc15);
    }

    // Quay mặt player về hướng chuột
    if (pointer.worldX < this.x) {
      this.setFlipX(true);
    } else {
      this.setFlipX(false);
    }

    // Xoay mũi tên theo hướng bắn
    arrow.setRotation(angle);

    // Cấp vận tốc
    const arrowSpeed = 600;
    arrow.setVelocityX(Math.cos(angle) * arrowSpeed);
    arrow.setVelocityY(Math.sin(angle) * arrowSpeed);

    this.scene.time.delayedCall(1600, () => {
      if (arrow.active) {
        this.clearFireArrowTrail(arrow);
        arrow.destroy();
      }
    });
  }

  createFireArrowTrail(arrow) {
    const trail = this.scene.add.graphics().setDepth(14);
    this.fireArrowTrails.set(arrow, trail);
    arrow.once("destroy", () => this.clearFireArrowTrail(arrow));
  }

  updateFireArrowTrail(arrow) {
    const trail = this.fireArrowTrails.get(arrow);
    if (!trail) return;

    const angle = arrow.rotation + Math.PI;
    trail.clear();

    // Flame trail behind burn arrows so the fire shot is easy to notice.
    for (let i = 0; i < 4; i += 1) {
      const distance = 8 + i * 7;
      const x = arrow.x + Math.cos(angle) * distance;
      const y = arrow.y + Math.sin(angle) * distance;
      trail.fillStyle(i % 2 === 0 ? 0xff4500 : 0xffc400, 0.65 - i * 0.12);
      trail.fillCircle(x, y, 7 - i);
    }
  }

  clearFireArrowTrail(arrow) {
    const trail = this.fireArrowTrails.get(arrow);
    if (!trail) return;

    trail.destroy();
    this.fireArrowTrails.delete(arrow);
  }

  getArrows() {
    return this.arrows;
  }

  destroy(fromScene) {
    this.scene?.input?.off("pointerdown", this.handlePointerDown);
    this.fireArrowTrails?.forEach((trail) => trail.destroy());
    this.fireArrowTrails?.clear();
    this.effectVisuals?.destroy();
    this.healthBarUI?.destroy();
    super.destroy(fromScene);
  }
}
