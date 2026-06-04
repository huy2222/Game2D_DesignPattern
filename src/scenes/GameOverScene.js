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

    // ===== Tiêu đề =====
    let title = this.add
      .text(
        width / 2,
        height / 2 - 70,
        "GAME OVER",
        {
          fontSize: "42px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // ===== Nút Try Again =====
    let button = this.add.image(
      width / 2,
      height / 2 + 50,
      "playAgain"
    );

    button.setInteractive();

    // Đặt tất cả scale ban đầu = 0 để animate
    popup.setScale(0);
    title.setScale(0);
    button.setScale(0);

    // ===== Hover effect =====
    button.on("pointerover", () => {
      button.setScale(0.4);
    });

    button.on("pointerout", () => {
      button.setScale(0.35);
    });

    // ===== Restart game =====
    button.on("pointerdown", () => {
      this.scene.stop("GameOverScene");
      this.scene.stop("GameScene");
      this.scene.start("GameScene");
    });

    // ===== Animation popup =====

    // Popup
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 300,
      ease: "Back.Out",
    });

    // Title
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 300,
      ease: "Back.Out",
      delay: 100,
    });

    // Button
    this.tweens.add({
      targets: button,
      scale: 0.35,
      duration: 300,
      ease: "Back.Out",
      delay: 200,
    });
  }
}