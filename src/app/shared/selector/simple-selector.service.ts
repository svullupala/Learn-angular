import {Injectable} from '@angular/core';
import {BaseModel} from '../models/base.model';
import {GenericSelectorService} from './generic-selector.service';

@Injectable()
export class SimpleSelectorService extends GenericSelectorService<BaseModel> {
}
