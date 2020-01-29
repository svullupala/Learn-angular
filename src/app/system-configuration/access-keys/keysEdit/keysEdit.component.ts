import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
import { ErrorHandlerComponent } from 'shared/components/error-handler/error-handler.component';
import { AlertComponent } from 'shared/components/msgbox/alert.component';
import { SessionService } from 'core';
import { AccessKeysService } from '../access-keys.service';
import { KeyModel } from '../key.model';
import { SdlTooltipDirective } from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';

@Component({
  selector: 'keys-edit',
  templateUrl: './keysEdit.component.html'
})

export class KeysEditComponent implements OnInit, OnDestroy {
  @ViewChild('keysEditContainer') editContainer: ElementRef;

  @Output() saveClick = new EventEmitter();
  @Output() cancelClick = new EventEmitter();
  @Input() disableAddKeys: boolean = false;

  public form: FormGroup;
  public name: AbstractControl;
  public accessKey: AbstractControl;
  public secretKey: AbstractControl;
  protected textCreateSucceed: string;
  protected textEditSucceed: string;
  model: KeyModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();

  private infoTitle: string;
  private processingRequestMsg: string;
  private textConfirm: string;
  private collapseSub: Subject<boolean> = new Subject<boolean>();
  private masked: boolean = false;
  private showPassword: boolean = false;

  constructor(protected accessKeysService: AccessKeysService, fb: FormBuilder,
    private translate: TranslateService) {

    // create forms for change password and edit user
    this.form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'accessKey': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'secretKey': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
    this.name = this.form.controls['name'];
    this.accessKey = this.form.controls['accessKey'];
    this.secretKey = this.form.controls['secretKey'];
  }

  public collapseRegistrationForm(collapsed: boolean): void {
    this.collapseSub.next(collapsed);
  }

  mask() {
    this.masked = true;
  }

  unmask() {
    this.masked = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) {
      me.alert.show(title || me.infoTitle, message);
    }
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  reset(collapse?: boolean): void {
    this.model = new KeyModel();
    this.form.reset();
    if (collapse)
      this.collapseRegistrationForm(true);
  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'accesskeys.textCreationSuccessful',
      'accesskeys.textEditSuccessful',
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['accesskeys.textCreationSuccessful'];
        me.textEditSucceed = resource['accesskeys.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new KeyModel();
  }

  ngOnDestroy() {
    this.collapseSub.unsubscribe();
  }

  onAddClick() {
    let me = this;
    if (!me.model.phantom)
      me.reset();
  }

  onCancelClick() {
    let me = this;
    me.reset();
    me.cancelClick.emit();
  }

  onSaveClick() {
    let me = this;

    me.mask();
    if (me.model.phantom) {
      me.accessKeysService.create(me.model)
        .subscribe(
          data => {
            me.unmask();
            me.info(me.textCreateSucceed);
            me.saveClick.emit();
            me.reset(true);
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
    } else {
      let model = me.model;
      model.keytype = undefined;
      me.accessKeysService.update(model)
        .subscribe(
          data => {
            me.unmask();
            me.info(me.textEditSucceed);
            me.saveClick.emit();
            me.reset(true);
          },
          err => {
            me.unmask();
            me.handleError(err, false);
          }
        );
    }
  }

  startEdit(item: KeyModel) {
    let me = this;
    me.model = item;
    me.collapseRegistrationForm(false);
  }

  private isValid(): boolean {
    if (this.model.isEncrypted && (!this.model || !this.model.passphrase || this.model.passphrase.length === 0
      || this.model.passphrase === undefined)) {
      return false;
    }
    if (this.model.phantom) {
      return this.form.valid;
    }
    return this.model.name.length > 0;
  }

  private togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
