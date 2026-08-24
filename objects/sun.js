
import * as THREE from 'three/webgpu';

/* soft radial-gradient sprite texture, reused for every glow layer */
function createGlowTexture(){
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    gradient.addColorStop(0.0,'rgba(255,255,255,1)');
    gradient.addColorStop(0.2,'rgba(255,220,150,0.8)');
    gradient.addColorStop(0.5,'rgba(255,150,60,0.25)');
    gradient.addColorStop(1.0,'rgba(255,100,40,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(canvas);
}

export function createSun() {

const loader = new THREE.TextureLoader();

/* SUN CORE */

const texture =
loader.load('textures/sun.jpg');

const geometry =
new THREE.SphereGeometry(15,64,64);

const material =
new THREE.MeshBasicMaterial({
map: texture
});

const sun =
new THREE.Mesh(
geometry,
material
);

/* CORONA - camera-facing sprites instead of a solid intersecting sphere */

const glowTexture = createGlowTexture();

const flareMaterial = new THREE.SpriteMaterial({
map: glowTexture,
color: 0xfff2c0,
transparent: true,
blending: THREE.AdditiveBlending,
depthWrite: false
});
const flare = new THREE.Sprite(flareMaterial);
flare.scale.set(34,34,1);   // pulsed each frame in main.js

const haloMaterial = new THREE.SpriteMaterial({
map: glowTexture,
color: 0xff9a4d,
transparent: true,
opacity: 0.55,
blending: THREE.AdditiveBlending,
depthWrite: false
});
const halo = new THREE.Sprite(haloMaterial);
halo.scale.set(70,70,1);

/* attach glow layers - order matters, main.js pulses children[0] */

sun.add(flare);
sun.add(halo);

return sun;

}

