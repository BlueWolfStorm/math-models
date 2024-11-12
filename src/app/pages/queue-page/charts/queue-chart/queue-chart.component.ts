import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewChecked,
  input,
} from '@angular/core';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  LineData,
} from 'lightweight-charts';
import { QueueSimulationService } from '../../../../core/services/queue-simulation/queue.simulation.service';

@Component({
  selector: 'app-queue-chart',
  standalone: true,
  imports: [],
  templateUrl: './queue-chart.component.html',
  styleUrl: './queue-chart.component.sass',
})
export class QueueChartComponent implements OnInit, AfterViewChecked {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  private chart!: IChartApi;
  private lineSeries!: ISeriesApi<'Area'>;
  private priceLine!: IPriceLine;
  private toolTip!: HTMLDivElement;
  chartName = input.required<string>();
  data = input.required<LineData[]>();
  width = input<number>(700);
  height = input<number>(380);

  constructor(public queueSimulationService: QueueSimulationService) {}

  ngOnInit(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      width: this.width(),
      height: this.height(),
      leftPriceScale: {
        visible: true,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: true,
          style: 0,
          width: 2,
          color: 'rgba(32, 38, 46, 0.1)',
          labelVisible: false,
        },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
    });

    this.lineSeries = this.chart.addAreaSeries({
      topColor: 'rgba(239, 83, 80, 0.05)',
      bottomColor: 'rgba(239, 83, 80, 0.28)',
      lineColor: 'rgba(239, 83, 80, 1)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    this.lineSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.3,
        bottom: 0.25,
      },
    });

    this.createToolTip();

    this.chart.subscribeCrosshairMove((param) => {
      this.updateToolTip(param);
    });

    this.chart.timeScale().fitContent();
  }

  ngAfterViewChecked(): void {
    this.updateChartData();
  }

  updateChartData(): void {
    this.lineSeries.setData(this.data());
  }

  private createToolTip(): void {
    const container = this.chartContainer.nativeElement;
    const toolTipWidth = 96;
    this.toolTip = document.createElement('div');
    this.toolTip.style.width = `${toolTipWidth}px`;
    this.toolTip.style.height = '300px';
    this.toolTip.style.position = 'absolute';
    this.toolTip.style.display = 'none';
    this.toolTip.style.padding = '8px';
    this.toolTip.style.boxSizing = 'border-box';
    this.toolTip.style.fontSize = '12px';
    this.toolTip.style.textAlign = 'left';
    this.toolTip.style.zIndex = '1000';
    this.toolTip.style.top = '12px';
    this.toolTip.style.left = '12px';
    this.toolTip.style.pointerEvents = 'none';
    this.toolTip.style.borderRadius = '4px 4px 0px 0px';
    this.toolTip.style.borderBottom = 'none';
    this.toolTip.style.background = `rgba(255, 255, 255, 0.25)`;
    this.toolTip.style.color = 'black';
    this.toolTip.style.borderColor = 'rgba(239, 83, 80, 1)';
    container.appendChild(this.toolTip);
  }

  private updateToolTip(param: any): void {
    const container = this.chartContainer.nativeElement;
    const toolTipWidth = 96;

    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > container.clientWidth ||
      param.point.y < 0 ||
      param.point.y > container.clientHeight
    ) {
      this.toolTip.style.display = 'none';
    } else {
      const dateStr = param.time;
      this.toolTip.style.display = 'block';
      const data = param.seriesData.get(this.lineSeries);
      const price = data.value !== undefined ? data.value : data.close;
      this.toolTip.innerHTML = `<div style="color: rgba(239, 83, 80, 1)">⬤${this.chartName()} .</div><div style="font-size: 24px; margin: 4px 0px; color: black">
        ${Math.round(100 * price) / 100}
        </div><div style="color: black">
        ${new Date(dateStr * 1000).toDateString()}
        </div>`;

      let left = param.point.x;
      const timeScaleWidth = this.chart.timeScale().width();
      const priceScaleWidth = this.chart.priceScale('left').width();
      const halfTooltipWidth = toolTipWidth / 2;
      left += priceScaleWidth - halfTooltipWidth;
      left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
      left = Math.max(left, priceScaleWidth);

      this.toolTip.style.left = left + 'px';
      this.toolTip.style.top = '0px';
    }
  }
}
