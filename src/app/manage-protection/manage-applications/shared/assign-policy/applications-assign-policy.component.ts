import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { DynamicTabEntry } from 'shared/components';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'shared/shared.service';
import { ApplicationsAssignPolicySelectedTab } from './applications-assign-policy.interface';
import { BaseApplicationModel } from 'applications/shared/base-application-model.model';
import { NvPairModel } from 'shared/models/nvpair.model';

@Component({
  selector: 'applications-assign-policy',
  templateUrl: './applications-assign-policy.component.html',
  styleUrls: ['./applications-assign-policy.component.scss']
})
export class ApplicationsAssignPolicyComponent implements OnInit {
  @Input() assignPolicyTo: BaseApplicationModel;
  @Input() applicationType: string;
  @Input() view: NvPairModel;
  @Input() runSettingsEditMode: boolean;
  @Output() closeView = new EventEmitter<void>();
  @ViewChild('policyTemp', { read: TemplateRef }) public policyTempRef: TemplateRef<any>;
  @ViewChild('runSettingsTemp', { read: TemplateRef }) public runSettingsTempRef: TemplateRef<any>;

  tabs: DynamicTabEntry[] = [];
  resourcesIconClassname: string;
  resourcesDisplayName$: Observable<string>;
  @Input() selectedTab: ApplicationsAssignPolicySelectedTab = 'policy';
  private textPolicy: string;
  private textRunSettings: string;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    SharedService.maximizeContent();
    this.translate.get(['inventory.textPolicy', 'inventory.textRunSettings']).subscribe(trans => {
      this.textPolicy = trans['inventory.textPolicy'];
      this.textRunSettings = trans['inventory.textRunSettings'];
    });
    this.tabs = this.prepareTabs();
    this.resourcesIconClassname = this.assignPolicyTo.icon;
    this.resourcesDisplayName$ = this.translate.get(
      `application.resources.${this.assignPolicyTo.resourcesNameTransKey}`
    );
  }

  onClose(): void {
    this.closeView.emit();
  }

  onSelectTab(selectedTab: DynamicTabEntry): void {
    this.selectedTab = selectedTab.key as ApplicationsAssignPolicySelectedTab;
  }

  private prepareTabs(): DynamicTabEntry[] {
    const tabs: DynamicTabEntry[] = [
      {
        key: 'policy',
        title: this.textPolicy,
        content: this.policyTempRef,
        refresh: false,
        active: this.selectedTab === 'policy'
      }
    ];

    if (this.applicationType !== 'office365') {
      tabs.push({
        key: 'runSettings',
        title: this.textRunSettings,
        content: this.runSettingsTempRef,
        refresh: false,
        active: this.selectedTab === 'runSettings'
      });
    }

    return tabs;
  }
}
