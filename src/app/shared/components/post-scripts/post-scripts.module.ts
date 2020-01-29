import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { ModalModule } from 'ngx-bootstrap';
import { TranslationModule } from '../../translation.module';
import { PostScriptsComponent } from './post-scripts.component';
import { PostScriptsSelectorComponent } from './post-scripts-selector/post-scripts-selector.component';
import { FormsModule } from '@angular/forms';
import { PostScriptsModalComponent } from './post-scripts-modal/post-scripts-modal.component';
import { ScriptsSelectorComponent } from "./post-scripts-selector/scripts-selector.component";
import { ServerSelectorComponent } from "./post-scripts-selector/server-selector.component";

@NgModule({
  declarations: [
    PostScriptsComponent,
    PostScriptsSelectorComponent,
    PostScriptsModalComponent,
    ScriptsSelectorComponent,
    ServerSelectorComponent
  ],
  imports: [
    CommonModule,
    ModalModule,
    FormsModule,
    TranslationModule
  ],
  exports: [
    PostScriptsComponent,
    PostScriptsSelectorComponent,
    PostScriptsModalComponent
  ],
  providers: [
  ]
})
export class PostScriptsModule {
}
