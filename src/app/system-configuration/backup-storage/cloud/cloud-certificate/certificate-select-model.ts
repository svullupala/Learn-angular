import { HasPersistentJson } from 'core';

export class CertificateSelectModel implements HasPersistentJson {
  public method: string = 'upload';
  public name: string = '';
  public type: string = '';
  public certificate: string;
  public certificateString: string;
  public certificateName: string;
  public certificateType: string;

  public getPersistentJson(): object {
    return {
      crt: typeof this.certificateString === 'string' ? this.certificateString.trim() : '',
      name: typeof this.certificateName === 'string' ? this.certificateName.trim() : '',
      type: typeof this.certificateType === 'string' ? this.certificateType.trim() : ''
    };
  }
}
