import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {FileRestoreOptionsModel} from './file-restore-options.model';
import {FileVersionModel} from './file-version.model';
import {HasNodeAPI, NodeService} from 'core';

export class FileRestoreModel implements HasNodeAPI {

  nodeApi(): string {
    return 'ngp/hypervisor';
  }

  constructor(private source: Array<FileVersionModel>, private options: FileRestoreOptionsModel) {
  }

  /**
   * Gets the JSON of v0.2 of File Restore contract, the JSON is payload for POST ngp/hypervisor?action=restorefile
   * @returns {Object}
   */
  json(): Object {
    let me = this, source = [], options = me.options;
    (me.source || []).forEach(function (item) {
      source.push({
        // href: item.file ? item.file.getId() : '',
        href: item.getUrl('source'),
        resourceType: 'file',
        include: true,
        version: {
          copy: {
            href: item.getId()
          },
          href: item.getUrl('version')
        }
      });
    });
    return {
      spec: {
        view: '',
        source: source,
        subpolicy: [
          {
            option: {
              overwriteExistingFile: options.overwriteExistingFolderFile,
              filePath: options.targetPath
            },
            destination: options.restoreFileToOriginal ? undefined : {
              target: {
                href: options.destinationVM.href,
                resourceType: 'vm'
              }
            }
          }
        ]
      }
    };
  }

  /**
   * Sends a POST request for the specified action 'restorefile' to server side by the given proxy.
   *
   * @param {NodeService} proxy The data proxy service.
   * @returns {Observable<boolean>}
   */
  apply(proxy: NodeService): Observable<boolean> {
    let me = this, observable: Observable<Object>, result: Observable<boolean>,
      api = `${me.nodeApi()}?action=restorefile`;
    if (proxy) {
      observable = proxy.post(api, me.json());
      result = observable.map((response: Object) => {
        return !!response;
      }).catch((error: HttpErrorResponse) => Observable.throw(error));
    }
    return result;
  }
}
