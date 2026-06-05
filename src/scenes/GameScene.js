import Phaser from "phaser";
import mapUrl from "../assets/Map 2.json?url";
import tilesetImg from "../assets/Tileset.png";
import decorationsImg from "../assets/Decorations.png";
import backgroundAudio from "../assets/audio/background.mp3";
import attackAudio from "../assets/audio/attack.mp3";
import enemyHitAudio from "../assets/audio/enemy_hit.mp3";
import pickUpAudio from "../assets/audio/pick_up.mp3";
import winAudio from "../assets/audio/win.mp3";
import loseAudio from "../assets/audio/lose.mp3";
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
import ActiveEffectUI from "../classes/ui/ActiveEffectUI";

const PICKUP_CHANGE_STYLES = {
  speed: { accent: 0x38bdf8, text: "#bae6fd" },
  damage: { accent: 0xf97316, text: "#fed7aa" },
  shield: { accent: 0x60a5fa, text: "#bfdbfe" },
  health: { accent: 0x22c55e, text: "#bbf7d0" },
  critical: { accent: 0xfacc15, text: "#fef08a" },
  burn: { accent: 0xef4444, text: "#fecaca" },
};

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
    this.load.audio("background", backgroundAudio);
    this.load.audio("attack", attackAudio);
    this.load.audio("enemy_hit", enemyHitAudio);
    this.load.audio("pick_up", pickUpAudio);
    this.load.audio("win", winAudio);
    this.load.audio("lose", loseAudio);

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
    this.isGameEnded = false;
    this.boundSceneEvents = [];
    this.cameras.main.setBackgroundColor("#1f2937");
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

    this.bindSceneEvent("player_attack", () => this.playSfx("attack", 0.6));
    this.bindSceneEvent("enemy_hit", () => this.playSfx("enemy_hit", 0.7));
    this.bindSceneEvent("item_collected", () => this.playSfx("pick_up", 0.7));
    this.bindSceneEvent("player_dead", () => this.handleLose());
    this.bindSceneEvent("enemy_died", (enemy) => {
      this.dropItemFromEnemy(enemy);

      this.enemyControllers = this.enemyControllers.filter(
        (c) => c.enemy !== enemy,
      );

      if (enemy.enemyType === "golem") {
        this.handleWin();
        return;
      }

      this.killCount++;
      this.progressText.setText(
        `Kills: ${this.killCount} / ${this.targetKills}`,
      );

      if (this.killCount < this.targetKills) {
        this.time.delayedCall(2000, () => {
          this.spawnEnemyByType(enemy.enemyType);
        });
      } else if (this.killCount === this.targetKills) {
        this.progressText.setText("BOSS APPEARED!");
        this.progressText.setColor("#ff0000");

        this.time.delayedCall(2000, () => {
          this.spawnEnemyByType("golem");
        });
      }
    });

    this.backgroundMusic = this.sound.add("background", {
      loop: true,
      volume: 0.18,
    });
    this.backgroundMusic.play();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

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

    this.activeEffectUI = new ActiveEffectUI(this, 12, 58);
    this.pickupChangeCards = new Map();
    this.player.initEffects(null, () => this.updateActiveEffectsUi());

    this.itemsGroup = this.physics.add.group();
    this.spawnInitialItems(map);
    this.physics.add.overlap(this.player, this.itemsGroup, (player, item) => {
      const pickupChange = item.collect(this.player.playerEffects);
      this.showPickupStatChange(pickupChange);
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
      .text(this.cameras.main.width - 200, 20, "Kills: 0 / 9", {
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
          // Không destroy mũi tên ngay lập tức để người chơi kịp nhìn thấy mũi tên chạm vào quái khi ở gần
          arrow.active = false;
          arrow.body.enable = false;
          arrow.setVelocity(0, 0);
          
          this.time.delayedCall(60, () => {
            if (arrow && arrow.scene) {
              this.player.clearFireArrowTrail(arrow);
              arrow.destroy();
            }
          });

          if (enemy.takeDamage) {
            const attack = this.player.playerEffects.rollAttackDamage();
            enemy.takeDamage(attack.amount); // TRỪ MÁU QUÁI

            // --- THÊM HIỆU ỨNG CHẠM (HIT EFFECT) ---
            let effectColor = 0xffffff;
            if (attack.isCritical) effectColor = 0xffd700; // Vàng cho Crit
            else if (this.player.playerEffects.hasEffect("burn")) effectColor = 0xff4500; // Đỏ cam cho Lửa
            else effectColor = 0xcccccc; // Trắng xám cho Đánh thường
            
            this.showHitEffect(arrow.x, arrow.y, effectColor);

            if (attack.isCritical) {
              this.showCriticalDamage(enemy, attack.amount);
            }

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

  bindSceneEvent(eventName, handler) {
    this.events.on(eventName, handler);
    this.boundSceneEvents.push({ eventName, handler });
  }

  playSfx(key, volume = 1) {
    this.sound.play(key, { volume });
  }

  handleWin() {
    if (this.isGameEnded) return;
    this.isGameEnded = true;

    this.playSfx("win", 0.9);
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, "VICTORY!", {
        fontSize: "80px",
        fill: "#00ff00",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.physics.pause();
    this.scene.pause();
  }

  handleLose() {
    if (this.isGameEnded) return;
    this.isGameEnded = true;

    this.playSfx("lose", 0.9);
    this.scene.launch("GameOverScene");
    this.physics.pause();
    this.scene.pause();
  }

  shutdown() {
    this.boundSceneEvents?.forEach(({ eventName, handler }) => {
      this.events.off(eventName, handler);
    });
    this.boundSceneEvents = [];

    this.backgroundMusic?.stop();
    this.backgroundMusic?.destroy();
    this.backgroundMusic = null;
    this.isGameEnded = false;
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
    this.activeEffectUI?.update();
    this.updatePickupStatChanges();
  }

  updateActiveEffectsUi() {
    this.activeEffectUI?.sync(this.player.playerEffects);
  }

  showHitEffect(x, y, color = 0xffffff) {
    // 1. Tạo các tia lửa (Sparks) bắn ra xung quanh
    const numSparks = Phaser.Math.Between(5, 8);
    for (let i = 0; i < numSparks; i++) {
      const spark = this.add.graphics();
      spark.fillStyle(color, 1);
      
      const size = Phaser.Math.Between(2, 4);
      spark.fillCircle(0, 0, size);
      spark.setPosition(x, y);
      spark.setDepth(200);

      // Tính toán hướng ngẫu nhiên và tốc độ
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(40, 90);
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.tweens.add({
        targets: spark,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Cubic.easeOut',
        onComplete: () => {
          spark.destroy();
        }
      });
    }

    // 2. Tạo một vòng tròn (Ring) phình to rồi mờ dần
    const ring = this.add.graphics();
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(0, 0, 6);
    ring.setPosition(x, y);
    ring.setDepth(199);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 2.5,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  showCriticalDamage(enemy, amount) {
    const text = this.add
      .text(enemy.x, enemy.y - 55, `CRIT ${amount}`, {
        fontSize: "18px",
        fill: "#ffd700",
        fontStyle: "bold",
        stroke: "#7f1d1d",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: 650,
      ease: "Sine.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  showPickupStatChange(change) {
    if (!change) return;

    this.destroyPickupChangeCard(change.type);

    const style = PICKUP_CHANGE_STYLES[change.type] || {
      accent: 0xffffff,
      text: "#ffffff",
    };
    const durationLine = change.durationText
      ? `${change.statusText} | ${change.durationText}`
      : change.statusText;

    const width = 390;
    const height = 64;
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(650);
    const background = this.add.graphics();
    const progress = this.add.graphics();
    const icon = this.add
      .image(-width / 2 + 34, 0, ITEM_TEXTURE_KEYS[change.type])
      .setDisplaySize(34, 34);
    const titleText = this.add
      .text(-width / 2 + 64, -14, change.title, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: style.text,
        stroke: "#111827",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);
    const statText = this.add
      .text(-width / 2 + 64, 10, change.statLine, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#111827",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);
    const durationText = this.add
      .text(width / 2 - 14, -14, durationLine, {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#d1d5db",
        stroke: "#111827",
        strokeThickness: 3,
      })
      .setOrigin(1, 0.5);

    background.fillStyle(0x111827, 0.88);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    background.lineStyle(2, style.accent, 0.95);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    background.fillStyle(style.accent, 0.95);
    background.fillRoundedRect(-width / 2, -height / 2, 7, height, 8);

    container.add([
      background,
      progress,
      icon,
      titleText,
      statText,
      durationText,
    ]);

    this.tweens.add({
      targets: container,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.96, to: 1 },
      duration: 160,
      ease: "Sine.easeOut",
    });

    this.pickupChangeCards.set(change.type, {
      container,
      progress,
      accent: style.accent,
      change,
      width,
      height,
    });
    this.layoutPickupChangeCards();
    this.drawPickupChangeProgress(this.pickupChangeCards.get(change.type));
  }

  updatePickupStatChanges() {
    if (!this.pickupChangeCards?.size) return;

    Array.from(this.pickupChangeCards.values()).forEach((card) => {
      if (this.time.now >= card.change.expiresAt) {
        this.destroyPickupChangeCard(card.change.type);
        return;
      }

      this.drawPickupChangeProgress(card);
    });
    this.layoutPickupChangeCards();
  }

  drawPickupChangeProgress(card) {
    const remaining = Math.max(0, card.change.expiresAt - this.time.now);
    const ratio = Phaser.Math.Clamp(remaining / card.change.duration, 0, 1);
    const barWidth = (card.width - 18) * ratio;

    card.progress.clear();
    card.progress.fillStyle(0x000000, 0.38);
    card.progress.fillRoundedRect(
      -card.width / 2 + 9,
      card.height / 2 - 9,
      card.width - 18,
      5,
      3,
    );
    card.progress.fillStyle(card.accent, 0.95);
    card.progress.fillRoundedRect(
      -card.width / 2 + 9,
      card.height / 2 - 9,
      barWidth,
      5,
      3,
    );
  }

  layoutPickupChangeCards() {
    if (!this.pickupChangeCards?.size) return;

    Array.from(this.pickupChangeCards.values()).forEach((card, index) => {
      card.container.setPosition(
        this.cameras.main.width / 2,
        96 + index * (card.height + 8),
      );
    });
  }

  destroyPickupChangeCard(type) {
    const card = this.pickupChangeCards?.get(type);
    if (!card) return;

    card.container.destroy(true);
    this.pickupChangeCards.delete(type);
  }

  spawnInitialItems(map) {
    // Giữ nguyên logic item
    const spawnPoints = [
      { x: map.widthInPixels * 0.2, y: map.heightInPixels * 0.25 },
      { x: map.widthInPixels * 0.45, y: map.heightInPixels * 0.2 },
      { x: map.widthInPixels * 0.7, y: map.heightInPixels * 0.3 },
      { x: map.widthInPixels * 0.25, y: map.heightInPixels * 0.55 },
      { x: map.widthInPixels * 0.8, y: map.heightInPixels * 0.65 },
      { x: map.widthInPixels * 0.35, y: map.heightInPixels * 0.8 },
      { x: map.widthInPixels * 0.65, y: map.heightInPixels * 0.85 },
    ];
    spawnPoints.forEach((point) => {
      const distanceFromPlayer = Phaser.Math.Distance.Between(
        point.x,
        point.y,
        this.player.x,
        this.player.y,
      );
      // 40% chance per point, but do not spawn directly on the player.
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
