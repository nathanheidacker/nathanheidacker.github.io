import * as THREE from "three";

function mod3(x: THREE.Vector3, mod: number): THREE.Vector3 {
    const y = x.clone();
    y.x = y.x % mod;
    y.y = y.y % mod;
    y.z = y.z % mod;
    return y;
}

function mod4(x: THREE.Vector4, mod: number): THREE.Vector4 {
    const y = x.clone();
    y.x = y.x % mod;
    y.y = y.y % mod;
    y.z = y.z % mod;
    y.w = y.w % mod;
    return y;
}

function abs4(x: THREE.Vector4): THREE.Vector4 {
    const y = x.clone();
    y.x = Math.abs(y.x);
    y.y = Math.abs(y.y);
    y.z = Math.abs(y.z);
    y.w = Math.abs(y.w);
    return y;
}

function step4(x: THREE.Vector4, y: THREE.Vector4): THREE.Vector4 {
    const z = x.clone();
    z.x = z.x < y.x ? 0.0 : 1.0;
    z.y = z.y < y.y ? 0.0 : 1.0;
    z.z = z.z < y.z ? 0.0 : 1.0;
    z.w = z.w < y.w ? 0.0 : 1.0;
    return z;
}

function permute(x: THREE.Vector4): THREE.Vector4 {
    return mod4(
        x.clone().multiplyScalar(34.0).addScalar(1.0).multiply(x),
        289.0
    );
}

function taylorInvSqrt(r: THREE.Vector4): THREE.Vector4 {
    return new THREE.Vector4()
        .setScalar(1.79284291400159)
        .sub(r.clone().multiplyScalar(0.85373472095314));
}

function fade(x: THREE.Vector3): THREE.Vector3 {
    return x
        .clone()
        .multiplyScalar(6.0)
        .subScalar(15)
        .multiply(x)
        .addScalar(10)
        .multiply(x)
        .multiply(x)
        .multiply(x);
}

function cnoise(P: THREE.Vector3): number {
    let Pi0 = P.clone().floor();
    let Pi1 = Pi0.clone().addScalar(1.0);
    Pi0 = mod3(Pi0, 289.0);
    Pi1 = mod3(Pi1, 289.0);
    let Pf0 = mod3(P, 1.0);
    let Pf1 = Pf0.clone().subScalar(1.0);
    let ix = new THREE.Vector4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    let iy = new THREE.Vector4(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
    let iz0 = new THREE.Vector4().setScalar(Pi0.z);
    let iz1 = new THREE.Vector4().setScalar(Pi1.z);

    let ixy = permute(permute(ix).add(iy));
    let ixy0 = permute(ixy.clone().add(iz0));
    let ixy1 = permute(ixy.clone().add(iz1));

    const seven = 1 / 7;
    let gx0 = ixy0.clone().multiplyScalar(seven);
    let gy0 = mod4(gx0.clone().floor().multiplyScalar(seven), 1.0).subScalar(
        0.5
    );
    gx0 = mod4(gx0, 1.0);
    let gz0 = new THREE.Vector4().setScalar(0.5).sub(abs4(gx0)).sub(abs4(gy0));
    let sz0 = step4(gz0, new THREE.Vector4());
    gx0.sub(
        sz0.clone().multiply(step4(new THREE.Vector4(), gx0).subScalar(0.5))
    );
    gy0.sub(
        sz0.clone().multiply(step4(new THREE.Vector4(), gy0).subScalar(0.5))
    );

    let gx1 = ixy1.clone().multiplyScalar(seven);
    let gy1 = mod4(gx1.clone().floor().multiplyScalar(seven), 1.0);
    gx1 = mod4(gx1, 1.0);
    let gz1 = new THREE.Vector4().setScalar(0.5).sub(abs4(gx1)).sub(abs4(gy1));
    let sz1 = step4(gz1, new THREE.Vector4());
    gx1.sub(
        sz1.clone().multiply(step4(new THREE.Vector4(), gx1).subScalar(0.5))
    );
    gy1.sub(
        sz1.clone().multiply(step4(new THREE.Vector4(), gy1).subScalar(0.5))
    );

    let g000 = new THREE.Vector3(gx0.x, gy0.x, gz0.x);
    let g100 = new THREE.Vector3(gx0.y, gy0.y, gz0.y);
    let g010 = new THREE.Vector3(gx0.z, gy0.z, gz0.z);
    let g110 = new THREE.Vector3(gx0.w, gy0.w, gy0.w);
    let g001 = new THREE.Vector3(gx1.x, gy1.x, gz1.x);
    let g101 = new THREE.Vector3(gx1.y, gy1.y, gz1.y);
    let g011 = new THREE.Vector3(gx1.z, gy1.z, gz1.z);
    let g111 = new THREE.Vector3(gx1.w, gy1.w, gy1.w);

    let norm0 = taylorInvSqrt(
        new THREE.Vector4(
            g000.dot(g000),
            g010.dot(g010),
            g100.dot(g100),
            g110.dot(g110)
        )
    );
    g000.multiplyScalar(norm0.x);
    g010.multiplyScalar(norm0.y);
    g100.multiplyScalar(norm0.z);
    g110.multiplyScalar(norm0.w);
    let norm1 = taylorInvSqrt(
        new THREE.Vector4(
            g001.dot(g001),
            g011.dot(g011),
            g101.dot(g101),
            g111.dot(g111)
        )
    );
    g001.multiplyScalar(norm1.x);
    g011.multiplyScalar(norm1.y);
    g101.multiplyScalar(norm1.z);
    g111.multiplyScalar(norm1.w);

    let n000 = g000.dot(Pf0);
    let n100 = g100.dot(new THREE.Vector3(Pf1.x, Pf0.y, Pf0.z));
    let n010 = g010.dot(new THREE.Vector3(Pf0.x, Pf1.y, Pf0.z));
    let n110 = g110.dot(new THREE.Vector3(Pf1.x, Pf1.y, Pf0.z));
    let n001 = g001.dot(new THREE.Vector3(Pf0.x, Pf0.y, Pf1.z));
    let n101 = g101.dot(new THREE.Vector3(Pf1.x, Pf0.y, Pf1.z));
    let n011 = g011.dot(new THREE.Vector3(Pf0.x, Pf1.y, Pf1.z));
    let n111 = g111.dot(Pf1);

    let fade_xyz = fade(Pf0);
    let n_z = new THREE.Vector4(n000, n100, n010, n110).lerp(
        new THREE.Vector4(n001, n101, n011, n111),
        fade_xyz.z
    );
    let n_yz = new THREE.Vector2(n_z.x, n_z.y).lerp(
        new THREE.Vector2(n_z.z, n_z.w),
        fade_xyz.y
    );
    let n_xyz = new THREE.Vector2()
        .setScalar(n_yz.x)
        .lerp(new THREE.Vector2().setScalar(n_yz.y), fade_xyz.x).x;
    return 2.2 * n_xyz;
}

export default cnoise;
