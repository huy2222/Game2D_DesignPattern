import Phaser from "phaser";
import mapUrl from "../assets/Map 2.json?url";
import tilesetImg from "../assets/Tileset.png";
import decorationsImg from "../assets/Decorations.png";
import playerWalkImg from "../assets/Enemy2/Soldier-Walk.png";
import playerAttackImg from "../assets/Enemy2/Soldier-Attack03.png";
import arrowImg from "../assets/arrow.png";

// 1. Import các sprite sheet của Enemy Orc
import orcIdleImg from "../assets/Enemy/Orc-Idle.png";
import orcWalkImg from "../assets/Enemy/Orc-Walk.png";
import orcAttack1Img from "../assets/Enemy/Orc-Attack01.png";
import orcHurtImg from "../assets/Enemy/Orc-Hurt.png";
import orcDeathImg from "../assets/Enemy/Orc-Death.png";

// 2. Import các sprite sheet của Enemy Soldier
import soldierIdleImg from "../assets/Enemy2/Soldier-Idle.png";
import soldierWalkImg from "../assets/Enemy2/Soldier-Walk.png";
import soldierAttack1Img from "../assets/Enemy2/Soldier-Attack01.png";
import soldierHurtImg from "../assets/Enemy2/Soldier-Hurt.png";
import soldierDeathImg from "../assets/Enemy2/Soldier-Death.png";

import BasicEnemy from "../classes/BasicEnemy";
import FastDecorator from "../classes/decorator/FastDecorator";
import StealthDecorator from "../classes/decorator/StealthDecorator";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.on("loaderror", (fileObj) => {
      console.error("Asset load error:", fileObj?.key, fileObj?.src);
    });

    // Load tilemap
    this.load.tilemapTiledJSON("map", mapUrl);
    this.load.image("TilesetImage", tilesetImg);
    this.load.image("DecorationsImage", decorationsImg);

    // Kích thước 1 khung hình (frame) của nhân vật có thể cần điều chỉnh lại cho chính xác với spritesheet mới
    this.load.spritesheet("player_walk", playerWalkImg, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet("player_attack", playerAttackImg, { frameWidth: 100, frameHeight: 100 });
    this.load.image("arrow", arrowImg);

    // Cấu hình khung hình (Thay đổi nếu kích thước ảnh khác 100x100)
    const frameConfig = { frameWidth: 100, frameHeight: 100 };

    // Load Spritesheet cho Orc
    this.load.spritesheet("orc_idle", orcIdleImg, frameConfig);
    this.load.spritesheet("orc_walk", orcWalkImg, frameConfig);
    this.load.spritesheet("orc_attack1", orcAttack1Img, frameConfig);
    this.load.spritesheet("orc_hurt", orcHurtImg, frameConfig);
    this.load.spritesheet("orc_death", orcDeathImg, frameConfig);

    // Load Spritesheet cho Soldier
    this.load.spritesheet("soldier_idle", soldierIdleImg, frameConfig);
    this.load.spritesheet("soldier_walk", soldierWalkImg, frameConfig);
    this.load.spritesheet("soldier_attack1", soldierAttack1Img, frameConfig);
  }

  create() {
    this.cameras.main.setBackgroundColor("#1f2937");

    // --- PHẦN 1: TẠO MAP ---
    const map = this.make.tilemap({ key: "map" });
    if (!map) {
      this.add
        .text(16, 16, "Map load failed", { fontSize: "18px", color: "#ff6b6b" })
        .setScrollFactor(0);
      return;
    }

    const groundTileset = map.addTilesetImage("Tileset", "TilesetImage");
    const decorationTileset = map.addTilesetImage(
      "Decorations",
      "DecorationsImage",
    );
    const tilesets = [groundTileset, decorationTileset].filter(Boolean);

    const mapLayers = {};
    const fallbackLayerNames = [
      "Background",
      "GrassnLake",
      "Decoration",
      "Decoration 2",
    ];
    const layerNamesToCreate =
      (map.layers || []).length > 0
        ? map.layers.map((l) => l.name)
        : fallbackLayerNames;

    layerNamesToCreate.forEach((layerName) => {
        const layer = map.createLayer(layerName, tilesets, 0, 0);
        if (!layer) {
          console.warn(`Layer ${layerName} could not be created.`);
          return;
        }

        mapLayers[layerName] = layer;
      });

    const collidableLayers = [];
    Object.values(mapLayers).forEach((layer) => {
      const hasCollision = (layer.layer.properties || []).some(
        (p) =>
          (p.name === "collision" || p.name === "collides") &&
          (p.value === true || p.value === 1),
      );
      if (hasCollision || /collision|wall|obstacle/i.test(layer.layer.name)) {
        layer.setCollisionByExclusion([-1], true);
        collidableLayers.push(layer);
      }
    });

    // --- PHẦN 2: TẠO PLAYER ---
    // --- TẠO ANIMATION CHO NHÂN VẬT TỪ CÁC FILE TRONG ENEMY2 ---
    // Vì không có file Idle cho player, ta sẽ lấy frame đầu tiên của animation Walk làm frame đứng yên (Idle)
    this.anims.create({ key: 'idle', frames: [{ key: 'player_walk', frame: 0 }], frameRate: 8 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player_walk'), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'shoot', frames: this.anims.generateFrameNumbers('player_attack'), frameRate: 15, repeat: 0 });

    // --- TẠO NHÂN VẬT ---
    this.player = this.physics.add.sprite(map.widthInPixels / 2, map.heightInPixels / 2, "player_walk");
    this.player.setCollideWorldBounds(true);
    this.player.setScale(3); // Làm player bự bằng enemy

    // Thêm hệ thống máu cho player
    this.player.hp = 100;
    this.hpText = this.add.text(10, 10, 'HP: 100', { 
      fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', backgroundColor: '#ffffff88', padding: { x: 5, y: 5 } 
    }).setScrollFactor(0).setDepth(100);

    this.player.takeDamage = (amount) => {
        this.player.hp -= amount;
        if (this.player.hp <= 0) {
            this.player.hp = 0;
            console.log("Player died!");
            this.scene.restart(); // Chết thì reset game
        }
        this.hpText.setText('HP: ' + this.player.hp);
        
        // Hiệu ứng chớp đỏ khi bị đánh
        this.player.setTint(0xff0000);
        this.time.delayedCall(150, () => {
            this.player.clearTint();
        });
    };

    // Sự kiện chuyển về idle khi bắn xong
    this.player.on('animationcomplete-shoot', () => {
      if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
        this.player.play('idle', true);
      }
    });

    // --- TẠO NHÓM MŨI TÊN ---
    this.arrows = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 20
    });
    this.lastFired = 0;

    // --- THIẾT LẬP PHÍM BẤM ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    collidableLayers.forEach((layer) => {
      this.physics.add.collider(this.player, layer);
    });

    // --- PHẦN 3: TẠO ANIMATIONS ---
    // Animations cho Orc
    this.anims.create({
      key: "anim_orc_idle",
      frames: this.anims.generateFrameNumbers("orc_idle", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_orc_walk",
      frames: this.anims.generateFrameNumbers("orc_walk", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_orc_attack1",
      frames: this.anims.generateFrameNumbers("orc_attack1", {
        start: 0,
        end: 5,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // Animations cho Soldier
    this.anims.create({
      key: "anim_soldier_idle",
      frames: this.anims.generateFrameNumbers("soldier_idle", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_soldier_walk",
      frames: this.anims.generateFrameNumbers("soldier_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_soldier_attack1",
      frames: this.anims.generateFrameNumbers("soldier_attack1", {
        start: 0,
        end: 5,
      }),
      frameRate: 15,
      repeat: 0,
    });

    // --- PHẦN 4: TẠO ENEMY ---
    this.physicsEnemiesGroup = this.physics.add.group();
    this.enemyControllers = [];

    collidableLayers.forEach((layer) => {
      this.physics.add.collider(this.physicsEnemiesGroup, layer);
    });

    // 1. Tạo Enemy Orc - Chạy nhanh
    // Cập nhật tọa độ sinh ra gần player hơn một chút (300, 300) và thêm tiền tố "orc"
    const enemy1 = new BasicEnemy(this, 300, 300, "orc_idle", "orc");
    this.physicsEnemiesGroup.add(enemy1);

    const fastEnemy = new FastDecorator(enemy1);
    this.enemyControllers.push(fastEnemy);

    // 2. Tạo Enemy Soldier - Tàng hình
    // Dùng texture "soldier_idle", tọa độ (500, 300) và thêm tiền tố "soldier"
    const enemy2 = new BasicEnemy(this, 800, 300, "soldier_idle", "soldier");
    this.physicsEnemiesGroup.add(enemy2);

    const stealthEnemy = new StealthDecorator(enemy2);
    this.enemyControllers.push(stealthEnemy);

    // --- PHẦN 5: SETUP CAMERA VÀ THẾ GIỚI ---
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.roundPixels = true;
    this.cameras.main.startFollow(this.player, true);

    // --- PHẦN 6: VA CHẠM MŨI TÊN VÀ ENEMY ---
    this.physics.add.overlap(this.arrows, this.physicsEnemiesGroup, (arrow, enemy) => {
        if (arrow.active && enemy.active) {
            // Tắt vật lý và ẩn mũi tên đi (chuẩn xác cho Phaser)
            arrow.disableBody(true, true);
            
            // Gây sát thương lên enemy
            if (enemy.takeDamage) {
                enemy.takeDamage(10);
            }
        }
    });

    console.log("GameScene initialized. Player, Orc and Soldier created!");
  }

  update(time, delta) {
    this.enemyControllers.forEach((controller) => {
      controller.update();
    });

    if (!this.player) return;

    const speed = 150;
    this.player.setVelocity(0);

    // Di chuyển
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }

    // Xử lý animation di chuyển vs đứng yên
    if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
      if (this.player.anims.currentAnim?.key !== 'shoot') {
        this.player.play('walk', true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== 'shoot') {
        this.player.play('idle', true);
      }
    }

    // Bắn cung (nhấn Space)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && time > this.lastFired) {
      this.player.play('shoot', true);
      this.shootArrow();
      this.lastFired = time + 400; // Thời gian delay giữa 2 lần bắn (400ms)
    }

    // Xóa mũi tên khi bay ra ngoài bản đồ
    this.arrows.getChildren().forEach((arrow) => {
      if (arrow.active && (arrow.x < 0 || arrow.x > this.physics.world.bounds.width || arrow.y < 0 || arrow.y > this.physics.world.bounds.height)) {
        arrow.disableBody(true, true);
      }
    });
  }

  shootArrow() {
    const arrow = this.arrows.get(this.player.x, this.player.y, 'arrow');
    if (arrow) {
      // Kích hoạt lại vật lý và hiển thị mũi tên ở vị trí người chơi
      arrow.enableBody(true, this.player.x, this.player.y, true, true);
      
      arrow.setScale(3); // Phóng to mũi tên
      arrow.setDepth(15); // Đảm bảo mũi tên luôn nổi lên trên cùng (trên cả map và quái)
      
      // Bay theo hướng nhân vật đang quay mặt
      const direction = this.player.flipX ? -1 : 1;
      arrow.setFlipX(this.player.flipX);
      
      const arrowSpeed = 600; // Tốc độ bay của mũi tên
      arrow.body.setSize(arrow.width, arrow.height); // Reset body size
      arrow.setVelocityX(arrowSpeed * direction);
      arrow.setVelocityY(0);
    }
  }
}
