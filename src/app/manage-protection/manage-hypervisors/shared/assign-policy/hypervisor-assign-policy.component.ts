import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { DynamicTabEntry } from 'shared/components';
import { HypervisorAssignPolicySelectedTab } from './hypervisor-assign-policy.interface';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';
import { HypervisorResourcesService } from '../hypervisor-resources.service';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';

@Component({
  selector: 'hypervisor-assign-policy',
  templateUrl: './hypervisor-assign-policy.component.html',
  styleUrls: ['./hypervisor-assign-policy.component.scss']
})
export class HypervisorAssignPolicyComponent implements OnInit {
  @Input() assignPolicyTo: BaseHypervisorModel;
  @Input() hypervisorType: string;
  @Input() runSettingsEditMode: boolean;

  @Output() closeView = new EventEmitter<void>();
  @ViewChild('policyTemp', { read: TemplateRef }) public policyTempRef: TemplateRef<any>;
  @ViewChild('runSettingsTemp', { read: TemplateRef }) public runSettingsTempRef: TemplateRef<any>;

  tabs: DynamicTabEntry[] = [];
  resourcesIconClassname: string;
  resourcesDisplayName$: Observable<string>;
  @Input() selectedTab: HypervisorAssignPolicySelectedTab = 'policy';
  private textPolicy: string;
  private textRunSettings: string;

  constructor(
    private hypervisorResourcesService: HypervisorResourcesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    SharedService.maximizeContent();
    this.translate.get(['inventory.textPolicy', 'inventory.textRunSettings']).subscribe(trans => {
      this.textPolicy = trans['inventory.textPolicy'];
      this.textRunSettings = trans['inventory.textRunSettings'];
    });
    this.tabs = this.prepareTabs();
    this.resourcesIconClassname = this.hypervisorResourcesService.getIconClassname(this.assignPolicyTo);
    this.resourcesDisplayName$ = this.hypervisorResourcesService.getDisplayName(this.assignPolicyTo);
  }

  onClose(): void {
    this.closeView.emit();
  }

  onSelectTab(selectedTab: DynamicTabEntry): void {
    this.selectedTab = selectedTab.key as HypervisorAssignPolicySelectedTab;
  }

  private prepareTabs(): DynamicTabEntry[] {
    return [
      {
        key: 'policy',
        title: this.textPolicy,
        content: this.policyTempRef,
        refresh: false,
        active: this.selectedTab === 'policy'
      },
      {
        key: 'runSettings',
        title: this.textRunSettings,
        content: this.runSettingsTempRef,
        refresh: false,
        active: this.selectedTab === 'runSettings'
      }
    ];
  }
}
