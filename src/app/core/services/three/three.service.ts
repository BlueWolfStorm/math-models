import { Injectable, NgZone } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { QueueSimulationService } from '../queue-simulation/queue.simulation.service';

interface Customer {
  mesh: THREE.Mesh;
  state: 'waiting' | 'moving' | 'served';
  targetPosition: THREE.Vector3;
}

@Injectable({
  providedIn: 'root',
})
export class ThreeService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId!: number;
  private lastTime = 0;
  delay = 10000; // Delay in milliseconds
  private customers: Customer[] = [];

  constructor(
    private ngZone: NgZone,
    private queueSimulationService: QueueSimulationService,
  ) {}

  init(container: HTMLElement): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Set background color to blue

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    const light = new THREE.PointLight(0xfffff, 1, 100);
    light.position.set(10, 10, 10);
    this.scene.add(light);

    this.camera.position.z = 8;
    this.camera.position.y = 4;
    this.camera.position.x = 10;
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
  }

  animate(): void {
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
      this.updateVisualization();
      this.updateCustomerPositions();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private updateVisualization(): void {
    // Clear previous objects
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // Add a green floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: THREE.Color.NAMES.green,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0, 0); // Adjusted position
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Add server objects
    const numServers = this.queueSimulationService.S;
    for (let i = 0; i < numServers; i++) {
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const server = new THREE.Mesh(geometry, material);
      server.position.set(i * 2 - numServers, 2, 0); // Adjusted position
      this.scene.add(server);
    }

    // Add customer objects to the server queues
    this.queueSimulationService.service.forEach((service, serverIndex) => {
      service.queue.forEach((customer, customerIndex) => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          serverIndex * 2 - numServers,
          1.5,
          -customerIndex - 1,
        ); // Adjusted position
        this.scene.add(cube);

        this.customers.push({
          mesh: cube,
          state: 'waiting',
          targetPosition: new THREE.Vector3(
            serverIndex * 2 - numServers,
            1.5,
            -customerIndex - 1,
          ),
        });
      });
    });
  }

  private updateCustomerPositions(): void {
    const speed = 0.05;
    this.customers.forEach((customer) => {
      if (customer.state === 'waiting') {
        const elevatorIndex =
          this.customers.indexOf(customer) % this.queueSimulationService.S;
        customer.targetPosition.set(
          elevatorIndex * 2 - this.queueSimulationService.S,
          2,
          0,
        );
        customer.state = 'moving';
      }

      if (customer.state === 'moving') {
        customer.mesh.position.lerp(customer.targetPosition, speed);
        if (customer.mesh.position.distanceTo(customer.targetPosition) < 0.1) {
          customer.state = 'served';
          this.scene.remove(customer.mesh);
        }
      }
    });

    this.customers = this.customers.filter(
      (customer) => customer.state !== 'served',
    );
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }
}
