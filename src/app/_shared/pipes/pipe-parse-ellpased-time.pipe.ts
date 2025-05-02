import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pipeParseEllpasedTime'
})
export class PipeParseEllpasedTimePipe implements PipeTransform {

  transform(totalSeconds: number, ...args: unknown[]): string {
    if (totalSeconds === null) {
      return '-:-';
    }
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }

}
