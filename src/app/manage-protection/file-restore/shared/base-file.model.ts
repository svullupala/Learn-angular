import {JsonObject} from 'json2typescript';
import {SearchResultModel} from './search-result.model';
import {MD5} from 'shared/util/md5';

@JsonObject
export abstract class BaseFileModel extends SearchResultModel {

  private _id: string = undefined;

  private generateId(): string {
    // The backend doesn't return an ID field, directly use the MD5 hash value of self.href as ID.
    return MD5.encode(this.getId());
  }

  get id(): string {
    if (this._id === undefined)
      this._id =  this.generateId();
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get volUniqueId(): string {
    return this.summary['volUniqueId'] || '';
  }

  set volUniqueId(value: string) {
    this.summary['volUniqueId'] = value;
  }

  get parentPk(): string {
    return this.summary['parentPk'] || '';
  }

  set parentPk(value: string) {
    this.summary['parentPk'] = value;
  }

  get documentType(): string {
    return this.summary['documentType'] || '';
  }

  set documentType(value: string) {
    this.summary['documentType'] = value;
  }

  get catalogProvider(): string {
    return this.summary['catalogProvider'] || '';
  }

  set catalogProvider(value: string) {
    this.summary['catalogProvider'] = value;
  }

  get filename(): string {
    return this.summary['name'] || '';
  }

  set filename(value: string) {
    this.summary['name'] = value;
  }

  get path(): string {
    return this.summary['location'] || '';
  }

  set path(value: string) {
    this.summary['location'] = value;
  }

  get vm(): string {
    return this.summary['vmName'] || '';
  }

  set vm(value: string) {
    this.summary['vmName'] = value;
  }

  get host(): string {
    return this.summary['Host'] || '';
  }

  set host(value: string) {
    this.summary['Host'] = value;
  }

  get size(): number {
    return this.summary['size'] || 0;
  }

  set size(value: number) {
    this.summary['size'] = value;
  }

  get catalogTime(): number {
    return this.summary['catalogTime'];
  }

  set catalogTime(value: number) {
    this.summary['catalogTime'] = value;
  }

  get accessTime(): number {
    return this.summary['accessTime'];
  }

  set accessTime(value: number) {
    this.summary['accessTime'] = value;
  }

  get modifyTime(): number {
    return this.summary['modifyTime'];
  }

  set modifyTime(value: number) {
    this.summary['modifyTime'] = value;
  }

  get os(): string {
    return this.summary['os'] || '';
  }

  set os(value: string) {
    this.summary['os'] = value;
  }

  get hypervisorType(): string {
    return this.summary['hypervisorType'] || '';
  }

  set hypervisorType(value: string) {
    this.summary['hypervisorType'] = value;
  }
}
