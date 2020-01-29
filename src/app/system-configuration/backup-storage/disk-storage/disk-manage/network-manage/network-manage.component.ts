import { Component, Input } from "@angular/core";
import { SelectorService } from "shared/selector/selector.service";
import { restoreItemSelectorFactory } from "hypervisor/restore";
import { ErrorHandlerComponent } from "shared/components";
import { AlertComponent } from "shared/components";
import { NetworkModel } from "diskstorage/disk-manage/network-manage/network.model";
import { Subject } from "rxjs";
import { SessionService } from "core";
import { StorageManageService } from "diskstorage/shared/storage-manage.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "network-manage",
  templateUrl: "./network-manage.component.html",
  styleUrls: ["../disk-manage.component.scss"],
  providers: [
    { provide: SelectorService, useFactory: restoreItemSelectorFactory }
  ]
})
export class NetworkManageComponent {
  @Input() networkList: Array<NetworkModel>;

  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  private subs: Subject<void> = new Subject<void>();
  private maskList: boolean = false;
  private infoTitle: string;
  private networkUpdateMessage: string;

  constructor(
    private storageManageService: StorageManageService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    let me = this,
      endpoint = me.storageManageService.getNodeServiceEndpoint();
    me.errorHandler = SessionService.getInstance().context["errorHandler"];
    me.alert = SessionService.getInstance().context["msgbox.alert"];

    me.translate
      .get(["common.infoTitle", "storage.textNetworksUpdated"])
      .subscribe((resource: Object) => {
        me.infoTitle = resource["common.infoTitle"];
        me.networkUpdateMessage = resource["storage.textNetworksUpdated"];
      });
  }

  ngOnDestroy() {
    this.subs.next();
    this.subs.complete();
    this.subs.unsubscribe();
  }

  mask(): void {
    this.maskList = true;
  }

  unmask(): void {
    this.maskList = false;
  }

  info(message: string, title?: string) {
    let me = this;
    if (me.alert) me.alert.show(title || me.infoTitle, message);
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler) me.errorHandler.handle(err, node);
  }

  saveNetworkSettings() {
    let me = this,
      iterated = 0;
    for (let i = 0; i < this.networkList.length; i++) {
      me.maskList = true;
      this.storageManageService.editNetwork(this.networkList[i]).subscribe(
        data => {
          iterated++;
          if (iterated === this.networkList.length) {
            me.info(me.networkUpdateMessage);
            me.maskList = false;
          }
        },
        err => {
          me.handleError(err);
          iterated++;
          if (iterated === this.networkList.length) {
            me.maskList = false;
          }
        }
      );
    }
  }

  isDisabled(): boolean {
    return this.networkList && !this.networkList[0].serviceTypes;
  }

  private onChange(item: NetworkModel, type: string) {
    if (item.serviceTypes === null) {
      item.serviceTypes = [];
    }
    if (item.serviceTypes.indexOf(type) === -1) {
      item.serviceTypes.push(type);
    } else {
      item.serviceTypes.splice(item.serviceTypes.indexOf(type, 0), 1);
    }
  }

  private isManagement(item: NetworkModel): boolean {
    return item.currentRequest;
  }

  private isData(item: NetworkModel): boolean {
    return item.serviceTypes && item.serviceTypes.indexOf("data") !== -1;
  }

  private isReplication(item: NetworkModel): boolean {
    return item.serviceTypes && item.serviceTypes.indexOf("repl") !== -1;
  }

  private disableServiceTypes(item: NetworkModel): boolean {
    return !item.serviceTypes;
  }
}
