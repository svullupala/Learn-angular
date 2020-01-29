import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BaseModel } from 'shared/models/base.model';
import { applyMixins } from 'rxjs/util/applyMixins';
import { Selectable } from 'shared/util/selectable';
import { HighlightableList } from 'shared/util/keyboard';
import { TenantUsernamesModel } from './tenant-usernames.model';

@Component({
    selector: 'tenant-usernames',
    templateUrl: './tenant-usernames.component.html',
    styleUrls: ['./tenant-usernames.component.scss'],
})
export class tenantUsernamesComponent extends HighlightableList implements Selectable {

    private searchResult: Array<TenantUsernamesModel>;
    @Input() set usernameSearchResult(value: Array<TenantUsernamesModel>) { this.searchResult = value; }
    @Input() masked: boolean;
    @Output() selectionChange = new EventEmitter();

    selectedItems: Array<TenantUsernamesModel> = [];
    isSelected: (item: BaseModel, singleSelect: boolean) => false;
    toggleSelect: (item: BaseModel, set: BaseModel[], event: MouseEvent | KeyboardEvent, singleSelect: boolean) => void;

    constructor() {
        super();
    }

}

applyMixins(tenantUsernamesComponent, [Selectable]);
