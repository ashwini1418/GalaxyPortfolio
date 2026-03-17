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
    document.body.appendChild(renderer.domElement);

    // 1. Add the WebGPU Galaxy from your code
    scene.add(createGalaxy());

    // 2. Add the Sun
    sun = createSun();
    sun.userData.url = "about";
    scene.add(sun);
    clickableObjects.push(sun);
    rotatingPlanets.push({mesh: sun,speed: 0.0005});


    // 3. Mercury as Education
    const educationData = { name: "eduaction", tex: 'textures/mercury.jpg', size: 4, dist: 30, url: "education" };
    const education = createPlanet(educationData.name, educationData.tex, educationData.size, educationData.dist, educationData.url);
    
    scene.add(education.group);
    clickableObjects.push(education.mesh);
    orbitingPlanets.push({ group: education.group, speed: 0.0004 });
    rotatingPlanets.push({mesh: education.mesh,speed: 0.01});
    education.group.rotation.y = Math.PI;   // 45 degrees

    // Venus as Experience
    const expData = { name: "experience", tex: 'textures/venus.jpg', size: 3.5, dist: 40, url: "experience" };
    const exp = createPlanet(expData.name, expData.tex, expData.size, expData.dist, expData.url);
    
    scene.add(exp.group);
    clickableObjects.push(exp.mesh);
    orbitingPlanets.push({ group: exp.group, speed: 0.0005 });
    rotatingPlanets.push({mesh: exp.mesh,speed: 0.01});
    exp.group.rotation.y = 3*Math.PI/2;   // 45 degrees


    // 3. earth as Skills
    const earthData = { name: "Projects", tex: 'textures/earth.jpg', size: 7, dist: 50, url: "Projects" };
    const earth = createPlanet(earthData.name, earthData.tex, earthData.size, earthData.dist, earthData.url);
    
    scene.add(earth.group);
    clickableObjects.push(earth.mesh);
    orbitingPlanets.push({ group: earth.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: earth.mesh,speed: 0.01});
    earth.group.rotation.y = Math.PI;   // 45 degrees

    // mars for Projects
    const projectData = { name: "Skills", tex: 'textures/mars.jpg', size: 8, dist: 60, url: "Skills" };
    const mars = createPlanet(projectData.name, projectData.tex, projectData.size, projectData.dist, projectData.url);
    
    scene.add(mars.group);
    clickableObjects.push(mars.mesh);
    rotatingPlanets.push({mesh: mars.mesh,speed: 0.01});
    orbitingPlanets.push({ group: mars.group, speed: 0.0002});
    earth.group.rotation.y = 3*Math.PI/4;   // 45 degrees

    //Jupiter as Resume
    const jupiterData = { name: "resume", tex: 'textures/jupiter.png', size: 11, dist: 80, url: "resume" };
    const jupiter = createPlanet(jupiterData.name, jupiterData.tex, jupiterData.size, jupiterData.dist, jupiterData.url);
    
    scene.add(jupiter.group);
    clickableObjects.push(jupiter.mesh);
    orbitingPlanets.push({ group: jupiter.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: jupiter.mesh,speed: 0.01});
    jupiter.group.rotation.y = 4*Math.PI/3;   // 45 degrees

    //Saturn as Contact
    const saturnData = { name: "contact", tex: 'textures/jupiter.png', size: 7, dist: 100, url: "contact" };
    const saturn = createSaturn(saturnData.name, saturnData.tex, saturnData.size, saturnData.dist, saturnData.url);
    
    scene.add(saturn.group);
    clickableObjects.push(saturn.group);
    orbitingPlanets.push({ group: saturn.group, speed: 0.0006 });
    rotatingPlanets.push({mesh: saturn.mesh,speed: 0.01});
    jupiter.group.rotation.y = Math.PI;

    createOrbit(30);
    createOrbit(40);
    createOrbit(50);
    createOrbit(60);
    createOrbit(80);
    createOrbit(100);


    // 4. Controls & Lights
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;   // prevents accidental shifting
    controls.target.set(0,0,0);
    controls.update();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('click', onClick);
    window.addEventListener("mousemove", onMouseMove);
    const light = new THREE.PointLight(0xffffff, 8000, 1000); // Light from the sun
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // ===== Handle Window Resize =====
    window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});

    animate();
    setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
}, 1500);
}

async function animate() {

    requestAnimationFrame(animate);

    orbitingPlanets.forEach(p => {
        p.group.rotation.y += p.speed;
    });

    rotatingPlanets.forEach(p => {
        p.mesh.rotation.y += p.speed;
    });
    sun.children[0].scale.x =1 + 2*Math.sin(10*Date.now()*0.03)*0.05;
    sun.children[0].scale.y =1 + 2*Math.cos(10*Date.now()*0.02)*0.05;
    sun.children[0].scale.z =1 + 2*Math.sin(10*Date.now()*0.04)*0.05;
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

function onClick(event){
    console.log("CLICK DETECTED");
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y =-((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse,camera);
    const intersects =raycaster.intersectObjects(clickableObjects,true);
    if(intersects.length===0) return;
    clickSound.currentTime = 0;  // reset if spam clicked
    clickSound.play();
    let object = intersects[0].object;
    while(object){
        if(object.userData && object.userData.url){
            if(object.userData.url=="Skills"){
                document.getElementById("skillPanel").classList.add("panel-active");
                typePanel("skillPanel",15);
            }
            if(object.userData.url=="Projects"){
                document.getElementById("projectPanel").classList.add("panel-active");
                typePanel("projectPanel",15);
            }
            if(object.userData.url=="about"){
                document.getElementById("aboutPanel").classList.add("panel-active");
                typePanel("aboutPanel",15);
            }
            if(object.userData.url=="education"){
                document.getElementById("educationPanel").classList.add("panel-active");
                typePanel("educationPanel",15);
            }
            if(object.userData.url=="experience"){
                document.getElementById("experiencePanel").classList.add("panel-active");
                typePanel("experiencePanel",15);
            }
            if(object.userData.url=="resume"){
                document.getElementById("resumePanel").classList.add("panel-active");
                typePanel("resumePanel",15);
            }
            if(object.userData.url=="contact"){
                document.getElementById("contactPanel").classList.add("panel-active");
                typePanel("contactPanel",15);
            }
        return;
    }
    object = object.parent;
}

}

// ===== orbite function =====

function createOrbit(radius){
    const geometry =
    new THREE.RingGeometry(radius-0.1,radius+0.1,128);
    const material =new THREE.MeshBasicMaterial({
        color:0x00ffff,
        side:THREE.DoubleSide,
        transparent:true,
        opacity:0.02
    });
    const orbit =
    new THREE.Mesh(geometry,material);
    orbit.rotation.x =
    Math.PI/2;
    scene.add(orbit);

}

// ===== Typing Effect =====

function typePanel(panelId, speed = 15){
    const panel = document.getElementById(panelId);
    const elements = panel.querySelectorAll("h1, h2, p, li");
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

// ===== to add the ambient sound =====
document.addEventListener("DOMContentLoaded", () => {

const toggle = document.getElementById("musicToggle");
ambientMusic.play();
musicPlaying = true;   
toggle.innerText = "Music On";
toggle.addEventListener("click", () => {

if(!musicPlaying){

ambientMusic.play();
toggle.innerText = "Music On";
musicPlaying = true;

}else{

ambientMusic.pause();
toggle.innerText = "Music Off";
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
