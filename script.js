
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
const hudMonsterHp = document.getElementById('hud-monster-hp');
const hudStatus = document.getElementById('hud-status');
const canvasAnchor = document.getElementById('canvas-3d-anchor');


let selectedBiome = "";
let currentLevel = 1;

const biomeData = {
    forest: {
        title: "CRISIS BARIER // FOREST CAMPAIGN",
        hydration: "Boil jungle stream water using gathered hot stones.",
        feeding: "Collect wild forest berries and clean elephant track green.",
        active: "Navigate under dense canopies. Watch for crushing stampedes.",
        sanity: "Listen to natural bird rhythms to maintain standard passage of time.",
        groundColor: 0x11381e, fogColor: 0x051a0e, environmentType: "forest",
        enemyFile: "elephant", playerFile: "player"
    },
    desert: {
        title: "CRISIS BARIER // DESERT CAMPAIGN",
        hydration: "Ectract moisture lines from subterranean desert roots.",
        feeding: "Track small lizard beneath rock shards before heat peaks.",
        active: "Sprint across dunes using steady strides. Avoid active pride hunters.",
        sanity: "Count grains of sand structures to cimbat heat mirages.",
        groundColor: 0x54431e, fogColor: 0x241b08, environmentType: "desert",
        enemyFile: "lion", playerFile: "player"
    },
    sea: {
        title: "CRISIS BARIER // MARITIME CAMPAIGN",
        hydration: "Catch fresh tropical rain on outstrached boat tarps.",
        feeding: "Spear local surface reef fish. Dry them using pure sea salt layers.",
        active: "Steer boat hull coordinates clear of dynamic surface feeding frenzies.",
        sanity: "Chart constellation at night to preserve navigation sanity lines.",
        groundColor: 0x071b3a, fogColor: 0x020a1a, environmentType: "sea",
        enemyFile: "shark", playerFile: "boat"
    }
};

function selectBiome(zone) {
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


forestBtn.addEventListener('click', () => selectBiome('forest'));
desertBtn.addEventListener('click', () => selectBiome('desert'));
seaBtn.addEventListener('click', () => selectBiome('sea'));

let scene, camera, renderer;
let playerGroup, enemiesArray = [], dropsArray = [], environmentAssets = [];
let keysPressed = {};
let engineActive = false;

let cachedModels = { player: null, boat: null, enemy: null, ammo: null, survival: null };
let loadedEnemyType = "";


let playerState = { x: 0, z: 0, health: 15, maxHealth: 15, ammo: 15, maxAmmo: 15, rotation: 0, speed: 0.18 };
let weaponCooldown = false;
let damageCooldown = false;
let bullets3D = [];

window.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });

function cleanTinkercadGeometry(model, scaleFactor) {
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    model.rotation.set(-Math.PI / 2, 0, Math.PI);

    model.traverse((child) => {
        if (child.isMesh) {
            child.geometry.center();
            if (child.material) {

                child.material.side = THREE.DoubleSide;
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

    mtlLoader.load(plainMtlFile, (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(plainObjFile, (obj) => {
            cleanTinkercadGeometry(obj, scale);
            if (targetKey === 'enemy') cachedModels.enemy = obj;
            else cachedModels[targetKey] = obj;
            callback();
        }, undefined, () => { fallbackObjOnly(objLoader, plainObjFile, scale, targetKey, callback); });
    }, undefined, () => {
        fallbackObjOnly(objLoader, plainObjFile, scale, targetKey, callback);
    });
}

function fallbackObjOnly(loader, path, scale, targetKey, callback) {
    loader.load(path, (obj) => {
        cleanTinkercadGeometry(obj, scale);
        if (targetKey === 'enemy') cachedModels.enemy = obj;
        else cachedModels[targetKey] = obj;
        callback();
    }, undefined, () => callback());
}

function loadCustomTinkercadAssets(callback) {
    const config = biomeData[selectedBiome];
    const manager = new THREE.LoadingManager();

    hudStatus.innerText ="LINKING GRAPHIC BUFFERS...";
    hudStatus.style.color = "#ffaa00";

    if (config.playerFile === "player" && !cachedModels.player) {
        manager.itemStart('player');
        loadModelWithMaterials('models/player.mtl', 'models/player.obj', 0.02, 'player', () => manager.itemEnd('player'));
    } else if (config.playerFile === "boat" && !cachedModels.boat) {
        manager.itemStart('boat');
        loadModelWithMaterials('models/boat.mtl', 'models/boat.obj', 0.025, 'boat', () => manager.itemEnd('boat'));
    }

    if (loadedEnemyType !== config.enemyFile) {
        cachedModels.enemy = null;
        loadedEnemyType = config.enemyFile;
        manager.itemStart('enemy');
        loadModelWithMaterials(`models/${config.enemyFile}.mtl`, `models/${config.enemyFile}.obj`, 0.035, 'enemy', () => manager.itemEnd('enemy'));
    }

    if (!cachedModels.ammo) {
        manager.itemStart('ammo');
        loadModelWithMaterials('models/ammo.mtl', 'models/ammo.obj', 0.03, 'ammo', () => manager.itemEnd('ammo'));
    }

    if (!cachedModels.survival) {
        manager.itemStart('survival');
        loadModelWithMaterials('models/survival.mtl', 'models/survival.obj', 0.03, 'survival', () => manager.itemEnd('survival'));
    }

    manager.onLoad = () => {
        hudStatus.innerText = "LOAD COMPLETE";
        callback();
    };

    if (manager.isLoading === undefined || Object.keys(manager.itemsLoaded).length === 0) {
        setTimeout(callback, 50);
    }
}

function createEnemyHealthBillboard(hp, maxHp) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222228';
    ctx.fillRect(0, 8, 128, 16);

    const hpPercentage = Math.max(0, hp / maxHp);
    ctx.fillStyle = '#ff3355';
    ctx.fillRect(2, 10, (124 * hpPercentage), 12);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.5, 0.65, 1);
    sprite.position.y = 2.4;
    return sprite;
}

function initCore3DSimulation() {
    const config = biomeData[selectedBiome];
    canvasAnchor.innerHTML = "";

    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.fogColor);
    scene.fog = new THREE.FogExp2(config.fogColor, 0.025);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasAnchor.clientWidth,  canvasAnchor.clientHeight);
    canvasAnchor.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(65, canvasAnchor.clientWidth / canvasAnchor.clientHeight, 0.1, 1000);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    let dLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dLight.position.set(20, 40, 20);
    scene.add(dLight);

    let terrainGeo = new THREE.PlaneGeometry(120, 120);
    let terrainMat = new THREE.MeshStandardMaterial({ color: config.groundColor, roughness: 0.95 });
    let terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotateX(-Math.PI / 2);
    scene.add(terrainMesh);

    buildEnvironmentDecoration(config.environmentType);

    playerGroup = new THREE.Group();
    let activePlayerAsset = config.playerFile === "boat" ? cachedModels.boat : cachedModels.player;

    if (activePlayerAsset) {
        playerGroup.add(activePlayerAsset.clone());
    } else {
        let fallbackGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        let fallbackMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
        playerGroup.add(new THREE.Mesh(fallbackGeo, fallbackMat));
    }
    scene.add(playerGroup);

    playerState.maxAmmo = 15;
    playerState.ammo = playerState.maxAmmo;
    playerState.health = 15;
    playerState.x = 0; playerState.z = 0; playerState.rotation = 0;

    enemiesArray = [];
    dropsArray = [];
    bullets3D = [];

    let spawnCount = 1 + Math.floor(currentLevel * 0.8);
    let enemyBaseSpeed = 0.04 + (currentLevel * 0.012);

    for (let i = 0; i < spawnCount; i++) {
        spawnEnemyInstance(enemyBaseSpeed);
    }

    triggerItemDropGenerators();
}


function buildEnvironmentDecoration(type) {
    environmentAssets.forEach(asset => scene.remove(asset));
    environmentAssets = [];
    let assetCount = type === "sea" ? 150 : 250;

    for (let i = 0; i < assetCount; i++) {
        let geo, mat, mesh;
        let rx = (Math.random() * 100) - 50;
        let rz = (Math.random() * 100) - 50;

        if (Math.abs(rx) < 5 && Math.abs(rz) < 5) continue;

        if (type === "forest") {
            let treeGroup = new THREE.Group();
            let trunkGeo = new THREE.CylinderGeometry(0.15, 0.3, 2, 8);
            let trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2510, roughness: 0.9 });
            let trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            treeGroup.add(trunk);


            for (let t = 0; t < 3; t++) {
                let leavesGeo = new THREE.ConeGeometry(1.4 - (t * 0.3), 1.8, 8);
                let leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a2f14, roughness: 0.8 });
                let leaves =  new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.y = 2.2 + (t * 1.1);
                treeGroup.add(leaves);
            }

            treeGroup.position.set(rx, 0, rz);
            scene.add(treeGroup);
            environmentAssets.push(treeGroup);
        } else if (type === "desert") {
            geo = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.2, 0);
            mat = new THREE.MeshStandardMaterial({ color: 0x8c6f3d });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(rx, 0.2, rz);
            scene.add(mesh);
            environmentAssets.push(mesh);
        } else if (type === "sea") {
            geo = new THREE.IcosahedronGeometry(Math.random() * 0.8 + 0.2, 1);
            mat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.4});
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(rx, -0.2, rz);
            scene.add(mesh);
            environmentAssets.push(mesh);
        }
    }
}

function spawnEnemyInstance(speed) {
    let enemyGroup = new THREE.Group();
    let hpMetric = 10;

    if (cachedModels.enemy) {
        enemyGroup.add(cachedModels.enemy.clone());
    } else {
        let fallbackGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        let fallbackMat = new THREE.MeshStandardMaterial({ color: 0xde3333 });
        enemyGroup.add(new THREE.Mesh(fallbackGeo, fallbackMat));
    }

    let angle = Math.random() * Math.PI * 2;
    let radius = 35 + Math.random() * 10;
    enemyGroup.position.set(Math.cos(angle) * radius, 0.75, Math.sin(angle) * radius);

    let hpBar = createEnemyHealthBillboard(hpMetric, hpMetric);
    enemyGroup.add(hpBar);

    scene.add(enemyGroup);
    enemiesArray.push({ mesh: enemyGroup, billboard: hpBar, hp: hpMetric, maxHp: hpMetric, speed: speed });
}

function updateEnemyHealthBillboard(enemyInstance) {
    enemyInstance.mesh.remove(enemyInstance.billboard);
    let newBar = createEnemyHealthBillboard(enemyInstance.hp, enemyInstance.maxHp);
    enemyInstance.billboard = newBar;
    enemyInstance.mesh.add(newBar);
}

function triggerItemDropGenerators(){
    dropsArray.forEach(drop => scene.remove(drop.mesh));
    dropsArray  = [];
    
    let types = ['ammo', 'survival'];
    types.forEach(type => {
        let dropGroup = new THREE.Group();
        if(type === 'ammo' && cachedModels.ammo) {
           dropGroup.add(cachedModels.ammo.clone()); 
        } else if (type === 'survival' && cachedModels.survival) {
            dropGroup.add(cachedModels.survival.clone());
        } else {
            let geo = type === 'ammo' ? new THREE.BoxGeometry(1.2, 1.2, 1.2) : new THREE.SphereGeometry(0.8, 8, 8);
            let mat = new THREE.MeshStandardMaterial({ color: type === 'ammo' ? 0xffd700 : 0xbf55ec });
            dropGroup.add(new THREE.Mesh(geo, mat));
        }

        let rx = (Math.random() * 40) - 20;
        let rz = (Math.random() * 40) - 20;
        dropGroup.position.set(rx, 0.5, rz);
        scene.add(dropGroup);
        dropsArray.push({ mesh: dropGroup, type: type });
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && engineActive && playerState.ammo > 0 && !weaponCooldown) {
        playerState.ammo--;
        weaponCooldown = true;
        setTimeout(() => { weaponCooldown = false; }, 200);

        let laserGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
        laserGeo.rotateX(Math.PI / 2);
        let laserMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        let laserMesh = new THREE.Mesh(laserGeo, laserMat);


        let ox = Math.sin(playerState.rotation);
        let oz = Math.cos(playerState.rotation);

        laserMesh.position.set(playerState.x + ox, 0.8, playerState.z + oz);
        laserMesh.rotation.y = playerState.rotation;
        scene.add(laserMesh);

        bullets3D.push({ mesh: laserMesh, vx: ox * 0.6, vz: oz * 0.6, range: 0 });
    }
});

playBtn.addEventListener('click', () => {
    loadCustomTinkercadAssets(() => {
        uiWrapper.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        hudStatus.innerText ="SIMULATION RUNNING";
        hudStatus.style.color = "#00ffcc";

        engineActive = true;
        initCore3DSimulation();
        renderCampaignLoop3D();
    });
});

quitBtn.addEventListener('click', () => {
    engineActive = false;
    gameContainer.classList.add('hidden');
    uiWrapper.classList.remove('hidden');
});

function renderCampaignLoop3D() {
    if (!engineActive) return;

    processEngineFrameUpdates();


    camera.position.set(playerState.x, 1.2, playerState.z);


    let targetLookX = playerState.x + Math.sin(playerState.rotation) * 10;
    let targetLookZ = playerState.z + Math.cos(playerState.rotation) * 10;
    camera.lookAt(targetLookX, 1.2, targetLookZ);

    dropsArray.forEach(drop => { drop.mesh.rotation.y += 0.02; });

    renderer.render(scene, camera);
    requestAnimationFrame(renderCampaignLoop3D);
}

function processEngineFrameUpdates() {

    if (keysPressed['a']) playerState.rotation += 0.022;
    if (keysPressed['d']) playerState.rotation -= 0.022;

    let forwardX = Math.sin(playerState.rotation);
    let forwardZ = Math.cos(playerState.rotation);

    if (keysPressed['w']) {
        playerState.x += forwardX * playerState.speed;
        playerState.z += forwardZ * playerState.speed;
    }
    if (keysPressed['s']) {
        playerState.x -= forwardX * playerState.speed;
        playerState.z -= forwardZ * playerState.speed;
    }

    playerState.x = Math.max(Math.min(playerState.x, 50), -50);
    playerState.z = Math.max(Math.min(playerState.z, 50), -50);

    playerGroup.position.set(playerState.x, 0.4, playerState.z);
    playerGroup.rotation.y = playerState.rotation;

    for (let i = bullets3D.length - 1; i >= 0; i--) {
        let b = bullets3D[i];
        b.mesh.position.x += b.vx;
        b.mesh.position.z += b.vz;
        b.range++;

        let hitRegistered = false;

        for (let j = enemiesArray.length - 1; j >= 0; j--) {
            let enemy = enemiesArray[j];
            let edx = enemy.mesh.position.x - b.mesh.position.x;
            let edz = enemy.mesh.position.z - b.mesh.position.z;
            let dist = Math.sqrt(edx * edx + edz * edz);

            if (dist < 2.5) {
                enemy.hp--;
                updateEnemyHealthBillboard(enemy);

                scene.remove(b.mesh);
                bullets3D.splice(i, 1);
                hitRegistered = true;

                if (enemy.hp <= 0) {
                    scene.remove(enemy.mesh);
                    enemiesArray.splice(j, 1);

                    if (enemiesArray.length === 0) {
                        if (currentLevel < 10) {
                            currentLevel++;
                            hudStatus.innerText = `LEVEL ${currentLevel} INITIALIZING...`;
                            setTimeout(initCore3DSimulation, 1500);
                        } else {
                            hudStatus.innerText =  "CAMPAIGN CLEAR! YOU WIN!";
                            hudStatus.style.color = "#00ffcc";
                            engineActive = false;
                        }
                    }
                }
                break;
            }
        }

        if (hitRegistered) continue;
        if (b.range > 50) {
            scene.remove(b.mesh);
            bullets3D.splice(i,1);
        }
    }

    let aggregateMonsterHp = 0;
    enemiesArray.forEach(enemy => {
        aggregateMonsterHp += enemy.hp;

        let tdx = playerState.x - enemy.mesh.position.x;
        let tdz = playerState.z - enemy.mesh.position.z;
        let tDist = Math.sqrt(tdx * tdx + tdz * tdz);

        if (tDist > 0.5) {
            enemy.mesh.position.x += (tdx / tDist) * enemy.speed;
            enemy.mesh.position.z += (tdz / tDist) * enemy.speed;

            let movementAngle = Math.atan2(tdx, tdz);
            enemy.mesh.rotation.y = movementAngle;
        }


        if (tDist < 2.2) {
            if (!damageCooldown) {
                damageCooldown = true;
                playerState.health--;

                if (playerState.health <= 0) {
                    hudStatus.innerText = "ENEMIES DEFEATED // GAME OVER";
                    hudStatus.style.color = "#ff3355";
                    engineActive = false;
                }


                setTimeout(() => { damageCooldown = false; }, 800);
            }
        }
    });

    for (let i = dropsArray.length - 1; i >= 0; i--) {
        let drop = dropsArray[i];
        let pdx = playerState.x - drop.mesh.position.x;
        let pdz = playerState.z - drop.mesh.position.z;
        let pDist = Math.sqrt(pdx * pdx + pdz * pdz);
        
        if (pDist < 2.0) {
            if (drop.type === 'ammo') {
                playerState.ammo = Math.min(playerState.ammo + 5, playerState.maxAmmo);
            } else if (drop.type === 'survival') {

                playerState.health = Math.min(playerState.health + 1, playerState.maxHealth);
            }
            scene.remove(drop.mesh);
            dropsArray.splice(i, 1);

            if (dropsArray.length === 0) {
                setTimeout(triggerItemDropGenerators, 3000);
            }
        }
    }

    hudLevel.innerText = `${currentLevel} / 10`;
    hudHealth.innerText = `${playerState.health} / ${playerState.maxHealth}`;
    hudAmmo.innerText = `${playerState.ammo} / ${playerState.maxAmmo}`;
    hudMonsterHp.innerText = enemiesArray.length > 0 ? aggregateMonsterHp : "0";
}

window.addEventListener('resize', () => {
    if (!scene) return;
    camera.aspect = canvasAnchor.clientWidth / canvasAnchor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasAnchor.clientWidth, canvasAnchor.clientHeight);
}); 