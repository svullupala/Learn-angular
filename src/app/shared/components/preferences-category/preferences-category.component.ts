import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ErrorHandlerComponent, AlertComponent, AlertType } from 'shared/components';
import { FormGroup, Validators, FormBuilder, AbstractControl, FormControl } from '@angular/forms';
import { PreferencesCategoryModel } from './preferences-category.model';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from 'core';
import { SharedService } from 'shared/shared.service';

@Component({
    selector: 'preferences-category',
    templateUrl: './preferences-category.component.html',
    styleUrls: ['./preferences-category.component.scss']
})
export class PreferencesCategoryComponent implements OnInit {

    errorHandler: ErrorHandlerComponent;
    alert: AlertComponent;
    private value: object
    private form: FormGroup;
    private preference: AbstractControl;
    private selectOption: AbstractControl;
    private textInvalidEntry: string;
    private textInvalidRange: string;
    private textInvalidLowerRange: string
    private textInvalidUpperRange: string
    private textUpdated: string;

    private preferenceList: Array<PreferencesCategoryModel>;
    @Input() set preferenceData(value: Array<PreferencesCategoryModel>) {
        this.preferenceList = value;
        if (this.preferenceList && this.preferenceList.length > 0) {
            for (let i = 0; i < this.preferenceList.length; i++) {
                if (this.preferenceList[i].typeKey === 'pref.type.list') {
                    for (let j = 0; j < this.preferenceList[i].values.length; j++) {
                        if (this.preferenceList[i].value === this.preferenceList[i].values[j].option) {
                            this.preferenceList[i].subValue = this.preferenceList[i].values[j];
                            this.preferenceList.splice(i + 1, 0, new PreferencesCategoryModel(
                                {
                                    category: this.preferenceList[i].subValue['category'],
                                    id: this.preferenceList[i].subValue['id'],
                                    name: this.preferenceList[i].subValue['name'],
                                    type: this.preferenceList[i].subValue['type'],
                                    typeKey: this.preferenceList[i].subValue['typeKey'],
                                    defaultValue: this.preferenceList[i].subValue['value'] === null || this.preferenceList[i].subValue['value']['defaultValue'] === null ? null : this.preferenceList[i].subValue['value']['defaultValue'],
                                    value: this.preferenceList[i].subValue['value'] === null || this.preferenceList[i].subValue['value']['value'] === null ? null : this.preferenceList[i].subValue['value']['value'],
                                    url: '/' + this.preferenceList[i].subValue['id'],
                                    addTabSpace: true
                                }));
                            this.handleInputValue(this.preferenceList[i].subValue['value'], i + 1);
                        }
                    }
                }
            }
        }

    }
    private title: string;
    @Input() set header(value: string) {
        this.title = value;
    }
    @Output() clickingReset = new EventEmitter<object>();
    @Output() detectingValueChange = new EventEmitter();

    constructor(private fb: FormBuilder, private translate: TranslateService) { }

    ngOnInit() {
        this.translate.get([
            'storage.textUpdated',
            'global-preferences.common.textInvalidEntry',
            'global-preferences.common.textInvalidRange',
            'global-preferences.common.textInvalidLowerRange',
            'global-preferences.common.textInvalidUpperRange',
        ])
            .subscribe((resource: Object) => {
                this.textUpdated = resource['storage.textUpdated'];
                this.textInvalidEntry = resource['global-preferences.common.textInvalidEntry'];
                this.textInvalidRange = resource['global-preferences.common.textInvalidRange'];
                this.textInvalidLowerRange = resource['global-preferences.common.textInvalidLowerRange'];
                this.textInvalidUpperRange = resource['global-preferences.common.textInvalidUpperRange'];
            });

        this.form = this.fb.group({
            'preference': [],
        });

        this.preferenceList.forEach(element => {
            if (element.typeKey === 'pref.type.integer' || element.typeKey === 'pref.type.string') {
                element.showClearIcon = element.value == null ? false : true;
            }
        });

        this.errorHandler = SessionService.getInstance().context['errorHandler'];
        this.alert = SessionService.getInstance().context['msgbox.alert'];
    }

    /**
     * Decides which input type the field has to be. 
     * @param typeKey 
     */
    getInputType(typeKey: string) {
        if (typeKey === 'pref.type.integer') {
            return 'number';
        }
        else if (typeKey === 'pref.type.string') {
            return 'text';
        }
    }

    /**
     * Detects change in value and EMITS an object to the component consuming it.
     * @param value 
     * @param typeKey 
     * @param url 
     * @param index 
     */
    onDetectingValueChange(value: any, defaultValue: any, typeKey: string, url: string, index: number) {
        this.preferenceList[index].maskPreference = true;
        //Below if-condition code is hard-coded for concurrent backup (vMOrDatabaseStreams) in the version 10.1.5.
        if (url === '/vMOrDatabaseStreams' && typeKey === 'pref.type.integer' && (value.target.value < 1 || value.target.value > this.preferenceList[index].toolTipMaxValue)) {
            let warningMessage: string;
            if (value.target.value < 1) {
                warningMessage = SharedService.formatString(this.textInvalidLowerRange, 1, this.preferenceList[index].toolTipMaxValue);
            }
            this.alert.show(this.textInvalidEntry, warningMessage === undefined ? this.textInvalidUpperRange : warningMessage, AlertType.WARNING);
            this.preferenceList[index].maskPreference = false;
            value.target.value = this.preferenceList[index].value;
            this.preferenceList[index].showToolTip = false;
            // if (!this.preferenceList[index].value) {
            //     this.preferenceList[index].showClearIcon = false;
            // }
            return;
        } //End of Hard-code
        if (typeKey === 'pref.type.integer' && (value.target.value < 0 || value.target.value > this.preferenceList[index].toolTipMaxValue)) {
            let warningMessage: string;
            if (value.target.value < 0) {
                warningMessage = SharedService.formatString(this.textInvalidLowerRange, 0, this.preferenceList[index].toolTipMaxValue);
            }
            this.alert.show(this.textInvalidEntry, warningMessage === undefined ? this.textInvalidUpperRange : warningMessage, AlertType.WARNING);
            this.preferenceList[index].maskPreference = false;
            value.target.value = this.preferenceList[index].value;
            this.preferenceList[index].showToolTip = false;
            if (!this.preferenceList[index].value) {
                this.preferenceList[index].showClearIcon = false;
            }
            return;
        }
        if (typeKey === 'pref.type.boolean' && value.target.checked === defaultValue) {
            this.onClickingReset(index, url);
            return;
        }
        this.detectingValueChange.emit({
            value: typeKey === 'pref.type.boolean' ? value.target.checked :
                typeKey === 'pref.type.list' ? value : value.target.value,
            typeKey: typeKey,
            url: url,
            index: index,
            preferenceList: this.preferenceList,
            callback: this.callbackForValueChange
        });
    }

    /**
     * callback function for detecting change. Called from the component consuming the emitted Object
     * @param index 
     * @param updatedValue 
     */
    callbackForValueChange(index, updatedValue) {
        if (this.preferenceList) {
            //For concurrent backup (vMOrDatabaseStreams) in the version 10.1.5
            if (typeof updatedValue === 'object') {
                this.preferenceList[index].value = updatedValue.value
            }
            else {
                this.preferenceList[index].value = updatedValue;
            }
            //For concurrent backup (vMOrDatabaseStreams) in the version 10.1.5
            if (this.preferenceList[index].id === 'concurrentBackup' && this.preferenceList[index].value === 'Limit') { // For concurrent backup (vMOrDatabaseStreams) in the version 10.1.5.
                this.preferenceList[index + 1].value = updatedValue.subValue;
            }
            this.preferenceList[index].maskPreference = false;
            //Displays the updated green checkbox on successful update for 1.5 seconds.
            this.preferenceList[index].updatedCheckbox = true;
            setTimeout(() => {
                this.preferenceList[index].updatedCheckbox = false;
            }, 1500);
        }
    }


    /**
     * Detects reset button clicked and EMITS an object to the component consuming it. 
     * @param index 
     * @param url 
     */
    onClickingReset(index: number, url: string) {
        this.preferenceList[index].maskPreference = true;
        this.clickingReset.emit({
            index: index,
            url: url,
            callback: this.callbackForClickingReset,
            preferenceList: this.preferenceList
        });
    }

    /**
     * callback function for reset. Called from the component consuming the emitted Object.
     * @param index 
     * @param resetValue 
     */
    callbackForClickingReset(index, resetValue) {
        if (this.preferenceList) {
            this.preferenceList[index].value = resetValue;
            this.preferenceList[index].showClearIcon = false;
            this.preferenceList[index].showToolTip = false;
            this.preferenceList[index].maskPreference = false;
            //Displays the updated green checkbox on successful update for 1.5 seconds.
            this.preferenceList[index].updatedCheckbox = true;
            setTimeout(() => {
                this.preferenceList[index].updatedCheckbox = false;
            }, 1500);
        }
    }

    /**
     * Check if the field is empty or not. If the field is empty, then !!event = true, else !!event = false.
     * If input type=number, then check if the value is negative or greater than max_integer_value and set showToolTip.
     * @param event 
     * @param index
     * @param url
     * @param typeKey 
     */
    handleInputValue(value: any, index: number, url?: string, typeKey?: string) {
        this.preferenceList[index].showClearIcon = !!value;
//Below code is hard-coded for concurrent backup (vMOrDatabaseStreams) in the version 10.1.5.
        if (Number(value) !== NaN && url === '/vMOrDatabaseStreams' && (Number(value) > this.preferenceList[index].toolTipMaxValue || Number(value) < 1)) {
            this.preferenceList[index].showToolTip = true;
        }
        else if (typeKey === 'pref.type.integer' && Number(value) !== NaN && (Number(value) > this.preferenceList[index].toolTipMaxValue || Number(value) < 0)) {
            this.preferenceList[index].showToolTip = true;
        } else this.preferenceList[index].showToolTip = false;
    }

    /**
     * Prevent Period key input by the user
     * @param key 
     * @param typeKey 
     */
    onKeyDown(key: any, typeKey: string) {
        if (typeKey === 'pref.type.integer')
            return !(key.key === '.' || key.keyCode === 46 || key.which === 46 || key.keyCode === 38 || key.which === 38 || key.keyCode === 40 || key.which === 40);
    }

    /**
     * prevent uncheck of the Updated Green box by the user.
     * @param event
     */
    preventUncheck(event: Event) {
        event.preventDefault();
    }

    /**
     * This method is used to store the value in the property subValue and then create a new instace of the model (for inserting the row)
     * @param event 
     * @param index 
     * @param typekey 
     */
    onSelectingDropdownOption(event: any, defaultValue: any, typeKey: string, url: string, index: number) {
        // Delete row if the User selects a different option
        this.preferenceList.splice(index + 1, 1);
        // Update the dropdown option
        this.onDetectingValueChange(event, defaultValue, typeKey, url, index);

        this.preferenceList[index].values.forEach(element => {
            if (element.option === event)
                this.preferenceList[index].subValue = element;
        });

        this.preferenceList.splice(index + 1, 0, new PreferencesCategoryModel(
            {
                category: this.preferenceList[index].subValue['category'],
                id: this.preferenceList[index].subValue['id'],
                name: this.preferenceList[index].subValue['name'],
                type: this.preferenceList[index].subValue['type'],
                typeKey: this.preferenceList[index].subValue['typeKey'],
                defaultValue: this.preferenceList[index].subValue['value'] === null || this.preferenceList[index].subValue['value']['defaultValue'] === null ? null : this.preferenceList[index].subValue['value']['defaultValue'],
                value: this.preferenceList[index].subValue['value'] === null || this.preferenceList[index].subValue['value']['value'] === null ? null : this.preferenceList[index].subValue['value']['value'],
                url: '/' + this.preferenceList[index].subValue['id'],
                addTabSpace: true
            }));
        this.handleInputValue(this.preferenceList[index].subValue['value'], index + 1, url, typeKey);
    }

}