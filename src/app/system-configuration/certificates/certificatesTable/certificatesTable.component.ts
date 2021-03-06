import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {AlertComponent, ErrorHandlerComponent} from 'shared/components/index';
import {SessionService} from 'core';
import {PaginateConfigModel} from 'shared/models/paginate-config.model';
import {Sortable, SortUtil} from 'shared/util/sortable';
import {SorterModel} from 'shared/models/sorter.model';
import {CertificateModel} from '../certificate.model';
import {CertificatesService} from '../certificates.service';
import {CertificatesModel} from '../certificates.model';

@Component({
  selector: 'certificates-table',
  styleUrls: [],
  templateUrl: './certificatesTable.component.html'
})

export class CertificatesTableComponent implements OnInit, Sortable {

  @Output() deleteClick = new EventEmitter<CertificateModel>();
  @Output() editClick = new EventEmitter<CertificateModel>();

  paginateConfig: PaginateConfigModel;
  errorHandler: ErrorHandlerComponent;
  alert: AlertComponent;
  disableAddCertificates: boolean = false;

  private certificatesTableData: Array<CertificateModel>;
  private sorters: Array<SorterModel>;
  private nameSort: SorterModel;

  constructor(private certificatesService: CertificatesService) {
    let paginationId: string = `certificates-table-pagination-${(new Date()).valueOf()}`;
    this.paginateConfig = new PaginateConfigModel({id: paginationId});
  }

  ngOnInit() {
    let me = this;
    me.errorHandler = SessionService.getInstance().context['errorHandler'];
    me.alert = SessionService.getInstance().context['msgbox.alert'];
    me.nameSort = new SorterModel('name', 'ASC');
    me.sorters = [me.nameSort];
    me.loadData();
  }

  loadData() {
    let me = this;
    me.certificatesService.getCertificates(me.sorters)
      .subscribe(
        data => {
          // Cast the JSON object to DatasetModel instance.
          let dataset = JsonConvert.deserializeObject(data, CertificatesModel);
          me.disableAddCertificates = !dataset.hasLink('create');
          me.certificatesTableData = dataset.records;
          me.paginateConfig.refresh(dataset.total);
          me.paginateConfig.itemsPerPage = dataset.total || 1;
        },
        err => me.handleError(err),
      );
  }

  handleError(err: any, node?: boolean): void {
    let me = this;
    if (me.errorHandler)
      me.errorHandler.handle(err, node);
  }

  onRefresh(): void {
    this.loadData();
  }

  onEditClick(item: CertificateModel) {
    this.editClick.emit(item);
  }

  onDeleteClick(item: CertificateModel) {
    this.deleteClick.emit(item);
  }

  canDelete(item: CertificateModel) {
    return item.hasLink('delete');
  }

  canEdit(item: CertificateModel) {
    return item.hasLink('edit');
  }

  isAsc(name: string): boolean {
    return SortUtil.has(this.sorters, name, false);
  }

  isDesc(name: string): boolean {
    return SortUtil.has(this.sorters, name, true);
  }

  onSort(name: string): void {
    this.changeSorter(name);
    SortUtil.toggle(this.sorters, name);
    this.onRefresh();
  }

  changeSorter(name: string): void {
    if (name === 'name') {
      this.sorters = [this.nameSort];
    }
  }
}
