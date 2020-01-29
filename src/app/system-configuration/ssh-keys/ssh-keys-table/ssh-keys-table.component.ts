import { Component } from '@angular/core';
import { AccessKeysService } from '../access-keys.service';
import { KeysTableComponent } from '../../access-keys/keysTable/keysTable.component';
import { JsonConvert } from 'json2typescript/index';
import { KeysModel } from '../../access-keys/keys.model';
import { FilterModel } from 'shared/models/filter.model';
import { KeyModel } from '../../access-keys/key.model';

@Component({
  selector: 'ssh-keys-table',
  styleUrls: [],
  templateUrl: './ssh-keys-table.component.html'
})

export class SshKeysTableComponent extends KeysTableComponent {

  private filters: Array<FilterModel> = [new FilterModel('keytype', KeyModel.SSH_KEY_TYPE)];

  // @Override
  loadData() {
    let me = this;
    me.accessKeysService.getKeys(me.sorters, me.filters)
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, KeysModel);
          me.disableAddKeys = !dataset.hasLink('create');
          me.keysTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.paginateConfig.itemsPerPage = dataset.total || 1;
        },
        err => me.handleError(err)
      );
  }
}
