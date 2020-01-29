import { Component, EventEmitter, Input, Output} from '@angular/core';
import { VadpModel } from '../vadp.model';
import { SiteModel } from '../../site/site.model';
import { AlertComponent } from 'shared/components/msgbox/alert.component';
import { SessionService } from 'core';
import { Selectable } from 'shared/util/selectable';
import { applyMixins } from 'rxjs/util/applyMixins';
import { BaseModel } from 'shared/models/base.model';
import { HighlightableList } from 'shared/util/keyboard';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'vadp-proxy-status-table',
  templateUrl: './vadp-proxy-status-table.component.html',
  styleUrls: ['./vadp-proxy-status-table.component.scss']
})

export class VadpProxyStatusTableComponent extends HighlightableList {
  @Input() vadpData: Array<VadpModel> = [];
  @Input() sites: Array<SiteModel> = [];
  @Output() selectionChange = new EventEmitter();
  @Output() refresh: EventEmitter<void> = new EventEmitter<void>();

  public alert: AlertComponent;
  selectedItems: Array<VadpModel> = [];
  isSelected: (item: BaseModel) => false;
  toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent) => void;
  textAvailable: string = 'Available';

  constructor(private translate: TranslateService) {
    super();
  }

  ngOnInit() {
    let me = this;
    this.alert = SessionService.getInstance().context['msgbox.alert'];
    me.translate.get([
        'vadpProxyMonitor.textAvailable'
      ]).subscribe((resource: Object) => {
        me.textAvailable = resource['vadpProxyMonitor.textAvailable']; 
      });  
  }

  public getProxyState(item: VadpModel): string {
    // Backend is returning 'UNKNOWN' for available state. Must fix. Doing this for now.
    return item.isVadpAvailable() ? this.textAvailable : ((item.stateDisplayName === undefined) ? item.state.toLowerCase() : item.stateDisplayName);
  }


  public resetSelection(): void {
    this.selectedItems = [];
  }

  private trackByFn(idx: number, item: VadpModel) {
    return item && item.url;
  }

  private onRefresh(): void {
    this.refresh.emit();
  }
}
applyMixins(VadpProxyStatusTableComponent, [Selectable]);
