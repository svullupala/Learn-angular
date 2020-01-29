import { ReportModel } from 'reports/shared/report.model';
import { LinkModel } from 'shared/models/link.model';

export type ReportsModalType = 'run' | 'schedule' | 'custom-create' | 'custom-run' | 'custom-update';

export interface ReportsModalContent {
  item: ReportModel;
  modalType: ReportsModalType;
  createLink?: LinkModel;
}
