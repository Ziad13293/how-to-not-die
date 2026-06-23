const activeBiomeText = document.getElementById('active-biome');
const playBtn = document.getElementById('btn-play');
const uiWrapper = document.getElementById('ui-wrapper');
const gameContainer = document.getElementById('game-container');
const quitBtn = document.getElementById('btn-quit');

const forestBtn = document.getElementById('btn-forest');
const desertBtn = document.getElementById('btn-desert');
const seaBtn = document.getElementById('btn-sea');

const hydrationText = document.querySelector('#hydration p');
const feedingText = document.querySelector('#feeding p');
const activeText = document.querySelector('#active p');
const entertainmentText = document.querySelector('#entertainment p');

const hudLevel = document.getElementById('hud-level');
const hudHealth = document.getElementById('hud-health');
const hudAmmo = document.getElementById('hud-ammo');
const hudMonesterHp = document.getElementById('hud-monster-hp');
const hudStatus = document.getElementById('hud-status');
const canvasAnchor = document.getElementById('canvas-3d-anchor');


let selectedBiome = "";
let currentLevel = 1;

const biomeData = {
    forest: {
        title: "FOREST SYSTEM // ELEPHANT CAMPAIGN",
        hydration: "Boil jungle stream water using gathered hot stones.",
        feeding: "Collect wild forest berries and clean elephant track green.",
        active: "Navigate under dense canopies. Watch for crushing stampedes.",
        sanity: "Listen to natural bird rhythms to maintain standard passage of time.",
        groundColor: 0x11381e, fogColor: 0x051a0e, environmentType: "forest",
        enemyFile: "elephant", playerFile: "player"
    },
    desert: {
        title: "DESERT SYSTEM // LION CAMPAIGN",
        hydration: "Ectract moisture lines from subterranean desert roots.",
        feeding: "Track small lizard beneath rock shards before heat peaks.",
        active: "Sprint across dunes using steady strides. Avoid active pride hunters.",
        sanity: "Count grains of sand structures to cimbat heat mirages.",
        groundColor: 0x54431e, fogColor: 0x241b08, environmentType: "desert",
        enemyFile: "lion", playerFile: "player"
    },
    sea: {
        title: "MARITIME SYSTEM // SHARK CAMPAIGN",
        hydration: "Catch fresh tropical rain on outstrached boat tarps.",
        feeding: "Spear local surface reef fish. Dry them using pure sea salt layers.",
        active: "Steer boat hull coordinates clear of dynamic surface feeding frenzies.",
        sanity: "Chart constellation at night to preserve navigation sanity lines.",
        groundColor: 0x071b3a, fogColor: 0x020a1a, environmentType: "sea",
        enemyFile: "shark", playerFile: "boat"
    }
};

function selectedBiome(zone) {
    selectedBiome = zone;
    currentLevel = 1;
    const config = biomeData[zone];
    activeBiomeText.innerText = config.title;
    hydrationText.innerText = config.hydration;
    feedingText.innerText = config.feeding;
    activeText.innerText = config.active;
    entertainmentText.innerText = config.sanity;
    playBtn.classList.remove('hidden');
}

forestBtn.addEventListener('click', () => selectedBiome('forest'));
desertBtn.addEventListener('click', () => selectedBiome('desert'));
seaBtn.addEventListener('click', () => selectedBiome('sea'));


let scene, camera, renderer;
let playerGroup, enemiesArray = [], dropArray = [], environmentAssets = [];
let keysPressed = {};
let engineActive = false;

let cachedModels = { player: null, boat: null, enemy: null, ammo: null, survival: null };
let loadedEnemyType = "";


let playerState = { x: 0, z: 0, health: 15, maxHealth: 15, ammo: 15, maxAmmo:}
