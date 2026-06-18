const  activeBiomeText = document.getElementById('active-biome');
const forestBtn = document.getElementById('btn-forest');


const hydrationText = document.querySelector('#hydration p');
const feedingText = document.querySelector('#feeding p');
const activeText = document.querySelector('#active p');
const enterainmentText = document.querySelector('#enterainment p');


const forestContent = {
    biomeName: "The Dense Forest ",
    hydration: "Look for fast-moving streams. Avoid stagnant puddles unless you can boil it over a fire first.",
    feeding: "Insect under rotting logs are high in protein. Stick to pine needles for tea; stay away from random mushrooms.",
    active: "Build a debris shelter immediately before dark. Priortize keeping your core body temprature warm.",
    enterainment: "Carve something out of wood, or organize your firewood pile by size. Do not sit idle and panic. You'll LOSE your SANITY BRO?!?!"
};




forestBtn.addEventListener('click', function() {
    activeBiomeText.innerText = forestContent.biomeName;


    hydrationText.innerText = forestContent.hydration;
    feedingText.innerText = forestContent.feeding;
    activeText.innerText = forestContent.active;
    entertainmentText.innerText = forestContent.entertainnment;


    console.log("Forest contentloaded successfully");
});