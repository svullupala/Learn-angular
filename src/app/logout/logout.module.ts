import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';

import { LogoutComponent } from './logout.component';
import { routing }       from './logout.routing';

@NgModule({
  imports: [
    CommonModule,
    routing
  ],
  declarations: [
    LogoutComponent
  ],
  exports: [LogoutComponent]
})
export class LogoutModule {}
