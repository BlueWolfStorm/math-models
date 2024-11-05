import { HourToMinutePipe } from './hour.to.minute.pipe';

describe('HourToMinutePipe', () => {
  it('create an instance', () => {
    const pipe = new HourToMinutePipe();
    expect(pipe).toBeTruthy();
  });
});
