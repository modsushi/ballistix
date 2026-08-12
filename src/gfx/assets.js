import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MANIFEST, SPACE, STATION } from './manifest.js';

/**
 * Loads the Kenney GLBs listed in `manifest.js`, bakes their transforms, and
 * hands out clones.
 */


export class AssetStore {
  constructor() {
    this.models = new Map();
    this.loader = new GLTFLoader();
  }

  /**
   * @param {(loaded:number, total:number, label:string)=>void} onProgress
   */
  async loadAll(onProgress) {
    const total = MANIFEST.length;
    let done = 0;

    // Six at a time: enough to saturate a mobile connection without the
    // request queue thrashing on high-latency links.
    const queue = MANIFEST.slice();
    const worker = async () => {
      for (;;) {
        const entry = queue.shift();
        if (!entry) return;
        const [name, dir] = entry;
        try {
          const gltf = await this.loader.loadAsync(`${dir}${name}.glb`);
          this.models.set(name, this._prepare(gltf.scene, name));
        } catch (err) {
          console.warn(`[assets] failed: ${name}`, err);
          this.models.set(name, new THREE.Group());
        }
        done++;
        onProgress?.(done, total, name);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));

    // The station kit's shared atlas. Loaded once and handed to the material
    // library rather than left embedded per-GLB.
    try {
      const tex = await new THREE.TextureLoader().loadAsync(`${STATION}Textures/colormap.png`);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;                 // glTF UV convention
      tex.anisotropy = 4;
      this.colormap = tex;
    } catch (err) {
      console.warn('[assets] colormap missing', err);
    }

    return this.models;
  }

  /**
   * Flatten and re-origin.
   *
   * Kenney's GLBs carry a node translation — `craft_speederA`, for instance,
   * sits at (2, 0, 1.5) inside its own file — so placing the loaded scene at a
   * world position puts the *node origin* there, not the model. Every prop
   * lands metres away from where the layout code asked for it, and the error
   * scales with whatever scale factor you applied.
   *
   * So we bake each mesh's world matrix into its geometry, drop the node
   * hierarchy entirely, and re-origin on the model's own footprint: centred in
   * XZ, resting on y = 0. After this, `position` means what it says.
   */
  _prepare(root, name) {
    root.updateMatrixWorld(true);

    const flat = new THREE.Group();
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();

      const mesh = new THREE.Mesh(g, o.material);
      mesh.name = o.name;
      mesh.userData.srcMat = o.material?.name || 'default';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      flat.add(mesh);
    });

    const box = new THREE.Box3().setFromObject(flat);
    if (box.isEmpty()) box.set(new THREE.Vector3(), new THREE.Vector3());
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const baseY = box.min.y;
    for (const m of flat.children) {
      m.geometry.translate(-cx, -baseY, -cz);
      m.geometry.computeBoundingSphere();
      m.geometry.computeBoundingBox();
    }

    flat.userData.modelName = name;
    flat.userData._bounds = new THREE.Box3().setFromObject(flat);
    return flat;
  }

  /** A fresh, independent copy ready to be positioned. */
  clone(name) {
    const src = this.models.get(name);
    if (!src) {
      console.warn(`[assets] missing model: ${name}`);
      return new THREE.Group();
    }
    const c = src.clone(true);
    c.traverse((o) => {
      if (o.isMesh) o.userData.srcMat = o.userData.srcMat;
    });
    return c;
  }

  /** World-space bounding box of a model, computed once and cached. */
  bounds(name) {
    const src = this.models.get(name);
    if (!src) return new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    if (!src.userData._bounds) {
      src.userData._bounds = new THREE.Box3().setFromObject(src);
    }
    return src.userData._bounds;
  }
}
