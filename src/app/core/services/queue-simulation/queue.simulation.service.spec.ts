import { TestBed } from '@angular/core/testing';

import { QueueSimulationService } from './queue.simulation.service';

describe('QueueSimulationService', () => {
  let service: QueueSimulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueueSimulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
