import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StorageModel } from 'diskstorage/shared/storage.model';
import { PreferencesCategoryModel } from 'shared/components/preferences-category/preferences-category.model';
import { vSnapPreferencesService } from './vsnap-preferences.service';
import { ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';
import { Subject } from 'rxjs';

@Component({
  selector: 'vsnap-preferences',
  templateUrl: './vsnap-preferences.component.html',
  styleUrls: ['./vsnap-preferences.component.scss'],
})

export class vSnapPreferencesComponent implements OnInit, OnDestroy {

  errorHandler: ErrorHandlerComponent;
  private preferencesCategoryModelArray: Array<PreferencesCategoryModel> = [];
  private resetValue: any;
  private updatedValue: any;
  private subs: Subject<void> = new Subject<void>();
  private vsnapData: object;
  @Input() storageItem: StorageModel
  @Input() set vsnapPreferenceData(value: any) {
    this.vsnapData = value;
    this.preferencesCategoryModelArray = [];
    if (this.vsnapData && this.vsnapData['preferences']) {
      this.vsnapData['preferences'].forEach(element => {
        this.preferencesCategoryModelArray.push(new PreferencesCategoryModel({
          id: element.id,
          name: element.name,
          value: element.value.value,
          defaultValue: element.value.defaultValue,
          values: element.value.values,
          url: '/' + element.id,
          typeKey: element.value.typeKey,
          showClearIcon: element.value.value === null ? false : true
        }));
      });
    }
  }

  constructor(private vSnapService: vSnapPreferencesService) {
  }

  ngOnInit() {
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  clickingReset(event: any) {
    this.vSnapService.resetData(this.storageItem, event.url).takeUntil(this.subs)
      .subscribe(
        response => {
          //Below code is hard-coded for concurrent backup (vMOrDatabaseStreams) in the version 10.1.5.
          if (response.typeKey === 'pref.type.list' && event.url === '/vMOrDatabaseStreams') {            
            for (let i = 0; i < response.value.values.length; i++) {
              let element = response.value.values[i];
              if (element && element.id && event.url.includes(element.id)) {
                this.resetValue = element.value.value;
                break;
              }
            }
          } //End of Hard-code
          else {
            this.resetValue = response.value.value;
          }
          event.callback(event.index, this.resetValue);
        },
        error => {
          this.errorHandler.handle(error);
        }
      );
  }

  detectingValueChange(event: any) {
    this.vSnapService.putData(this.storageItem, event.value, event.typeKey, event.url).takeUntil(this.subs)
      .subscribe(
        response => {
          //Below code is for concurrent backup (vMOrDatabaseStreams) in the version 10.1.5.
          if (response.typeKey === 'pref.type.list' && event.typeKey && event.typeKey !== 'pref.type.list') {            
            for (let i = 0; i < response.value.values.length; i++) {
              let element = response.value.values[i];
              if (element && element.id && event.url.includes(element.id)) {
                this.updatedValue = element.value.value;
                break;
              }
            }
          } 
          else if (response.typeKey === 'pref.type.list' && event.url === '/concurrentBackup'
            && response.value.value === 'Limit') {
              this.updatedValue = {
                value: response.value.value,
                subValue: response.value.values[0].value.value
              }
          } //End of Hard-code
          else {
            this.updatedValue = response.value.value
          }
          event.callback(event.index, this.updatedValue);
        },
        error => {
          this.errorHandler.handle(error);
        }
      );
  }

}
