import {JsonObject, JsonProperty} from 'json2typescript/index';
import {BaseModel} from 'shared/models/base.model';

@JsonObject
export class KeyModel extends BaseModel {

  static SSH_KEY_TYPE: string = 'ssh_private_key';

  @JsonProperty('resourceType', String, true)
  public resourceType: string = '';

  @JsonProperty('keytype', String, true)
  public keytype: string = 'iam_key';

  @JsonProperty('keyalgorithm', undefined, true)
  public keyalgorithm: any = undefined;

  @JsonProperty('user', undefined, true)
  public user: any = undefined;

  @JsonProperty('fingerprint', undefined, true)
  public fingerprint: any = undefined;

  @JsonProperty('publickey', undefined, true)
  public publickey: any = undefined;

  @JsonProperty('access', undefined, true)
  public access: any = undefined;

  @JsonProperty('secret', undefined, true)
  public secret: any = undefined;

  @JsonProperty('passphrase', undefined, true)
  public passphrase: any = "";

  @JsonProperty('privatekey', undefined, true)
  public privatekey: any = undefined;

  public isEncrypted: boolean = false;

  getPersistentJson(): object {
    return {
      name: this.name,
      keytype: this.keytype,
      access: this.access,
      secret: this.secret,
      passphrase: this.passphrase
    };
  }

  getSSHJson(editMode: boolean = false): object { 
    return {
      name: this.name,
      user: this.user,
      keytype: editMode ? undefined : KeyModel.SSH_KEY_TYPE,
      privatekey: this.privatekey,
      passphrase: !this.isEncrypted ? null : this.passphrase
    };
  }
}
