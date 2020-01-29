import {Type, ViewContainerRef, ComponentFactoryResolver} from '@angular/core';

/**
 * DynaCompService - Used for dynamically loading components.

 Example:

 [mycomponent.component.ts]: dynamic component to extend on DynaComp interface.  data property can be used to pass
          properties to the dynamic component.

 export class MyComponent implements DynaComp {
    ...
    data: any
    ...
 }

 [example.module.ts]:  Declare the components in the ngModule that will be dynamically loaded.

 @NgModule({
  imports: [....],
  entryComponents: [MyComponent],
  declarations: [...]
 })

 [example.component.html]: Use ng-container and assigned id to use a placeholder where the component will be inserted.
  <html>
  <ng-container #goeshere></ng-container>
  </html>

 [example.component.ts]: insert the dynamic component.

 export class ExampleComponent implements OnInit, AfterViewInit {

 // Use ViewChild to get the ViewContainerRef of the ng-container
 @ViewChild('goeshere', {read: ViewContainerRef}) versionContainer: ViewContainerRef;


 // Inject the ComponentFactoryResolver
 constructor(private componentFactoryResolver: ComponentFactoryResolver) {

 // Create the service
 compService = new DynaCompService(componentFactoryResolver);
 }

 // Add the dynamic components to the service.
 ngOnInit() {
   this.compService.addDynaComp(MyComponent, {property: ''});
 }

 // Insert component into DOM at ng-container
 onSomething() {
  this.compService.loadDynaCompByIndex(this.componentFactoryResolver, 0, this.versionContainer);
 }
 */


export class DynaCompService {
  private items: Array<DynaCompItem> = [];

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}


  /**
   * Add DynaComp to the service
   * @param component
   * @param data
   */
  public addDynaComp(component: Type<DynaComp>, data: any) {
    this.items.push(new DynaCompItem(component, data));
  }

  /**
   * get All DynaCompItems
   * @returns {Array<DynaCompItem>}
   */
  public getDynaComps(): Array<DynaCompItem> {
    return this.items;
  }

  /**
   * set All DynaComps
   * @param items
   */
  public setDynaComps(items: any[]): void {
    this.items = [];
    for (let i = 0; i < items.length; i++) {
      this.addDynaComp(items[i].component, items[i].data);
    }
  }

  /**
   * Insert the DynaComp into the ViewContainerRef
   * @param count
   * @param viewContainerRef
   */
  public loadDynaCompByIndex(count: number, viewContainerRef: ViewContainerRef): void {
    DynaCompUtils.loadDynaComp(this.componentFactoryResolver, this.items[count], viewContainerRef);
  }

  /**
   * Insert the DynaComp into the ViewContainerRef
   * @param component
   * @param viewContainerRef
   */
  public loadDynaCompByType(component: Type<DynaComp>, viewContainerRef: ViewContainerRef): void {
    let index = this.items.findIndex((element) => {
      if  (element.component === component) {
        return true;
      }
    });

    DynaCompUtils.loadDynaComp(this.componentFactoryResolver, this.items[index], viewContainerRef);
  }
}

/**
 * Static class for utility methods related to DynaComps
 */
export class DynaCompUtils {
  public static loadDynaComp(componentFactoryResolver: ComponentFactoryResolver, item: DynaCompItem,
                             viewContainerRef: ViewContainerRef): void {
    let componentFactory = componentFactoryResolver.resolveComponentFactory(item.component);
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(componentFactory);
    (<DynaComp>componentRef.instance).data = item.data;
  }
}

/**
 * Item containing the component to be dynamically inserted.
 * data contains properties to be passed to the DynaComp
 */
export class DynaCompItem {
  constructor(public component: Type<any>, public data: any) {}
}

/**
 * All Dynamically insertable components need to implement this interface
 */
export interface DynaComp {
  data: any;
}
