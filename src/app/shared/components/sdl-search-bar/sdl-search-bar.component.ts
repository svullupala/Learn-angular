import {Component, Input, Output, EventEmitter, ElementRef, ViewChild, NgZone, ChangeDetectorRef} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
/**
 *  SDL search bar.
 *
 *     Selector: sdl-search-bar
 *
 *     Events:
 *              search
 *
 *     Inputs:
 *              textPlaceholderLabel - default('Search')
 *
 */
@Component({
  selector: 'sdl-search-bar',
  templateUrl: './sdl-search-bar.component.html',
  styleUrls: ['./sdl-search-bar.component.scss']
})
export class SdlSearchBarComponent {
  @Input() textPlaceholderLabel: string = 'Search';
  @Input() isSupportClear: boolean = false;
  @Input() isSearchFieldDisabled: boolean = false;
  @Output() search = new EventEmitter();
  @Output() clear = new EventEmitter();
  @ViewChild('searchField') searchField: ElementRef;

  private searchForm: FormGroup = undefined;

  public get pattern(): string {
    let field = this.searchForm ? this.searchForm.get('searchField') : null;
    return field ? field.value : '';
  }

  constructor(private fb: FormBuilder, private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.searchForm = this.fb.group({
      'searchField': ['', Validators.compose([Validators.required, Validators.minLength(
         0)])]
    });
  }

  focusSearchField() {
    this.searchField.nativeElement.focus();
  }

  onSearch(event?: KeyboardEvent) {
    this.search.emit(this.searchForm.get('searchField').value);
    if (event && event.preventDefault)
      event.preventDefault();
  }
  
  isSearchContent(): boolean {
    return this.searchForm.get('searchField').value.length > 0;
  }

  onClear() {
    this.reset();
    this.clear.emit();
  }

  reset() {
    this.searchForm.get('searchField').setValue('');
  }

  // Workaround for the fact that (cdkFocusChange) emits outside NgZone.
  markForCheck() {
    this.ngZone.run(() => this.cdr.markForCheck());
  }
}
