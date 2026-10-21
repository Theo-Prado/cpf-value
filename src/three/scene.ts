import * as THREE from 'three';

import type { CpfStatus } from '../lib/cpf';

/** Parâmetros de câmera e ambiente (SDD 11.3, 11.5). */
const CAMERA_BASE = { x: 0, y: 2.2, z: 5.4 };
const CAMERA_MAX_OFFSET = { x: 0.55, y: 0.32 };
const CAMERA_LOOK_AT = { x: 0, y: 0.3, z: 0 };

/** Niveis de luz por estado (SDD 11.6). */
const LIGHT_LEVELS: Record<CpfStatus, number> = {
  EMPTY: 0.35,
  INCOMPLETE: 0.6,
  VALID: 1,
  INVALID_DV1: 1,
  INVALID_DV2: 1,
  INVALID_CHARS: 0.6,
  INVALID_LENGTH: 0.6,
  SEQUENTIAL: 0.55,
};

/** Opacidade do material de tinta por estado. */
const INK_LEVELS: Record<CpfStatus, number> = {
  EMPTY: 0,
  INCOMPLETE: 0.35,
  VALID: 0.92,
  INVALID_DV1: 0.8,
  INVALID_DV2: 0.8,
  INVALID_CHARS: 0.3,
  INVALID_LENGTH: 0.3,
  SEQUENTIAL: 0.7,
};

/** Opcoes de criacao da cena. */
export interface SceneOptions {
  /** Elemento onde o canvas sera montado. */
  readonly container: HTMLElement;
  /** Estado inicial do carimbo. */
  readonly status: CpfStatus;
  /** `true` quando o movimento esta reduzido. */
  readonly reducedMotion: boolean;
}

/** Controle imperative da cena. */
export interface SceneController {
  /** Atualiza o estado refletido pela cena. */
  setStatus: (status: CpfStatus) => void;
  /** Atualiza a posicao normalizada do ponteiro. */
  setPointer: (x: number, y: number) => void;
  /** Libera recursos e pausa o loop. */
  dispose: () => void;
}

/**
 * Gera a textura da mesa de forma procedural (SDD 11.4).
 *
 * Nenhum asset externo e usado: veios, ruido e desgaste sao desenhados
 * em um canvas e convertidos em textura.
 *
 * @returns A textura pronta para uso.
 */
function createDeskTexture(): THREE.Texture {
  const size = 1024;
  const canvas = document.createElement('canvas');

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  if (context === null) {
    return new THREE.Texture();
  }

  context.fillStyle = '#2E231A';
  context.fillRect(0, 0, size, size);

  // Veios de madeira.
  for (let index = 0; index < 220; index += 1) {
    const startY = Math.random() * size;
    const bend = (Math.random() - 0.5) * 60;

    context.beginPath();
    context.moveTo(0, startY);
    context.bezierCurveTo(size * 0.3, startY + bend, size * 0.7, startY - bend, size, startY);
    context.strokeStyle = Math.random() > 0.5 ? 'rgba(23, 18, 14, 0.1)' : 'rgba(74, 58, 40, 0.09)';
    context.lineWidth = 0.5 + Math.random() * 1.5;
    context.stroke();
  }

  // Ruino fino.
  for (let index = 0; index < 40000; index += 1) {
    context.fillStyle = `rgba(0, 0, 0, ${0.02 + Math.random() * 0.02})`;
    context.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  // Desgaste nas bordas.
  const vignette = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.75,
  );

  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Cria e inicializa a cena 3D imperativa (SDD 11).
 *
 * A cena e decorativa: ela nunca participa da validacao e sua falha
 * **MUST NOT** derrubar a aplicacao.
 *
 * @param options Opcoes de criacao.
 * @returns O controlador da cena, ou `null` se o WebGL nao estiver disponivel.
 */
export function createScene(options: SceneOptions): SceneController | null {
  const { container, status, reducedMotion } = options;

  let renderer: THREE.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio <= 2, alpha: true });
  } catch {
    console.warn('WebGL indisponível: usando o fallback CSS da cena.');

    return null;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080605, 0.09);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
  camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'scene__canvas';
  container.appendChild(renderer.domElement);

  // --- Mesa ---------------------------------------------------------------
  const deskTexture = createDeskTexture();
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ map: deskTexture, roughness: 0.94, metalness: 0.04 }),
  );
  desk.rotation.x = -Math.PI / 2;
  scene.add(desk);

  // --- Luz rasante de janela ---------------------------------------------
  const ambient = new THREE.AmbientLight(0xd8c8ac, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.SpotLight(0xffe9c4, 60, 18, Math.PI / 5, 0.6, 1.4);
  keyLight.position.set(-4.2, 5.4, 3.2);
  keyLight.target.position.set(0, 0, 0);
  scene.add(keyLight);
  scene.add(keyLight.target);

  const fillLight = new THREE.PointLight(0xc8a24a, 6, 12);
  fillLight.position.set(3.4, 1.8, 2.6);
  scene.add(fillLight);

  // --- Poeira em suspension ------------------------------------------------
  const dustCount = 420;
  const dustPositions = new Float32Array(dustCount * 3);

  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (Math.random() - 0.5) * 9;
    dustPositions[index * 3 + 1] = Math.random() * 4.2;
    dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 7;
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustMaterial = new THREE.PointsMaterial({
    color: 0xffeccd,
    size: 0.016,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  // --- Onda de choque no impacto ------------------------------------------
  const shockRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.72, 64),
    new THREE.MeshBasicMaterial({
      color: 0xe7c56b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  shockRing.rotation.x = -Math.PI / 2;
  shockRing.position.y = 0.012;
  scene.add(shockRing);

  // --- Estado ---------------------------------------------------------------
  let currentStatus: CpfStatus = status;
  let targetLight = LIGHT_LEVELS[currentStatus];
  let currentLight = targetLight;
  let shockAge = Number.POSITIVE_INFINITY;
  let pointerX = 0;
  let pointerY = 0;
  let disposed = false;

  const cameraTarget = new THREE.Vector3(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
  const lookTarget = new THREE.Vector3(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);


  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener('resize', resize);

  let frameId: number | null = null;
  let previousTime = performance.now();

  const render = (now: number) => {
    if (disposed) {
      return;
    }

    const delta = Math.min((now - previousTime) / 1000, 1 / 20);
    previousTime = now;

    // A luz reage ao estado, com interpolacao suave.
    currentLight += (targetLight - currentLight) * Math.min(delta * 4, 1);
    keyLight.intensity = 60 * currentLight;
    fillLight.intensity = 6 * currentLight;

    // A poeira deriva lentamente pelo ambiente.
    const positions = dustGeometry.getAttribute('position') as THREE.BufferAttribute;
    const array = positions.array as Float32Array;

    for (let index = 0; index < dustCount; index += 1) {
      array[index * 3 + 1] += delta * 0.035;

      if (array[index * 3 + 1] > 4.4) {
        array[index * 3 + 1] = 0;
      }
    }

    positions.needsUpdate = true;
    dustMaterial.opacity = 0.55 * (0.4 + currentLight * 0.6);

    // Onda de choque no chao.
    if (shockAge < 0.6) {
      shockAge += delta;
      const progress = Math.min(shockAge / 0.6, 1);

      shockRing.scale.setScalar(1 + progress * 5.5);
      shockRing.material.opacity = (1 - progress) * 0.6;
    } else {
      shockRing.material.opacity = 0;
    }

    // Parallax da camera, com damping dependente de dt (SDD 11.5).
    cameraTarget.set(
      pointerX * CAMERA_MAX_OFFSET.x,
      CAMERA_BASE.y + pointerY * CAMERA_MAX_OFFSET.y,
      CAMERA_BASE.z + Math.abs(pointerX) * 0.18,
    );

    camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, delta));

    lookTarget.set(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y + pointerY * 0.06, CAMERA_LOOK_AT.z);
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);

    frameId = window.requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (frameId === null && !disposed) {
      previousTime = performance.now();
      frameId = window.requestAnimationFrame(render);
    }
  };

  const stopLoop = () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  const handleVisibility = () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);

  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    startLoop();
  }

  return {
    setStatus(nextStatus: CpfStatus) {
      currentStatus = nextStatus;
      targetLight = LIGHT_LEVELS[currentStatus];

      const inkLevel = INK_LEVELS[currentStatus];
      dustMaterial.opacity = 0.55 * (0.4 + inkLevel * 0.6);

      if (
        currentStatus === 'VALID' ||
        currentStatus === 'INVALID_DV1' ||
        currentStatus === 'INVALID_DV2'
      ) {
        shockAge = 0;
      }
    },

    setPointer(x: number, y: number) {
      pointerX = x;
      pointerY = y;
    },

    dispose() {
      disposed = true;
      stopLoop();

      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);

      deskTexture.dispose();
      desk.geometry.dispose();
      (desk.material as THREE.Material).dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      shockRing.geometry.dispose();
      (shockRing.material as THREE.Material).dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}


