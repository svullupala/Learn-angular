import { Component, Input, OnInit } from '@angular/core';
import { SlapoliciesModel } from 'slapolicy/shared/slapolicies.model';
import { SlapolicyService } from 'slapolicy/shared/slapolicy.service';
import { JsonConvert } from 'json2typescript/src/json2typescript/json-convert';
import { SlapolicyModel } from 'slapolicy/shared/slapolicy.model';
import { SelectorService } from 'shared/selector/selector.service';
import { selectorFactory, SelectorType } from 'shared/selector/selector.factory';
import { BaseModel } from 'shared/models/base.model';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { HypervisorBackupService } from 'hypervisor/backup/hypervisor-backup.service';
import { HypervisorAssignPolicyService } from '../hypervisor-assign-policy.service';
import { ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'hypervisor-assign-policy-policies',
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.scss'],
  providers: [
    { provide: SelectorService, useFactory: selectorFactory, deps: [SelectorType] },
    { provide: SelectorType, useValue: SelectorType.SIMPLE }
  ]
})
export class PoliciesComponent implements OnInit {
  @Input() assignPolicyTo: BaseHypervisorModel;
  @Input() hypervisorType: string;

  displayedRecords: SlapolicyModel[] = [];
  masked: boolean = false;
  isSummaryView: boolean = false;
  private records: SlapolicyModel[] = [];
  private errorHandler: ErrorHandlerComponent;
  private textAssignToProtectResourcesInfo: string;
  private textItemsSelected: string;

  constructor(
    private slaPolicyService: SlapolicyService,
    private selector: SelectorService<BaseModel>,
    private hypervisorBackupService: HypervisorBackupService,
    private assignPolicyService: HypervisorAssignPolicyService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
    this.translate
      .get(['inventory.textAssignToProtectResourcesInfo', 'common.textItemsSelected'])
      .subscribe(trans => {
        this.textAssignToProtectResourcesInfo = trans['inventory.textAssignToProtectResourcesInfo'];
        this.textItemsSelected = trans['common.textItemsSelected'];
      });
    this.loadData();
  }

  get formattedTextAssignToProtectResourcesInfo(): string {
    return SharedService.formatString(
      this.textAssignToProtectResourcesInfo,
      this.assignPolicyTo.name
    );
  }

  get formattedTextItemsSelected(): string {
    return SharedService.formatString(this.textItemsSelected, this.selector.count());
  }

  onSelect(item: SlapolicyModel): void {
    if (item.metadata['selected']) {
      this.selector.select(item);
    } else {
      this.selector.deselect(item);
    }
  }

  onResetPolicies(): void {
    this.selector.deselectAll();
    this.initMetadata();
    this.displayedRecords = [...this.records];
  }

  onEditAssignments(): void {
    this.isSummaryView = false;
    this.records = this.records.map(item => {
      item.metadata['disabled'] = false;
      return item;
    });
    this.displayedRecords = [...this.records];
  }

  onAssignPolicies(): void {
    this.masked = true;
    this.hypervisorBackupService
      .applyPolicies(this.hypervisorType, [this.assignPolicyTo], this.selector.selection())
      .subscribe(
        () => {
          this.masked = false;
          this.isSummaryView = true;
          this.displayedRecords = this.displayedRecords
            .filter(item => item.metadata['selected'])
            .map(item => {
              item.metadata['disabled'] = true;
              return item;
            });
          this.onAssignPoliciesSuccess();
        },
        err => {
          this.handleError(err);
          this.masked = false;
        }
      );
  }

  private loadData(): void {
    this.masked = true;
    this.slaPolicyService.getSLAPolicies(undefined, undefined, 0).subscribe(
      data => {
        let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);
        this.records = dataset.records;
        this.initMetadata();
        this.displayedRecords = [...this.records];
        this.masked = false;
      },
      err => {
        this.handleError(err);
        this.masked = false;
      }
    );
  }

  private handleError(err: any): void {
    if (this.errorHandler) {
      this.errorHandler.handle(err);
    }
  }

  private onAssignPoliciesSuccess(): void {
    this.reassignStorageProfiles();
    this.assignPolicyService.emitAssignedPolices(this.assignPolicyTo);
  }

  private reassignStorageProfiles(): void {
    this.assignPolicyTo.storageProfiles = this.records
      .filter(item => item.metadata['selected'])
      .map(item => item.name);
  }

  private initMetadata(): void {
    const assignedPolicies = this.assignPolicyTo.storageProfiles || [];

    this.records = this.records.map(item => {
      item.metadata['selected'] = this.selector.isSelected(item);

      const isPolicyAssigned = !!assignedPolicies.find(name => name === item.name);

      if (isPolicyAssigned) {
        this.selector.select(item);
        item.metadata['selected'] = true;
      }

      return item;
    });
  }
}
