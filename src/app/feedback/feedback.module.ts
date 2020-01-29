import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap';
import { FeedbackComponent } from './feedback.component';
import { TranslationModule } from 'shared';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from './feedback.service';

@NgModule({
  imports: [
    ModalModule.forRoot(),
    FormsModule,
    TranslationModule
  ],
  declarations: [
    FeedbackComponent
  ],
  exports: [
    FeedbackComponent
  ],
  providers: [
    FeedbackService
  ]
})

export class FeedbackModule {}
