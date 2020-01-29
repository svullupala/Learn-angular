import {Component, TemplateRef, ViewChild} from '@angular/core';
import { DynamicTabEntry } from 'shared/components';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'keys-and-certificates',
  templateUrl: './keys-and-certificates.component.html'
})
export class KeysAndCertificatesComponent {

  @ViewChild('keysAndCertificatesAccessKeys', { read: TemplateRef })
    keysAndCertificatesAccessKeysTemplateRef: TemplateRef<any>;
  @ViewChild('keysAndCertificatesSshKeys', { read: TemplateRef })
    keysAndCertificatesSshKeysTemplateRef: TemplateRef<any>;
  @ViewChild('keysAndCertificatesCertificates', { read: TemplateRef })
    keysAndCertificatesCertificatesTemplateRef: TemplateRef<any>;

  private tabs: DynamicTabEntry[];
  private textAccessKeys: string = 'Access Keys';
  private textSshKeys: string = 'SSH Keys';
  private textCertificates: string = 'Certificates';

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    let me = this;
    me.initTabs();

    me.translate.get([
      'accesskeys.textAccessKeys',
      'key.textSshKeys',
      'certificates.textCertificates'])
      .subscribe((resource: Object) => {
        me.textAccessKeys = resource['accesskeys.textAccessKeys'];
        me.textSshKeys = resource['key.textSshKeys'];
        me.textCertificates = resource['certificates.textCertificates'];
        me.initTabs();
      });
  }

  private  initTabs() {
    this.tabs = [
      {
        key: 'keysAndCertificatesAccessKeys',
        title: this.textAccessKeys,
        content: this.keysAndCertificatesAccessKeysTemplateRef,
        refresh: false,
        active: true
      },
      {
        key: 'keysAndCertificatesSshKeys',
        title: this.textSshKeys,
        content: this.keysAndCertificatesSshKeysTemplateRef,
        refresh: false,
        active: false
      },
      {
        key: 'keysAndCertificatesCertificates',
        title: this.textCertificates,
        content: this.keysAndCertificatesCertificatesTemplateRef,
        refresh: false,
        active: false
      }
    ];
  }
}
