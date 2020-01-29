import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
@Component({
    selector: 'application-pst-options',
    templateUrl: './application-pst-options.component.html',
    styleUrls: ['./application-pst-options.component.scss'],
  })

export class ApplicationPSTOptionsComponent implements OnInit {
    private optionSelected: string;
    @Input() set pstOptionSelected(value: string) {
        this.optionSelected = value;
    };
    @Output() clickPSTOptions = new EventEmitter();
    private radioControlValue: string;

    ngOnInit() {
    }

    onClickPSTOptions(value: any) {
        this.radioControlValue = value;
        this.clickPSTOptions.emit(this.radioControlValue);
    }

}