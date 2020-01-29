import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap';
import { QuickStartComponent } from './quickstart.component';
import { TranslationModule } from 'shared';
import { FormsModule } from '@angular/forms';
import { QuickStartService } from './quickstart.service';
import {SharedModule} from 'shared/shared.module';

@NgModule({
  imports: [
    ModalModule.forRoot(),
    FormsModule,
    TranslationModule,
    SharedModule
  ],
  declarations: [
    QuickStartComponent,
  ],
  exports: [
    QuickStartComponent,
  ],
  providers: [
    QuickStartService
  ]
})

export class QuickStartModule {}
