import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';

@Injectable()
export class HypervisorResourcesService {
  constructor(private translateService: TranslateService) {}

  getIconClassname(item: BaseHypervisorModel): string {
    if (
      item.resourceType === 'hypervisor' ||
      item.resourceType === 'folder' ||
      (!item.type && item.resourceType !== 'vm' && item.resourceType !== 'volume')
    ) {
      return 'ion-android-folder';
    }

    if ((item.type || '').toLowerCase() === 'datacenter') {
      return 'fa fa-building';
    }

    if ((item.type || '').toLowerCase() === 'vmgroup') {
      return 'ion-android-apps';
    }

    if ((item.type || '').toLowerCase() === 'virtualmachine' || item.resourceType === 'vm') {
      return 'ion-android-desktop';
    }

    if ((item.type || '').toLowerCase() === 'datastore' || item.resourceType === 'datastore') {
      return 'fa fa-database';
    }

    if ((item.type || '').toLowerCase() === 'volume' || item.resourceType === 'volume') {
      return 'fa fa-database';
    }

    if ((item.type || '').toLowerCase() === 'vdisk' || item.resourceType === 'vdisk') {
      return 'ion-cube';
    }

    if (item.resourceType === 'tagcategory') {
      return 'ion-pricetags';
    }

    if (item.resourceType === 'tag') {
      return 'ion-pricetag';
    }

    return '';
  }

  getDisplayName(item: BaseHypervisorModel): Observable<string> {
    const resourcesTranslationKey = this.getResourcesNameTransKey(item);

    return this.translateService.get(`hypervisor.resources.${resourcesTranslationKey}`);
  }

  private getResourcesNameTransKey(item: BaseHypervisorModel): string {
    if ((item.type || '').toLowerCase() === 'folder' || item.resourceType === 'folder') {
      return 'textFolder';
    }
    if ((item.type || '').toLowerCase() === 'datacenter') {
      return 'textDataCenter';
    }
    if ((item.type || '').toLowerCase() === 'vmgroup') {
      return 'textVmGroup';
    }
    if ((item.type || '').toLowerCase() === 'virtualmachine' || item.resourceType === 'vm') {
      return 'textVm';
    }
    if ((item.type || '').toLowerCase() === 'datastore' || item.resourceType === 'datastore') {
      return 'textDataStore';
    }
    if ((item.type || '').toLowerCase() === 'volume' || item.resourceType === 'volume') {
      return 'textVolume';
    }
    if ((item.type || '').toLowerCase() === 'vdisk' || item.resourceType === 'vdisk') {
      return 'textVDisk';
    }
    if (item.resourceType === 'tagcategory') {
      return 'textTagCategory';
    }
    if (item.resourceType === 'tag') {
      return 'textTag';
    }
    if (item.resourceType === 'hypervisor') {
      return 'textHypervisor';
    }
    return '';
  }
}
