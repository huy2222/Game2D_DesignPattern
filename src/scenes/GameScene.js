import Phaser from "phaser";
import mapUrl from "../assets/Map 2.json?url";
import tilesetImg from "../assets/Tileset.png";
import decorationsImg from "../assets/Decorations.png";
import playerWalkImg from "../assets/Enemy2/Soldier-Walk.png";
import playerAttackImg from "../assets/Enemy2/Soldier-Attack03.png";
import arrowImg from "../assets/arrow.png";
import speedItemImg from "../assets/skillEffect/speed.png";
import damageItemImg from "../assets/skillEffect/damage.png";
import shieldItemImg from "../assets/skillEffect/shield.png";
import healthItemImg from "../assets/skillEffect/health.png";
import criticalItemImg from "../assets/skillEffect/critical.png";
import burnItemImg from "../assets/skillEffect/burn.png";

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
import Player from "../classes/Player";
import ItemFactory, { ITEM_TEXTURE_KEYS } from "../classes/items/ItemFactory";

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
    this.load.image(ITEM_TEXTURE_KEYS.speed, speedItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.damage, damageItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.shield, shieldItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.health, healthItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.critical, criticalItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.burn, burnItemImg);

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
    this.load.spritesheet("soldier_death", soldierDeathImg, frameConfig);
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
    this.player = new Player(this, map.widthInPixels / 2, map.heightInPixels / 2, "player_walk");

    collidableLayers.forEach((layer) => {
      this.physics.add.collider(this.player, layer);
    });

    this.effectText = this.add.text(10, 52, 'Effects: None', {
      fontSize: '16px', fill: '#ffffff', backgroundColor: '#00000088', padding: { x: 5, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.player.initEffects(this.effectText, () => this.updateActiveEffectsUi());

    this.itemsGroup = this.physics.add.group();
    this.spawnInitialItems(map);
    this.physics.add.overlap(this.player, this.itemsGroup, (player, item) => {
      item.collect(this.player.playerEffects);
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
    this.anims.create({
      key: "anim_orc_death",
      frames: this.anims.generateFrameNumbers("orc_death", { start: 0, end: 3 }),
      frameRate: 8,
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
    this.anims.create({
      key: "anim_soldier_death",
      frames: this.anims.generateFrameNumbers("soldier_death", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });

    // --- PHẦN 4: TẠO ENEMY ---
    this.physicsEnemiesGroup = this.physics.add.group();
    this.enemyControllers = [];

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
    this.physics.add.overlap(this.player.getArrows(), this.physicsEnemiesGroup, (arrow, enemy) => {
        if (arrow.active && enemy.active) {
            // Tắt vật lý và ẩn mũi tên đi (chuẩn xác cho Phaser)
            arrow.disableBody(true, true);
            
            // Gây sát thương lên enemy
            if (enemy.takeDamage) {
                const attack = this.player.playerEffects.rollAttackDamage();
                enemy.takeDamage(attack.amount);

                if (attack.isCritical) {
                  console.log("Critical hit!");
                }

                if (this.player.playerEffects.hasBurnAttack() && enemy.applyBurn) {
                  enemy.applyBurn(
                    this.player.playerEffects.getBurnDamage(),
                    this.player.playerEffects.getBurnTicks(),
                  );
                }
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

    this.player.update(time);
  }

  updateActiveEffectsUi() {
    const labels = this.player.playerEffects?.getActiveEffectLabels() || [];
    this.effectText?.setText(`Effects: ${labels.length > 0 ? labels.join(", ") : "None"}`);
  }

  spawnInitialItems(map) {
    const spawnPoints = [
      { x: map.widthInPixels * 0.2, y: map.heightInPixels * 0.25 },
      { x: map.widthInPixels * 0.45, y: map.heightInPixels * 0.2 },
      { x: map.widthInPixels * 0.7, y: map.heightInPixels * 0.3 },
      { x: map.widthInPixels * 0.25, y: map.heightInPixels * 0.55 },
      { x: map.widthInPixels * 0.8, y: map.heightInPixels * 0.65 },
      { x: map.widthInPixels * 0.35, y: map.heightInPixels * 0.8 },
      { x: map.widthInPixels * 0.65, y: map.heightInPixels * 0.85 },
    ];

    // 40% chance at each point, as planned for map item spawn.
    spawnPoints.forEach((point) => {
      const distanceFromPlayer = Phaser.Math.Distance.Between(
        point.x,
        point.y,
        this.player.x,
        this.player.y,
      );

      if (distanceFromPlayer > 170 && Math.random() < 0.4) {
        this.spawnItem(point.x, point.y, ItemFactory.rollAnyType());
      }
    });
  }

  spawnItem(x, y, type) {
    const item = ItemFactory.create(this, x, y, type);
    if (item) {
      this.itemsGroup.add(item);
    }
  }

  dropItemFromEnemy(enemy) {
    if (!this.itemsGroup || !ItemFactory.shouldDrop(0.35)) return;

    // Drop table depends on enemy type: orc and soldier drop different items.
    const itemType = ItemFactory.rollDropType(enemy.enemyType);
    this.spawnItem(enemy.x, enemy.y, itemType);
  }
}
