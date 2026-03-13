import * as THREE from 'three/webgpu';

export function createSaturn(name, texturePath, size, distance, url){

const loader = new THREE.TextureLoader();

/* PLANET */

const planetTexture =
loader.load(texturePath);

const planetGeometry =
new THREE.SphereGeometry(size,64,64);

const planetMaterial =
new THREE.MeshStandardMaterial({
map:planetTexture
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

color:0xd2b48c,

side:THREE.DoubleSide,

transparent:true,

opacity:0.7

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