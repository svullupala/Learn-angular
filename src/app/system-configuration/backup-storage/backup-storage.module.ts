import {NgModule} from '@angular/core';
import {routing} from './backup-storage.routing';
import {BackupStorageComponent} from './backup-storage.component';
import {DiskStorageModule} from './disk-storage/disk-storage.module';
import { CloudModule } from './cloud/cloud.module';
import { RepositoryServerModule } from './repository-server/repository-server.module';
import { SharedModule } from 'shared/shared.module';

@NgModule({
  imports: [
    routing,
    DiskStorageModule,
    RepositoryServerModule,
    CloudModule,
    SharedModule
  ],
  declarations: [
    BackupStorageComponent
  ],
  providers: [
  ],
  exports: [
  ]
})

export class BackupStorageModule {
}
