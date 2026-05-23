import Phaser from 'phaser';
import HomeScene from "./scenes/HomeScene.js";
// import GameScene from "./scenes/GameScene.js";

const config={

    type:Phaser.AUTO,

    width:1000,
    height:600,

    physics:{
        default:"arcade",
        arcade:{
            debug:false
        }
    },

    scene:[
        HomeScene,
        // GameScene
    ]

}

new Phaser.Game(config);