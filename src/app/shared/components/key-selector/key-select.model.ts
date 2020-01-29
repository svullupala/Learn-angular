import { HasProxyAndPersistentJson } from 'core';
import { KeyModel } from '../../../system-configuration/access-keys/key.model';

export class KeySelectModel implements HasProxyAndPersistentJson {
  public useExisting: boolean = false;
  public name: string = '';
  public access: string = '';
  public secret: string = '';
  public user: string = '';
  public privatekey: string = '';
  public keyHref: string = '';
  public key: KeyModel;
  public proxy;
  public sshKey: boolean = false;

  reset(): void {
    this.useExisting = false;
    this.name = '';
    this.access = '';
    this.secret = '';
    this.keyHref = '';
    this.user = '';
    this.privatekey = '';
  }

  getPersistentJson(): object {
    if (this.sshKey) {
      return {
        name: typeof this.name === 'string' ? this.name.trim() : '',
        keytype: KeyModel.SSH_KEY_TYPE,
        user: typeof this.access === 'string' ? this.access.trim() : '',
        privatekey: typeof this.secret === 'string' ? this.secret.trim() : ''
      };
    }
    return {
      name: typeof this.name === 'string' ? this.name.trim() : '',
      keytype: 'iam_key',
      access: typeof this.access === 'string' ? this.access.trim() : '',
      secret: typeof this.secret === 'string' ? this.secret.trim() : ''
    };
  }
}
