import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { BsDropdownDirective } from 'ngx-bootstrap';

@Component({
  selector: 'sdl-async-search-bar',
  templateUrl: './sdl-async-search-bar.component.html',
  styleUrls: ['../sdl-search-bar/sdl-search-bar.component.scss']
})
export class SdlAsyncSearchBarComponent implements OnInit, OnDestroy {
  @Input() textPlaceholderLabel: string = 'Search';
  @Input() isSearchFieldDisabled: boolean = false;
  @Input() searchAction: (value: string) => Observable<any>;
  @Input() displayFieldKey: string = 'name';
  @Output() selectResult = new EventEmitter<any>();
  @ViewChild('searchField') searchField: ElementRef;
  @ViewChild(BsDropdownDirective) dropdown: BsDropdownDirective;

  searchResults: any[] = [];
  searching: boolean = false;
  private searchForm: FormGroup;
  private destroy = new Subject();

  constructor(private fb: FormBuilder, private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.searchForm = this.fb.group({
      searchField: ['']
    });
  }

  ngOnInit(): void {
    this.searchForm
      .get('searchField')
      .valueChanges.debounceTime(200)
      .takeUntil(this.destroy)
      .filter(value => value && !!value.length)
      .do(() => (this.searching = true))
      .switchMap(value => this.searchAction(value))
      .subscribe(results => {
        this.searchResults = Array.isArray(results) ? results : [];
        this.searching = false;
      });

    this.searchForm
      .get('searchField')
      .valueChanges.takeUntil(this.destroy)
      .subscribe(() => {
        this.searchResults = [];
        if (this.isSearchContent()) {
          this.dropdown.show();
        } else {
          this.dropdown.hide();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.unsubscribe();
  }

  focusSearchField(): void {
    this.searchField.nativeElement.focus();
  }

  onFocusSearchField(): void {
    if (this.isSearchContent()) {
      this.dropdown.show();
    }
  }

  onBlurSearchField(): void {
    setTimeout(() => {
      this.dropdown.hide();
    }, 100);
  }

  onSelectResult(item: any): void {
    this.selectResult.emit(item);
    this.searchForm.patchValue({ searchField: item[this.displayFieldKey] }, { emitEvent: false });
  }

  isSearchContent(): boolean {
    return this.searchForm.get('searchField').value.length > 0;
  }

  onClear(): void {
    this.reset();
  }

  // Workaround for the fact that (cdkFocusChange) emits outside NgZone.
  markForCheck(): void {
    this.ngZone.run(() => this.cdr.markForCheck());
  }

  private reset(): void {
    this.searchForm.get('searchField').setValue('', { emitEvent: false });
  }
}
