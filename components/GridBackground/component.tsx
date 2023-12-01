"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ShaderPass, EffectComposer } from "three/examples/jsm/Addons.js";

const gridShader = new ShaderPass({
    name: "gridShader",
    uniforms: {
        iResolution: { value: new THREE.Vector3(800, 800, 1) },
        iScroll: { value: new THREE.Vector2(0, 0) },
        iColors: { value: new THREE.Vector2(0.1, 0.05) },
    },
    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,
    fragmentShader: /* glsl */ `

    precision highp float;

    #define DENSITY 6.0
    #define BORDER_THICKNESS 0.015
    #define DISTORTION 1.2

    uniform vec3 iResolution;
    uniform vec2 iScroll;
    uniform vec2 iColors;

    void main()
    {   
        float ratio = iResolution.x / iResolution.y;
        vec2 frag = (gl_FragCoord.xy / (iResolution.xy * iResolution.z)) - 0.5;
        frag.x *= ratio;
        vec3 direction = normalize (vec3 (frag, 2.0 - DISTORTION));

        // Set the camera
        vec3 origin = vec3 (0.0, 0.0, 1.0);
        vec3 forward = -origin;
        vec3 up = vec3 (0.0, 1.0, 0.0);
        mat3 rotation;
        rotation [2] = normalize (forward);
        rotation [0] = normalize (cross (up, forward));
        rotation [1] = cross (rotation [2], rotation [0]);
        direction = rotation * direction;
        
        // Scroll down
        direction.y -= iScroll.y / (iResolution.y * 4.0);

        // Apply grid pattern
        float curveModifier = DENSITY;
        float xBorder = fract(direction.x * curveModifier) > BORDER_THICKNESS ? 0.0 : 1.0;
        float yBorder = fract(direction.y * curveModifier) > BORDER_THICKNESS ? 0.0 : 1.0;
        float crossBorder = fract((direction.x + direction.y) * curveModifier) > BORDER_THICKNESS ? 0.0 : 1.0;

        float border = min(yBorder + xBorder + crossBorder, 1.0);
        float color = border > 0.0 ? iColors.x : iColors.y;

        gl_FragColor = vec4(vec3(color), 1.0);
    }`,
});

function GridBackground({
    className,
    mode,
}: {
    className?: string;
    mode: "light" | "dark";
}) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mode == "light") {
            gridShader.uniforms.iColors.value.set(0.9, 1.0);
        } else {
            gridShader.uniforms.iColors.value.set(0.1, 0.05);
        }
    }, [mode]);

    useEffect(() => {
        if (container.current) {
            const elem = container.current;

            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(elem.clientWidth, elem.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            gridShader.uniforms.iResolution.value.z = window.devicePixelRatio;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;

            const composer = new EffectComposer(renderer);
            gridShader.setSize(elem.clientWidth, elem.clientHeight);
            composer.addPass(gridShader);
            composer.setSize(elem.clientWidth, elem.clientHeight);

            gridShader.uniforms.iResolution.value.set(
                elem.clientWidth,
                elem.clientHeight
            );

            window.addEventListener("resize", () => {
                gridShader.uniforms.iResolution.value.set(
                    elem.clientWidth,
                    elem.clientHeight
                );
                renderer.setSize(elem.clientWidth, elem.clientHeight);
                composer.setSize(elem.clientWidth, elem.clientHeight);
                gridShader.setSize(elem.clientWidth, elem.clientHeight);
            });

            window.addEventListener("scroll", () => {
                gridShader.uniforms.iScroll.value.set(
                    window.scrollX,
                    window.scrollY
                );
            });

            const animate = () => {
                composer.render();
            };

            renderer.setAnimationLoop(animate);
            container.current.appendChild(renderer.domElement);
        }
    }, []);

    return <div className={className} ref={container}></div>;
}

export default GridBackground;
