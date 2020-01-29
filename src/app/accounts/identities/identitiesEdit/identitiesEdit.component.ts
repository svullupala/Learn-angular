import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs/Subject';
import {ErrorHandlerComponent} from 'shared/components/error-handler/error-handler.component';
import {AlertComponent} from 'shared/components/msgbox/alert.component';
import {SessionService} from 'core';
import {IdentityModel} from '../identity.model';
import {IdentitiesService} from '../identities.service';
import {SdlTooltipDirective} from 'shared/directives/sdl-tooltip/sdl-tooltip.directive';

@Component({
  selector: 'identities-edit',
  templateUrl: './identitiesEdit.component.html'
})

export class IdentitiesEditComponent implements OnInit, OnDestroy {
  @ViewChild('identitiesEditContainer') editContainer: ElementRef;

  @Output() saveClick = new EventEmitter();
  @Output() cancelClick = new EventEmitter();

  public form: FormGroup;
  public name: AbstractControl;
  public username: AbstractControl;
  public password: AbstractControl;
  model: IdentityModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  session = SessionService.getInstance();

  private infoTitle: string;
  private processingRequestMsg: string;
  private textCreateSucceed: string;
  private textEditSucceed: string;
  private textConfirm: string;
  private masked: boolean = false;

  constructor(private identitiesService: IdentitiesService, fb: FormBuilder,
              private translate: TranslateService) {

    // create forms for change password and edit user
    this.form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'username': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'password': ['', Validators.compose([Validators.required, Validators.minLength(1.)])],
    });
    this.name = this.form.controls['name'];
    this.username = this.form.controls['username'];
    this.password = this.form.controls['password'];
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

  reset(): void {
    this.model = new IdentityModel();
    this.form.reset();

  }

  ngOnInit(): void {
    let me = this;

    me.translate.get([
      'common.infoTitle',
      'common.processingRequestMsg',
      'common.textConfirm',
      'identities.textCreationSuccessful',
      'identities.textEditSuccessful',
    ])
      .subscribe((resource: Object) => {
        me.infoTitle = resource['common.infoTitle'];
        me.processingRequestMsg = resource['common.processingRequestMsg'];
        me.textConfirm = resource['common.textConfirm'];
        me.textCreateSucceed = resource['identities.textCreationSuccessful'];
        me.textEditSucceed = resource['identities.textEditSuccessful'];
      });

    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.model = new IdentityModel();
  }

  ngOnDestroy() {
  }

  onAddClick() {
    let me = this;
    if (!me.model.phantom)
      me.reset();
  }

  onCancelClick() {
    this.cancelClick.emit();
    this.reset();
  }

  onSaveClick() {
    let me = this;

    me.mask();
      if (me.model.phantom) {
        me.identitiesService.create(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.info(me.textCreateSucceed);
              me.saveClick.emit();
              me.reset();
            },
            err => {
              me.unmask();
              me.handleError(err, false);
            }
          );
      } else {
        me.identitiesService.edit(me.model)
          .subscribe(
            data => {
              me.unmask();
              me.info(me.textEditSucceed);
              me.saveClick.emit();
              me.reset();
            },
            err => {
              me.unmask();
              me.handleError(err, false);
            }
          );
      }
  }

  startEdit(item: IdentityModel) {
    let me = this, oldId, newId = item ? item.id : undefined;

    if (me.model && !me.model.phantom) {
      oldId = me.model.id;
    }

    me.model = item;
  }

  private isValid(): boolean {
    if (this.model.phantom) {
      return this.form.valid;
    } else {
      return this.model.name.length > 0 && this.model.username.length > 0 && this.model.password &&
        this.model.password.length > 0;
    }
  }
}
