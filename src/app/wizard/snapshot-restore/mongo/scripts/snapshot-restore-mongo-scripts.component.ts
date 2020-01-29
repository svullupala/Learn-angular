import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {SnapshotRestoreMongoModel} from '../snapshot-restore-mongo.model';
import {
  PostScriptsSelectorComponent
} from 'shared/components/post-scripts/post-scripts-selector/post-scripts-selector.component';
import {PostScriptsModel} from 'shared/components/post-scripts/post-scripts.model';

@Component({
  selector: 'snapshot-restore-mongo-scripts',
  templateUrl: './snapshot-restore-mongo-scripts.component.html',
  styleUrls: ['../snapshot-restore-mongo.scss']
})
export class SnapshotRestoreMongoScriptsComponent extends WizardPage<SnapshotRestoreMongoModel> {
  @ViewChild(PostScriptsSelectorComponent) scripts: PostScriptsSelectorComponent;
  @ViewChild('summary', {read: TemplateRef})
  private _summary: TemplateRef<any>;

  validate(silent: boolean): boolean {
    return this.scripts.isValid();
  }

  get summary(): SummaryEntry {
    return {content: this._summary};
  }

  get hasPreScript(): boolean {
    let script = this.getScriptModel(),
      hasScript = script && script.enablePreGuest && script.preGuestScript;
    return !!hasScript;
  }

  get preScript(): string {
    let script = this.getScriptModel();
    return this.hasPreScript ? script.preGuestScript.name : null;
  }

  get hasPostScript(): boolean {
    let script = this.getScriptModel(),
      hasScript = script && script.enablePostGuest && script.postGuestScript;
    return !!hasScript;
  }

  get postScript(): string {
    let script = this.getScriptModel();
    return this.hasPostScript ? script.postGuestScript.name : null;
  }

  get isPreScriptServer(): boolean {
    let script = this.getScriptModel();
    return this.hasPreScript && script.isPreScriptServer;
  }

  get preServer(): string {
    let script = this.getScriptModel();
    return script.preGuestAppserver ? script.preGuestAppserver.name : null;
  }

  get isPostScriptServer(): boolean {
    let script = this.getScriptModel();
    return this.hasPreScript && script.isPostScriptServer;
  }

  get postServer(): string {
    let script = this.getScriptModel();
    return script.postGuestAppserver ? script.postGuestAppserver.name : null;
  }

  get continueScriptsOnError(): boolean {
    let script = this.getScriptModel();
    return script.continueScriptsOnError;
  }

  public onActive(param: WizardPageEventParam): void {
    this.setScripts(this.model.script);
  }

  public onDeactive(param: WizardPageEventParam): void {
    let me = this;
    if (me.validate(false))
      me.saveOptions();
  }

  private getScriptModel(): PostScriptsModel {
    return this.scripts && this.scripts.getModel();
  }

  private setScripts(scripts: PostScriptsModel): void {
    if (this.scripts) {
      this.scripts.setModel(scripts, false);
    }
  }

  private saveOptions(): void {
    let me = this,
      model = me.model,
      script = me.getScriptModel();
    script.syncPrePostGuest();
    model.script = script;
  }
}
