import Phaser from "phaser";
import playAgain from "../assets/homeUI/TryAgainButton.png";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  preload() {
    this.load.image("playAgain", playAgain);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // ===== Nền tối mờ =====
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.5
    );

    // ===== Khung popup =====
    let popup = this.add.rectangle(
      width / 2,
      height / 2,
      450,
      300,
      0x222222,
      0.9
    );

    popup.setStrokeStyle(3, 0xffffff);

    // hiệu ứng xuất hiện
    popup.setScale(0);

    // ===== Tiêu đề =====
    let title = this.add
      .text(
        width / 2,
        height / 2 - 70,
        "GAME OVER",
        {
          fontSize: "42px",
          color: "#ffffff",
          fontStyle: "bold"
        }
      )
      .setOrigin(0.5);

    title.setScale(0);

    // ===== Nút play again =====
    let button = this.add.image(
      width / 2,
      height / 2 + 50,
      "playAgain"
    );

    button.setScale(0.35);
    button.setInteractive();

    button.setScale(0);

    // hover
    button.on("pointerover", () => {
      button.setScale(0.4);
    });

    button.on("pointerout", () => {
      button.setScale(0.35);
    });

    // restart game
    button.on("pointerdown", () => {
      this.scene.stop("GameOverScene");
      this.scene.stop("GameScene");
      this.scene.start("GameScene");
    });

    // ===== Animation popup =====

    this.tweens.add({
      targets: [popup, title, button],
      scale: 1,
      duration: 300,
      ease: "Back.Out"
    });
  }
}