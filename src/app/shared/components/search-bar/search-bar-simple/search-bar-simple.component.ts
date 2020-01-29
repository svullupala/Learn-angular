import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
/**
 *  Simple search bar.
 *
 *     Selector: searchbar-simple
 *
 *     Events:
 *              onSearch
 *
 *     Inputs:
 *              placeholderLabel - default('')
 *              icon - default(ion-search)
 *
 */
@Component({
  selector: 'searchbar-simple',
  styleUrls: ['./search-bar-simple.scss'],
  template: `
    <form [formGroup]="searchForm" (ngSubmit)="searchSubmit()" class="form-horizontal">
        <div class="input-group searchbox">
            <span class="input-group-btn"> 
              <button id="search-button" type="submit" class="btn btn-default">
                <i id="search-icon" class="{{icon}}"></i></button> 
            </span>
              <input formControlName="searchField" type="text" class="form-control" placeholder="{{placeholderLabel}}" 
                     id="inputSearch">
        </div> 
    </form>
  `
})
export class SearchBarSimpleComponent {
  @Input() placeholderLabel: string = '';
  @Input() icon: string = 'ion-search';
  @Output() onSearch = new EventEmitter();
  public searchForm: FormGroup = undefined;

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      'searchField': ['', Validators.compose([Validators.required, Validators.minLength(1)])]
    });
  }

  searchSubmit() {
    this.onSearch.emit(this.searchForm.get('searchField').value);
  }
}
