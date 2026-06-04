import Phaser from "phaser";
import bgImg from "../assets/homeUI/background.png";
import playBtnImg from "../assets/homeUI/playGameButton.png";
import startGameAudio from "../assets/audio/start_game.mp3";

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
  }

  preload() {
    // nền menu
    this.load.image("background", bgImg);

    // nút play
    this.load.image("playButton", playBtnImg);

    // sound effect khi bắt đầu game
    this.load.audio("start_game", startGameAudio);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // ===== Nền full màn =====

    const background = this.add.image(width / 2, height / 2, "background");

    // Scale ảnh để phủ toàn màn hình
    background.setDisplaySize(width, height);

    // ===== Tiêu đề =====

    this.add
      .text(width / 2, height * 0.25, "Zombie Shooter", {
        fontSize: "50px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // ===== Nút play =====

    let button = this.add.image(width / 2, height * 0.65, "playButton");

    // thu nhỏ nút
    button.setScale(0.12);

    button.setInteractive();

    // hiệu ứng hover

    button.on("pointerover", () => {
      button.setScale(0.2);
    });

    button.on("pointerout", () => {
      button.setScale(0.12);
    });

    // chuyển scene

    button.on("pointerdown", () => {
      this.sound.play("start_game", { volume: 0.8 });
      this.time.delayedCall(150, () => {
        this.scene.start("GameScene");
      });
    });
  }
}
