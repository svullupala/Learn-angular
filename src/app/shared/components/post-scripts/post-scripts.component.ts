import {
  Component, OnInit, ViewChild, Input, EventEmitter, Output, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PostScriptsModalComponent } from './post-scripts-modal/post-scripts-modal.component';
import { SlapolicyModel } from 'slapolicy/shared/slapolicy.model';
import { SlapolicyService } from 'slapolicy/shared/slapolicy.service';
import { SessionService } from 'core';
import { ErrorHandlerComponent } from '../error-handler/error-handler.component';
import {JsonConvert} from 'json2typescript';
import {Subject} from 'rxjs/Subject';
import {PostScriptsModel} from './post-scripts.model';
import {PolicyOptionsModel} from './policy-options.model';

@Component({
  selector: 'post-scripts-component',
  styleUrls: ['./post-scripts.component.scss'],
  templateUrl: './post-scripts.component.html'
})

export class PostScriptsComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild(PostScriptsModalComponent) scriptsModal: PostScriptsModalComponent;
  @Output() applyScriptsEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() showModal = new EventEmitter();
  @Output() hideModal = new EventEmitter();
  @Input() slaPolicy: SlapolicyModel;
  @Input() policyOptions: PolicyOptionsModel;
  @Input() subtype: string;
  @Input() showOptions: boolean = false;
  @Input() autoLoad: boolean = false;
  @Input() disableButton: boolean = true;
  @Input() isScriptServerOnly: boolean = false;

  private subs: Subject<void> = new Subject<void>();
  private scriptsConfigured: boolean = false;
  private errorHandler: ErrorHandlerComponent;

  constructor(private translate: TranslateService, private policyService: SlapolicyService) {
  }

  ngOnInit() {
    this.onPolicyOptionsChanges();
    this.errorHandler = SessionService.getInstance().context['errorHandler'];
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let me = this;
    // Detect the slaPolicy & policyOptions changes.
    if (changes && (changes['slaPolicy'] || changes['policyOptions'])) {
      me.onPolicyOptionsChanges();
    }
  }

  onPostScriptsModalShow(): void {
    this.showModal.emit();
  }

  onPostScriptsModalHide(): void {
    this.hideModal.emit();
  }

  private onPolicyOptionsChanges(): void {
    if (this.slaPolicy.script && this.policyOptions) {
      this.slaPolicy.script.policyOption = JsonConvert.deserializeObject(this.policyOptions, PolicyOptionsModel);
      this.scriptsConfigured = this.slaPolicy.script.isOptionsConfigured ||
        this.slaPolicy.script.isPostguestConfigured ||
        this.slaPolicy.script.isPreguestConfigured;
    }
  }

  private onShowScripts(): void {
    if (this.scriptsModal) {
      this.scriptsModal.show();
    }
  }

  private applyScripts(scriptModel: PostScriptsModel): void {
    let observable = this.policyService.applyScripts(this.slaPolicy, scriptModel, this.subtype, this.showOptions);
    if (observable) {
      this.scriptsModal.showMask();
      observable.takeUntil(this.subs).subscribe(
        () => {
          this.scriptsModal.hideMask();
          this.scriptsModal.hide();
          this.applyScriptsEvent.emit();
          this.scriptsConfigured = scriptModel.isOptionsConfigured ||
            scriptModel.enablePostGuest ||
            scriptModel.enablePreGuest;
        },
        err => {
          this.scriptsModal.hideMask();
          this.handleError(err, true);
        }
      );
    }
  }

  private handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }
}
