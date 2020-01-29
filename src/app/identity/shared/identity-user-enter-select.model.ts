import { IdentityUserModel } from './identity-user.model';
import {KeySelectModel} from 'shared/components/key-selector/key-select.model';

export class IdentityUserEnterSelectModel {
  useExisting: boolean = false;
  useSsh: boolean = false;
  name: string = '';
  username: string = '';
  password: string = '';
  userHref: string = '';
  public user: IdentityUserModel;
  public sshKey = new KeySelectModel();

  reset(): void {
    this.useExisting = false;
    this.useSsh = false;
    this.username = '';
    this.password = '';
    this.userHref = '';
    this.name = '';
    this.user = undefined;
    this.sshKey = new KeySelectModel();
  }
}
