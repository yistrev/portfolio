/*
 * ヒーローの3Dパネル。
 * モデル解決順: /models/keycap.glb（Blender書き出しをここに置くだけで差し替わる）
 *             → 失敗時はコード製プリミティブ（青のEnterキーキャップ＋escオレンジのミニキー）
 * 挙動: 低速オートローテート＋ポインタ追従（lerp）＋ドラッグ回転。
 *       DPR上限2・画面外とタブ非表示で停止・reduced-motionは静止1フレーム。
 */

const MODEL_URL = '/models/keycap.glb';

// ロゴと同じ sRGB 固定値（design.md: #1358bb / #d56650）
const BLUE = 0x1358bb;
const BLUE_DEEP = 0x0d4394;
const ORANGE = 0xd56650;
const CREAM = 0xf3efe3;

/** 4角錐台のキーキャップ（radialSegments=4 のシリンダーを45°回して作る） */
function buildKeycap(THREE) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.72, 1, 0.72, 4, 1);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ color: BLUE, flatShading: true, roughness: 0.6 })
  );
  body.rotation.y = Math.PI / 4;
  group.add(body);

  // 天面のくぼみプレート
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.08, 0.86),
    new THREE.MeshStandardMaterial({ color: BLUE_DEEP, flatShading: true, roughness: 0.55 })
  );
  top.position.y = 0.4;
  group.add(top);

  // ↵ の刻印がわりの棒2本（フラットな面で構成）
  const glyphMat = new THREE.MeshStandardMaterial({ color: CREAM, flatShading: true, roughness: 0.5 });
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.34), glyphMat);
  stem.position.set(0.09, 0.46, 0);
  group.add(stem);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), glyphMat);
  arm.position.set(-0.02, 0.46, 0.13);
  group.add(arm);

  // esc のミニキー（「escだけ違う色」— 極小ワンポイント）
  const esc = new THREE.Group();
  const escBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.28, 0.22, 4, 1),
    new THREE.MeshStandardMaterial({ color: ORANGE, flatShading: true, roughness: 0.6 })
  );
  escBody.rotation.y = Math.PI / 4;
  esc.add(escBody);
  esc.position.set(1.15, 0.55, -0.35);
  esc.rotation.z = -0.35;
  group.add(esc);
  group.userData.esc = esc;

  return group;
}

export async function initHero3D(container) {
  if (!container) return;

  const THREE = await import('three');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.7, 4.6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // ライト: 紙の上の見本らしくフラットに（ぼかし影は使わない世界観なので影も焼かない）
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a1, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdce6ff, 0.7);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // モデル: glb があればそれを・なければプリミティブ
  let model;
  try {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    model = gltf.scene;
    // 収まりを正規化（最大辺 ≒ 2 に）
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    box.setFromObject(model).getCenter(model.position).multiplyScalar(-1);
  } catch {
    model = buildKeycap(THREE);
  }

  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.rotation.x = 0.35;
  scene.add(pivot);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduceMotion) renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  if (reduceMotion) {
    // 静止1フレームのみ（resize時に再描画）
    renderer.render(scene, camera);
    return;
  }

  // ポインタ追従＋ドラッグ回転（どちらも慣性のlerpで馴染ませる）
  const target = { x: 0.35, y: 0 };
  let dragging = false;
  let spin = 0;

  container.addEventListener('pointermove', (e) => {
    const rect = container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    if (dragging) return;
    target.y = nx * 0.5;
    target.x = 0.35 + ny * 0.3;
  });

  container.addEventListener('pointerdown', (e) => {
    dragging = true;
    container.setPointerCapture(e.pointerId);
  });
  container.addEventListener('pointerup', () => (dragging = false));
  container.addEventListener('pointercancel', () => (dragging = false));
  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    spin += e.movementX * 0.008;
    target.x += e.movementY * 0.004;
  });

  // スクロール量に連動して回る（モーションデザインの背骨をスクロールに揃える）
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    spin += (window.scrollY - lastScrollY) * 0.0022;
    lastScrollY = window.scrollY;
  }, { passive: true });

  // 画面外・タブ非表示では回さない
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(container);

  let raf;
  const clock = new THREE.Clock();
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const dt = clock.getDelta();
    spin += dt * 0.25; // 低速オートローテート（常時ループはこれ1つだけ）
    pivot.rotation.y += (spin + target.y - pivot.rotation.y) * 0.06;
    pivot.rotation.x += (target.x - pivot.rotation.x) * 0.06;
    const esc = model.userData?.esc;
    if (esc) esc.position.y = 0.55 + Math.sin(clock.elapsedTime * 1.4) * 0.06;
    renderer.render(scene, camera);
  }
  tick();

  // Astro のページ遷移等でリークしないよう後始末
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
}
