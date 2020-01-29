import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {LoaderBasicComponent} from './loader-basic/loader-basic.component';
export {LoaderBasicComponent} from './loader-basic/loader-basic.component';

@NgModule({
  imports: [ CommonModule ],
  declarations: [ LoaderBasicComponent ],
  exports: [ LoaderBasicComponent ]
})
export class LoaderModule {}

