import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage} from 'shared/components/wizard/wizard-page';
import {BackupSqlModel} from '../backup-sql.model';
import {Subject} from 'rxjs';
import {SlapolicyModel} from 'slapolicy/shared/slapolicy.model';
import {SlapolicyService} from 'slapolicy/shared/slapolicy.service';
import {JsonConvert} from 'json2typescript/src/json2typescript/json-convert';
import {SlapoliciesModel} from 'slapolicy/shared/slapolicies.model';

@Component({
  selector: 'backup-sql-select-sla',
  templateUrl: './backup-sql-select-sla.component.html',
  styleUrls: ['../backup-sql.scss'],
  providers: [SlapolicyService]
})
export class BackupSqlSelectSlaComponent extends WizardPage<BackupSqlModel> implements OnInit {
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  private subs: Subject<void> = new Subject<void>();
  private policies: Array<SlapolicyModel>;
  private selectedPolicy: SlapolicyModel;
  private mask: boolean = false;

  constructor(private slapolicyService: SlapolicyService) {
    super();
  }

  ngOnInit(): void {
    let me = this;
    me.mask = true;
    me.slapolicyService.getSLAPolicies().takeUntil(me.subs).subscribe(
      data => {
        me.mask = false;
        let dataset = JsonConvert.deserializeObject(data, SlapoliciesModel);
        me.policies = dataset.records;
      },
      err => {
        me.mask = false;
        me.handleError(err, true);
      },
      () => {
        me.mask = false;
      }
    );
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  validate(silent: boolean): boolean {
    return !!this.model.selectedPolicy;
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  onSlaClick(policy: SlapolicyModel): void {
    this.model.selectedPolicy = policy;
  }
}
