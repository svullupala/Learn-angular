import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {RefreshButtonBasicComponent} from './refresh-button-basic/refresh-button-basic.component';
export {RefreshButtonBasicComponent} from './refresh-button-basic/refresh-button-basic.component';

@NgModule({
  imports: [ CommonModule ] ,
  declarations: [ RefreshButtonBasicComponent ],
  exports: [ RefreshButtonBasicComponent ]
})
export class RefreshButtonModule {}
