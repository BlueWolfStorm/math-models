import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ThreeService } from '../../core/services/three/three.service';
import { QueueSimulationService } from '../../core/services/queue-simulation/queue.simulation.service';
import { FormsModule } from '@angular/forms';
import { HourToMinutePipe } from '../../core/pipes/hour-to-minute/hour.to.minute.pipe';
import { HourToSecondPipe } from '../../core/pipes/hour-to-second/hour.to.second.pipe';
import { NgClass } from '@angular/common';
import { QueueChartComponent } from './charts/queue-chart/queue-chart.component';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [
    FormsModule,
    HourToMinutePipe,
    HourToSecondPipe,
    NgClass,
    QueueChartComponent,
  ],
  templateUrl: './queue-page.component.html',
  styleUrls: ['./queue-page.component.sass'],
})
export class QueuePageComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  isControlPanelVisible = false;
  isSimulationPanelVisible = false;

  constructor(
    public threeService: ThreeService,
    public queueSimulationService: QueueSimulationService,
  ) {}

  ngOnInit(): void {
    this.queueSimulationService.startSimulation(1, 30);
    this.threeService.init(this.canvasContainer.nativeElement);
    this.threeService.animate();
  }

  ngOnDestroy(): void {
    this.threeService.stop();
  }

  toggleSimulationPanel() {
    this.isSimulationPanelVisible = !this.isSimulationPanelVisible;
  }

  toggleControlPanel() {
    this.isControlPanelVisible = !this.isControlPanelVisible;
  }

  onSimulationParamsChange(): void {
    this.queueSimulationService.calculateDelay();
  }

  onModelParamsChange(): void {
    if(this.queueSimulationService.simulationStopped) return

    this.stopSimulation();
    setTimeout(() => {
      this.startSimulation();
    }, 300);
  }

  startSimulation(): void {
    this.queueSimulationService.startSimulation(
      this.queueSimulationService.hoursSimulate,
      this.queueSimulationService.durationSeconds,
    );
  }

  stopSimulation(): void {
    this.queueSimulationService.stopSimulation();
  }
}
