import { Component, OnDestroy, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { SummaryEntry, WizardPage, WizardPageEventParam } from 'shared/components/wizard/wizard-page';
import { SnapshotRestoreExchOnlineModel } from '../snapshot-restore-exchonline.model';
import { ApplicationRestoreItem } from 'app/manage-protection/applications/restore/application-list-table/application-list-table.component';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationRestoreService } from 'app/manage-protection/applications/restore/application-restore.service';
import { FilterModel } from 'shared/models/filter.model';
import { NvPairModel } from 'shared/models/nvpair.model';
import { ApplicationDestinationTableComponent } from 'app/manage-protection/applications/restore/application-destination-table/application-destination-table.component';
import { Subscription, Subject } from 'rxjs';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { SessionService } from 'core';
import { TenantUsernamesModel } from './tenant-usernames/tenant-usernames.model';
import { JsonConvert } from 'json2typescript';

@Component({
  selector: 'snapshot-restore-exch-destination',
  templateUrl: './snapshot-restore-exchonline-destination.component.html',
  styleUrls: ['../snapshot-restore-exchonline.scss']
})
export class SnapshotRestoreExchOnlineDestinationComponent extends WizardPage<SnapshotRestoreExchOnlineModel> implements OnInit, OnDestroy {
  get applicationType(): string {
    return this.model.workflow;
  }
  get views(): NvPairModel[] {
    return this.model.views;
  }
  set views(views: NvPairModel[]) {
    this.model.views = views;
  }
  get view(): NvPairModel {
    return this.model.view;
  }
  get targetLocation(): string { return this.model.targetLocation; }
  set targetLocation(value: string) { this.model.targetLocation = value; }
  get hasMultipleVersions(): boolean { return this.model.hasMultipleVersions; }
  get targetPath(): string {
    return this.model.policy.spec.subpolicy[0].destination['targetPath'];
  }
  set targetPath(value: string) {
    this.model.policy.spec.subpolicy[0].destination['targetPath'] = value;
  }
  get target(): object { return this.model.target; }
  // set target(value: object) { this.model.target = value; }

  @ViewChild(ApplicationDestinationTableComponent) restoreDestinationTable: ApplicationDestinationTableComponent;
  @ViewChild('summary', { read: TemplateRef })
  private _summary: TemplateRef<any>;
  private filters: Array<FilterModel> = [];
  private subscriptions: Subscription[] = [];
  private textTargetPathPlaceholder: string;
  private textSearchByUsername: string;

  private tenantProviderID: Array<NvPairModel> = [];
  private selectedTenantProviderID: NvPairModel = new NvPairModel('', '');
  private unSelectedTenantProviderID: NvPairModel;
  private usernameSearchResult = Array<TenantUsernamesModel>();
  private subs: Subject<void> = new Subject<void>();
  private isTenantProviderIDSelected: boolean = false;
  private isTenantUsernameSelected: boolean = false;
  private isSearchByUsernameDisabled: boolean = true;
  private destinationMetadata: object = {};
  private masked: boolean = false;
  private disableNextOnAlternate: boolean = false;
  errorHandler: ErrorHandlerComponent;

  private get originalLocation(): boolean {
    return this.targetLocation === 'original' || this.targetLocation === 'originalPrimary';
  }

  constructor(private translate: TranslateService,
    private applicationRestoreService: ApplicationRestoreService) {
    super();
  }

  ngOnInit() {
    let me = this;
    me.unSelectedTenantProviderID = new NvPairModel('', '');
    me.selectedTenantProviderID = me.unSelectedTenantProviderID;

    me.translate.get([
      'application.textTargetPathPlaceholder',
      'application.textSearchByUsername',
      'application.textTenantProviderID'
    ])
      .subscribe((resource: Object) => {
        me.textTargetPathPlaceholder = resource['application.textTargetPathPlaceholder'];
        me.textSearchByUsername = resource['application.textSearchByUsername'];
        me.unSelectedTenantProviderID.name = resource['application.textTenantProviderID'];
      });

    me.applicationRestoreService.getApplicationsForOffice365()
      .takeUntil(me.subs).subscribe(
        response => {
          if (response['instances'] && response['instances'].length > 0) {
            response['instances'].forEach(instance => {
              me.tenantProviderID.push(new NvPairModel(instance['name'], instance['id']))
            });
          }
        },
        error => {
          me.errorHandler.handle(error);
        });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];

    if (me.editMode) {
      if (me.model.targetLocation === 'alternate') {
        me.targetLocation = 'alternate';
        me.selectedTenantProviderID = {
          name: me.model.metadata['tenantProviderIDSelected']['name'],
          value: me.model.metadata['tenantProviderIDSelected']['value']
        };
        me.isTenantProviderIDSelected = true;
        me.isSearchByUsernameDisabled = false;
        me.model.selectedUsername = me.model.metadata['user']['username'];
        me.destinationMetadata['tenantProviderIDSelected'] = me.selectedTenantProviderID;
        me.destinationMetadata['user'] = me.model.metadata['user'];
      }
      else if (me.model.targetLocation === 'original') {
        me.disableNextOnAlternate = true;
      }
    }
  }


  ngOnDestroy(): void {
    let me = this;
    if (me.subscriptions) {
      me.unsubscribe(me.subscriptions);
    }
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  validate(silent: boolean): boolean {
    if (this.targetLocation === 'original') {
      return true;
    }
    if (this.targetLocation === 'alternate' && this.isTenantProviderIDSelected && this.isTenantUsernameSelected) {
      return true;
    }
    if (this.editMode && !this.disableNextOnAlternate) {
      return true;
    }
  }

  onActive(param: WizardPageEventParam, firstTime?: boolean): void {
    let me = this;


    if (firstTime) {
      // Publish the invalidDestination subject.
      me.publish<string>({
        invalidDestination: {
          initValue: null
        }
      });
      // Subscribe the view subject.
      me.subscriptions.push(...me.subscribe<NvPairModel>({
        view: {
          fn: (value: NvPairModel) => {
            // NULL indicates no change.
            if (value)
              this.handleViewChange(value);
          },
          scope: me
        }
      }));
      // Subscribe the runType subject.
      me.subscriptions.push(...me.subscribe<string>({
        runType: {
          fn: (value: string) => {
            // NULL indicates no change.
            if (value)
              me.handleRunTypeChange(value);
          },
          scope: me
        }
      }));
    }

    if (me.editMode && firstTime) {
      me.populateOptions();
    }
  }

  onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(false))
      me.saveOptions();
  }

  get summary(): SummaryEntry {
    return { content: this._summary };
  }

  get destinationName(): string {
    let instance = this.restoreDestinationTable ? this.restoreDestinationTable.getSelectedInstance() : null;
    return instance ? instance.name : '';
  }

  private handleViewChange(view: NvPairModel): void {
    this.handleSubjectsChange(view, this.model.runType);
  }

  private handleRunTypeChange(runType: string): void {
    this.handleSubjectsChange(this.view, runType, true);
  }

  private handleSubjectsChange(view: NvPairModel, runType: string, notifyIfInvalid?: boolean): void {
    let me = this;
    me.restoreDestinationTable.setView(me.views[0]);
    me.restoreDestinationTable.osType = me.extractOsType(me.model.source);
    me.restoreDestinationTable.loadData(undefined, undefined, undefined, () => {
      if (notifyIfInvalid && !me.validate(true))
        me.notify<string>('invalidDestination', me.pageKey);
    });
  }

  private getDestinationValue(): object {
    return this.restoreDestinationTable && this.restoreDestinationTable.getValue();
  }

  private getRestoreList(): Array<ApplicationRestoreItem> {
    return this.model.source;
  }

  private onOriginalClick(value: string): void {
    this.targetLocation = value;
  }

  private onAlternateLocationClick(value: string): void {
    this.targetLocation = value;
    this.applicationRestoreService.filterInstances(this.getRestoreList());
  }

  private getDbGroupValue(): object {
    return this.restoreDestinationTable && this.restoreDestinationTable.getDbGroupValue();
  }

  private extractOsType(list: Array<ApplicationRestoreItem>): string {
    let target = (list || []).find(function (item) {
      let resource = item.resource;
      return resource && !!resource.osType;
    });
    return target && target.resource ? target.resource.osType : undefined;
  }

  private saveOptions(): void {
    let me = this,
      model = me.model;

    model.originalLocation = me.originalLocation;
    model.targetLocation = me.targetLocation;
    model.dbGroupValue = me.getDbGroupValue();
    model.destinationValue = me.getDestinationValue();
    model.policy.spec.subpolicy[0].destination['targetPath'] = me.targetPath;

    model.target = me.target;
    model.metadata = this.destinationMetadata;
  }

  private populateOptions(): void {
    let me = this,
      model = me.model,
      policy = model.policy,
      subpolicy = policy.spec.subpolicy[0],
      destinationInstance: object,
      destinationGroup: object;

    destinationInstance = subpolicy.destination['target'];
    destinationGroup = subpolicy.destination['targetGroup'];
  }

  private onTenantProviderIDSelect(item: NvPairModel) {
    this.isTenantProviderIDSelected = true;
    this.isSearchByUsernameDisabled = false;
    if (this.selectedTenantProviderID.value !== item.value) {
      this.selectedTenantProviderID = item;
      this.destinationMetadata['tenantProviderIDSelected'] = this.selectedTenantProviderID;
    }
  }

  private getTenantUsernamesList(namePattern: string) {
    this.masked = true;
    this.applicationRestoreService.getTenantUsernamesList(namePattern, this.selectedTenantProviderID.value, this.applicationType)
      .takeUntil(this.subs).subscribe(
        response => {
          this.usernameSearchResult = [];
          this.masked = false;
          if (response['contents'] && response['contents'].length > 0) {
            response['contents'].forEach(element => {
              this.usernameSearchResult.push(JsonConvert.deserializeObject(element, TenantUsernamesModel)
              )
            });
          }
        },
        error => {
          this.errorHandler.handle(error);
        })
  }

  private startSearch(namePattern?: string) {
    this.getTenantUsernamesList(namePattern);
  }

  private onSelectionChange(tenantUsernameModel: Array<object>) {
    this.isTenantUsernameSelected = true;
    this.model.selectedUsername = tenantUsernameModel[0]['name'];
    let target = {
      href: tenantUsernameModel[0]['links']['self']['href'],
      resourceType: 'folder'
    }
    this.model.target = target;
    this.destinationMetadata['user'] = {
      username: this.model.selectedUsername,
      href: tenantUsernameModel[0]['links']['self']['href']
    };
  }

}
