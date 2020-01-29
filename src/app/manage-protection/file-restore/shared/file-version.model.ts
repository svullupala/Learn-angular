import {JsonObject, JsonProperty} from 'json2typescript';
import {BaseFileModel} from './base-file.model';
import {FileModel} from './file.model';

@JsonObject
export class FileVersionModel extends BaseFileModel {

  get protectionCopyTime(): number {
    return this.copyTime;
  }

  set protectionCopyTime(value: number) {
    this.copyTime = value;
  }

  get protectionTime(): number {
    return this.protectionInfo['protectionTime'];
  }

  set protectionTime(value: number) {
    this.protectionInfo['protectionTime'] = value;
  }

  get site(): string {
    return this.summary['site'] || '';
  }

  set site(value: string) {
    this.summary['site'] = value;
  }

  get storage(): string {
    return this.summary['storageServer'] || '';
  }

  set storage(value: string) {
    this.summary['storageServer'] = value;
  }

  public file: FileModel;
}
