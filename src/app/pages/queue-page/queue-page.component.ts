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

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './queue-page.component.html',
  styleUrls: ['./queue-page.component.sass'],
})
export class QueuePageComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  isControlPanelVisible = true;

  constructor(
    public threeService: ThreeService,
    public queueSimulationService: QueueSimulationService,
  ) {}

  ngOnInit(): void {
    this.threeService.init(this.canvasContainer.nativeElement);
    this.threeService.animate();
  }

  ngOnDestroy(): void {
    this.threeService.stop();
  }

  toggleControlPanel(): void {
    this.isControlPanelVisible = !this.isControlPanelVisible;
  }
}
