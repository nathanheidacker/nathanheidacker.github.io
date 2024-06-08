"use client";
import * as THREE from "three";
import { useState, useRef, useEffect } from "react";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { GUI } from "lil-gui";
import { Howl, Howler } from "howler";

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

class PixelPass extends RenderPixelatedPass {
    createPixelatedMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                tNormal: { value: null },
                resolution: {
                    value: new THREE.Vector4(
                        this.renderResolution.x,
                        this.renderResolution.y,
                        1 / this.renderResolution.x,
                        1 / this.renderResolution.y
                    ),
                },
                normalEdgeStrength: { value: 0 },
                depthEdgeStrength: { value: 0 },
            },
            vertexShader: /* glsl */ `
				varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,
            fragmentShader: /* glsl */ `
				uniform sampler2D tDiffuse;
				uniform float normalEdgeStrength;
				varying vec2 vUv;

                void main() {
					gl_FragColor = texture2D( tDiffuse, vUv ) * (1.0 + normalEdgeStrength);
                }
			`,
        });
    }
}

function color255(R: number, G: number, B: number): THREE.Color {
    return new THREE.Color(R / 255, G / 255, B / 255);
}

function pointLight() {
    return new THREE.PointLight(
        new THREE.Color(1.42, 0.82, 0.11),
        0.3,
        1.0,
        0.2
    );
}

function stairwell(height: number): THREE.Group {
    const stairwell = new THREE.Group();
    const stairwellHeight = height * 0.9;
    const rectLight = new THREE.RectAreaLight(
        new THREE.Color(1.14, 0.82, 0.11),
        0.25,
        0.02,
        stairwellHeight
    );
    rectLight.rotateY(Math.PI);
    rectLight.position.y += stairwellHeight / 2;
    stairwell.add(rectLight);
    const nFloors = height * 2 - 1;
    let heightOffset = 0.5;
    for (let n = 0; n < nFloors; n++) {
        if (Math.random() < 0.8 || n == 0 || n == nFloors - 1) {
            const pLight = pointLight();
            pLight.position.y += heightOffset;
            stairwell.add(pLight);
        }
        heightOffset += 0.5;
    }
    return stairwell;
}

function windows(width: number, height: number) {
    const lights = new THREE.Group();
    const nFloors = height * 2 - 1;
    const nRooms = width * 4;
    let heightOffset = 0.5;
    let widthOffset = 0.0;
    for (let n = 0; n < nFloors; n++) {
        for (let k = 0; k < nRooms; k++) {
            if (Math.random() < 0.1) {
                const pLight = pointLight();
                pLight.position.x = widthOffset;
                pLight.position.y = heightOffset;
                lights.add(pLight);
            }
            widthOffset += 0.25;
        }
        heightOffset += 0.5;
        widthOffset = 0;
    }
    return lights;
}

function createBuilding(width: number, depth: number, height: number) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(1.53, 1.01, 0.82),
        })
    );
    cube.position.y += height / 2;

    const stairs = stairwell(height);
    stairs.position.z = depth / -2 - 0.015;
    stairs.position.x = width / -2 + 0.1;

    const windowLights = windows(width - 0.4, height);
    windowLights.position.z = depth / -2 - 0.015;
    windowLights.position.x = width / -2 + 0.35;

    const leftWindowLights = windows(width - 0.2, height);
    leftWindowLights.rotateY(Math.PI / 2);
    leftWindowLights.position.x = width / 2 + 0.015;
    leftWindowLights.position.z = depth / 2 - 0.1;

    const building = new THREE.Group();
    building.add(cube);
    //building.add(stairs);
    //building.add(windowLights);
    //building.add(leftWindowLights);
    return building;
}

function createAltBuilding(width: number, depth: number, height: number) {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            //seed: { value: Math.random() },
            //scale: { value: new THREE.Vector3(width, depth, height) },
            time: { value: 0.0 },
            seed: { value: Math.random() },
        },
        vertexShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPos;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            void main() {
                vUv = uv;
                vNormal = normal;
                vPos = position;
                vCameraPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                vWorldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPos;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            uniform float time;
            uniform float seed;

            #define BASE_COLOR vec3(0.205, 0.174, 0.257)
            #define LIGHT_COLOR vec3(1.0, 0.52, 0.11)
            #define HORIZON_COLOR vec3(0.176, 0.196, 0.314)
            #define STREET_LIGHTING_STRENGTH 0.07
            #define FOG_START 20.0
            #define FOG_END 50.0
            #define WINDOW_ASPECT 2.0
            #define BUILDING_SCALE 3.0
            #define MIN_WINDOW_CHANCE 0.10
            #define MAX_WINDOW_CHANCE 0.20
            #define FLICKER_CHANCE 0.05

            float random(vec3 seed) {
                vec3 dotSeed = vec3(
                    dot(seed, vec3(127.1, 311.7, 74.7)),
                    dot(seed, vec3(269.5, 183.3, 246.1)),
                    dot(seed, vec3(113.5, 271.9, 124.6))
                );
                float combined = dot(dotSeed, vec3(1.0));
                return fract(sin(combined) * 43758.5453);
            }

            vec3 random_vec3(vec3 seed) {
                vec3 dotSeed = vec3(
                    dot(seed, vec3(127.1, 311.7, 74.7)),
                    dot(seed, vec3(269.5, 183.3, 246.1)),
                    dot(seed, vec3(113.5, 271.9, 124.6))
                );
                dotSeed = sin(dotSeed) * 43758.5453;
                return vec3(fract(dotSeed.x), fract(dotSeed.y), fract(dotSeed.z));
            }

            bool window_check(vec3 id) {
                return random(id) < ((MAX_WINDOW_CHANCE - MIN_WINDOW_CHANCE) * seed) + MIN_WINDOW_CHANCE;
            }

            void main() {
                vec3 color = BASE_COLOR + (random_vec3(vec3(seed)) * 0.015);
                if (vNormal.x < 0.0 || vNormal.z < 0.0) {
                    vec3 bottom_lighting = LIGHT_COLOR * (vUv.y + -1.0) * -STREET_LIGHTING_STRENGTH;
                    color += max(bottom_lighting, 0.0);

                    vec3 grid_space = vWorldPos * vec3(WINDOW_ASPECT, 1.0, WINDOW_ASPECT) * BUILDING_SCALE;
                    vec3 grid = fract(grid_space);
                    vec3 grid_ids = floor(grid_space);

                    vec3 light_color = LIGHT_COLOR;
                    bool window_on = window_check(grid_ids);
                    if (window_on) {

                        // Handle flickering
                        float random_time = seed * 10.0 + time;
                        float chance = random(vec3(floor(random_time) + random(grid_ids)));
                        if (chance < FLICKER_CHANCE) {
                            float power = 2.0 * (0.5 - abs(fract(random_time) - 0.5));
                            float modulation = power * sin(10.0 * random_time) / 10.0;
                            light_color *= 1.0 + modulation + power;
                        }
                    }

                    if (vNormal.x < 0.0) {

                        // Handle staircase
                        if (seed > 0.4) {
                            float light_power = distance(vUv.x, clamp(seed, 0.15, 0.85));
                            light_power = 1.0 - clamp(light_power * 25.0, 0.0, 1.0);
                            color = mix(color, light_color, light_power * 0.3);
                        }

                        // Handle window lighting
                        if (window_on) {
                            float z_dist = distance(grid.z, 0.5);
                            float y_dist = distance(grid.y, 0.5);

                            if (z_dist < 0.1 && y_dist < 0.05) {
                                color = light_color;
                            }
                            else {
                                color = mix(color, light_color, pow(1.0 - (z_dist + y_dist), 6.0));
                            }
                        }
                    }
                    else if (vNormal.z < 0.0) {

                        // Handle staircase
                        if (seed < 0.6) {
                            float light_power = distance(vUv.x, clamp(seed, 0.15, 0.85));
                            light_power = 1.0 - clamp(light_power * 25.0, 0.0, 1.0);
                            color = mix(color, light_color, light_power * 0.3);
                        }

                        if (window_on) {
                            float x_dist = distance(grid.x, 0.5);
                            float y_dist = distance(grid.y, 0.5);

                            if (x_dist < 0.1 && y_dist < 0.05) {
                                color = light_color;
                            }
                            else {
                                color = mix(color, light_color, pow(1.0 - (x_dist + y_dist), 6.0));
                            }
                        }
                    }
                }

                float dist = length(vCameraPos);
                float fog_blend_value = clamp((dist - FOG_START) / FOG_END, 0.0, 1.0);
                color = mix(color, HORIZON_COLOR, fog_blend_value);

                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );
    cube.position.y += height / 2;

    return cube;
}

function euclideanDistance(vals1: number[], vals2: number[]): number {
    let total = 0;
    for (let i = 0; i < vals1.length; i++) {
        total += (vals1[i] - vals2[i]) ** 2;
    }
    return Math.sqrt(total);
}

function createCity(
    rows: number,
    columns: number,
    peak: [number, number],
    minHeight: number = 2,
    maxHeight: number = 8,
    minSize: number = 1,
    maxSize: number = 2
): THREE.Group {
    const city = new THREE.Group();
    const corners = [
        [0, 0],
        [0, columns],
        [rows, 0],
        [rows, columns],
    ];
    let maxDist = 0;
    for (let corner of corners) {
        maxDist = Math.max(maxDist, euclideanDistance(corner, peak));
    }
    let xOffset = 0;
    let zOffset = 0;
    let heightVariance = maxHeight - minHeight;
    let sizeVariance = maxSize - minSize;
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            let dist = euclideanDistance([j, i], peak) / maxDist;

            let baseHeight = minHeight + heightVariance * (1 - dist);
            let heightOffset =
                (Math.random() * 2 - 1) * dist * heightVariance * 0.65;
            let height = Math.min(
                Math.max(baseHeight + heightOffset, minHeight),
                maxHeight
            );

            let baseWidth = minSize + sizeVariance * (1 - dist);
            let widthOffset =
                (Math.random() * 2 - 1) * dist * sizeVariance * 0.65;
            let width = Math.min(
                Math.max(baseWidth + widthOffset, minSize),
                maxSize
            );

            let baseDepth = minSize + sizeVariance * (1 - dist);
            let depthOffset =
                (Math.random() * 2 - 1) * dist * sizeVariance * 0.65;
            let depth = Math.min(
                Math.max(baseDepth + depthOffset, minSize),
                maxSize
            );

            let building = createAltBuilding(width, depth, height);
            building.position.x = xOffset;
            building.position.z = zOffset;
            xOffset += width * 2;

            city.add(building);
        }
        xOffset = 0;
        zOffset += maxSize;
    }
    return city;
}

function createPallette(colors: Array<[number, number, number]>): THREE.Group {
    const pallette = new THREE.Group();
    let offset = 0;
    for (let color of colors) {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshStandardMaterial({ color: color255(...color) })
        );
        cube.position.x += offset;
        offset += 0.2;
        pallette.add(cube);
    }
    return pallette;
}

function createGrass(radius: number, count: number): THREE.InstancedMesh {
    const geometry = new THREE.InstancedBufferGeometry();

    const vertices = new Float32Array([
        0.0, 0.2, 0.0, -0.03, -0.03, 0.0, 0.03, -0.03, 0.0,
    ]);
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    const uvs = new Float32Array([0.5, 1.0, 0.0, 0.0, 1.0, 0.0]);
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    const instanceHeights = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        instanceHeights[i] = 1.0 - 0.4 * (Math.random() * 2 - 1);
    }
    geometry.setAttribute(
        "height",
        new THREE.InstancedBufferAttribute(instanceHeights, 1)
    );

    const loader = new THREE.TextureLoader();
    const texture = loader.load("noise.png");

    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { time: { value: 0.0 }, noiseTexture: { value: texture } },
        vertexShader: /*glsl*/ `
            precision lowp float;

            attribute float height;

            varying vec2 vUv;
            varying vec3 vWorldPos;

            uniform float time;
            uniform sampler2D noiseTexture;

            float random(vec3 seed) {
                vec3 dotSeed = vec3(
                    dot(seed, vec3(127.1, 311.7, 74.7)),
                    dot(seed, vec3(269.5, 183.3, 246.1)),
                    dot(seed, vec3(113.5, 271.9, 124.6))
                );
                float combined = dot(dotSeed, vec3(1.0));
                return fract(sin(combined) * 43758.5453);
            }

            mat3 rotateX(float angle) {
                float cosTheta = cos(angle);
                float sinTheta = sin(angle);

                return mat3(
                    1.0, 0.0, 0.0,
                    0.0, cosTheta, -sinTheta,
                    0.0, sinTheta, cosTheta
                );
            }

            mat3 rotateZ(float angle) {
                float cosTheta = cos(angle);
                float sinTheta = sin(angle);
            
                return mat3(
                    cosTheta, -sinTheta, 0.0,
                    sinTheta,  cosTheta, 0.0,
                    0.0,       0.0,      1.0
                );
            }

            mat4 mat3to4(mat3 m) {
                return mat4(
                    m[0][0], m[0][1], m[0][2], 0.0,
                    m[1][0], m[1][1], m[1][2], 0.0,
                    m[2][0], m[2][1], m[2][2], 0.0,
                    0.0,     0.0,     0.0,     1.0
                );
            }

            void main() {
                vUv = uv;
                vWorldPos = (instanceMatrix * vec4(position, 1.0)).xyz;

                vec3 grassVertexPosition = position;
                grassVertexPosition.y *= height;

            
                float wind = dot(texture2D(noiseTexture, fract(vWorldPos.xz / 50.0 + vec2(time / 25.0))).xyz, vec3(1.0)) / 3.0;
                wind = wind * 2.0 - 1.0;
                mat3 windMat = rotateZ(wind * 1.0);
                grassVertexPosition *= windMat;

                float bend = random(vWorldPos) * (height / 3.0);
                float rustle = dot(texture2D(noiseTexture, fract(vWorldPos.xz + vec2(time / 200.0))).xyz, vec3(1.0)) / 3.0;
                rustle = rustle * 2.0 - 1.0;
                mat3 grassMat = rotateX((bend + rustle) * 0.5);
                grassVertexPosition *= grassMat;

                vec4 worldPosition = instanceMatrix * vec4(grassVertexPosition, 1.0);
                gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;

            #define TIP_COLOR vec3(0.048, 0.089, 0.101)
            #define BASE_COLOR vec3(0.024, 0.045, 0.050)
        
            void main() {
                vec3 color = mix(BASE_COLOR, TIP_COLOR, vUv.y);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const grass = new THREE.InstancedMesh(geometry, material, count);
    grass.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        let distance = radius;
        while (distance >= radius) {
            distance = gaussianRandom(0, 0.4) * radius;
        }
        const angle = Math.random() * 2 * Math.PI;
        dummy.position.set(
            distance * Math.cos(angle),
            0,
            distance * Math.sin(angle)
        );
        //dummy.rotateY(Math.PI * Math.random());
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
    }

    grass.instanceMatrix.needsUpdate = true;

    return grass;
}

function createBrush(
    width: number,
    depth: number,
    count: number
): THREE.InstancedMesh {
    const geometry = new THREE.PlaneGeometry();
    const loader = new THREE.TextureLoader();
    const texture = loader.load("noise.png");
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: { noiseTexture: { value: texture } },
        vertexShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            uniform sampler2D noiseTexture;

            float random(vec3 seed) {
                vec3 dotSeed = vec3(
                    dot(seed, vec3(127.1, 311.7, 74.7)),
                    dot(seed, vec3(269.5, 183.3, 246.1)),
                    dot(seed, vec3(113.5, 271.9, 124.6))
                );
                float combined = dot(dotSeed, vec3(1.0));
                return fract(sin(combined) * 43758.5453);
            }

            void main() {
                vUv = uv;
                vWorldPos = (instanceMatrix * vec4(position, 1.0)).xyz;
                vCameraPos = (modelViewMatrix * vec4(vWorldPos, 1.0)).xyz;
                vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            uniform sampler2D noiseTexture;

            #define FRONT_COLOR vec3(0.1,0.1,0.2)
            #define BACK_COLOR vec3(0.165,0.184,0.294)
        
            void main() {
                vec3 color = mix(FRONT_COLOR, BACK_COLOR, vWorldPos.x);
                float alpha = 1.0;
                float offset = dot(texture2D(noiseTexture, fract(vUv.xx + vWorldPos.xz)), vec4(1.0)) / 3.0;
                float base_height = 1.0 - length(vUv - vec2(0.5)) - (0.5 * -vWorldPos.x);

                if (vUv.y > base_height) {
                    alpha = 0.0;
                }
                
                gl_FragColor = vec4(vCameraPos, alpha);
            }
        `,
    });

    const brush = new THREE.InstancedMesh(geometry, material, count);
    brush.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        dummy.position.set(Math.random() * depth, 0.5, Math.random() * width);
        dummy.rotation.y = Math.PI / 2.0;
        dummy.updateMatrix();
        brush.setMatrixAt(i, dummy.matrix);
    }

    brush.instanceMatrix.needsUpdate = true;

    return brush;
}

function createGround(width: number, depth: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, depth, 10, 10);
    const loader = new THREE.TextureLoader();
    const texture = loader.load("noise.png");
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { noiseTexture: { value: texture } },
        vertexShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;

            uniform sampler2D noiseTexture;

            float random(vec3 seed) {
                vec3 dotSeed = vec3(
                    dot(seed, vec3(127.1, 311.7, 74.7)),
                    dot(seed, vec3(269.5, 183.3, 246.1)),
                    dot(seed, vec3(113.5, 271.9, 124.6))
                );
                float combined = dot(dotSeed, vec3(1.0));
                return fract(sin(combined) * 43758.5453);
            }

            void main() {
                vUv = uv;
                float height = dot(texture2D(noiseTexture, vUv), vec4(1.0)) * 1.5 - 1.0;
                vec3 pos = vec3(position.xy, position.z + height * 0.1);
                vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;

            #define BASE_COLOR vec3(0.034, 0.055, 0.060)
        
            void main() {
                gl_FragColor = vec4(BASE_COLOR, 1.0);
            }
        `,
    });

    const ground = new THREE.Mesh(geometry, material);

    ground.rotateX(Math.PI / -2);

    return ground;
}

function Environment() {
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (container.current) {
            const elem = container.current;

            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(elem.clientWidth, elem.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;

            const camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
            camera.position.set(-25, 5, -25);

            const scene = new THREE.Scene();
            const composer = new EffectComposer(renderer);
            const pixelPass = new PixelPass(1, scene, camera);
            composer.addPass(pixelPass);
            composer.setSize(elem.clientWidth, elem.clientHeight);

            window.addEventListener("resize", () => {
                renderer.setSize(elem.clientWidth, elem.clientHeight);
                composer.setSize(elem.clientWidth, elem.clientHeight);
            });

            const horizonColor = color255(45, 50, 80);
            scene.background = horizonColor;
            const floor = createGround(100, 100);
            scene.add(floor);
            const ambient = new THREE.AmbientLight(color255(102, 136, 255), 1);
            scene.add(ambient);
            const block1 = createCity(3, 15, [2, 7]);
            scene.add(block1);
            const block2 = createCity(10, 3, [1, 2]);
            scene.add(block2);
            block2.position.x = 5;
            const block3 = createCity(4, 8, [3, 6]);
            scene.add(block3);
            block3.position.z = -27;
            block3.position.x = 17;
            const block4 = createCity(5, 2, [3, 1]);
            scene.add(block4);
            block4.position.z = -14;
            block4.position.x = 30;

            const grass = createGrass(15, 40000);
            grass.rotateY(Math.PI / 4);
            grass.position.set(-15, 0, -10);
            scene.add(grass);

            const brush1 = createBrush(20, 1, 3);
            brush1.position.x = -3;
            brush1.position.z = -1;
            //scene.add(brush1)

            //const controls = new OrbitControls(camera, renderer.domElement);
            camera.lookAt(new THREE.Vector3(-15, 0, -15));
            const clock = new THREE.Clock();
            const animate = () => {
                for (let block of [block1, block2, block3, block4]) {
                    for (let building of block.children) {
                        (
                            building as THREE.Mesh<
                                THREE.BoxGeometry,
                                THREE.ShaderMaterial
                            >
                        ).material.uniforms.time.value = clock.getElapsedTime();
                    }
                }
                (
                    grass as THREE.InstancedMesh<
                        THREE.BufferGeometry,
                        THREE.ShaderMaterial
                    >
                ).material.uniforms.time.value = clock.getElapsedTime();
                composer.render();
            };
            camera.position.set(-15.565, 0.24945, -11.27);
            camera.rotation.set(2.694, -1.113, 2.735);
            renderer.setAnimationLoop(animate);
            container.current.appendChild(renderer.domElement);
        }
    }, []);

    return (
        <div className="fixed h-screen w-screen -z-50" ref={container}></div>
    );
}

function MessageInput() {
    const [userInput, setUserInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <input
            ref={inputRef}
            className="flex m-20 bg-black outline-none"
            value={userInput}
            type="text"
            placeholder="enter text here"
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    if (userInput == "unihime") {
                        alert("hehexd");
                    } else {
                        if (inputRef.current) {
                            const currentClassName = inputRef.current.className;
                            inputRef.current.className = `${currentClassName} rejectionAnim`;
                            setTimeout(() => {
                                if (inputRef.current) {
                                    inputRef.current.className =
                                        currentClassName;
                                }
                            }, 100);
                        }
                    }
                    setUserInput("");
                }
            }}
            onChange={(e) => {
                setUserInput(e.target.value);
            }}
        />
    );
}

function Page() {

    const ambientSound = new Howl({
        src: ["bg_sound.mp3"]
    })
    return (
        <div>
            <Environment></Environment>
        </div>
    );
}

export default Page;
