import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {RestService} from 'core';
import {NodeService} from 'core';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class SystemInfoService {

  private metricsApi: string = 'ngp/metrics';
  private sysdiagApi: string = 'api/endeavour/sysdiag/filesystem';

  constructor(private rest: RestService, private node: NodeService, translate: TranslateService) { }

  public getMetrics(): Observable<MetricsModel> {
    return this.node.getAll(this.metricsApi).map(
      res => {
        return new MetricsModel(res);
    }
    ).catch(this.handleError);
  }

  public getFilesystems(): Observable<FilesystemModel[]> {
    this.rest.setNoAuditHeader(true);
    return this.rest.getAll(this.sysdiagApi).map(
      res => {
        let retVal: FilesystemModel[] = [];
        let body = res;
        if (body && body.filesystems) {
          let filesystems = body.filesystems;
          for (let i = 0; i < filesystems.length; i++) {
            retVal.push(new FilesystemModel(filesystems[i].totalSize, filesystems[i].percentUsed,
              filesystems[i].name, filesystems[i].status));
          }
        }
        return retVal;
      }
    ).catch(this.handleError);
  }

  private handleError(error: HttpErrorResponse) {
    return Observable.throw(error);
  }
}

export class MetricsModel {
  public cpu: number = undefined;
  public mem: number = undefined;
  public memTotal: number = undefined;
  public data1: FilesystemModel = undefined;
  public data2: FilesystemModel = undefined;
  public data3: FilesystemModel = undefined;

  constructor(res: any) {
    let body = res || {};
    this.cpu = Math.ceil(body.cpuUtil);
    if (body.memory) {
      this.mem = body.memory.util * 100;
      this.memTotal = body.memory.size;
    }
    if (body.data) {
      this.data1 = new FilesystemModel(body.data.size, Math.ceil(body.data.util), 'data', 'NORMAL');
    }

    if (body.data2) {
      this.data2 = new FilesystemModel(body.data2.size, Math.ceil(body.data2.util), 'data2', 'NORMAL');
    }

    if (body.data3) {
      this.data3 = new FilesystemModel(body.data3.size, body.data3.util, 'data3', 'NORMAL');
    }
  }
}

export class FilesystemModel {
  constructor(public size: number, public util: number, public name: string, public status: string) { }
}

