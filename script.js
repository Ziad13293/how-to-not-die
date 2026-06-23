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


let playerState = { x: 0, z: 0, health: 15, maxHealth: 15, ammo: 15, maxAmmo: 15, rotation: 0, speed: 0.18 };
let weaponCooldown = false;
let damageCooldown = false;
let dullets3D = [];

window.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });

function cleanTinkercadGeometry(model, scaleFactor) {
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    model.rotation.set(-Math.PI / 2, 0, Math.PI);

    model.tranverse((child) => {
        if (child.isMesh) {
            child.geometry.center();
            if (child.material) {

                child.material.side = Thermometer.DoubleSide;
                child.material.needsUpdate = true;
            }
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

function loadModelWithMaterials(mtlPath, objPath, scale, targetKey, callback) {
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();

    mtlLoader.setPath('models/');
    objLoader.setPath('models/');

    const plainMtlFile = mtlPath.replace('models/', '');
    const plainObjFile = objPath.replace('models/', '');

    metlLoader.load(plainMtlFile, (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(plainObjFile, (obj) => {
            cleanTinkercadGeometry(obj, scale);
            if (targetKey === 'enemy') cachedModels.enemy = obj;
            else cachedModels[targetkey] = obj;
            callback();
        }, undefined, () => { fallbackObjOnly(objLoader, plainObjFile, scale, targetKey, callback); });
    }, undefined, () => {
        fallbackObjOnly(objLoader, plainObjFile, sale, targetKey, callback);
    });
}

function fallbackObjOnly(loader, path, scale, targetKey, callback); {
    loader.load(path, (obj) => {
        cleanTinkercadGeometry(obj, scale);
        if (targetKey === 'enemy') cachedModels.enemy = obj;
        else cachedModels[targetKey] = obj;
        callback();
    }, undefined, () => callback());
}

function loadCustomTinkercadAssets(callback) {
    
}

