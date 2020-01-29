import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Building16Module} from '@carbon/icons-angular/lib/building/16';
import {DataBase16Module} from '@carbon/icons-angular/lib/data--base/16';
import {Folder16Module} from '@carbon/icons-angular/lib/folder/16';
import {ApplicationIconComponent} from './application-icon.component';
import {Calendar16Module} from '@carbon/icons-angular/lib/calendar/16';
import {Email16Module} from '@carbon/icons-angular/lib/email/16';
import {Upload16Module} from '@carbon/icons-angular/lib/upload/16';
import {User16Module} from '@carbon/icons-angular/lib/user/16';
import {UserProfile16Module} from '@carbon/icons-angular/lib/user--profile/16';

@NgModule({
  imports: [
    CommonModule,
    Building16Module,
    Calendar16Module,
    DataBase16Module,
    Email16Module,
    Folder16Module,
    Upload16Module,
    User16Module,
    UserProfile16Module
  ],
  declarations: [
    ApplicationIconComponent
  ],
  exports: [ApplicationIconComponent]
})
export class ApplicationIconModule {
}
