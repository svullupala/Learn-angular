import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BaseHypervisorModel } from 'hypervisor/shared/base-hypervisor.model';

@Injectable()
export class HypervisorAssignPolicyService {
  private assignedPoliciesSubject = new Subject<BaseHypervisorModel>();

  constructor() {}

  emitAssignedPolices(item: BaseHypervisorModel): void {
    this.assignedPoliciesSubject.next(item);
  }

  policiesAssignedSuccess$(): Observable<BaseHypervisorModel> {
    return this.assignedPoliciesSubject.asObservable();
  }
}
