import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { BaseApplicationModel } from 'applications/shared/base-application-model.model';

@Injectable()
export class ApplicationsAssignPolicyService {
  private assignedPoliciesSubject = new Subject<BaseApplicationModel>();

  constructor() {}

  emitAssignedPolices(item: BaseApplicationModel): void {
    this.assignedPoliciesSubject.next(item);
  }

  policiesAssignedSuccess$(): Observable<BaseApplicationModel> {
    return this.assignedPoliciesSubject.asObservable();
  }
}
