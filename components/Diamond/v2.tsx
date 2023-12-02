"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
    ShaderPass,
    EffectComposer,
    OutputPass,
    SMAAPass,
} from "three/examples/jsm/Addons.js";
import perlinNoise from "./perlin";

const diamondShader = new ShaderPass({
    name: "DiamondShader",
    uniforms: {
        iTime: { value: 0.0 },
        iResolution: { value: new THREE.Vector3(5000, 500, 1) },
        iChannel0: { value: new THREE.CubeTexture() },
        iScroll: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,
    fragmentShader: /* glsl */ `

    precision highp float;

    #define RAY_LENGTH_MAX 50.0
    #define RAY_BOUNCE_MAX 20
    #define RAY_STEP_MAX   200
    #define DELTA          0.001

    #define COLOR				vec3 (0.8, 0.8, 0.9)
    #define ALPHA				0.9999999999
    #define REFRACT_INDEX		vec3 (2.407, 2.426, 2.451)
    #define AMBIENT				0.1
    #define SPECULAR_POWER		3.0
    #define SPECULAR_INTENSITY	0.5
    #define LIGHT_DIRECTION     vec3 (1.0, 1.0, -1.0)       

    uniform float iTime;
    uniform vec3 iResolution;
    uniform samplerCube iChannel0;
    uniform vec2 iScroll;

    const vec3 lightDirection = normalize(LIGHT_DIRECTION);

    mat3 setCamera(in vec3 origin, in vec3 target, float rotation) {
        vec3 forward = normalize(target - origin);
        vec3 orientation = vec3(sin(rotation), cos(rotation), 0.0);
        vec3 left = normalize(cross(forward, orientation));
        vec3 up = normalize(cross(left, forward));
        return mat3(left, up, forward);
    }

    vec3 vRotateY (in vec3 p, in float angle) {
        float c = cos (angle);
        float s = sin (angle);
        return vec3 (c * p.x - s * p.z, p.y, c * p.z + s * p.x);
    }
    
    vec3 vRotateX(in vec3 p, in float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
    }
    
    vec3 vRotateZ(in vec3 p, in float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(c * p.x + s * p.y, -s * p.x + c * p.y, p.z); 
    }

    vec3 rotateDiamond(vec3 position) {
        vec3 rotation = (iTime / 100.0) * vec3(1.0, 2.0, 3.0);
        rotation = (sin(rotation) * 2.0) + 2.1;
    
        position = vRotateX(position, rotation.x);
        position = vRotateY(position, rotation.y);
        position = vRotateZ(position, rotation.z);
    
        return position;
    }

    float sdOctahedron( vec3 p, float s) {
        p = abs(p);
        return (p.x+p.y+p.z-s)*0.57735027;
    }
    

    float scene(in vec3 position) {
        return sdOctahedron(rotateDiamond(position), 1.0);
    }

    vec3 getNormal(in vec3 position) {
        vec3 epsilon = vec3(DELTA, 0.0, 0.0);
        vec3 n = vec3(
              scene(position + epsilon.xyy) - scene(position - epsilon.xyy),
              scene(position + epsilon.yxy) - scene(position - epsilon.yxy),
              scene(position + epsilon.yyx) - scene(position - epsilon.yyx));
        return normalize(n);
    }

    float traceRay(in vec3 origin, in vec3 direction) {

        float totalDistance = 0.0;
        float nearest;
    
        float dist = RAY_LENGTH_MAX;
        for (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {
    
            nearest = scene(origin);
    
            float distMin = max (nearest, DELTA);
            totalDistance += distMin;
            if (nearest < 0.0) {
                return totalDistance;
            }
            else if (totalDistance > RAY_LENGTH_MAX) {
                return -1.0;
            }
            origin += direction * distMin;
        }
    
        return -1.0;
    }

    float scatterRay (in vec3 origin, in vec3 direction, in vec4 normal, in float color, in vec3 channel) {
        // The ray continues...
        color *= 1.0 - ALPHA;
        float intensity = ALPHA;
        float distanceFactor = 1.0;
        float refractIndex = dot (REFRACT_INDEX, channel);
        int rayBounce = 1;
        for (int i = 0; rayBounce < RAY_BOUNCE_MAX; ++rayBounce) {
    
            // Interface with the material
            vec3 refraction = refract (direction, normal.xyz, distanceFactor > 0.0 ? 1.0 / refractIndex : refractIndex);
            if (dot (refraction, refraction) < DELTA) {
                direction = reflect (direction, normal.xyz);
                origin += direction * DELTA * 3.0;
            } else {
                direction = refraction;
                distanceFactor = -distanceFactor;
            }
    
            // Ray marching
            float dist;
            int rayStep = 0;
            for (int j = 0; rayStep < RAY_STEP_MAX; ++rayStep) {
                dist = distanceFactor * scene(origin);
                float distMin = max (dist, DELTA);
                normal.w += distMin;
                if (dist < 0.0 || normal.w > RAY_LENGTH_MAX) {
                    break;
                }
                origin += direction * distMin;
            }
    
            // Check whether we hit something
            if (dist >= 0.0) {
                break;
            }
    
            // Get the getNormal
            normal.xyz = distanceFactor * getNormal (origin);
    
            // Basic lighting
            if (distanceFactor > 0.0) {
                float reflectionDiffuse = max (0.0, dot (normal.xyz, lightDirection));
                float reflectionSpecular = pow (max (0.0, dot (reflect (direction, normal.xyz), lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;
                float localColor = (AMBIENT + reflectionDiffuse) * dot (COLOR, channel) + reflectionSpecular;
                color += localColor * (1.0 - ALPHA) * intensity;
                intensity *= ALPHA;
            }
        }
    
        // Get the background color
        vec3 backColor = texture(iChannel0, direction).rgb;
    
        // Full-channel version
        //return color + backColor * intensity;

        // Channel splitting version
        return color + dot(backColor, channel) * intensity;
    }

    vec4 diamondMaterial(in vec3 origin, in vec3 direction) {

        // Get the getNormal
        vec4 normal = vec4(0.0);
        normal.xyz = getNormal(origin);
    
        // Basic lighting
        float relfectionDiffuse = max (0.0, dot (normal.xyz, lightDirection));
        float relfectionSpecular = pow (max (0.0, dot (reflect (direction, normal.xyz), lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;
        vec3 color = (AMBIENT + relfectionDiffuse) * COLOR + relfectionSpecular;

        // Cast a single ray
        // color.rgb = scatterRay(origin, direction, normal, color.r, vec3 (1.0, 0.0, 0.0));
    
        // Cast a ray for each color channel
        color.r = scatterRay(origin, direction, normal, color.r, vec3 (1.0, 0.0, 0.0));
        color.g = scatterRay(origin, direction, normal, color.g, vec3 (0.0, 1.0, 0.0));
        color.b = scatterRay(origin, direction, normal, color.b, vec3 (0.0, 0.0, 1.0));
    
        return vec4(color, 1.0);
    }

    vec4 render(in vec3 origin, in vec3 direction) {
        float distanceToScene = traceRay(origin, direction);
        origin += distanceToScene * direction;

        if (distanceToScene >= 0.0) {
            return diamondMaterial(origin, direction);
        }

        return vec4(0.0);
    }

    vec3 Tonemap_ACES(const vec3 x) {
        // Narkowicz 2015, "ACES Filmic Tone Mapping Curve"
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return (x * (a * x + b)) / (x * (c * x + d) + e);
    }

    void main()
    {
        float ratio = iResolution.x / iResolution.y;
        vec2 p = (gl_FragCoord.xy / (iResolution.xy * iResolution.z)) - 0.5;
        //vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
        
        // Aspect ratio
        p.x *= iResolution.x / iResolution.y;

        // Camera position and "look at"
        vec3 origin = vec3(0.0, 0.1, 0.0);
        vec3 target = vec3(0.0);

        float baseDistance = 4.0;

        origin.x += baseDistance * cos(iTime / 30.0);
        origin.z += baseDistance * sin(iTime / 30.0);

        mat3 toWorld = setCamera(origin, target, 0.0);
        vec3 direction = toWorld * normalize(vec3(p.xy, 2.0));

        origin.y -= iScroll.y / iResolution.y;

        vec4 color = render(origin, direction);

        color = vec4(Tonemap_ACES(color.xyz), color.w);

        gl_FragColor=color;
    }`,
});

function Diamond({ className }: { className?: string }) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (container.current) {
            const loader = new THREE.CubeTextureLoader();
            const texture = loader.load([
                "./dark.png",
                "./dark.png",
                "./dark.png",
                "./dark.png",
                "./dark.png",
                "./dark.png",
            ]);
            const elem = container.current;
            const renderer = new THREE.WebGLRenderer();
            const clock = new THREE.Clock();
            renderer.autoClear = false;
            renderer.setSize(elem.clientWidth, elem.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);

            const composer = new EffectComposer(renderer);
            composer.renderToScreen = true;
            composer.addPass(diamondShader);

            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

            const smaa = new SMAAPass(
                elem.clientWidth * window.devicePixelRatio,
                elem.clientHeight * devicePixelRatio
            );
            composer.addPass(smaa);

            texture.minFilter = THREE.LinearFilter;
            diamondShader.uniforms.iChannel0.value = texture;
            diamondShader.uniforms.iResolution.value.set(
                elem.clientWidth,
                elem.clientHeight,
                window.devicePixelRatio
            );

            window.addEventListener("resize", () => {
                diamondShader.uniforms.iResolution.value.set(
                    elem.clientWidth,
                    elem.clientHeight,
                    window.devicePixelRatio
                );
                renderer.setSize(elem.clientWidth, elem.clientHeight);
                composer.setSize(elem.clientWidth, elem.clientHeight);
            });

            window.addEventListener("scroll", () => {
                diamondShader.uniforms.iScroll.value.set(
                    window.scrollX,
                    window.scrollY
                );
            });

            const animate = () => {
                diamondShader.uniforms.iTime.value = clock.getElapsedTime();
                composer.render();
            };

            renderer.setAnimationLoop(animate);
            container.current.appendChild(renderer.domElement);
        }
    }, []);

    return <div className={className} ref={container}></div>;
}

export default Diamond;
