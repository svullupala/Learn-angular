import {JsonObject} from 'json2typescript';
import {FileVersionModel} from './file-version.model';
import {BaseFileModel} from './base-file.model';

@JsonObject
export class FileModel extends BaseFileModel {
   public versions: Array<FileVersionModel> = [];
   public latestVersion: FileVersionModel;
}
