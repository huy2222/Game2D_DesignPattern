import Phaser from "phaser";
import mapUrl from "../assets/Map 2.json?url";
import tilesetImg from "../assets/Tileset.png";
import decorationsImg from "../assets/Decorations.png";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.on("loaderror", (fileObj) => {
      console.error("Asset load error:", fileObj?.key, fileObj?.src);
    });

    // Load tilemap JSON by URL (stable with Phaser Loader)
    this.load.tilemapTiledJSON("map", mapUrl);

    // Load tileset images (keys are referenced by addTilesetImage in create)
    this.load.image("TilesetImage", tilesetImg);
    this.load.image("DecorationsImage", decorationsImg);
  }

  create() {
    this.cameras.main.setBackgroundColor("#1f2937");

    // Build the map from Tiled JSON
    const map = this.make.tilemap({ key: "map" });
    if (!map) {
      this.add
        .text(16, 16, "Map load failed: key 'map' not found", { fontSize: "18px", color: "#ff6b6b" })
        .setScrollFactor(0);
      return;
    }

    // These names must match the tileset names inside Map 2.json
    const groundTileset = map.addTilesetImage("Tileset", "TilesetImage");
    const decorationTileset = map.addTilesetImage("Decorations", "DecorationsImage");
    const tilesets = [groundTileset, decorationTileset].filter(Boolean);

    if (tilesets.length === 0) {
      throw new Error("No tileset could be created. Check tileset names in Map 2.json.");
    }

    // Create tile layers by name (works across Phaser versions)
    const mapLayers = {};
    const discoveredLayerNames = (map.layers || [])
      .map((layerData) => layerData?.name)
      .filter(Boolean);

    // Fallback for this map in case runtime metadata omits layer entries
    const fallbackLayerNames = ["Background", "GrassnLake", "Decoration", "Decoration 2"];
    const layerNamesToCreate = discoveredLayerNames.length > 0 ? discoveredLayerNames : fallbackLayerNames;

    layerNamesToCreate.forEach((layerName) => {
        const layer = map.createLayer(layerName, tilesets, 0, 0);
        if (!layer) {
          console.warn(`Layer ${layerName} could not be created.`);
          return;
        }

        mapLayers[layerName] = layer;
      });

    if (Object.keys(mapLayers).length === 0) {
      this.add
        .text(16, 16, "Map loaded but no layer was created", { fontSize: "18px", color: "#ff6b6b" })
        .setScrollFactor(0);
      return;
    }

    // Keep collision behavior if collision layer/property exists
    const collidableLayers = [];
    Object.values(mapLayers).forEach((layer) => {
      const hasCollisionProperty = (layer.layer.properties || []).some(
        (prop) =>
          (prop.name === "collision" || prop.name === "collides") &&
          (prop.value === true || prop.value === 1)
      );

      if (hasCollisionProperty || /collision|wall|obstacle/i.test(layer.layer.name)) {
        layer.setCollisionByExclusion([-1], true);
        collidableLayers.push(layer);
      }
    });

    if (this.player && collidableLayers.length > 0) {
      collidableLayers.forEach((collisionLayer) => {
        this.physics.add.collider(this.player, collisionLayer);
      });
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.roundPixels = true;

    if (this.player) {
      this.cameras.main.startFollow(this.player, true);
    } else {
      this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
    }

    this.add
      .text(12, 12, "Map loaded", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 4 }
      })
      .setScrollFactor(0)
      .setDepth(9999);

    console.log("GameScene created with tilemap!");
    console.log("Map dimensions:", map.width, "x", map.height);
    console.log("Map size in pixels:", map.widthInPixels, "x", map.heightInPixels);
    console.log("Discovered layer names:", discoveredLayerNames);
    console.log("Loaded layers:", Object.keys(mapLayers));
  }

  update() {
    // Game loop
  }
}



