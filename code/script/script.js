//Import
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import ball from "../image/ball.jpg";
import grass from "../image/grass.avif";

//--------------------------------------------
//NOTE Creating renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
//--------------------------------------------

//--------------------------------------------
//NOTE texture loader
const textureLoader = new THREE.TextureLoader();
//--------------------------------------------

//--------------------------------------------
//NOTE Creating scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
//--------------------------------------------

//--------------------------------------------
//NOTE Perspective Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-10, 30, 30);
//--------------------------------------------

//--------------------------------------------
//NOTE Percpective controll
const orbit = new OrbitControls(camera, renderer.domElement);
//--------------------------------------------

//--------------------------------------------
//NOTE - direction light
const directionLight = new THREE.DirectionalLight(0xffffff, 3);
scene.add(directionLight);
directionLight.position.set(-30, 20, 10);
directionLight.castShadow = true;
const frustumSize = 50;
directionLight.shadow.camera.left = -frustumSize;
directionLight.shadow.camera.right = frustumSize;
directionLight.shadow.camera.top = frustumSize;
directionLight.shadow.camera.bottom = -frustumSize;
//--------------------------------------------

//--------------------------------------------
//NOTE - ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
//--------------------------------------------

//--------------------------------------------
//NOTE - creating world where physics exist
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -29.81, 0),
});
//--------------------------------------------

//--------------------------------------------
//NOTE - creating ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  map: textureLoader.load(grass),
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(groundMesh);
groundMesh.rotation.x = -0.5 * Math.PI;
groundMesh.receiveShadow = true;
//--------------------------------------------

//--------------------------------------------
//NOTE - ground body
const groundBodyMaterial = new CANNON.Material();
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(50, 50, 0.001)),
  type: CANNON.Body.STATIC,
  material: groundBodyMaterial,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
//--------------------------------------------

//--------------------------------------------
//NOTE - collision property
const ballBodyMaterial = new CANNON.Material();
const groundBallContactMat = new CANNON.ContactMaterial(
  groundBodyMaterial,
  ballBodyMaterial,
  {
    friction: 0.04,
    restitution: 0.9,
  }
);
const ballBallContactMat = new CANNON.ContactMaterial(
  ballBodyMaterial,
  ballBodyMaterial,
  {
    friction: 0.01,
    restitution: 1,
  }
);
world.addContactMaterial(groundBallContactMat);
world.addContactMaterial(ballBallContactMat);
//--------------------------------------------

//--------------------------------------------
//NOTE - generate ball function
const ballCollection = [];
function generateBall({ x, y, z }) {
  //NOTE: Create ball
  const ballGeometry = new THREE.SphereGeometry(2, 50, 50);
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    map: textureLoader.load(ball),
  });
  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  scene.add(ballMesh);
  ballMesh.position.set(x, y, z);
  ballMesh.castShadow = true;
  //NOTE - Ball Body
  const ballBody = new CANNON.Body({
    shape: new CANNON.Sphere(2),
    mass: 50,
    position: new CANNON.Vec3(x, y, z),
    material: ballBodyMaterial,
  });
  world.addBody(ballBody);
  return [ballMesh, ballBody];
}
//--------------------------------------------

//--------------------------------------------
//NOTE - create ball on click
const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectionPoint);
});
window.ondblclick = () => ballCollection.push(generateBall(intersectionPoint));
//--------------------------------------------

//--------------------------------------------
//NOTE - animate function
const timeStep = 1 / 60;
function animate(time) {
  world.step(timeStep);
  ballCollection.forEach(([ballMesh, ballBody]) => {
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);
  });
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
//--------------------------------------------

//--------------------------------------------
//NOTE - resize camera view
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
//--------------------------------------------
