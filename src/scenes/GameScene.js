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

import orcIdleImg from "../assets/Enemy/Orc-Idle.png";
import orcWalkImg from "../assets/Enemy/Orc-Walk.png";
import orcAttack1Img from "../assets/Enemy/Orc-Attack01.png";
import orcHurtImg from "../assets/Enemy/Orc-Hurt.png";
import orcDeathImg from "../assets/Enemy/Orc-Death.png";

import soldierIdleImg from "../assets/Enemy2/Soldier-Idle.png";
import soldierWalkImg from "../assets/Enemy2/Soldier-Walk.png";
import soldierAttack1Img from "../assets/Enemy2/Soldier-Attack01.png";
import soldierHurtImg from "../assets/Enemy2/Soldier-Hurt.png";
import soldierDeathImg from "../assets/Enemy2/Soldier-Death.png";

import golemIdleImg from "../assets/Golem/Idle.png";
import golemWalkImg from "../assets/Golem/Walk.png";
import golemAttack1Img from "../assets/Golem/A1.png";
import golemGetHit from "../assets/Golem/GetHit.png";

import cultisIdleImg from "../assets/Cultis/Idle.png";
import cultisWalkImg from "../assets/Cultis/Walk.png";
import cultisAttack1Img from "../assets/Cultis/attack.png";
import cultisGetHit from "../assets/Cultis/hurt.png";

import BasicEnemy from "../classes/Enemy/BasicEnemy";
import FastDecorator from "../classes/Enemy/decorator/FastDecorator";
import StealthDecorator from "../classes/Enemy/decorator/StealthDecorator";
import StrongDecorator from "../classes/Enemy/decorator/StrongDecorator";
import Player from "../classes/player/Player";
import ItemFactory, { ITEM_TEXTURE_KEYS } from "../classes/items/ItemFactory";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.on("loaderror", (fileObj) => {
      console.error("Asset load error:", fileObj?.key, fileObj?.src);
    });

    this.load.tilemapTiledJSON("map", mapUrl);
    this.load.image("TilesetImage", tilesetImg);
    this.load.image("DecorationsImage", decorationsImg);

    this.load.spritesheet("player_walk", playerWalkImg, {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet("player_attack", playerAttackImg, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.image("arrow", arrowImg);
    this.load.image(ITEM_TEXTURE_KEYS.speed, speedItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.damage, damageItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.shield, shieldItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.health, healthItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.critical, criticalItemImg);
    this.load.image(ITEM_TEXTURE_KEYS.burn, burnItemImg);

    const frameConfig = { frameWidth: 100, frameHeight: 100 };
    const golemFrameConfig = { frameWidth: 256, frameHeight: 256 };
    const cultisFrameConfig = { frameWidth: 64, frameHeight: 64 };

    this.load.spritesheet("orc_idle", orcIdleImg, frameConfig);
    this.load.spritesheet("orc_walk", orcWalkImg, frameConfig);
    this.load.spritesheet("orc_attack1", orcAttack1Img, frameConfig);
    this.load.spritesheet("orc_hurt", orcHurtImg, frameConfig);
    this.load.spritesheet("orc_death", orcDeathImg, frameConfig);

    this.load.spritesheet("soldier_idle", soldierIdleImg, frameConfig);
    this.load.spritesheet("soldier_walk", soldierWalkImg, frameConfig);
    this.load.spritesheet("soldier_attack1", soldierAttack1Img, frameConfig);
    this.load.spritesheet("soldier_hurt", soldierHurtImg, frameConfig);
    this.load.spritesheet("soldier_death", soldierDeathImg, frameConfig);

    this.load.spritesheet("golem_idle", golemIdleImg, golemFrameConfig);
    this.load.spritesheet("golem_walk", golemWalkImg, golemFrameConfig);
    this.load.spritesheet("golem_attack1", golemAttack1Img, golemFrameConfig);
    this.load.spritesheet("golem_hurt", golemGetHit, golemFrameConfig);

    this.load.spritesheet("cultis_idle", cultisIdleImg, cultisFrameConfig);
    this.load.spritesheet("cultis_walk", cultisWalkImg, cultisFrameConfig);
    this.load.spritesheet(
      "cultis_attack1",
      cultisAttack1Img,
      cultisFrameConfig,
    );
    this.load.spritesheet("cultis_hurt", cultisGetHit, cultisFrameConfig);
  }

  create() {
    this.cameras.main.setBackgroundColor("#1f2937");

    // --- PHẦN 1: TẠO MAP ---
    const map = this.make.tilemap({ key: "map" });
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

    this.anims.create({
      key: "idle",
      frames: [{ key: "player_walk", frame: 0 }],
      frameRate: 8,
    });
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player_walk"),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "shoot",
      frames: this.anims.generateFrameNumbers("player_attack"),
      frameRate: 15,
      repeat: 0,
    });

    this.player = new Player(
      this,
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "player_walk",
    );
    collidableLayers.forEach((layer) => {
      this.physics.add.collider(this.player, layer);
    });

    this.effectText = this.add
      .text(10, 52, "Effects: None", {
        fontSize: "16px",
        fill: "#ffffff",
        backgroundColor: "#00000088",
        padding: { x: 5, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.player.initEffects(this.effectText, () =>
      this.updateActiveEffectsUi(),
    );

    this.itemsGroup = this.physics.add.group();
    this.spawnInitialItems(map);
    this.physics.add.overlap(this.player, this.itemsGroup, (player, item) => {
      item.collect(this.player.playerEffects);
    });

    // --- ANIMATIONS ---
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
      key: "anim_orc_hurt",
      frames: this.anims.generateFrameNumbers("orc_hurt", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });
    this.anims.create({
      key: "anim_orc_death",
      frames: this.anims.generateFrameNumbers("orc_death", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

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
      key: "anim_soldier_hurt",
      frames: this.anims.generateFrameNumbers("soldier_hurt", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });
    this.anims.create({
      key: "anim_soldier_death",
      frames: this.anims.generateFrameNumbers("soldier_death", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    this.anims.create({
      key: "anim_golem_idle",
      frames: this.anims.generateFrameNumbers("golem_idle", {
        start: 4,
        end: 7,
      }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_golem_walk",
      frames: this.anims.generateFrameNumbers("golem_walk", {
        start: 4,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_golem_attack1",
      frames: this.anims.generateFrameNumbers("golem_attack1", {
        start: 4,
        end: 7,
      }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: "anim_golem_hurt",
      frames: this.anims.generateFrameNumbers("golem_hurt", {
        start: 4,
        end: 7,
      }),
      frameRate: 8,
      repeat: 0,
    });

    this.anims.create({
      key: "anim_cultis_idle",
      frames: this.anims.generateFrameNumbers("cultis_idle", {
        start: 0,
        end: 14,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_cultis_walk",
      frames: this.anims.generateFrameNumbers("cultis_walk", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "anim_cultis_attack1",
      frames: this.anims.generateFrameNumbers("cultis_attack1", {
        start: 0,
        end: 12,
      }),
      frameRate: 15,
      repeat: 0,
    });
    this.anims.create({
      key: "anim_cultis_hurt",
      frames: this.anims.generateFrameNumbers("cultis_hurt", {
        start: 0,
        end: 15,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // --- ENEMY WAVE MANAGER ---
    this.physicsEnemiesGroup = this.physics.add.group();
    this.enemyControllers = [];

    this.killCount = 0;
    this.targetKills = 9; // Giết 9 con để gọi Boss

    // Text UI Đếm Kill (Góc trên bên phải màn hình)
    this.progressText = this.add
      .text(this.cameras.main.width - 150, 20, "Kills: 0 / 9", {
        fontSize: "24px",
        fill: "#ffcc00",
        fontStyle: "bold",
        backgroundColor: "#000000aa",
        padding: { x: 10, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Spawn 3 con quái cơ bản ban đầu
    this.spawnEnemyByType("orc");
    this.spawnEnemyByType("soldier");
    this.spawnEnemyByType("cultis");

    // Lắng nghe sự kiện "Quái Chết" từ BasicEnemy
    this.events.on("enemy_died", (enemy) => {
      // Dọn dẹp Decorator bị thừa trong vòng lặp
      this.enemyControllers = this.enemyControllers.filter(
        (c) => c.enemy !== enemy,
      );

      // NẾU GIẾT BOSS GOLEM -> WIN GAME
      if (enemy.enemyType === "golem") {
        this.add
          .text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "VICTORY!",
            {
              fontSize: "80px",
              fill: "#00ff00",
              fontStyle: "bold",
              stroke: "#000",
              strokeThickness: 6,
            },
          )
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1000);
        this.scene.pause(); // Dừng game
        return;
      }

      // Nếu giết quái thường
      this.killCount++;
      this.progressText.setText(
        `Kills: ${this.killCount} / ${this.targetKills}`,
      );

      // Đẻ thêm quái đợt tiếp theo
      if (this.killCount < this.targetKills) {
        // Sau 2 giây sẽ hồi sinh lại đúng loại quái vừa chết
        this.time.delayedCall(2000, () => {
          this.spawnEnemyByType(enemy.enemyType);
        });
      }
      // Khi đủ 9 kill -> GỌI BOSS
      else if (this.killCount === this.targetKills) {
        this.progressText.setText("BOSS APPEARED!");
        this.progressText.setColor("#ff0000");

        this.time.delayedCall(2000, () => {
          this.spawnEnemyByType("golem");
        });
      }
    });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.roundPixels = true;
    this.cameras.main.startFollow(this.player, true);

    // Va chạm Mũi tên - Quái vật
    this.physics.add.overlap(
      this.player.getArrows(),
      this.physicsEnemiesGroup,
      (arrow, enemy) => {
        if (arrow.active && enemy.active) {
          arrow.disableBody(true, true);

          if (enemy.takeDamage) {
            const attack = this.player.playerEffects.rollAttackDamage();
            enemy.takeDamage(attack.amount); // TRỪ MÁU QUÁI

            if (this.player.playerEffects.hasBurnAttack() && enemy.applyBurn) {
              enemy.applyBurn(
                this.player.playerEffects.getBurnDamage(),
                this.player.playerEffects.getBurnTicks(),
              );
            }
          }
        }
      },
    );
  }

  // --- HÀM HỖ TRỢ SPAWN QUÁI Ở VỊ TRÍ BẤT KỲ TRÊN BẢN ĐỒ ---
  spawnEnemyByType(type) {
    // Sinh ngẫu nhiên tọa độ X, Y (cách lề 200px cho an toàn)
    const mapW = this.physics.world.bounds.width;
    const mapH = this.physics.world.bounds.height;
    const randX = Phaser.Math.Between(200, mapW - 200);
    const randY = Phaser.Math.Between(200, mapH - 200);

    let enemy, decorator;
    if (type === "orc") {
      enemy = new BasicEnemy(this, randX, randY, "orc_idle", "orc");
      decorator = new FastDecorator(enemy);
    } else if (type === "soldier") {
      enemy = new BasicEnemy(this, randX, randY, "soldier_idle", "soldier");
      decorator = new StealthDecorator(enemy);
    } else if (type === "cultis") {
      enemy = new BasicEnemy(this, randX, randY, "cultis_idle", "cultis");
      decorator = new FastDecorator(enemy);
    } else if (type === "golem") {
      // Golem xuất hiện gần trung tâm hơn một chút
      enemy = new BasicEnemy(
        this,
        mapW / 2 + 100,
        mapH / 2,
        "golem_idle",
        "golem",
      );
      decorator = new StrongDecorator(enemy);
    }

    this.physicsEnemiesGroup.add(enemy);
    this.enemyControllers.push(decorator);
  }

  update(time, delta) {
    this.enemyControllers.forEach((controller) => controller.update());
    if (!this.player) return;
    this.player.update(time);
  }

  updateActiveEffectsUi() {
    const labels = this.player.playerEffects?.getActiveEffectLabels() || [];
    this.effectText?.setText(
      `Effects: ${labels.length > 0 ? labels.join(", ") : "None"}`,
    );
  }

  spawnInitialItems(map) {
    // Giữ nguyên logic item
    const spawnPoints = [
      { x: 200, y: 200 },
      { x: 400, y: 400 },
    ];
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
    if (item) this.itemsGroup.add(item);
  }

  dropItemFromEnemy(enemy) {
    if (!this.itemsGroup || !ItemFactory.shouldDrop(0.35)) return;
    const itemType = ItemFactory.rollDropType(enemy.enemyType);
    this.spawnItem(enemy.x, enemy.y, itemType);
  }
}
