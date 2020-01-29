import { NgModule }      from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule }  from '@angular/common';
import { NgaModule } from 'theme/nga.module';
import { SharedModule, TranslationModule } from 'shared';
import { routing } from './whatsnew.routing';
import { WhatsNewComponent } from './whatsnew.component';
import { Version_10_1_4Component } from './versions/version-10-1-4.component';
import { Version_10_1_5Component } from './versions/version-10-1-5.component';
import { Version_10_1_6Component } from './versions/version-10-1-6.component';

@NgModule({
  imports: [
    CommonModule,
    NgaModule,
    SharedModule,
    TranslationModule,
    FormsModule,
    routing
  ],
  entryComponents: [
    Version_10_1_4Component, 
    Version_10_1_5Component,
    Version_10_1_6Component
  ],
  declarations: [
    WhatsNewComponent,
    Version_10_1_4Component,
    Version_10_1_5Component,
    Version_10_1_6Component
  ]
})
export class WhatsNewModule {}

