import {ViewChild, Component, EventEmitter, Output, OnInit} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap';
import {JsonConvert} from 'json2typescript';

import {FilterModel} from '../../models/filter.model';
import {StoragesModel} from 'diskstorage/shared/storages.model';
import {StorageModel} from 'diskstorage/shared/storage.model';
import {StorageManageService} from 'diskstorage/shared/storage-manage.service';

@Component({
  selector: 'initialize-system',
  templateUrl: './initialize-system.component.html',
  providers: [StorageManageService]
})
export class InitializeSystemComponent implements OnInit {
  @Output('hide') hideEvent = new EventEmitter();
  @Output('okClick') okCLick = new EventEmitter();
  @ViewChild('lgModal') lgModal: ModalDirective;

  private storageTableData: Array<StorageModel>;

  constructor(private storageManageService: StorageManageService) {
  }

  ngOnInit() {
  }

  show(reset: boolean = true): void {
    let me = this;
    me.lgModal.show();
  }

  hide(): void {
    this.lgModal.hide();
    this.hideEvent.emit();
  }

  private onOkClick(encryption?: boolean){
    let me = this;
    me.storageManageService.getAll([new FilterModel('type', 'vsnap')])
      .subscribe(
        data => {
          // Cast the JSON object to StoragesModel instance.
          let dataset = JsonConvert.deserializeObject(data, StoragesModel);
          me.storageTableData = <Array<StorageModel>> dataset.records;
          if (me.storageTableData.length > 0) {
            if (encryption) {
              me.storageManageService.initializeVSnapWithEncryption(me.storageTableData[0])
                .subscribe(
                  vsnapData => {
                  }
                );
            } else {
              me.storageManageService.initializeVSnap(me.storageTableData[0])
                .subscribe(
                  vsnapData => {
                  }
                );
            }
          }
        }
      );
    this.hide();
    this.okCLick.emit();
  }
}
