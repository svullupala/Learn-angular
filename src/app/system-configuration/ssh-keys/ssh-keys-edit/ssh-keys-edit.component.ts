import { Component, OnDestroy, Input } from '@angular/core';
import { KeysEditComponent } from '../../access-keys/keysEdit/keysEdit.component';
import { TranslateService } from '@ngx-translate/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AccessKeysService } from '../../access-keys/access-keys.service';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'ssh-keys-edit',
  templateUrl: './ssh-keys-edit.component.html'
})

export class SshKeysEditComponent extends KeysEditComponent implements OnDestroy {
  @Input() clsOfLabelCol: string;
  @Input() clsOfFieldCol: string;
  private user: AbstractControl;
  private privateKey: AbstractControl;
  private passphrase: AbstractControl;
  private subs: Subject<void> = new Subject<void>();

  constructor(accessKeysService: AccessKeysService, fb: FormBuilder, translate: TranslateService) {
   super(accessKeysService, fb, translate);
    // create forms for change password and edit user
    this.form = fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'user': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'privateKey': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'passphrase': ['', Validators.compose([])]
    });
    this.name = this.form.controls['name'];
    this.user = this.form.controls['user'];
    this.privateKey = this.form.controls['privateKey'];
    this.passphrase = this.form.controls['passphrase'];
  }

  ngOnDestroy(): void {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  // @override
  onSaveClick() {
    let me = this,
        observable: Observable<object>,
        infoMsg: string;

    if (me.model.phantom) {
      infoMsg = me.textCreateSucceed;
      observable = me.accessKeysService.create(me.model, me.model.getSSHJson());
    } else {
      infoMsg = me.textEditSucceed;
      observable = me.accessKeysService.update(me.model, me.model.getSSHJson(true));
    }
    if (observable) {
      me.mask();
      observable.takeUntil(me.subs).subscribe(
        data => {
          me.unmask();
          me.info(infoMsg);
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
}
