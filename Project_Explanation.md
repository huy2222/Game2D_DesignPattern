# Project Explanation: Game 2D Design Pattern

Dưới đây là giải thích chi tiết về kiến trúc và các đoạn code chính trong dự án **Game 2D Design Pattern** của bạn, tập trung vào class `Player` và cách hoạt động của game.

## 1. Kiến trúc chung của dự án
Dự án sử dụng **Phaser 3**, một framework mạnh mẽ cho game 2D trên nền web, kết hợp với các khái niệm thiết kế hướng đối tượng (OOP) và Design Patterns. 

Cấu trúc luồng chạy của game:
- `main.js`: File khởi tạo và cấu hình game (kích thước màn hình, engine vật lý Arcade, danh sách các cảnh - Scenes).
- `HomeScene.js`: Cảnh màn hình chờ, menu chính.
- `GameScene.js`: Cảnh chính của trò chơi (chứa logic sinh map, quái vật, v.v.).
- `src/classes/`: Chứa định nghĩa các đối tượng (Player, Enemy, Item, UI...).

## 2. Giải thích mã nguồn: Class `Player` (`src/classes/player/Player.js`)

Đây là class cốt lõi quản lý nhân vật chính, bao gồm di chuyển, bắn cung, xử lý sát thương và hiệu ứng (buff/debuff).

### Khởi tạo nhân vật (Constructor)
```javascript
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    // Kích hoạt vật lý và thêm vào cảnh
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(3); // Phóng to nhân vật

    // Hitbox (Vùng va chạm): Thu nhỏ lại để va chạm chính xác hơn, tránh bị quái đánh trúng khi hình ảnh chưa chạm.
    this.body.setSize(20, 30);
    this.body.setOffset(40, 60);

    // Chỉ số cơ bản
    this.maxHp = 200;
    this.hp = this.maxHp;
    this.baseMoveSpeed = 175;
    this.baseAttackDamage = 25;
    
    // Khởi tạo thanh máu (UI) và hiệu ứng hình ảnh (Visual Effects)
    this.healthBarUI = new HealthBarUI(scene, 12, 12);
    this.healthBarUI.update(this.hp, this.maxHp);
    this.effectVisuals = new PlayerEffectVisuals(scene, this);

    // ... (Khởi tạo input và vũ khí)
  }
}
```

### Xử lý phím bấm và di chuyển (Hàm `update`)
Hàm `update()` được gọi liên tục (60 FPS) để cập nhật trạng thái nhân vật.
```javascript
  update(time) {
    // Tốc độ thay đổi dựa vào việc có đang bị hiệu ứng (làm chậm/tăng tốc) hay không
    const speed = this.playerEffects
      ? this.playerEffects.getMoveSpeed()
      : this.baseMoveSpeed;
      
    this.setVelocity(0); // Reset gia tốc mỗi khung hình

    // Di chuyển trái/phải
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true); // Quay mặt sang trái
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false); // Quay mặt sang phải
    }

    // Di chuyển lên/xuống
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.setVelocityY(speed);
    }

    // Xử lý Animation: Nếu có vận tốc thì chạy (walk), nếu không thì đứng yên (idle)
    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
      if (this.anims.currentAnim?.key !== "shoot") this.play("walk", true);
    } else {
      if (this.anims.currentAnim?.key !== "shoot") this.play("idle", true);
    }

    // Hủy mũi tên bay ra khỏi màn hình
    this.arrows.getChildren().forEach((arrow) => {
      // Logic kiểm tra tọa độ...
    });
  }
```

### Cơ chế chiến đấu: Bắn cung (`shootArrowPointer`)
Khi người chơi click chuột, hàm này tính toán góc bắn và sinh ra một mũi tên bay về hướng chuột.
```javascript
  shootArrowPointer(pointer) {
    // Tính toán góc giữa nhân vật và con trỏ chuột
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      pointer.worldX, pointer.worldY
    );

    // Đẩy điểm spawn mũi tên ra xa người một chút (40 pixel) 
    // Tránh việc mũi tên vừa xuất hiện đã đâm trúng quái ở sau lưng
    const spawnDistance = 40;
    const startX = this.x + Math.cos(angle) * spawnDistance;
    const startY = this.y + Math.sin(angle) * spawnDistance;

    // Tạo mũi tên và lưu vào nhóm (Group)
    const arrow = this.scene.physics.add.image(startX, startY, "arrow");
    this.arrows.add(arrow);
    this.scene.events.emit("player_attack", { arrow, player: this });

    // Xử lý mũi tên mang hiệu ứng (Decorator/State Pattern)
    if (this.playerEffects?.hasEffect("damage")) {
      arrow.setTint(0xff7a00); // Mũi tên cam to hơn
      arrow.setScale(3.5);
    } else if (this.playerEffects?.hasEffect("burn")) {
      arrow.setTint(0xff3300); // Mũi tên lửa
      arrow.setScale(3.8);
      this.createFireArrowTrail(arrow); // Tạo vệt lửa bay theo
    } else if (this.playerEffects?.hasEffect("critical")) {
      arrow.setTint(0xfacc15); // Mũi tên vàng
    }

    // Quay nhân vật và mũi tên về hướng bắn
    this.setFlipX(pointer.worldX < this.x);
    arrow.setRotation(angle);

    // Cấp vận tốc bay cho mũi tên
    const arrowSpeed = 600;
    arrow.setVelocityX(Math.cos(angle) * arrowSpeed);
    arrow.setVelocityY(Math.sin(angle) * arrowSpeed);

    // Hủy mũi tên sau 1.6s nếu chưa trúng gì
    this.scene.time.delayedCall(1600, () => {
      if (arrow.active) {
        this.clearFireArrowTrail(arrow);
        arrow.destroy();
      }
    });
  }
```

### Xử lý sát thương (`takeDamage`)
Khi nhân vật bị quái chạm vào, hàm này sẽ được gọi.
```javascript
  takeDamage(amount) {
    if (this.isDead) return;

    // Cho phép hệ thống hiệu ứng (EffectManager) can thiệp vào sát thương (VD: Giáp chắn)
    let finalDamage = amount;
    if (this.playerEffects) {
      finalDamage = this.playerEffects.takeDamage(amount);
    }
    
    // Trừ máu
    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.setVelocity(0, 0); // Ngừng di chuyển
      this.scene.events.emit("player_dead", this); // Gửi sự kiện báo tử vong
    }

    // Cập nhật giao diện thanh máu
    if (this.playerEffects) this.playerEffects.updateHealthUI();
    else this.healthBarUI.update(this.hp, this.maxHp);

    // Hiệu ứng chớp đỏ báo hiệu bị đau
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.clearTint());
  }
```

## 3. Các Design Patterns sử dụng trong dự án
Dựa vào kiến trúc trên, trò chơi đang sử dụng một số Patterns rõ rệt:
1. **Component Pattern / Entity Component System (ECS)**: Các `Visuals`, `Effects`, và `UI` được tách thành các lớp độc lập (Component) `PlayerEffectVisuals`, `PlayerEffectManager`, `HealthBarUI` và inject vào class Player.
2. **Observer Pattern (Sự kiện)**: Sử dụng qua `scene.events.emit("player_dead")` và `scene.events.emit("player_attack")`. Nó giúp các UI hoặc Quái vật biết Player vừa tấn công hoặc chết mà không cần gọi hàm trực tiếp.
3. **Decorator Pattern / Strategy Pattern**: Hệ thống hiệu ứng `PlayerEffectManager` thay đổi hành vi và sức mạnh (sát thương nhận vào, tốc độ di chuyển) của Player lúc Runtime.
