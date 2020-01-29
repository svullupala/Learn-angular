import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MomentModule} from 'angular2-moment';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';

import {TranslationModule} from 'shared/index';
import {SharedModule} from 'shared';
import {NgaModule} from 'theme/nga.module';
import {StorageManageService} from './storage-manage.service';
import {IdentitySharedModule} from 'identity/shared/identity-shared.module';
import {PartnerManageComponent} from '../disk-manage/partner-manage/partner-manage.component';
import {DiskTableComponent} from 'diskstorage/disk-table/disk-table.component';
import {DiskEditComponent} from 'diskstorage/disk-edit/disk-edit.component';
import {DiskManageComponent} from 'diskstorage/disk-manage/disk-manage.component';
import { RefreshButtonModule } from 'shared/components/refresh-button/refresh-button.module';
import { ActiveDirectoryComponent } from 'diskstorage/disk-manage/active-directory/active-directory.component'
import { vSnapPreferencesComponent } from "diskstorage/disk-manage/vsnap-preferences/vsnap-preferences.component";
import { vSnapPreferencesService } from 'diskstorage/disk-manage/vsnap-preferences/vsnap-preferences.service';
import {NetworkManageComponent} from 'diskstorage/disk-manage/network-manage/network-manage.component';

@NgModule({
  imports: [
    NgaModule,
    TranslationModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDropdownModule,
    ModalModule.forRoot(),
    MomentModule,
    SharedModule,
    RefreshButtonModule,
    IdentitySharedModule,
    TooltipModule
  ],
  declarations: [
    PartnerManageComponent,
    NetworkManageComponent,
    DiskTableComponent,
    DiskEditComponent,
    DiskManageComponent,
    ActiveDirectoryComponent,
    vSnapPreferencesComponent
  ],
  providers: [
    StorageManageService,
    vSnapPreferencesService
  ],
  exports: [
    PartnerManageComponent,
    NetworkManageComponent,
    DiskTableComponent,
    DiskEditComponent,
    DiskManageComponent,
    ActiveDirectoryComponent,
    vSnapPreferencesComponent
  ]
})
export class StorageSharedModule {
}
