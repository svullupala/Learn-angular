import {Component, QueryList, Input, OnInit, AfterViewInit, OnDestroy, EventEmitter, Output, ViewChild, ViewChildren} from '@angular/core';
import {Selectable} from 'shared/util/selectable';
import {applyMixins} from 'rxjs/util/applyMixins';
import {CloneTableComponent} from '../../../../job/shared/clone-table/clone-table.component';

@Component({
  selector: 'active-resources',
  styleUrls: ['./active-resources.scss'],
  templateUrl: './active-resources.component.html'
})

export class ActiveResourcesComponent {

  @ViewChildren(CloneTableComponent)
  private tables: QueryList<CloneTableComponent> ;

  private jobServiceIdsApplication: Array<string> = ['serviceprovider.recovery.application'];
  private jobServiceIdsHypervisor: Array<string> = ['serviceprovider.recovery.hypervisor'];

  public onRefresh(): void {
    this.tables.forEach((instance) => {
      instance.loadData();
    }); 
  }

}

applyMixins(ActiveResourcesComponent, [Selectable]);
