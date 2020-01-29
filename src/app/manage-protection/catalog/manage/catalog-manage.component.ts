import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CatalogResourceComponent } from './resource/catalog-resource.component';
import { CatalogSearchComponent } from './search/catalog-search.component';
import { DynamicTabEntry, DynamicTabsetComponent } from 'shared/components';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';

@Component({
	selector: 'catalog-manage',
	templateUrl: './catalog-manage.component.html'
})

export class CatalogManageComponent implements OnInit, OnDestroy {
	@ViewChild(DynamicTabsetComponent)
	tabSet: DynamicTabsetComponent;

	@ViewChild('search', { read: TemplateRef })
	public search: TemplateRef<any>;

	@ViewChild('resource', { read: TemplateRef })
	public resource: TemplateRef<any>;

	private tabs: DynamicTabEntry[];
	private mode: string = 'search';
	private subs: Subject<void> = new Subject<void>();

	constructor(private translate: TranslateService) { }

	ngOnInit() {
		this.translate.get([
			'catalog.textResourceTab',
			'catalog.textSearchTab'])
			.takeUntil(this.subs)
			.subscribe((resource: Object) => {
				this.tabs = [
					{ key: 'search', title: resource['catalog.textSearchTab'], content: this.search, refresh: false, active: true },
					{ key: 'resource', title: resource['catalog.textResourceTab'], content: this.resource, refresh: false, active: false }
				];
			});
	}

	ngOnDestroy() {
		this.subs.next();
		this.subs.complete();
		this.subs.unsubscribe();
	}

	onSwitchMode(activeTab: DynamicTabEntry) {
		if (activeTab.key === 'search') {
			this.mode = 'search';
		} else {
			this.mode = 'resource';
		}
	}
}
