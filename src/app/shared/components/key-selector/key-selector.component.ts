import {
  Component, Input, OnInit, EventEmitter, Output
} from '@angular/core';
import {FormGroup, AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {ErrorHandlerComponent} from 'app/shared/components/index';
import {RestService} from 'core';
import {SessionService} from 'core';
import {SorterModel} from 'shared/models/sorter.model';
import { Subject } from 'rxjs/Subject';
import { LinkModel } from 'shared/models/link.model';
import { KeySelectModel } from './key-select.model';
import { KeysModel } from '../../../system-configuration/access-keys/keys.model';
import { KeyModel } from '../../../system-configuration/access-keys/key.model';
import { FilterModel } from 'shared/models/filter.model';

@Component({
  selector: 'key-selector',
  templateUrl: './key-selector.component.html'
})
export class KeySelectorComponent implements OnInit {
  @Output() createdKeyEvent: EventEmitter<KeyModel> = new EventEmitter<KeyModel>();
  @Output() loadedKeyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Input() enableAddKeyBtn: boolean = false;
  @Input() model: KeySelectModel;
  @Input() clsOfLabelCol: string;
  @Input() clsOfFieldCol: string;
  @Input() onlySSHKeys: boolean = false;
  @Input() disabled: boolean = false;
  @Input() useExistingOnly: boolean = false;
  @Input() hideNameField: boolean = false;
  @Input() textAccessKeyLabel: string;
  @Input() textSecretKeyLabel: string;

  private form: FormGroup;
  private name: AbstractControl;
  private access: AbstractControl;
  private secret: AbstractControl;
  private user: AbstractControl;
  private privateKey: AbstractControl;
  private errorHandler: ErrorHandlerComponent;
  private createLink: LinkModel;
  private records: Array<KeyModel>;
  private showPassword: boolean = false;
  private subs: Subject<void> = new Subject<void>();
  private filters: Array<FilterModel> = [];

  constructor(private restService: RestService,
              private translate: TranslateService, private fb: FormBuilder) {}

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    if (me.onlySSHKeys) {
      me.filters.push(new FilterModel('keytype', KeyModel.SSH_KEY_TYPE));
      // create forms for change password and edit user
      this.form = this.fb.group({
        'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
        'user': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
        'privateKey': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
      });
      this.name = this.form.controls['name'];
      this.user = this.form.controls['user'];
      this.privateKey = this.form.controls['privateKey'];
    } else {
      this.form = this.fb.group({
        'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
        'access': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
        'secret': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
      });
      this.name = this.form.controls['name'];
      this.access = this.form.controls['access'];
      this.secret = this.form.controls['secret'];
    }
    if (!me.model)
      me.model = new KeySelectModel();

    me.model.proxy = me.restService;
    me.model.useExisting = me.useExistingOnly;
    me.model.sshKey = me.onlySSHKeys;
    me.loadKeys();
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  loadKeys(): void {
    let me = this, observable: Observable<KeysModel>,
      sorters = [
        new SorterModel('name', 'ASC')
      ];
    observable = KeysModel.retrieve<KeyModel, KeysModel>(KeysModel, me.restService,
      me.filters, sorters, 0, RestService.pageSize);

    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        dataset => {
          me.records = dataset.records;
          me.createLink = new LinkModel();
          me.createLink.href = dataset.getUrl('create');
          me.createLink.rel = 'create';

          if (me.model.keyHref) {
            this.setValue(me.model.keyHref);
          }
          me.loadedKeyEvent.emit();
        },
        err => me.handleError(err)
      );
    }
  }

  createKey(): void {
    let me = this, observable: Observable<KeyModel>;

    if (!me.model.useExisting) {
      observable = KeysModel.create<KeyModel>(KeyModel, me.model, me.createLink, me.restService);
    }
    if (observable) {
      observable.takeUntil(me.subs).subscribe(
        key => {
          me.createdKeyEvent.emit(key);
          me.model.reset();
          setTimeout(() => {
            me.model.key = key;
            me.model.keyHref = key.url;
            me.model.useExisting = true;
          }, 100);
          me.loadKeys();
        },
        err => me.handleError(err)
      );
    }
  }

  reset(): void {
    if (this.onlySSHKeys) {
      this.user.reset();
      this.privateKey.reset();
    } else {
      this.name.reset();
      this.access.reset();
      this.secret.reset();
    }
    this.model = new KeySelectModel();
    this.model.sshKey = this.onlySSHKeys;
  }

  /**
   * Returns the model indicates the key's setting.
   * @returns {KeySelectModel}
   */
  getValue(): KeySelectModel {
    return this.model;
  }

  setValue(href: string): void {
    this.model.useExisting = true;
    this.model.keyHref = href;
    this.model.key = (this.records || []).find((key: KeyModel) => { return href === key.url; });
    this.model.sshKey = this.onlySSHKeys;
  }

  getKey(href: string): KeyModel {
    return (this.records || []).find((key: KeyModel) => { return href === key.url; });
  }

  /**
   * Returns true if the setting is valid.
   * @returns {boolean}
   */
  isValid(): boolean {
    let me = this, model = me.model;
    if (me.onlySSHKeys) {
      return model && (model.useExisting && model.keyHref && model.keyHref.length > 0 ||
        !model.useExisting && ((model.name && model.name.length > 0 || this.hideNameField)
          && model.user && model.user.length > 0
          && model.privatekey && model.privatekey.length > 0
        ));
    }
    return model && (model.useExisting && model.keyHref && model.keyHref.length > 0 ||
      !model.useExisting && ((model.name && model.name.length > 0 || this.hideNameField)
        && model.access && model.access.length > 0
        && model.secret && model.secret.length > 0
      ));
  }

  private onSelectKey(): void {
    this.model.keyHref = this.model.key.url;
  }

  private togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}


