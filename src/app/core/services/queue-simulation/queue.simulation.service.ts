import { Injectable } from '@angular/core';

interface Customer {
  arrivalTime: number;
  serviceTime: number;
}

interface Service {
  enabled: boolean;
  queue: Customer[];
}

@Injectable({
  providedIn: 'root',
})
export class QueueSimulationService {
  // Simulation parameters
  queue: Customer[] = [];
  service: Service[] = [];
  currentTime = 0;
  serviceEndTimes: number[] = [];

  // Queue parameters
  K = 10; // K = 10
  S = 1; // S = 1
  lambda = 1; // λ = 1
  mu = 1; // μ = 1
  rho = this.lambda / this.mu; // ρ = λ / μ
  systemUtilization = this.rho; // ρ = 0
  systemNonUtilization = 1 - this.rho; // ρ0
  L = 0; // L = 0
  Lq = 0; // Lq = 0
  W = 0; // W = 0
  Wq = 0; // Wq = 0

  constructor() {
    this.serviceEndTimes = Array(this.S).fill(0);
  }

  private exponentialRandom(mean: number): number {
    return -mean * Math.log(1 - Math.random());
  }

  public simulateStep(intervalDuration: number): void {
    this.currentTime = 0;
    // Check the type of the queue
    const isMM1 = this.S === 1 && this.K === 0;
    const isMMS = this.S > 1 && this.K === 0;
    const isMM1K = this.S === 1 && this.K > 0;
    const isMMSK = this.S > 1 && this.K > 0;
    this.rho = this.lambda / this.mu;
    if (isMM1) this.calculateMM1();
    else if (isMMS) this.calculateMMS();
    else if (isMM1K) this.calculateMM1K();
    else if (isMMSK) this.calculateMMSK();

    // Initialize the services
    for (let i = 0; i < this.S; i++) {
      this.service.push({ enabled: true, queue: [] });
    }

    const simulationEndTime = 3600; // Simulate one hour (3600 seconds)
    let actualCustomers = 0;
    // Simulate the queue
    while (this.currentTime < simulationEndTime) {
      this.currentTime += intervalDuration / 1000; // Convert interval duration to seconds

      if (actualCustomers < this.lambda && this.queue.length < this.lambda) {
        // Generate a random number between 0 and lambda
        const randomCustomers = this.getRandomInt(0, this.lambda);
        actualCustomers += randomCustomers;

        for (let i = 0; i < randomCustomers; i++) {
          const customer: Customer = {
            arrivalTime: this.currentTime,
            serviceTime: (1 / this.mu) * 60,
          };
          console.log(customer);
          this.queue.push(customer);
        }
        console.log('Entraron', randomCustomers, 'clientes');
      }

      console.log('Clientes en cola', this.queue.length);

      // Serve customers into service queues
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue.length > 0) {
          // Find the server with the least number of clients
          let minQueueIndex = 0;
          const serversFull: boolean[] = Array(this.S).fill(false);
          for (let j = 1; j <= this.S; j++) {
            if (this.service[j].queue.length >= this.K) {
              serversFull[j] = true;
            }

            if (
              this.service[j].queue.length <
              this.service[minQueueIndex].queue.length
            ) {
              minQueueIndex = j;
            }
          }

          // If all servers are full, do nothing
          if (serversFull.every((server) => server)) {
            console.log('Todos los servidores están llenos');
            break;
          }

          // Insert the client into the server's queue with the least number of clients
          if (this.service[minQueueIndex].queue.length < this.K) {
            const customer = this.queue.shift();
            if (customer) {
              this.service[minQueueIndex].queue.push(customer);
            }
          }
        }
      }

      for (let i = 0; i < this.S; i++) {
        // Update service times and remove customers whose service time has reached 0
        this.service[i].queue = this.service[i].queue.filter((customer) => {
          customer.serviceTime -= intervalDuration / 1000;
          return customer.serviceTime > 0;
        });

        console.log(`Clientes en servidor ${i}`, this.service[i].queue.length);
      }
    }
  }

  private calculateMM1(): void {
    console.log('Calculando MM1');
    this.systemUtilization = this.rho;
    this.systemNonUtilization = 1 - this.rho;
    this.Lq = this.rho ** 2 / this.systemNonUtilization;
    this.Wq = this.Lq / this.lambda;
    this.W = this.Wq + 1 / this.mu;
    this.L = this.lambda * this.W;

    console.log('lambda', this.lambda);
    console.log('mu', this.mu);
    console.log('S', this.S);
    console.log('rho', this.rho);
    console.log('systemUtilization', this.systemUtilization);
    console.log('systemNonUtilization', this.systemNonUtilization);
    console.log('Lq', this.Lq);
    console.log('L', this.L);
    console.log('Wq', this.Wq);
    console.log('W', this.W);
  }

  private calculateMMS(): void {
    console.log('Calculando MMS');
    this.systemUtilization = this.lambda / (this.S * this.mu);
    this.systemNonUtilization = this.getMMSSystemNonUtilization();
    this.Lq =
      (this.rho ** (this.S + 1) / this.factorial(this.S - 1)) *
      (1 / (this.S - this.rho) ** 2) *
      this.systemNonUtilization;
    this.Wq = this.Lq / this.lambda;
    this.W = this.Wq + 1 / this.mu;
    this.L = this.lambda * this.W;
  }

  private getMMSSystemNonUtilization(): number {
    let sum = 0;
    for (let i = 0; i < this.S - 1; i++) {
      sum += this.rho ** i / this.factorial(i);
    }

    return (
      1 /
      (sum +
        (this.rho ** this.S / this.factorial(this.S)) *
          (this.S / (this.S - this.rho)))
    );
  }

  private calculateMM1K(): void {
    console.log('Calculando MM1K');
    this.systemUtilization = this.rho;
    this.systemNonUtilization = (1 - this.rho) / ((1 - this.rho) ** this.K + 1);
    this.L =
      this.rho / (1 - this.rho) -
      ((this.K + 1) * this.rho ** (this.K + 1)) /
        (1 - this.rho ** (this.K + 1));
    this.Lq = this.L - (1 - this.systemNonUtilization);
    this.Wq = this.Lq / this.lambda;
    this.W = this.L / this.lambda;
    console.log('rho', this.rho);
    console.log('systemUtilization', this.systemUtilization);
    console.log('systemNonUtilization', this.systemNonUtilization);
    console.log('L', this.L);
    console.log('Lq', this.Lq);
    console.log('Wq', this.Wq);
    console.log('W', this.W);
  }

  private calculateMMSK(): void {
    console.log('Calculando MMSK');
    const singleServerLambda = this.lambda / this.S;
    this.rho = singleServerLambda / this.mu;
    this.systemUtilization = this.rho;
    this.systemNonUtilization = (1 - this.rho) / ((1 - this.rho) ** this.K + 1);
    this.L =
      this.rho / (1 - this.rho) -
      ((this.K + 1) * this.rho ** (this.K + 1)) /
        (1 - this.rho ** (this.K + 1));
    this.Lq = this.L - (1 - this.systemNonUtilization);
    this.Wq = this.Lq / singleServerLambda;
    this.W = this.L / singleServerLambda;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private factorial(n: number): number {
    if (n === 0) return 1;
    return n * this.factorial(n - 1);
  }

  public getNumServers(): number {
    return this.S;
  }

  public getRandomInt(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  }
}
