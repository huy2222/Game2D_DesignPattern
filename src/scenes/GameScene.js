import Phaser from "phaser";
import mapUrl from "../assets/Map 2.json?url";
import tilesetImg from "../assets/Tileset.png";
import decorationsImg from "../assets/Decorations.png";

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

    // Load tạm ảnh cho player
    this.load.image(
      "hero",
      "https://labs.phaser.io/assets/sprites/phaser-dude.png",
    );

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
      if (layer) mapLayers[layerName] = layer;
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
    this.player = this.physics.add.sprite(400, 300, "hero");
    this.player.setCollideWorldBounds(true);

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

    console.log("GameScene initialized. Player, Orc and Soldier created!");
  }

  update() {
    this.enemyControllers.forEach((controller) => {
      controller.update();
    });
  }
}
