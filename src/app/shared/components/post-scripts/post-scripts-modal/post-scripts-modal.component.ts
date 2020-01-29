import {
  ViewChild, Component, EventEmitter, Input, Output, AfterViewInit, OnInit, OnChanges,
  SimpleChanges
} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { PostScriptsSelectorComponent } from '../post-scripts-selector/post-scripts-selector.component';
import { PostScriptsModel } from '../post-scripts.model';

@Component({
  selector: 'post-scripts-modal',
  templateUrl: './post-scripts-modal.component.html',
  styleUrls: ['./post-scripts-modal.component.scss']
})
export class PostScriptsModalComponent implements OnInit, OnChanges {
  @ViewChild('scriptModal') scriptModal: ModalDirective;
  @ViewChild(PostScriptsSelectorComponent) postScriptsSelectorComponent: PostScriptsSelectorComponent;

  @Input() autoLoad: boolean = false;
  @Input() script: PostScriptsModel;
  @Input() subtype: string;
  @Input() showOptions: boolean = false;
  @Input() showInventoryBackupOption = true;
  @Input() showInventoryTimeoutOption = false;
  @Input() isScriptServerOnly: boolean = false;

  @Output('show') showEvent = new EventEmitter();
  @Output('hide') hideEvent = new EventEmitter();
  @Output('save') saveEvent = new EventEmitter<PostScriptsModel>();

  public mask: boolean = false;
  private loadCount: number = 0;

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    // Detect the script change.
    if (changes && changes['script']) {
      me.onScriptChange();
    }
  }

  public show(): void {
    if (this.loadCount === 0 && this.autoLoad === false && this.postScriptsSelectorComponent) {
      this.postScriptsSelectorComponent.getAppservers();
      this.postScriptsSelectorComponent.getScripts();
      this.loadCount = 1;
    }
    this.scriptModal.show();
    this.showEvent.emit();
  }

  public hide(): void {
    this.scriptModal.hide();
    this.hideEvent.emit();
  }

  public showMask(): void {
    this.mask = true;
  }

  public hideMask(): void {
    this.mask = false;
  }

  private save(): void {
    this.saveEvent.emit(this.postScriptsSelectorComponent.getModel());
  }

  private isValid(): boolean {
    return this.postScriptsSelectorComponent && this.postScriptsSelectorComponent.isValid();
  }

  private onScriptChange(): void {
    if (this.postScriptsSelectorComponent) {
      this.postScriptsSelectorComponent.setModel(this.script, false);
    }
  }
}
