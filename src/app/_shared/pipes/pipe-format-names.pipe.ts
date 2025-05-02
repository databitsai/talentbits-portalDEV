import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pipeFormatNames'
})
export class PipeFormatNamesPipe implements PipeTransform {

  transform(name: string, ...args: unknown[]): unknown {
    const nameParts: string[] = name.split(" ");
    const namePartsCapitalize = nameParts
    .map((chain: string) => chain.toLowerCase())
    .map((chain: string) => chain.charAt(0).toUpperCase() + chain.slice(1));
    return namePartsCapitalize.join(" ");
  }

}
