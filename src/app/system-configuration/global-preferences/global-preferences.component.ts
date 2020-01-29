import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalPreferencesService } from './global-preferences.service';
import { PreferencesCategoryModel } from "../../shared/components/preferences-category/preferences-category.model";
import { TranslateService } from '@ngx-translate/core';
import { ErrorHandlerComponent } from 'shared/components';
import { SessionService } from 'core';
import { Subject } from 'rxjs';

@Component({
    selector: 'global-preferences',
    templateUrl: './global-preferences.component.html'
})
export class GlobalPreferencesComponent implements OnInit, OnDestroy {

    errorHandler: ErrorHandlerComponent;
    private schemaGroup: object = {};
    private textInvalidEntry: string;
    private resetValue: any;
    private updatedValue: any;
    objectKeys = Object.keys;
    private subs: Subject<void> = new Subject<void>();

    constructor(private service: GlobalPreferencesService, private translate: TranslateService) { }

    ngOnInit() {
        let me = this;

        me.translate.get([
            'global-preferences.common.textInvalidEntry'
        ]).takeUntil(this.subs).subscribe((resource: Object) => {
            me.textInvalidEntry = resource['global-preferences.common.textInvalidEntry'];
        });

        this.service.getGlobalPreferenceData().takeUntil(this.subs)
            .subscribe(
                data => {
                    data['preferences'].forEach(element => {
                        if (!me.schemaGroup[element.category]) {
                            me.schemaGroup[element.category] = [];
                        }
                        me.schemaGroup[element.category].push(
                            new PreferencesCategoryModel({
                                category: element.category,
                                id: element.id,
                                name: element.name,
                                type: element.type,
                                typeKey: element.typeKey,
                                defaultValue: element.value.defaultValue,
                                url: '/' + element.id,
                                value: element.value.value,
                                values: element.value.values,
                                toolTipMinValue: 0,
                                toolTipMaxValue: 2147483647,
                                showToolTipText: me.textInvalidEntry,
                            })
                        );
                    });
                });
        this.errorHandler = SessionService.getInstance().context['errorHandler'];
    }

    ngOnDestroy() {
        this.subs.next();
        this.subs.complete();
        this.subs.unsubscribe();
    }

    clickingReset(event: any) {
        this.service.resetData(event.index, event.url).takeUntil(this.subs).subscribe(
            response => {
                this.resetValue = response.value.value;
                event.callback(event.index, this.resetValue);
            },
            error => {
                this.errorHandler.handle(error);
            }
        );
    }

    detectingValueChange(event: any) {
        this.service.putData(event.value, event.typeKey, event.url).takeUntil(this.subs).subscribe(
            response => {
                this.updatedValue = response.value.value;
                event.callback(event.index, this.updatedValue);
            },
            error => {
                this.errorHandler.handle(error);
            }
        );
    }

}
