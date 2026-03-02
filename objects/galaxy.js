import * as THREE from 'three/webgpu';
import {cos,float,mix,range,sin,time,uv,vec3,vec4,color
} from 'three/tsl';

export function createGalaxy() {
    const material = new THREE.SpriteNodeMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    /* ---------- SAFE SCALE (NO UNIFORM) ---------- */
    const size = float(0.06);
    material.scaleNode =range(0,1).mul(size);

    /* ---------- SPIRAL ---------- */

    const radiusRatio = range(0,1);

    const radius =
        radiusRatio.pow(3)
        .mul(200)
        .toVar();


    const branches = 10;
    const branchAngle =range(0,branches).floor().mul(float(Math.PI*2/branches));

    const spin=-9;
    const angle =branchAngle.add( radiusRatio.mul(spin) ).add(time.mul(radiusRatio.oneMinus().mul(0.1)));


    const position =vec3(cos(angle),0,sin(angle)).mul(radius);


    const randomOffset =range(vec3(-2),vec3(2)).pow3().mul(radiusRatio);


    material.positionNode =position.add(randomOffset);

    /* ---------- COLOR (NO UNIFORMS) ---------- */
    const colorInside =color('#ffffff');
    const colorOutside =color('#a017c9');

    const colorFinal =mix(colorInside,colorOutside,radiusRatio);


    const alpha =float(1).div(uv().sub(0.5).length()).sub(0.2);


    material.colorNode =
        vec4(colorFinal,alpha);


    /* ---------- MESH ---------- */

    return new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1,1),
        material,
        100000
    );
}