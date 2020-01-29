import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Apps16Module} from '@carbon/icons-angular/lib/apps/16';
import {Building16Module} from '@carbon/icons-angular/lib/building/16';
import {DataBase16Module} from '@carbon/icons-angular/lib/data--base/16';
import {DataVis_216Module} from '@carbon/icons-angular/lib/data-vis--2/16';
import {Folder16Module} from '@carbon/icons-angular/lib/folder/16';
import {Screen16Module} from '@carbon/icons-angular/lib/screen/16';
import {TagGroup16Module} from '@carbon/icons-angular/lib/tag--group/16';
import {Tag16Module} from '@carbon/icons-angular/lib/tag/16';
import {HypervisorIconComponent} from './hypervisor-icon.component';

@NgModule({
  imports: [
    CommonModule,
    Apps16Module,
    Building16Module,
    DataBase16Module,
    DataVis_216Module,
    Folder16Module,
    Screen16Module,
    TagGroup16Module,
    Tag16Module
  ],
  declarations: [
    HypervisorIconComponent
  ],
  exports: [HypervisorIconComponent]
})
export class HypervisorIconModule {
}
