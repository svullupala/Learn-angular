import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { BaseModalComponent } from 'shared/components/base-modal/base-modal.component';
import { DiscoveryInstanceModel } from 'appserver/discovery-instance.model';
import { IdentityUserEnterSelectComponent } from 'identity/shared/identity-user-enter-select';
import { IdentityUserEnterSelectModel } from 'identity/shared/identity-user-enter-select.model';
import { AppCredentialModel } from 'appserver/appserver.model';

@Component({
  selector: 'discovery-table',
  templateUrl: 'discovery-table.component.html'
})

export class DiscoveryTableComponent implements OnInit {
  @ViewChild(BaseModalComponent) modal: BaseModalComponent;
  @ViewChild(IdentityUserEnterSelectComponent) identityComponent: IdentityUserEnterSelectComponent;

  @Input() instances: Array<DiscoveryInstanceModel>;
  @Input() applicationType: string;
  // Use this global variable to keep state of instance index in the array for later use.
  private instanceIndex: number = 0;
  private statusStringMap: Map<string, string>;

  constructor() {}

  ngOnInit() {
    /*
      Here we create a simple map in order to l10n strings
      that come form node. We let the translate pipe do the translation.
      Three statuses that come back is 'stale', 'live' and 'registered'.
      UI can make changes accordingly.
    */
    this.statusStringMap = new Map<string, string>();
    this.statusStringMap.set('stale', 'common.textStale');
    this.statusStringMap.set('live', 'common.textLive');
    this.statusStringMap.set('registered', 'common.textRegistered');
  }

  public reset(): void {
    this.instances = undefined;
    this.instanceIndex = 0;
  }

  public getValue(): Array<any> {
    let retVal: Array<any> = [];

    (this.instances || []).forEach((instance: DiscoveryInstanceModel) => {

      if (instance.isConfigured) {
        retVal.push(instance.getPersistentJson());
      }
    });

    return retVal;
  }

  public setValue(instances: Array<DiscoveryInstanceModel>): Array<DiscoveryInstanceModel> {
    let retVal: Array<DiscoveryInstanceModel> = [],
      discoveryInstance: DiscoveryInstanceModel;

    if (Array.isArray(instances) && instances.length > 0) {
      instances.forEach((instance: DiscoveryInstanceModel) => {
        discoveryInstance = new DiscoveryInstanceModel();
        discoveryInstance.isConfigured = typeof instance.href === 'string' && instance.href && instance.href.length > 0;
        discoveryInstance.name = instance.name;
        discoveryInstance.status = instance.status;
        discoveryInstance.user = new IdentityUserEnterSelectModel();
        discoveryInstance.user.useExisting = discoveryInstance.isConfigured;
        discoveryInstance.user.userHref = instance['href'] || '';
        discoveryInstance.user.user = typeof instance.href === 'string'
          ? (this.identityComponent.getUser(discoveryInstance.user.userHref))
          : undefined;
        retVal.push(discoveryInstance);
      });
    }
    return retVal;
  }

  private onShowModal(instance: DiscoveryInstanceModel, idx: number) {
    this.instanceIndex = idx;
    instance.user = instance.user || new IdentityUserEnterSelectModel();
    if (this.modal) {
      this.modal.show();
    }
    if (this.identityComponent) {
      this.identityComponent.setValue(instance.user);
    }
  }

  private onSave(): void {
    if (this.modal) {
      this.modal.hide();
    }
    if (this.identityComponent) {
      this.instances[this.instanceIndex].user = this.identityComponent.getValue();
      this.instances[this.instanceIndex].isConfigured = true;
    }
  }

  private onRemoveInstance(instance: DiscoveryInstanceModel): void {
    instance.user = new IdentityUserEnterSelectModel();
    instance.isConfigured = false;
  }

  private isIdentityValid(): boolean {
    if (this.identityComponent)
      return this.identityComponent.isValid();
    return false;
  }

  private trackyByFn(isx: number, model: DiscoveryInstanceModel): string {
    return model.name;
  }
}
