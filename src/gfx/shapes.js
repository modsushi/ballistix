import * as THREE from 'three';

/**
 * Small procedural geometry helpers.
 *
 * Everything the brick field and the pinball furniture is built from is
 * generated here rather than loaded. Two reasons: the collision shapes are
 * axis-aligned boxes and circles, so the visual has to match them exactly to
 * the unit or contacts read as wrong; and a beveled slab is a dozen lines of
 * setup against a model that would have to be re-scaled per brick anyway.
 */

/** A rounded rectangle in the XY plane, centred on the origin. */
function roundedRect(w, d, r) {
  const hw = w * 0.5 - r, hd = d * 0.5 - r;
  const s = new THREE.Shape();
  s.moveTo(-hw - r, -hd);
  s.lineTo(-hw - r, hd);
  s.quadraticCurveTo(-hw - r, hd + r, -hw, hd + r);
  s.lineTo(hw, hd + r);
  s.quadraticCurveTo(hw + r, hd + r, hw + r, hd);
  s.lineTo(hw + r, -hd);
  s.quadraticCurveTo(hw + r, -hd - r, hw, -hd - r);
  s.lineTo(-hw, -hd - r);
  s.quadraticCurveTo(-hw - r, -hd - r, -hw - r, -hd);
  return s;
}

/**
 * A beveled slab: `w` x `d` in plan, `h` tall, resting on y = 0 and centred in
 * XZ. The bevel is what stops a box from reading as a placeholder — it gives
 * every edge a highlight to catch, which is most of what makes low-poly
 * geometry look expensive under image-based lighting.
 *
 * All bricks share one of these at exactly the configured size and are placed
 * with a 0 or 90° rotation, never a non-uniform scale, so the bevel stays the
 * same width on every block.
 */
export function beveledSlab(w, d, h, bevel = 0.12) {
  const r = Math.min(bevel * 2.0, Math.min(w, d) * 0.2);
  const geo = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, d - bevel * 2, r), {
    depth: Math.max(0.01, h - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 2,
    steps: 1,
  });
  // Extrusion runs up +Z; stand it up and drop it onto the deck.
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * A truncated cone with a flat cap — the pop bumper body. Split into two
 * geometries by the caller so the cap can take a different material.
 */
export function bumperBody(rBottom, rTop, h, seg = 20) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, false);
  geo.translate(0, h * 0.5, 0);
  return geo;
}

/**
 * The slingshot: a wedge standing on the deck, its face in the XZ plane at
 * z = 0 with the normal pointing down -Z, tapering away behind.
 */
export function slingWedge(halfLen, depth, h) {
  const geo = new THREE.BufferGeometry();
  const L = halfLen, D = depth;
  // Face corners (front, at z = 0) and the tapered back spine.
  // The plan taper is kept mild (0.82, not a true triangle) because the
  // collider is a box of exactly `halfLen` x `depth`: a sharply pointed back
  // would leave the rear corners bouncing orbs off visibly empty deck.
  const B = L * 0.82;
  const v = [
    -L, 0, 0, L, 0, 0, L, h, 0, -L, h, 0,   // face
    -B, 0, D, B, 0, D,                      // back base
    -B, h * 0.8, D, B, h * 0.8, D,          // back top
  ];
  // Wound so the face looks down -Z and every other side faces outward; a
  // flipped triangle here shows up as a black facet under image-based lighting.
  const idx = [
    0, 2, 1, 0, 3, 2,          // face   (-Z)
    4, 5, 7, 4, 7, 6,          // back   (+Z)
    3, 7, 2, 3, 6, 7,          // top    (+Y)
    0, 1, 5, 0, 5, 4,          // bottom (-Y)
    0, 4, 6, 0, 6, 3,          // left   (-X)
    1, 7, 5, 1, 2, 7,          // right  (+X)
  ];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
