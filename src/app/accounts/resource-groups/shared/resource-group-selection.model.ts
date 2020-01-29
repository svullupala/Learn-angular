import { BreadcrumbModel } from 'shared/models/breadcrumb.model';
import { BaseModel } from 'shared/models/base.model';
import { HasPersistentJson } from 'core';

export class ResourceGroupSelectionModel implements HasPersistentJson {
  public path: string;
  constructor(public title: string,
              public resource?: any,
              public breadcrumbs?: Array<BreadcrumbModel>){}
  public equals(resource: BaseModel): boolean {
    return this.resource && this.resource.equals(resource);
  }

  public getPersistentJson(): object {
    return {
      path: this.resource && this.resource.rbacPath,
      include: true,
      metadata: {
        href_host: '',
        href_path: '',
        id: (this.resource && this.resource.id) || '',
        name: (this.resource && this.resource.name) || '',
        typeTitle: this.title && this.title,
        path: this.path || this.getPath(this.breadcrumbs)
      }
    };
  }

  private getPath(breadcrumbs: Array<BreadcrumbModel>): string {
    let strArr: Array<string> = [];
    if (breadcrumbs && breadcrumbs.length > 0) {
      breadcrumbs.forEach((breadcrumb: BreadcrumbModel) => {
        strArr.push(breadcrumb.title + ':' + breadcrumb.title.toLowerCase());
      });
    }
    if (this.resource) {
      if (this.resource.name) {
        strArr.push(this.resource.name + ':' + (this.resource.id || this.resource.name));
      }
    }
    return strArr.length > 0 ? strArr.join('/') : '';
  }
}
