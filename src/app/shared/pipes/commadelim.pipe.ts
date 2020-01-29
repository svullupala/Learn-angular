import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'commadelim'
})
export class CommaDelimPipe implements PipeTransform {
  transform(value: String): String {
    if (value) {
      return value.replace(new RegExp(',', 'g'), ', ');
    }

    return value;
  }
}
