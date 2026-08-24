import * as THREE from 'three/webgpu';

/* radial fade + banding for the ring, mapped along the ring's v-axis (inner -> outer) */
function createRingTexture(){
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,512);
    gradient.addColorStop(0.00,'rgba(210,180,140,0.0)');
    gradient.addColorStop(0.08,'rgba(225,200,165,0.55)');
    gradient.addColorStop(0.20,'rgba(235,215,180,0.85)');
    gradient.addColorStop(0.33,'rgba(190,160,120,0.35)');
    gradient.addColorStop(0.47,'rgba(235,215,180,0.9)');
    gradient.addColorStop(0.60,'rgba(205,175,135,0.5)');
    gradient.addColorStop(0.75,'rgba(235,220,185,0.8)');
    gradient.addColorStop(0.90,'rgba(210,185,150,0.4)');
    gradient.addColorStop(1.00,'rgba(210,180,140,0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,64,512);
    return new THREE.CanvasTexture(canvas);
}

export function createSaturn(name, texturePath, size, distance, url){

const loader = new THREE.TextureLoader();

/* PLANET */

const planetTexture =
loader.load(texturePath);

const planetGeometry =
new THREE.SphereGeometry(size,64,64);

const planetMaterial =
new THREE.MeshStandardMaterial({
map:planetTexture,
color:0xE8D9B0,   // warm gold tint so Saturn reads distinct from Jupiter's shared texture
emissive:0x1c1e26,
emissiveIntensity:1.4
});

const planet =
new THREE.Mesh(
planetGeometry,
planetMaterial
);

planet.userData.url = url;


/* RING (HOLLOW DISK) */

const ringGeometry =
new THREE.RingGeometry(
size*1.5,   // inner radius
size*2.5,   // outer radius
128
);

const ringMaterial =
new THREE.MeshBasicMaterial({

map:createRingTexture(),

color:0xffffff,

side:THREE.DoubleSide,

transparent:true,

depthWrite:false

});

const ring =
new THREE.Mesh(
ringGeometry,
ringMaterial
);

/* Tilt ring */

ring.rotation.x =
Math.PI/2.3;


/* GROUP */

const group =
new THREE.Group();

planet.position.x =
distance;

ring.position.x =
distance;

group.add(planet);
group.add(ring);

return{

group:group,
mesh:planet

};

}