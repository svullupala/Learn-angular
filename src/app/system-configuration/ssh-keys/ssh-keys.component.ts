import { Component, ViewChild } from '@angular/core';
import { SshKeysTableComponent } from './ssh-keys-table/ssh-keys-table.component';
import { SshKeysEditComponent } from './ssh-keys-edit/ssh-keys-edit.component';
import { AccessKeysComponent } from '../access-keys/access-keys.component';

@Component({
  selector: 'ssh-keys',
  templateUrl: './ssh-keys.component.html',
})
export class SshKeysComponent extends AccessKeysComponent {
  @ViewChild(SshKeysTableComponent) keysTable: SshKeysTableComponent;
  @ViewChild(SshKeysEditComponent) keysEdit: SshKeysEditComponent;
}
