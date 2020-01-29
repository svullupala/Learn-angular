import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { LdapGroupModel } from 'ldapsmtp/ldapGroup.model';
import { BaseModel } from 'shared/models/base.model';
import { applyMixins } from 'rxjs/util/applyMixins';
import { Selectable } from 'shared/util/selectable';
import { HighlightableList } from 'shared/util/keyboard';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'ldap-list-table',
    templateUrl: './ldap-table.component.html',
    styleUrls: ['./ldap-table.component.scss'],
})
export class LdapTableComponent extends HighlightableList implements OnInit, Selectable {

    private ldapList: Array<LdapGroupModel>;
    @Input() set ldapGroupList(value: Array<LdapGroupModel>) { this.ldapList = value; }
    @Input() masked: boolean;
    @Output() selectionChange = new EventEmitter();

    selectedItems: Array<LdapGroupModel> = [];
    isSelected: (item: BaseModel, singleSelect: boolean) => false;
    toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent, singleSelect: boolean) => void;

    private textLdapList: string;
    private textClickViewAllLdapList: string;
    constructor(private translate: TranslateService) {
        super();
    }

    ngOnInit() {
        let me = this;
        me.translate.get([
            'ldap-smtp.textClickViewAllLdapList',
            'ldap-smtp.textLdapList',
        ]).subscribe((resource: Object) => {
            me.textClickViewAllLdapList = resource['ldap-smtp.textClickViewAllLdapList'];
            me.textLdapList = resource['ldap-smtp.textLdapList'];
        });
    }

}

applyMixins(LdapTableComponent, [Selectable]);
