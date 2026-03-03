import * as THREE from 'three/webgpu';

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

/* FLAME GLOW */

const glowGeometry =
new THREE.SphereGeometry(18,64,64);

const glowMaterial =
new THREE.MeshBasicMaterial({

color:0xff6600,

transparent:true,

opacity:0.5

});

const glow =
new THREE.Mesh(
glowGeometry,
glowMaterial
);

/* attach glow */

sun.add(glow);

return sun;


}
