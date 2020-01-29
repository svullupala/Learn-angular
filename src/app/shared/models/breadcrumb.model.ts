import {BaseModel} from './base.model';

export class BreadcrumbModel {
    constructor(public title: string,
                public url: string,
                public resource?: BaseModel){}
}
