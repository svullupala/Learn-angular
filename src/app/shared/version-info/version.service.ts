import {Injectable} from '@angular/core';
import {NodeService} from 'core';

@Injectable()
export class VersionService {

  constructor(private node: NodeService) {
  }

  getVersion() {
    return this.node.getAll('ngp/version');
  }
}
