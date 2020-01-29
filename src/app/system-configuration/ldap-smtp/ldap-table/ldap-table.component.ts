import {Component, Input, Output, EventEmitter} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {LdapsModel} from '../ldaps.model';
import {LdapModel} from '../ldap.model';

@Component({
  selector: 'ldap-table',
  templateUrl: './ldap-table.component.html'

})
export class LdapTableComponent {
  @Input() ldapEntries: LdapsModel = undefined;
  @Output() onUnregister = new EventEmitter() ;
  @Output() onEdit = new EventEmitter();
  private ldap: LdapModel = new LdapModel;

  constructor() {}

  getRecords(): void {
    let ldapServers = this.ldapEntries.ldapServers;
    this.ldap = ldapServers.length > 0 ? JsonConvert.deserializeObject(ldapServers[0], LdapModel) : new LdapModel;
  }

  isRecords(): boolean {
    if (this.ldapEntries === undefined) {
      return false;
    }
    this.getRecords();
    return true;
  }

  unregister(item: LdapModel) {
    this.onUnregister.emit(item);
  }

  edit(item: LdapModel) {
    this.onEdit.emit(item);
  }

}
