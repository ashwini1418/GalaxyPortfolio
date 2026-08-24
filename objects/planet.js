
import * as THREE from 'three/webgpu';

export function createPlanet(name, texturePath, size, distance, url) {

    const loader =new THREE.TextureLoader();

    const texture =loader.load(texturePath);

    const geometry =new THREE.SphereGeometry(size,64,64);

    const material =new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 1,
        metalness: 0,
        emissive: 0x1c1e26,   // faint starlight floor so the night side reads as dark grey, not a black cutout
        emissiveIntensity: 1.4});

    const mesh =
        new THREE.Mesh(geometry,material);
    
    mesh.userData.url = url;

    const group =new THREE.Group();

    mesh.position.x =distance;

    group.add(mesh);

    return {group: group,mesh: mesh,url: url};

    }