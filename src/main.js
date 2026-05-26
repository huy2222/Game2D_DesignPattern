import Phaser from 'phaser';
import HomeScene from "./scenes/HomeScene.js";
import GameScene from "./scenes/GameScene.js";
import GameOverScene from "./scenes/GameOverScene.js";

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
        GameScene,
        GameOverScene

    ]

}

new Phaser.Game(config);