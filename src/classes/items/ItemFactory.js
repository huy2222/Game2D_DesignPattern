import SpeedItem from "./SpeedItem";
import DamageItem from "./DamageItem";
import ShieldItem from "./ShieldItem";
import HealthItem from "./HealthItem";
import CriticalItem from "./CriticalItem";
import BurnItem from "./BurnItem";

export const ITEM_TEXTURE_KEYS = {
  speed: "item_speed",
  damage: "item_damage",
  shield: "item_shield",
  health: "item_health",
  critical: "item_critical",
  burn: "item_burn",
};

export const ITEM_CONFIGS = {
  speed: {
    type: "speed",
    textureKey: ITEM_TEXTURE_KEYS.speed,
    effect: { type: "speed", label: "Speed", duration: 5000 },
  },
  damage: {
    type: "damage",
    textureKey: ITEM_TEXTURE_KEYS.damage,
    effect: { type: "damage", label: "Damage", duration: 3000 },
  },
  shield: {
    type: "shield",
    textureKey: ITEM_TEXTURE_KEYS.shield,
    effect: { type: "shield", label: "Shield", duration: 5000 },
  },
  health: {
    type: "health",
    textureKey: ITEM_TEXTURE_KEYS.health,
    effect: { type: "health", label: "Health", amount: 25 },
  },
  critical: {
    type: "critical",
    textureKey: ITEM_TEXTURE_KEYS.critical,
    effect: { type: "critical", label: "Critical", duration: 3000 },
  },
  burn: {
    type: "burn",
    textureKey: ITEM_TEXTURE_KEYS.burn,
    effect: { type: "burn", label: "Burn", duration: 3000 },
  },
};

const ITEM_CLASSES = {
  speed: SpeedItem,
  damage: DamageItem,
  shield: ShieldItem,
  health: HealthItem,
  critical: CriticalItem,
  burn: BurnItem,
};

const ENEMY_DROP_TABLE = {
  orc: ["speed", "speed", "damage", "damage", "burn"],
  soldier: ["shield", "shield", "critical", "health", "health"],
  default: ["speed", "damage", "shield", "health", "critical", "burn"],
};

export default class ItemFactory {
  static create(scene, x, y, type) {
    const config = ITEM_CONFIGS[type];
    const ItemClass = ITEM_CLASSES[type];
    if (!config || !ItemClass) return null;

    return new ItemClass(scene, x, y, config);
  }

  static shouldDrop(dropChance = 0.35) {
    return Math.random() < dropChance;
  }

  static rollDropType(enemyType) {
    const table = ENEMY_DROP_TABLE[enemyType] || ENEMY_DROP_TABLE.default;
    return table[Math.floor(Math.random() * table.length)];
  }

  static rollAnyType() {
    const types = Object.keys(ITEM_CONFIGS);
    return types[Math.floor(Math.random() * types.length)];
  }
}
