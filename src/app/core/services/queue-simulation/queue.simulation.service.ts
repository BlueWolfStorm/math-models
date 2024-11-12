import { Injectable } from '@angular/core';
import { LineData, UTCTimestamp } from 'lightweight-charts';
import * as PoissonProcess from 'poisson-process'

interface Customer {
  serviceTime: number;
}

interface Service {
  enabled: boolean;
  queue: Customer[];
  K: number;
  endWhenQueueIsEmpty: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class QueueSimulationService {
  // Simulation parameters
  queue: Customer[] = [];
  service: Service[] = [];
  endWhenServerQueueIsEmpty = false
  startSimulationTime = new Date();
  serviceEndTimes: number[] = [];
  customerProbability = 0;
  hoursSimulate = 0;
  durationSeconds = 0;
  intervalPerStep = 0;
  simulationStopped = false;

  // Chart parameters
  queueChartData: LineData[] = [];
  serviceChartData: LineData[] = [];


  // Queue parameters
  K = 0; // K
  S = 1; // S
  lambda = 2; // λ
  oneOverLambda = 1 / this.lambda; // 1 / λ
  calculateOneOverLambda = true;
  mu = 3; // μ
  oneOverMu = 1 / this.mu; // 1 / μ
  calculateOneOverMu = true;
  rho = this.lambda / this.mu; // ρ = λ / μ
  systemUtilization = this.rho; // ρ
  systemNonUtilization = 1 - this.rho; // ρ0
  L = 0; // L
  Lq = 0; // Lq
  W = 0; // W
  Wq = 0; // Wq

  constructor() {
    this.serviceEndTimes = Array(this.S).fill(0);
  }

  // Simulation methods

  public startSimulation(hoursSimulate: number, durationSeconds: number): void {
    this.queue = [];
    this.service = [];
    this.startSimulationTime = new Date();
    this.simulationStopped = false;
    this.hoursSimulate = hoursSimulate;
    this.durationSeconds = durationSeconds;
    this.queueChartData = [];
    this.serviceChartData = [];
    console.log('');
    console.log('');
    console.log('Initializing Values...');

    if (this.calculateOneOverLambda) this.oneOverLambda = 1 / this.lambda;
    if (this.calculateOneOverMu) this.oneOverMu = 1 / this.mu;

    const isMM1 = this.S === 1 && this.K === 0;
    const isMMS = this.S > 1 && this.K === 0;
    const isMM1K = this.S === 1 && this.K > 0;
    const isMMSK = this.S > 1 && this.K > 0;
    this.rho = this.lambda / this.mu;
    if (isMM1) this.calculateMM1();
    else if (isMMS) this.calculateMMS();
    else if (isMM1K) this.calculateMM1K();
    else if (isMMSK) this.calculateMMSK();

    this.roundValues();
    this.printValues();

    for (let i = 0; i < this.S; i++) {
      let queueLength = this.K;
      if(this.K == 0)
        queueLength = 1

      this.service.push({
        enabled: true,
        queue: [],
        K: queueLength,
        endWhenQueueIsEmpty: this.endWhenServerQueueIsEmpty,
      });
    }

    console.log('');
    console.log('');
    console.log('Starting simulation...');

    this.calculateDelay();

    const simulateStepWithDelay = (step: number) => {
      if (this.simulationStopped) return;
      console.log('Step', step);
      if(step % 60 == 0){
        const customerArriving = Math.round(PoissonProcess.sample(this.lambda));
        this.customerProbability = 100 * (customerArriving/ 60);
        console.log('[POISSON] Llegaran', customerArriving, ' clientes en esta hora');
      }


      this.simulateStep();
      setTimeout(() => simulateStepWithDelay(step + 1), this.intervalPerStep);
    };

    simulateStepWithDelay(0);
  }

  public stopSimulation(): void {
    console.log('Simulation stopped');
    this.simulationStopped = true;
  }

  public calculateDelay() {
    const hourInterval = (this.durationSeconds / this.hoursSimulate) * 1000;
    this.intervalPerStep = hourInterval / 60;
  }

  private simulateStep(): void {
    this.updateServiceTimes();
    this.arriveCustomer();
    if (this.queue.length != 0){
      if(!this.endWhenServerQueueIsEmpty)
        this.insertCustomersInServiceQueue()
      else
        this.insertCustomersInServiceEmptyQueue()
    }
  }

  private arriveCustomer(): void {;
    let currentCustomerProbability = this.customerProbability;
    let clientsArrived = 0;
    while (currentCustomerProbability > 0) {
      if (Math.random() * 100 < currentCustomerProbability) {
        const customer: Customer = {
          serviceTime: this.oneOverMu * 60,
        };
        this.queue.push(customer);
        clientsArrived++;
      }
      currentCustomerProbability -= 100;
    }
    if(clientsArrived > 0)
      console.log(`   Entro ${clientsArrived} clientes`);

    const totalQueue =
      this.queue.length;

    this.queueChartData.push({
      time: (this.startSimulationTime.getTime() / 1000) as UTCTimestamp,
      value: totalQueue,
    });

    let serviceQueue = 0;
    for(let i = 0; i < this.S; i++){
      serviceQueue += this.service[i].queue.length;
    }
    this.serviceChartData.push({
      time: (this.startSimulationTime.getTime() / 1000) as UTCTimestamp,
      value: serviceQueue,
    });

    this.startSimulationTime = new Date(
      this.startSimulationTime.getTime() + 60000,
    );
  }

  private insertCustomersInServiceQueue(): void {
    // Find non full servers
    let nonFullServers: number[] = [];

    if (this.K > 0)
      nonFullServers = this.service
        .map((server, index) => (server.queue.length < this.K ? index : -1))
        .filter((index) => index !== -1);
    else
      nonFullServers = this.service
        .map((server, index) => (server.queue.length > -1 ? index : -1))
        .filter((index) => index !== -1);

    if (nonFullServers.length === 0 || this.queue.length === 0) return;

    // Find non full server with less customers
    const serverWithLessCustomers = nonFullServers.reduce((prev, current) =>
      this.service[prev].queue.length < this.service[current].queue.length
        ? prev
        : current,
    );

    // Insert first customer in queue
    this.service[serverWithLessCustomers].queue.push(this.queue.shift()!);
    console.log('     Cliente entro en el servidor:', serverWithLessCustomers);

    this.insertCustomersInServiceQueue();
  }

  private insertCustomersInServiceEmptyQueue(): void {
    // Find servers with empty queue
    let emptyServers: number[] = [];

    emptyServers = this.service
      .map((server, index) => (server.queue.length === 0 ? index : -1))
      .filter((index) => index !== -1);

    if (emptyServers.length === 0 || this.queue.length === 0) return;

    let numberOfCustomers = 0;
    // Insert K customers in empty server
    for (let i = 0; i < this.service[emptyServers[0]].K; i++) {
      if (this.queue.length <= 0) break;
      this.service[emptyServers[0]].queue.push(this.queue.shift()!)
      numberOfCustomers++;
    }

    console.log(`     Entraron ${numberOfCustomers} clientes en el servidor `, emptyServers[0]);
  }

  private updateServiceTimes(): void {
    if (this.service.length === 0) return;

    for (let i = 0; i < this.S; i++) {
      // Update service times and remove customers whose service time has reached 0
      for (let j = 0; j < this.service[i].queue.length; j++) {
        this.service[i].queue[j].serviceTime -= 1;
        if (this.service[i].queue[j].serviceTime <= 0) {
          this.service[i].queue.splice(j, 1);
          console.log('       Cliente atendido en servidor', i);
        }
      }
    }
  }

  // Logic methods

  private calculateMM1(): void {
    console.log('Calculando MM1');
    this.systemUtilization = this.rho;
    this.systemNonUtilization = 1 - this.rho;
    this.Lq = this.rho ** 2 / this.systemNonUtilization;
    this.Wq = this.Lq / this.lambda;
    this.W = this.Wq + this.oneOverMu;
    this.L = this.lambda * this.W;
  }

  private calculateMMS(): void {
    console.log('Calculando MMS');
    this.systemUtilization = this.lambda / (this.S * this.mu);
    this.systemNonUtilization = this.getMMSSystemNonUtilization();
    this.Lq =
      ((this.rho ** (this.S + 1))  / this.factorial(this.S - 1)) *
      (1 / ((this.S - this.rho) ** 2)) *
      this.systemNonUtilization;
    this.Wq = this.Lq / this.lambda;
    this.W = this.Wq + this.oneOverMu;
    this.L = this.lambda * this.W;
  }

  private getMMSSystemNonUtilization(): number {
    let sum = 0;
    for (let i = 0; i <= this.S - 1; i++) {
      sum += this.rho ** i / this.factorial(i);
    }

    return (
      1 /
      (sum +
        ((this.rho ** this.S) / this.factorial(this.S)) *
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

    if (this.Wq < 0) this.Wq = 0;
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

  private roundValues() {
    this.rho = Math.round(this.rho * 10000) / 10000;
    this.systemUtilization = Math.round(this.systemUtilization * 10000) / 10000;
    this.systemNonUtilization = Math.round(this.systemNonUtilization * 10000) / 10000;
    this.Lq = Math.round(this.Lq);
    this.L = Math.round(this.L);
    this.oneOverMu = Math.round(this.oneOverMu * 10000) / 10000;
    this.Wq = Math.round(this.Wq * 10000) / 10000;
    this.W = Math.round(this.W * 10000) / 10000;
  }

  private printValues(): void {
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

  private factorial(n: number): number {
    if (n === 0) return 1;
    return n * this.factorial(n - 1);
  }

  public getRandomInt(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  }
}
