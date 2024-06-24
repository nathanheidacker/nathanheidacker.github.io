"use client";
import * as THREE from "three";
import { useState, useRef, useEffect } from "react";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Howl, Howler } from "howler";
import MESSAGE from "./message";

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

function createRain() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("noise.png");
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            time: { value: 0.0 },
            noiseTexture: { value: texture },
        },
        vertexShader: /*glsl*/ `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: /*glsl*/ `
            uniform float time;
            uniform sampler2D noiseTexture;
            varying vec2 vUv;

            #define HORIZON_COLOR vec3(0.176, 0.196, 0.314)
            #define WIND_SPEED 0.1
            #define LAYERS 16

            float hash( float n ) {
                return fract(sin(n)*687.3123);
            }

            float noise( in vec2 x ) {
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f*f*(3.0-2.0*f);
                float n = p.x + p.y*157.0;
                return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+157.0), hash(n+158.0),f.x),f.y);
            }

            void main() {

                float wind = dot(texture2D(noiseTexture, fract(vec2(time / 100.0))).xyz, vec3(1.0));
                wind = wind * 2.0 - 1.0;
                wind *= WIND_SPEED;
                wind = WIND_SPEED;

                float alpha = 0.0;
                float ttime = time * 2.0;

                for (int i = 0; i < LAYERS; i++) {
                    float layer = float(i + 1);
                    float size = pow(1.2, layer);
                    float dist = pow(0.9, layer);
                    float offset = hash(floor((vUv.x + (wind * vUv.y)) * 800.0 * size));
                    float rain = (sin(10. * (vUv.y + offset + ttime)) + sin(vUv.y + (ttime * offset) + offset * 1000.)) / 2.;
                    if (rain > 0.99) {
                        alpha = 0.03 * dist;
                    }
                }

                gl_FragColor = vec4(vec3(1.0), alpha);
            }
        
        `,
    });
    return new THREE.Mesh(geometry, material);
}

function createBrightLight() {}

function color255(R: number, G: number, B: number): THREE.Color {
    return new THREE.Color(R / 255, G / 255, B / 255);
}

function createBuilding(width: number, depth: number, height: number) {
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
            #define FOG_END 40.0
            #define WINDOW_ASPECT 2.0
            #define BUILDING_SCALE 3.0
            #define MIN_WINDOW_CHANCE 0.10
            #define MAX_WINDOW_CHANCE 0.20
            #define FLICKER_CHANCE 0.10

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
    maxHeight: number = 12,
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
                (Math.random() * 2 - 1) * dist * heightVariance * 0.4;
            let height = Math.min(
                Math.max(baseHeight + heightOffset, minHeight),
                maxHeight
            );

            let baseWidth = minSize + sizeVariance * (1 - dist);
            let widthOffset =
                (Math.random() * 2 - 1) * dist * sizeVariance * 0.4;
            let width = Math.min(
                Math.max(baseWidth + widthOffset, minSize),
                maxSize
            );

            let baseDepth = minSize + sizeVariance * (1 - dist);
            let depthOffset =
                (Math.random() * 2 - 1) * dist * sizeVariance * 0.4;
            let depth = Math.min(
                Math.max(baseDepth + depthOffset, minSize),
                maxSize
            );

            let building = createBuilding(width, depth, height);
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
    height: number,
    layers: number,
    brightness: number
): THREE.Group {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("noise.png");
    const makeMaterial = (seed: number, dims: THREE.Vector3, iter: number) => {
        return new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                brightness: { value: brightness },
                seed: { value: seed },
                layer: { value: iter },
                noiseTexture: { value: texture },
                dimensions: { value: dims },
            },
            vertexShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            void main() {
                vUv = uv;
                vCameraPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                vWorldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
            fragmentShader: /* glsl */ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vCameraPos;

            uniform sampler2D noiseTexture;
            uniform vec3 dimensions;
            uniform float seed;
            uniform float layer;
            uniform float brightness;

            #define N_ITER 5
            #define HORIZON_COLOR vec3(0.176, 0.196, 0.314)
            #define FOG_START 0.0
            #define FOG_END 40.0

            float hash( float n ) {
                return fract(sin(n)*687.3123);
            }

            float noise( in vec2 x ) {
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f*f*(3.0-2.0*f);
                float n = p.x + p.y*157.0;
                return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+157.0), hash(n+158.0),f.x),f.y);
            }

            float sigmoid(float x) {
                return 1.0 / (1.0 + exp(-x));
            }
        
            void main() {
                vec3 color = HORIZON_COLOR * brightness;

                vec2 coords = vUv * 2.0 - 1.0;

                float alpha = 1.0;
                float base_height = -pow(coords.x, 2.0) - 0.3;
                float alt_height = 1.0;
                float offset = seed;
                float magnitude = 0.1;

                for (int i = 0; i < N_ITER; i++) {
                    offset = noise(vec2(offset));
                    float iter = float(i + 1);
                    float perlin = dot(texture2D(noiseTexture, fract(vUv.xx / iter + offset)).rgb, vec3(1.0)) / 3.0;
                    alt_height += perlin;

                    float lod = 10.0 * iter * pow(1.5, iter);
                    base_height += abs(sin(coords.x * lod + offset)) * magnitude;
                    magnitude *= 0.7;
                }

                alt_height /= float(N_ITER);
                alt_height = (alt_height - 0.7) * 3.0;
                float height = base_height + (base_height * alt_height * 1.0);


                if (coords.y > height) {
                    alpha = 0.0;
                }

                float dist = length(vCameraPos);
                float fog_blend_value = clamp((dist - FOG_START) / FOG_END, 0.0, 1.0) + (0.06 * layer);
                color = mix(color, HORIZON_COLOR, min(fog_blend_value, 1.0));
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        });
    };

    const brush = new THREE.Group();
    for (let i = 0; i < layers; i++) {
        const geometry = new THREE.PlaneGeometry(width, height);
        const instance = new THREE.Mesh(
            geometry,
            makeMaterial(
                Math.random(),
                new THREE.Vector3(width, height, layers),
                i
            )
        );
        instance.position.z = -i * 0.2;
        instance.position.y = height / 2;
        brush.add(instance);
        height *= 1.5;
    }

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
            #define HORIZON_COLOR vec3(0.176, 0.196, 0.314)
            #define FOG_START 10.0
            #define FOG_END 30.0
        
            void main() {
                float dist = length(vWorldPos);
                float fog_blend_value = clamp((dist - FOG_START) / FOG_END, 0.0, 1.0);
                vec3 color = mix(BASE_COLOR, HORIZON_COLOR, fog_blend_value);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const ground = new THREE.Mesh(geometry, material);

    ground.rotateX(Math.PI / -2);

    return ground;
}

function createMidBuilding() {}

function createDarkBuilding(
    width: number,
    depth: number,
    height: number,
    brightness: number
): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { brightness: { value: brightness } },
        vertexShader: /*glsl*/ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vCameraPos;

            void main() {
                vUv = uv;
                vNormal = normal;
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vCameraPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            precision lowp float;

            varying vec2 vUv;
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vCameraPos;

            uniform float brightness;

            #define HORIZON_COLOR vec3(0.176, 0.196, 0.314)
            #define FOG_START 0.0
            #define FOG_END 30.0
        
            void main() {
                float direction = dot(normalize(vNormal), normalize(vec3(-1.0, 0.0, 0.0)));
                vec3 color = HORIZON_COLOR * (brightness - max(0.1 * direction, 0.0));
                float dist = length(vCameraPos);
                float fog_blend_value = clamp((dist - FOG_START) / FOG_END, 0.0, 1.0);
                color = mix(color, HORIZON_COLOR, fog_blend_value);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    return building;
}

const dummy = new THREE.Object3D();

function rotateTowardsCamera(object: THREE.Object3D, camera: THREE.Camera) {
    dummy.position.copy(object.position);
    dummy.lookAt(camera.position);
    object.rotation.y = dummy.rotation.y;
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
                75,
                window.innerWidth / window.innerHeight,
                0.01,
                2000
            );
            camera.position.set(
                -13.014682564973398,
                0.26023915684972087,
                -9.608193800634998
            );
            camera.rotation.set(
                2.5972713696066094,
                -1.2363717085292816,
                2.622178772676298
            );

            const scene = new THREE.Scene();
            const composer = new EffectComposer(renderer);

            let pixelPassDetail = Math.floor(3 * window.devicePixelRatio);
            if (window.devicePixelRatio > 1) {
                pixelPassDetail -= 1;
            }
            const pixelPass = new PixelPass(pixelPassDetail, scene, camera);
            composer.addPass(pixelPass);
            composer.setSize(elem.clientWidth, elem.clientHeight);

            window.addEventListener("resize", () => {
                renderer.setSize(elem.clientWidth, elem.clientHeight);
                composer.setSize(elem.clientWidth, elem.clientHeight);
            });

            const horizonColor = color255(45, 50, 80);
            scene.background = horizonColor;
            const floor = createGround(80, 80);
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
            grass.position.set(-13, 0, -10);
            scene.add(grass);

            const brush1 = createBrush(10, 1, 3, 0.2);
            brush1.position.x = -3;
            brush1.position.z = -2;
            rotateTowardsCamera(brush1, camera);
            brush1.rotation.y += Math.PI / -2;
            scene.add(brush1);

            const brush2 = createBrush(10, 2, 3, 0.2);
            brush2.position.x = -3;
            brush2.position.z = 6;
            rotateTowardsCamera(brush2, camera);
            brush2.rotation.y += Math.PI / -2;
            scene.add(brush2);

            const brush3 = createBrush(10, 3, 3, 0.2);
            brush3.position.x = -3;
            brush3.position.z = 12;
            rotateTowardsCamera(brush3, camera);
            brush3.rotation.y += Math.PI / -2;
            scene.add(brush3);

            const darkBuilding1 = createDarkBuilding(1.5, 1.5, 2.5, 0.2);
            darkBuilding1.position.x = -2;
            darkBuilding1.position.z = 2.5;
            scene.add(darkBuilding1);

            const darkBuilding2 = createDarkBuilding(1.7, 1.7, 4, -0.3);
            darkBuilding2.position.x = -4;
            darkBuilding2.position.z = 12;
            scene.add(darkBuilding2);

            const leftBrush1 = createBrush(10, 1, 3, 0.2);
            leftBrush1.position.x = 10;
            leftBrush1.position.z = -17;
            rotateTowardsCamera(leftBrush1, camera);
            scene.add(leftBrush1);

            const leftBrush2 = createBrush(10, 2, 3, 0.2);
            leftBrush2.position.x = 5;
            leftBrush2.position.z = -22;
            rotateTowardsCamera(leftBrush2, camera);
            scene.add(leftBrush2);

            const leftDarkBuilding1 = createDarkBuilding(1.5, 1.5, 1.8, 0.2);
            leftDarkBuilding1.position.x = 7;
            leftDarkBuilding1.position.z = -15;
            scene.add(leftDarkBuilding1);

            const rain = createRain();
            rain.position.copy(camera.position);
            rain.position.add(
                camera
                    .getWorldDirection(new THREE.Vector3())
                    .multiplyScalar(0.12)
            );
            rain.lookAt(camera.position);
            scene.add(rain);

            const clock = new THREE.Clock();
            const animate = () => {
                const newTime = clock.getElapsedTime();

                for (let block of [block1, block2, block3, block4]) {
                    for (let building of block.children) {
                        (
                            building as THREE.Mesh<
                                THREE.BoxGeometry,
                                THREE.ShaderMaterial
                            >
                        ).material.uniforms.time.value = newTime;
                    }
                }
                (
                    grass as THREE.InstancedMesh<
                        THREE.BufferGeometry,
                        THREE.ShaderMaterial
                    >
                ).material.uniforms.time.value = newTime;
                rain.material.uniforms.time.value = newTime;
                composer.render();

                if (false && clock.getElapsedTime() % 1 < 0.001) {
                    console.log(
                        camera.position.x,
                        camera.position.y,
                        camera.position.z
                    );
                    console.log(
                        camera.rotation.x,
                        camera.rotation.y,
                        camera.rotation.z
                    );
                }
            };

            //const controls = new OrbitControls(camera, renderer.domElement);
            renderer.setAnimationLoop(animate);
            container.current.appendChild(renderer.domElement);
        }
    }, []);

    return (
        <div className="fixed h-screen w-screen -z-50" ref={container}></div>
    );
}

async function generateKeyFromPassword(password: string) {
    // Encode password and salt as UTF-8
    const enc = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(""),
            iterations: 100000,
            hash: "SHA-256",
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptMessage(key: CryptoKey, message: string) {
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(12),
        },
        key,
        enc.encode(message)
    );
    return new Uint8Array(encrypted);
}

async function decryptMessage(key: CryptoKey, encryptedMessage: BufferSource) {
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(12),
        },
        key,
        encryptedMessage
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}

async function hashString(message: string) {
    // Encode the message as a Uint8Array (required by the Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Hash the data using SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert the ArrayBuffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

    return hashHex;
}

function MessageInput({
    setMessage,
}: {
    setMessage: React.Dispatch<React.SetStateAction<string>>;
}) {
    const passHash =
        "5a1bdb19d16c7bdf2dd7d51990b703d94601a6823d848e1ace153c1cff2bc0f7DELETE";
    const [userInput, setUserInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <input
            ref={inputRef}
            className="flex placeholder:text-white text-lg md:text-xl bg-transparent mt-[30vh] mb-[70vh] rounded-lg p-2 m-auto messageInput"
            value={userInput}
            type="text"
            placeholder="password"
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    hashString(userInput).then((result) => {
                        if (result == passHash) {
                            generateKeyFromPassword(result).then((key) => {
                                let newData = new Uint8Array(
                                    Buffer.from(MESSAGE, "base64")
                                );
                                decryptMessage(key, newData).then(
                                    (original) => {
                                        setMessage(original);
                                    }
                                );
                            });
                        } else {
                            if (inputRef.current) {
                                inputRef.current.classList.remove(
                                    "messageInput"
                                );
                                inputRef.current.classList.add(
                                    "messageInputRejection"
                                );
                                setTimeout(() => {
                                    if (inputRef.current) {
                                        inputRef.current.classList.remove(
                                            "messageInputRejection"
                                        );
                                        inputRef.current.classList.add(
                                            "messageInput"
                                        );
                                    }
                                }, 150);
                            }
                        }
                    });
                }
            }}
            onChange={(e) => {
                setUserInput(e.target.value);
            }}
        />
    );
}

function MailboxSVG() {
    return (
        <svg
            className="w-full h-[100%] opacity-30 hover:opacity-60 transition-opacity"
            viewBox="0 0 100 62.5"
        >
            <polygon
                points="0,0 0,10 40,30 80,10 80,0"
                fill="white"
                strokeLinejoin="round"
            ></polygon>
            <polygon
                points="0,15 0,50 80,50, 80,15 40,35"
                fill="white"
            ></polygon>
        </svg>
    );
}

function AudioSVG({ muted }: { muted: boolean }) {
    const opacity = muted ? 100 : 0;
    const waveOpacity = `transition-opacity opacity-${100 - opacity}`;

    return (
        <svg
            className="w-full h-full grow opacity-30 hover:opacity-60 transition-opacity"
            viewBox="0 0 120 100"
        >
            <polygon
                points="20,30 30,30 60,10 60,90 30,70 20,70"
                fill="white"
            ></polygon>
            <circle r="20" cx="20" cy="50" fill="white"></circle>
            <path
                className={waveOpacity}
                id="smallWave"
                d="M 75,65 L 80,70 A 1,1 0 0,0 80,30 L 75,35 A 1,1 0 0,1 75,65 Z"
                fill="white"
            ></path>
            <path
                className={waveOpacity}
                id="bigWave"
                d="M 85,75 L 90,80 A 1,1 0 0,0 90,20 L 85,25 A 1,1 0 0,1 85,75 Z"
                fill="white"
            ></path>
        </svg>
    );
}

function Message({
    messageVisible,
    message,
}: {
    messageVisible: boolean;
    message: string;
}) {
    const parts = message.split("\n");

    return (
        <div
            id="message"
            className={`m-12 md:m-20 text-md md:text-xl text-wrap opacity-${
                messageVisible ? 100 : 0
            }`}
        >
            {" "}
            <div className="h-[13vh]"></div>
            <div className="flex flex-col space-y-4">
                {parts.map((part, index) => {
                    if (part.startsWith("##")) {
                        return (
                            <p
                                key={index}
                                className="md:text-xl pt-6 font-bold"
                            >
                                {part.slice(2)}
                            </p>
                        );
                    } else if (part.startsWith("#")) {
                        return (
                            <p
                                key={index}
                                className="text-lg md:text-2xl pt-8 font-bold"
                            >
                                {part.slice(1)}
                            </p>
                        );
                    }
                    return (
                        <p
                            key={index}
                            dangerouslySetInnerHTML={{ __html: part }}
                        ></p>
                    );
                })}
            </div>
            <div className="h-[25vh]"></div>
        </div>
    );
}

function Interface() {
    const [message, setMessage] = useState("");
    const [messageVisible, setMessageVisible] = useState(false);
    const [volume, setVolume] = useState(0.2);
    const [muted, setMuted] = useState(false);

    const rain = new Howl({
        volume: 0.3,
        src: ["rain.wav"],
        loop: true,
    });

    const bgMusic = new Howl({
        src: ["bg_music.mp3"],
        loop: true,
        sprite: { song: [1000, 200500] },
    });

    useEffect(() => {
        rain.play();

        bgMusic.play("song");

        return () => {
            bgMusic.stop();
            rain.stop();
        };
    }, []);

    useEffect(() => {
        Howler.volume(volume * (muted ? 0 : 1));
    }, [volume, muted]);

    return (
        <div className="max-w-[800px] mx-auto">
            <div className="h-8 md:h-12"></div>
            <div className="flex h-6 md:h-8 place-content-between mx-8">
                <div id="volumeControls" className="flex space-x-4">
                    <div
                        onClick={() => {
                            setMuted(!muted);
                        }}
                    >
                        <AudioSVG muted={muted}></AudioSVG>
                    </div>
                    <input
                        id="volume"
                        type="range"
                        className="volumeSlider opacity-30 hover:opacity-60 transition-opacity"
                        min={0}
                        max={1}
                        step={0.001}
                        value={volume}
                        onChange={(e) => {
                            setVolume(parseFloat(e.target.value));
                        }}
                    />
                </div>

                <div
                    id="messageControls"
                    className={
                        message == ""
                            ? "opacity-0 transition-opacity"
                            : "transition-opacity"
                    }
                    onClick={() => {
                        setMessageVisible(!messageVisible);
                    }}
                >
                    <MailboxSVG></MailboxSVG>
                </div>
            </div>
            {message == "" ? (
                <MessageInput setMessage={setMessage}></MessageInput>
            ) : (
                <Message
                    messageVisible={messageVisible}
                    message={message}
                ></Message>
            )}
        </div>
    );
}

function Vignette() {
    return (
        <div
            id="vignette"
            className="absolute overflow-hidden pointer-events-none h-screen w-screen place-content-center flex z-10"
        >
            <div className="bg-black grow"></div>
            <div id="leftVignette" className="bg-black min-w-[300px]"></div>
            <div className="min-w-[1600px]"></div>
            <div id="rightVignette" className="bg-black min-w-[300px]"></div>
            <div className="bg-black grow"></div>
        </div>
    );
}

function Page() {
    const [message, setMessage] = useState("");

    return (
        <div className="fixed w-screen max-h-screen overflow-hidden">
            <Vignette></Vignette>
            <Environment></Environment>
            <Interface></Interface>
            <style>
                {`

                .messageInput {
                    color: white;
                    outline: white solid 1px;
                    transition: 0.1s ease-out;
                }

                .messageInputRejection {
                    color: rgb(200, 100, 100);
                    outline: rgb(200, 100, 100) solid 1px;
                    transition: none !important;
                }
                
                .volumeSlider {
                    -webkit-appearance: none;
                    border-radius: 1rem;
                    height: 30%;
                    outline: none;
                    margin: auto;
                }
                
                #leftVignette {
                    mask-image: linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
                }

                #rightVignette {
                    mask-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
                }
                
                #message {
                    transition: opacity 0.5s ease-out;
                    max-height: 80vh;
                    overflow-y: scroll;
                    scrollbar-width: none;
                    -ms-overflow-style: -ms-autohiding-scrollbar;
                    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0) 100%);
                }

                #message::-webkit-scrollbar {
                    display: none;
                    width: 0px;
                    background-color: rgba(0, 0, 0, 0);
                }
                `}
            </style>
        </div>
    );
}

export default Page;
