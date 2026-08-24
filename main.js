import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGalaxy } from './objects/galaxy.js';
import { createSun } from './objects/sun.js';
import { createPlanet } from './objects/planet.js';
import { createSaturn } from './objects/saturn.js';

let scene, camera, renderer, controls, raycaster, mouse,sun;
const clickableObjects = [];
const orbitingPlanets = [];
const rotatingPlanets = [];

let label = document.getElementById("planetLabel");

let clickSound = new Audio("sounds/click.mp3");
clickSound.volume = 0.5;   // adjust if too loud

let ambientMusic = new Audio("sounds/ambient.mp3");
ambientMusic.loop = true;
ambientMusic.volume = 0.3;
let musicPlaying = false;

let loadingProgress = 0;
let firstFrame = true;

const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
    const percent = (loaded / total) * 100;
    document.getElementById("progress").style.width = percent + "%";
};
manager.onLoad = () => {
    document.getElementById("loadingScreen").style.display = "none";
};

const progressBar = document.getElementById("progress");

const fakeLoader = setInterval(() => {

    loadingProgress += 7;

    if(progressBar){
        progressBar.style.width = loadingProgress + "%";
    }

    if(loadingProgress >= 100){
        clearInterval(fakeLoader);
    }

}, 80);

// ===== distant background stars =====

function createStarfield(count = 6000, radius = 1200){
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xbfd7ff),
        new THREE.Color(0xfff4d6),
        new THREE.Color(0xffe1c2)
    ];

    for(let i = 0; i < count; i++){
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = radius * (0.6 + Math.random() * 0.4);

        positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i*3+2] = r * Math.cos(phi);

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i*3] = c.r;
        colors[i*3+1] = c.g;
        colors[i*3+2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
}

// ===== asteroid belt (Mars -> Jupiter gap) =====

function createAsteroidBelt(count = 500){
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
        new THREE.Color(0xb8a68e),
        new THREE.Color(0x9a8b76),
        new THREE.Color(0xcbb99a)
    ];

    for(let i = 0; i < count; i++){
        const angle = Math.random() * Math.PI * 2;
        const r = 66 + Math.random() * 10;
        const y = (Math.random() - 0.5) * 4;

        positions[i*3]   = Math.cos(angle) * r;
        positions[i*3+1] = y;
        positions[i*3+2] = Math.sin(angle) * r;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i*3] = c.r;
        colors[i*3+1] = c.g;
        colors[i*3+2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.3,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: true
    });

    const belt = new THREE.Points(geometry, material);
    belt.rotation.x = degToRad(2);
    return belt;
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    if(window.innerWidth < 768){camera.position.set(0, 120, 200); // zoom out for small screens
    }else{
        camera.position.set(0, 80, 140);
    }

    renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.touchAction = 'none';   // stop the browser's native pinch/pan fighting OrbitControls
    document.body.appendChild(renderer.domElement);

    // 1. Add the WebGPU Galaxy from your code
    scene.add(createGalaxy());
    scene.add(createStarfield());

    // 2. Add the Sun
    sun = createSun();
    sun.userData.url = "about";
    scene.add(sun);
    clickableObjects.push(sun);
    rotatingPlanets.push({mesh: sun,speed: 0.0005});


    // 3. Mercury as Education
    const educationData = { name: "eduaction", tex: 'textures/mercury.jpg', size: 3, dist: 30, url: "education" };
    const education = createPlanet(educationData.name, educationData.tex, educationData.size, educationData.dist, educationData.url);

    scene.add(education.group);
    clickableObjects.push(education.mesh);
    orbitingPlanets.push({ group: education.group, speed: 0.0004 });
    rotatingPlanets.push({mesh: education.mesh,speed: 0.01});
    education.group.rotation.y = 0.4;
    education.group.rotation.x = degToRad(7);
    education.mesh.rotation.z = degToRad(2);

    // Venus as Experience
    const expData = { name: "experience", tex: 'textures/venus.jpg', size: 5.5, dist: 40, url: "experience" };
    const exp = createPlanet(expData.name, expData.tex, expData.size, expData.dist, expData.url);

    scene.add(exp.group);
    clickableObjects.push(exp.mesh);
    orbitingPlanets.push({ group: exp.group, speed: 0.0005 });
    rotatingPlanets.push({mesh: exp.mesh,speed: 0.01});
    exp.group.rotation.y = 2.1;
    exp.group.rotation.x = degToRad(-3.5);
    exp.mesh.rotation.z = degToRad(177);   // near-total retrograde tilt, like the real Venus

    // 3. earth as Skills
    const earthData = { name: "Projects", tex: 'textures/earth.jpg', size: 6, dist: 50, url: "Projects" };
    const earth = createPlanet(earthData.name, earthData.tex, earthData.size, earthData.dist, earthData.url);

    scene.add(earth.group);
    clickableObjects.push(earth.mesh);
    orbitingPlanets.push({ group: earth.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: earth.mesh,speed: 0.01});
    earth.group.rotation.y = 4.0;
    earth.mesh.rotation.z = degToRad(23);

    // mars for Projects
    const projectData = { name: "Skills", tex: 'textures/mars.jpg', size: 4, dist: 60, url: "Skills" };
    const mars = createPlanet(projectData.name, projectData.tex, projectData.size, projectData.dist, projectData.url);

    scene.add(mars.group);
    clickableObjects.push(mars.mesh);
    rotatingPlanets.push({mesh: mars.mesh,speed: 0.01});
    orbitingPlanets.push({ group: mars.group, speed: 0.0002});
    mars.group.rotation.y = 5.6;
    mars.group.rotation.x = degToRad(5);
    mars.mesh.rotation.z = degToRad(25);

    // asteroid belt between Mars and Jupiter
    scene.add(createAsteroidBelt());

    //Jupiter as Resume
    const jupiterData = { name: "resume", tex: 'textures/jupiter.png', size: 14, dist: 80, url: "resume" };
    const jupiter = createPlanet(jupiterData.name, jupiterData.tex, jupiterData.size, jupiterData.dist, jupiterData.url);

    scene.add(jupiter.group);
    clickableObjects.push(jupiter.mesh);
    orbitingPlanets.push({ group: jupiter.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: jupiter.mesh,speed: 0.01});
    jupiter.group.rotation.y = 1.3;
    jupiter.group.rotation.x = degToRad(-4);
    jupiter.mesh.rotation.z = degToRad(3);

    //Saturn as Contact
    const saturnData = { name: "contact", tex: 'textures/jupiter.png', size: 12, dist: 100, url: "contact" };
    const saturn = createSaturn(saturnData.name, saturnData.tex, saturnData.size, saturnData.dist, saturnData.url);

    scene.add(saturn.group);
    clickableObjects.push(saturn.group);
    orbitingPlanets.push({ group: saturn.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: saturn.mesh,speed: 0.01});
    saturn.group.rotation.y = 3.0;
    saturn.group.rotation.x = degToRad(6);

    createOrbit(30, degToRad(7));
    createOrbit(40, degToRad(-3.5));
    createOrbit(50, 0);
    createOrbit(60, degToRad(5));
    createOrbit(80, degToRad(-4));
    createOrbit(100, degToRad(6));


    // 4. Controls & Lights
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;   // prevents accidental shifting
    controls.target.set(0,0,0);
    controls.update();
    controls.addEventListener('start', hideOnboardHint);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('click', onClick);
    window.addEventListener("mousemove", onMouseMove);
    const light = new THREE.PointLight(0xffffff, 8000, 1000); // Light from the sun
    scene.add(light);
    scene.add(new THREE.HemisphereLight(0x223355, 0x0a0a10, 0.9)); // cool sky fill, faint ground bounce
    scene.add(new THREE.AmbientLight(0x101820, 0.3)); // guarantees dark sides never go pure black

    // ===== Handle Window Resize =====
    window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});

    animate();
    setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
    showOnboardHint();
    setTimeout(hideOnboardHint, 8000);
}, 1500);
}

// ===== onboarding hint =====

function showOnboardHint(){
    const hint = document.getElementById("onboardHint");
    if(hint) hint.classList.add("show");
}

function hideOnboardHint(){
    const hint = document.getElementById("onboardHint");
    if(hint) hint.classList.remove("show");
}

async function animate() {

    requestAnimationFrame(animate);

    orbitingPlanets.forEach(p => {
        p.group.rotation.y += p.speed;
    });

    rotatingPlanets.forEach(p => {
        p.mesh.rotation.y += p.speed;
    });
    const flareBase = 34;
    sun.children[0].scale.x = flareBase * (1 + 2*Math.sin(10*Date.now()*0.03)*0.05);
    sun.children[0].scale.y = flareBase * (1 + 2*Math.cos(10*Date.now()*0.02)*0.05);
    controls.update();

    await renderer.renderAsync(scene, camera);
    if(firstFrame){
        const loader = document.getElementById("loadingScreen");
        if(loader) loader.style.display = "none";
        firstFrame = false;
    }

}

init();

// ===== onclick function =====

// ===== shared panel-opening logic (used by 3D planet clicks AND the ribbon nav) =====

const panelForUrl = {
    "Skills": "skillPanel",
    "Projects": "projectPanel",
    "about": "aboutPanel",
    "education": "educationPanel",
    "experience": "experiencePanel",
    "resume": "resumePanel",
    "contact": "contactPanel"
};

function openPanelForUrl(url){
    const panelId = panelForUrl[url];
    if(!panelId) return;
    clickSound.currentTime = 0;  // reset if spam clicked
    clickSound.play();
    document.getElementById(panelId).classList.add("panel-active");
    typePanel(panelId, 15);
}

function onClick(event){
    console.log("CLICK DETECTED");
    hideOnboardHint();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y =-((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse,camera);
    const intersects =raycaster.intersectObjects(clickableObjects,true);
    if(intersects.length===0) return;
    let object = intersects[0].object;
    while(object){
        if(object.userData && object.userData.url){
            openPanelForUrl(object.userData.url);
            return;
        }
        object = object.parent;
    }
}

// ===== orbite function =====

function createOrbit(radius, tilt = 0){
    const geometry =
    new THREE.RingGeometry(radius-0.1,radius+0.1,128);
    const material =new THREE.MeshBasicMaterial({
        color:0x00ff88,
        side:THREE.DoubleSide,
        transparent:true,
        opacity:0.08,
        blending:THREE.AdditiveBlending,
        depthWrite:false
    });
    const orbit =
    new THREE.Mesh(geometry,material);
    orbit.rotation.x =
    Math.PI/2 + tilt;   // matches the same planet's orbital-plane inclination
    scene.add(orbit);

}

function degToRad(deg){
    return deg * Math.PI / 180;
}

// ===== Typing Effect =====

function typePanel(panelId, speed = 15){
    const panel = document.getElementById(panelId);
    // skip the skill chips - typing dozens of short tags one letter at a time is slow
    // and, under main-thread contention (e.g. a busy render loop on a phone), can look stuck/cut off
    const elements = Array.from(panel.querySelectorAll("h1, h2, p, li")).filter(el => !el.closest(".chip-group"));
    let delay = 0;
    elements.forEach(el => {
        const text = el.textContent;
        el.textContent = "";
    setTimeout(()=>{
        let i = 0;
        function typing(){
            if(i < text.length){
                el.textContent += text[i];
                i++;
                setTimeout(typing,speed);
            }
        }
        typing();
    },delay);
    delay += text.length * speed + 10;
    });
}

// ===== Close panel when clicking outside =====
document.addEventListener("click", function(e){
    const panels = document.querySelectorAll("#skillPanel, #projectPanel, #aboutPanel, #educationPanel, #experiencePanel, #contactPanel, #resumePanel, #achievementPanel");
    panels.forEach(panel => {
        if(panel.classList.contains("panel-active")){
    // If click is NOT inside panel
        if(!panel.contains(e.target)){
            panel.classList.remove("panel-active");
        }
    }
});
});

// ===== ribbon nav: same panel-opening logic as clicking the planet in 3D =====
document.addEventListener("DOMContentLoaded", () => {

document.querySelectorAll(".planetInfo[data-url]").forEach(item => {
    item.addEventListener("click", (e) => {
        e.stopPropagation();   // don't let this bubble to the "click outside closes panel" listener
        hideOnboardHint();
        openPanelForUrl(item.dataset.url);
    });
    item.addEventListener("keydown", (e) => {
        if(e.key === "Enter" || e.key === " "){
            e.preventDefault();
            hideOnboardHint();
            openPanelForUrl(item.dataset.url);
        }
    });
});

});

// ===== ambient sound: autoplay on load, with a graceful fallback if the browser blocks it =====
document.addEventListener("DOMContentLoaded", () => {

const toggle = document.getElementById("musicToggle");
const toggleLabel = toggle.querySelector(".navLabel");

function setMusicLabel(text){
    toggleLabel.textContent = text;
}

function startMusic(){
    ambientMusic.play().then(() => {
        musicPlaying = true;
        setMusicLabel("Music On");
    }).catch(() => {
        // autoplay blocked - retry on the user's first interaction with the page
        const retry = () => {
            ambientMusic.play().then(() => {
                musicPlaying = true;
                setMusicLabel("Music On");
            });
        };
        document.addEventListener("pointerdown", retry, { once: true });
        document.addEventListener("keydown", retry, { once: true });
    });
}

startMusic();

toggle.addEventListener("click", () => {

if(!musicPlaying){

ambientMusic.play();
setMusicLabel("Music On");
musicPlaying = true;

}else{

ambientMusic.pause();
setMusicLabel("Music Off");
musicPlaying = false;

}

});

});

// ===== this function is for hover name of planet =====
function onMouseMove(event){

const rect = renderer.domElement.getBoundingClientRect();

mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

raycaster.setFromCamera(mouse, camera);

const intersects = raycaster.intersectObjects(clickableObjects, true);

if(intersects.length > 0){

let object = intersects[0].object;

while(object){

if(object.userData && object.userData.url){

label.style.display = "block";
label.innerText = object.userData.url.toUpperCase();

label.style.left = event.clientX + 15 + "px";
label.style.top = event.clientY + 15 + "px";

return;
}

object = object.parent;

}

}

label.style.display = "none";

}
