import {Component, OnInit, ViewChild} from '@angular/core';
import {CatalogBackupService} from './catalog-backup.service';
import {SessionService} from 'core';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components';
import {TranslateService} from '@ngx-translate/core';
import {JsonConvert, JsonProperty} from 'json2typescript/index';
import {BaseModel} from 'shared/models/base.model';
import {PolicySelectTableComponent} from '../../slapolicy/shared/policySelectTable';

@Component({
  selector: 'catalog-backup',
  templateUrl: './catalog-backup.component.html',
  providers: [
    CatalogBackupService
  ]
})
export class CatalogBackupComponent implements OnInit {

  @ViewChild(PolicySelectTableComponent) policySelectTable: PolicySelectTableComponent;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;

  private mask: boolean = false;
  private associationList: string[];
  private infoTitle: string;
  private textAddSuccess: string;

  constructor(private catalogBackupService: CatalogBackupService,  private translate: TranslateService) {
  }

  ngOnInit() {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'catalog.textAddSuccess',
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.textAddSuccess = resource['catalog.textAddSuccess'];
        me.loadSlaAssociations();
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  onApplyPolicyClick() {
    let me = this, resources = me.policySelectTable.getValue();

    me.mask = true;
    me.catalogBackupService.applyPolicies(resources).subscribe(
      success => {
        me.mask = false;
        me.info(me.textAddSuccess);
        me.loadSlaAssociations();
      },
      err => {
        me.mask = false;
        me.handleError(err, true);
      }
    );
  }

  private loadSlaAssociations(): void {
    let me = this;

    me.catalogBackupService.getCatalogSystem().subscribe(
      data => {
        let dataset = JsonConvert.deserializeObject(data, CatalogModel);
        this.associationList = dataset.storageProfiles;
        this.policySelectTable.selectByNames(this.associationList);
      },
      err => {
        me.handleError(err, false);
      },
      () => {
      }
    );
  }
}

export class CatalogModel extends BaseModel {

  @JsonProperty('storageProfiles', [String])
  public storageProfiles: string[] = [];
}

