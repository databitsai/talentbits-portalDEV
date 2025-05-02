import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pipeSecondsToMinutes'
})
export class PipeSecondsToMinutesPipe implements PipeTransform {

  transform(seconds: number, ...args: unknown[]): string {
    if (seconds < 60) {
      return `${seconds} s`;
    } else {
      return `${(seconds/60).toFixed(1)} min`;
    }
  }

}
