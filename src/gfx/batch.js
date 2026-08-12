import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Collapses many small static props into one mesh per material.
 *
 * The arena dresses itself with several hundred Kenney pieces. Left as
 * individual objects that is several hundred draw calls plus the matrix and
 * frustum work behind them — the single biggest thing that would stop this
 * running on a mid-range phone. Baked down by material it is a handful of
 * calls, and the CPU stops caring how much greeble we add.
 */
export class StaticBatcher {
  constructor(materialSet) {
    this.set = materialSet;
    this.groups = new Map();   // materialKey -> geometry[]
    this.count = 0;
  }

  /**
   * Bake an object tree at its current world transform.
   * @param {THREE.Object3D} root
   */
  add(root) {
    root.updateWorldMatrix(true, true);
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const key = o.userData.srcMat || 'metal';
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);

      // Merging requires identical attribute sets. Kenney meshes are
      // position/normal/uv, but a stray model without uv would poison the
      // whole group, so normalise here rather than discovering it at merge.
      if (!g.attributes.uv) {
        const n = g.attributes.position.count;
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      }
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      }
      g.morphAttributes = {};

      if (!this.groups.has(key)) this.groups.set(key, []);
      this.groups.get(key).push(g);
      this.count++;
    });
  }

  /**
   * @param {THREE.Object3D} parent where the baked meshes are attached
   * @param {{castShadow?:boolean, receiveShadow?:boolean, name?:string}} opts
   */
  build(parent, opts = {}) {
    const made = [];
    for (const [key, list] of this.groups) {
      if (!list.length) continue;
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!merged) {
        console.warn(`[batch] merge failed for material "${key}"`);
        continue;
      }
      if (list.length > 1) for (const g of list) g.dispose();
      merged.computeBoundingSphere();

      const mat = this.set[key] || this.set.metal || this.set._defaultMat;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = opts.castShadow ?? true;
      mesh.receiveShadow = opts.receiveShadow ?? true;
      mesh.name = `${opts.name || 'batch'}:${key}`;
      parent.add(mesh);
      made.push(mesh);
    }
    this.groups.clear();
    return made;
  }
}
