import {BaseHypervisorModel} from 'hypervisor/shared/base-hypervisor.model';
import {SnapshotModel} from 'hypervisor/shared/snapshot.model';
import {HasEquals} from 'shared/selector/generic-selector.service';

export class RestoreItem implements HasEquals<RestoreItem> {
  public mapName: string = '';

  constructor(public resource: BaseHypervisorModel, public snapshot: SnapshotModel) {
  }

  equals(target: RestoreItem): boolean {
    return this.resource.equals(target.resource);
  }
}
