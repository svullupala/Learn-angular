import {Pipe, PipeTransform} from '@angular/core';
import {BaseApplicationModel, PartitionModel} from './base-application-model.model';
import { SharedService } from 'shared/shared.service';

@Pipe({
    'name': 'partitionDisplay'
})
export class PartitionDisplayPipe implements PipeTransform {
  private FORMAT = '{0}({1})';
  constructor() {
  }

  transform(value: BaseApplicationModel): string {
    let partitions: Array<PartitionModel> = value.partitions, map: any,
      retVal: Array<string> = [];

    if (partitions === undefined || partitions == null) {
      return '';
    }

    map = this.getMap(partitions);

    Object.keys(map).forEach((element) => {
      retVal.push(this.getDisplay(element, map[element]));
    });

    return retVal.join(' ');
  }

  private getMap(partitions: Array<PartitionModel>): any {
    let map: any = {};

    partitions.forEach((element) => {
      if (map[element.host] === undefined) {
        map[element.host] = [];
      }

      map[element.host].push(element.id); 
    });
  
    return map;
  }

  private getDisplay(host: string, parts: Array<string>): string {
      return SharedService.formatString(this.FORMAT, host, parts.join(','));
  }
}
