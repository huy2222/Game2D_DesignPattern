import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    // Thêm sprite vào scene và kích hoạt vật lý
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(3); // Làm player bự bằng enemy
    
    // Thu nhỏ hitbox (bounding box) để va chạm chuẩn xác hơn
    this.body.setSize(30, 50);
    this.body.setOffset(35, 50);

    // Thêm hệ thống máu cho player
    this.hp = 100;
    this.hpText = scene.add.text(10, 10, 'HP: 100', { 
      fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', backgroundColor: '#ffffff88', padding: { x: 5, y: 5 } 
    }).setScrollFactor(0).setDepth(100);

    // Sự kiện chuyển về idle khi bắn xong
    this.on('animationcomplete-shoot', () => {
      if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        this.play('idle', true);
      }
    });

    // --- THIẾT LẬP PHÍM BẤM ---
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // --- TẠO NHÓM MŨI TÊN ---
    this.arrows = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'arrow',
      maxSize: 20
    });
    this.lastFired = 0;

    // Sự kiện click chuột để bắn
    scene.input.on('pointerdown', (pointer) => {
      if (scene.time.now > this.lastFired) {
        this.play('shoot', true);
        this.shootArrowPointer(pointer);
        this.lastFired = scene.time.now + 400;
      }
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
        this.hp = 0;
        console.log("Player died!");
        this.scene.scene.restart(); // Chết thì reset game
    }
    this.hpText.setText('HP: ' + this.hp);
    
    // Hiệu ứng chớp đỏ khi bị đánh
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
        this.clearTint();
    });
  }

  update(time) {
    const speed = 150;
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
      if (this.anims.currentAnim?.key !== 'shoot') {
        this.play('walk', true);
      }
    } else {
      if (this.anims.currentAnim?.key !== 'shoot') {
        this.play('idle', true);
      }
    }

    // Xóa mũi tên khi bay ra ngoài bản đồ
    this.arrows.getChildren().forEach((arrow) => {
      if (arrow.active && (arrow.x < 0 || arrow.x > this.scene.physics.world.bounds.width || arrow.y < 0 || arrow.y > this.scene.physics.world.bounds.height)) {
        arrow.disableBody(true, true);
      }
    });
  }

  shootArrowPointer(pointer) {
    // Ưu tiên lấy mũi tên đã chết, nếu không có sẽ tự tạo mới
    const arrow = this.arrows.get(this.x, this.y, 'arrow');
    if (!arrow) return;

    // Kích hoạt lại vật lý và hiển thị mũi tên ở vị trí người chơi
    arrow.enableBody(true, this.x, this.y, true, true);
    
    arrow.setScale(3); // Phóng to mũi tên
    arrow.setDepth(15); // Đảm bảo mũi tên luôn nổi lên trên cùng
    arrow.setFlipX(false);
    
    // Tính toán góc giữa player và vị trí chuột trong world
    // Dùng pointer.worldX và worldY là chuẩn xác nhất với camera
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);

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
  }

  getArrows() {
    return this.arrows;
  }
}
