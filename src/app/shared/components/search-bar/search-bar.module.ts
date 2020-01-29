import { NgModule } from '@angular/core';
import { SearchBarSimpleComponent } from './search-bar-simple/search-bar-simple.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export { SearchBarSimpleComponent } from './search-bar-simple/search-bar-simple.component';

@NgModule({
  imports: [ CommonModule, ReactiveFormsModule, FormsModule ],
  declarations: [ SearchBarSimpleComponent ] ,
  exports: [ SearchBarSimpleComponent ]
})
export class SearchBarModule { }
