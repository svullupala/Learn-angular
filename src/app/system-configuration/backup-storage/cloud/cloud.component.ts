import { Component, ViewChild } from '@angular/core';
import { CloudTableComponent } from './cloud-table/cloud-table.component';
import { CloudRegistrationComponent } from 'cloud/cloud-registration/cloud-registration.component';
import { CloudModel } from 'cloud/cloud.model';
import {RefreshSameUrl} from 'shared/util/refresh-same-url';
import {GlobalState} from '../../../global.state';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'cloud-component',
  templateUrl: 'cloud.component.html'
})

export class CloudComponent extends RefreshSameUrl {
  @ViewChild(CloudTableComponent) cloudTable: CloudTableComponent;
  @ViewChild(CloudRegistrationComponent) cloudRegistration: CloudRegistrationComponent;

  private addCloud: boolean = false;
  private editMode: boolean = false;

  constructor(protected globalState: GlobalState,
              protected route: ActivatedRoute) {
    super(globalState, route);
  }

  protected onRefreshSameUrl(): void {
    this.onCancelClick();
  }

  private canCreate(): boolean {
    if (this.cloudTable) { return this.cloudTable.canCreateCloud(); }
  }

  private onSuccessfulRegister(): void {
    if (this.cloudTable) { this.cloudTable.getClouds(); }
    this.addCloud = false;
    this.editMode = false;
  }

  private canRegister(): boolean {
    return this.cloudRegistration && this.cloudRegistration.canRegister();
  }

  private onRegisterCloudProvider(): void {
    if (this.cloudRegistration)
      this.cloudRegistration.onRegisterCloudProvider();
  }

  private onAddCloudClick(): void {
    this.addCloud = true;
    if (this.cloudRegistration)
      this.cloudRegistration.newRegistration();
  }

  private onCancelClick(): void {
    this.addCloud = false;
    this.editMode = false;
    if (this.cloudRegistration) {
      this.cloudRegistration.reset();
    }
  }

  private onEditCloudClick(cloud: CloudModel): void {
    this.addCloud = true;
    this.editMode = true;
    if (this.cloudRegistration)
      this.cloudRegistration.setCloud(cloud);
  }
}
