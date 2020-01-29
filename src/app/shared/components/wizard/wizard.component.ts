import {
  Component, EventEmitter, Input, Output, OnDestroy, OnInit, QueryList, ViewChild,
  ViewChildren, AfterViewChecked, TemplateRef, ComponentFactory, ComponentFactoryResolver
} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {isString} from 'util';
import {
  WizardPageContainerComponent
} from 'app/shared/components/wizard/page-container/wizard-page-container.component';
import {WizardModel, Workflow} from 'app/shared/components/wizard/wizard.model';
import {
  WizardPageEntry,
  WizardCategory,
  WizardRegistry,
  WizardAllowedCategory, WizardPreviewEntry, WizardTheme
} from 'app/shared/components/wizard/wizard-registry';
import {WizardTopbarComponent} from 'app/shared/components/wizard/topbar/wizard-topbar.component';
import {WizardSidebarComponent} from 'app/shared/components/wizard/sidebar/wizard-sidebar.component';
import {WizardToolbarComponent} from 'app/shared/components/wizard/toolbar/wizard-toolbar.component';
import {SharedService} from 'shared/shared.service';
import {SummaryEntry, WizardPage, WizardPageEventParam} from 'shared/components/wizard/wizard-page';
import {ToggleComponent, WizardPreviewPageComponent, WizardSidebarItem, WizardStartEventParam} from 'shared/components';
import {WizardReviewPageComponent} from 'shared/components/wizard/review-page/wizard-review-page.component';
import {WorkflowSelectorComponent} from 'shared/components/wizard/workflow-selector/workflow-selector.component';
import {
  WizardSummaryPageComponent
} from 'shared/components/wizard/summary-page/wizard-summary-page.component';
import {
  WIZARD_PREVIEW_PAGE_IDX,
  WIZARD_PREVIEW_PAGE_KEY,
  WizardPreview,
  WizardPreviewEventParam
} from 'shared/components/wizard/wizard-preview';

type SortableGroup = { title: string; sortableKey: number; summaryTitle: string };

export type WizardStartPagesEventParam = {
  category: WizardCategory;
  model: WizardModel;
  workflow?: boolean;
};

@Component({
  selector: 'wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})
export class WizardComponent implements OnInit, OnDestroy, AfterViewChecked {

  @Input() registry: WizardRegistry;
  @Input() model: WizardModel;
  @Input() delayLoad: boolean = true;
  @Input() sidebarVisible: boolean = true;
  @Input() sidebarNavigable: boolean = false; // If set to true, allow the user to jump to any previous step
                                              // in the wizard by clicking on the side bar items.
  @Input() maximize: boolean = false;
  @Input() isContentMaximized: boolean = false; // True indicates the content is maximized before open this wizard.
  @Input() hideTopbar: boolean = false;
  @Input() theme: WizardTheme = 'standard';

  @Input() textBackToTarget: string;
  @Input() hideBackSubmitButtonMode: boolean = true;
  @Input() showOverallSummary: boolean = true;
  @Input() enablePreview: boolean = false;
  @Input() nextOnceWorkflowSelected: boolean = false; // If set to true, go to the next step automatically
                                                      // once the user selected a Source Type(i.e. Workflow).
  @Input() allowedCategories: WizardAllowedCategory[]; // Empty to allow all.
  @Input() interactWithSkipOptionalPages: boolean = false;   // If set to true, allow the user to skip optional steps
                                                      // via interaction with a checkbox.
  @Input() skipOptionalPages: boolean = false; // The initial state of skip optional steps.

  @Input() textDefaultView: string;
  @Input() textAdvancedView: string;
  @Input() textPreview: string;

  @Output() submitEvent: EventEmitter<WizardModel> = new EventEmitter<WizardModel>();
  @Output() cancelEvent: EventEmitter<any> = new EventEmitter<any>();

  @Output() beforeCancelEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();
  @Output() beforePrevEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();
  @Output() beforeNextEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();
  @Output() beforeSubmitEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();

  @Output() activatePageEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();
  @Output() deactivatePageEvent: EventEmitter<WizardPageEventParam> = new EventEmitter<WizardPageEventParam>();
  @Output() startPagesEvent: EventEmitter<WizardStartPagesEventParam> = new EventEmitter<WizardStartPagesEventParam>();
  @Output() previewEvent: EventEmitter<WizardPreviewEventParam> = new EventEmitter<WizardPreviewEventParam>();

  @ViewChild(ToggleComponent) view: ToggleComponent;
  @ViewChild(WizardTopbarComponent) topbar: WizardTopbarComponent;
  @ViewChild(WizardSidebarComponent) sidebar: WizardSidebarComponent;
  @ViewChild(WizardToolbarComponent) toolbar: WizardToolbarComponent;
  @ViewChild('previewPageContainer') previewContainer: WizardPageContainerComponent;
  @ViewChildren(WizardPageContainerComponent) allPageContainers: QueryList<WizardPageContainerComponent>;

  get pageContainers(): WizardPageContainerComponent[] {
    return this.allPageContainers.filter(function (item) {
      return item.key !== WIZARD_PREVIEW_PAGE_KEY;
    });
  }

  protected preview: WizardPreviewEntry;
  protected pages: WizardPageEntry[] = [];
  protected sidebarItems: WizardSidebarItem[] = [];
  protected alwaysHideNext: boolean = false;

  get editMode(): boolean {
    return this.model && this.model.editMode;
  }

  get categories(): WizardCategory[] {
    return this.registry ? this.registry.getCategories() : [];
  }

  get firstCategory(): WizardCategory {
    let categories = this.registry ? this.registry.getCategories() : [];
    return categories && categories.length > 0 ? categories[0] : null;
  }

  get hasAllowedCategory(): boolean {
    return this.allowedCategories && this.allowedCategories.length > 0;
  }

  get firstAllowedCategory(): WizardAllowedCategory {
    let categories = this.allowedCategories ? this.allowedCategories : [];
    return categories && categories.length > 0 ? categories[0] : null;
  }

  get onlyOneAllowedCategory(): boolean {
    return this.hasAllowedCategory && this.allowedCategories.length === 1;
  }

  get defaultCategory(): WizardCategory {
    let model = this.model, categories = this.registry ? this.registry.getCategories() : [],
      allowedCategory: WizardAllowedCategory;
    if (this.editMode)
      return categories.find(function (item) {
        return item.type === model.category && item.subType === model.workflow;
      });
    else if (this.hasAllowedCategory) {
      allowedCategory = this.firstAllowedCategory;
      return categories.find(function (item) {
        return item.type === allowedCategory.type && item.subType === allowedCategory.subType;
      });
    }
    return this.firstCategory;
  }

  get category(): WizardCategory {
    return this.hasStarter || this.startPagesCategory ? this.startPagesCategory : this.defaultCategory;
  }

  get title(): string {
    let category: WizardCategory;
    if (this.hasStarter)
      return this.registry ? this.registry.title : '';
    else {
      category = this.category;
      return category ? category.title : '';
    }
  }

  get subtitle(): string {
    let category: WizardCategory;
    category = this.category;
    return category ? category.subtitle : '';
  }

  get description(): string | TemplateRef<any> {
    let category: WizardCategory;
    if (this.hasStarter)
      return this.registry ? this.registry.description : '';
    else {
      category = this.category;
      return category ? category.description : '';
    }
  }

  get hasStarter(): boolean {
    return this.registry ? this.registry.hasStarter : false;
  }

  get summaryEntries(): SummaryEntry[] {
    return this.sidebar ? this.sidebar.summaryEntries : [];
  }

  get applicableWorkflows(): Workflow[] {
    let me = this, entries: Workflow[] = [], hasAllowedCategory = me.hasAllowedCategory,
      allowedWorkflows: Workflow[];
    if (me.category) {
      allowedWorkflows = hasAllowedCategory ? me.getAllowedWorkflows(me.category.type) : [];
      (me.categories || []).forEach(function (category) {
        if (category.type === me.category.type &&
          entries.findIndex(function (entry) {
            return entry === category.subType;
          }) === -1) {
          if (allowedWorkflows.length === 0 || allowedWorkflows.indexOf(category.subType) !== -1)
            entries.push(category.subType);
        }
      });
    }
    return entries;
  }

  get hasAdvancedPages(): boolean {
    return (this.pages || []).findIndex(function (item) {
      return !!item.advanced;
    }) !== -1;
  }

  get isActivePageAdvanced(): boolean {
    let me = this, page = me.getActivePage();
    return page && !!page.advanced;
  }

  get previewKey(): string {
    return WIZARD_PREVIEW_PAGE_KEY;
  }

  private inPreview: boolean = false;
  private isAdvancedView: boolean = false;
  private started: boolean = false;
  private startPagesPending: boolean = false;
  private startPagesCategory: WizardCategory;
  private startWorkflowPending: boolean = false;
  private subRef: Subject<void> = new Subject<void>();

  constructor(private resolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    let me = this;

    if (!me.registry) {
      console.error('[Wizard] registry property is required');
      return;
    }

    if (!me.firstCategory) {
      console.error('[Wizard] must have one category at least');
      return;
    }

    if (me.maximize)
      SharedService.maximizeContent();

    if (!me.hasStarter)
      me.startPages(me.defaultCategory, me.model);
  }

  ngAfterViewChecked(): void {
    let me = this, workflow = false;
    if ((me.startPagesPending || me.startWorkflowPending) && me.isPageContainersReady()) {
      if (me.startPagesPending)
        me.startPagesPending = false;
      if (me.startWorkflowPending) {
        me.startWorkflowPending = false;
        workflow = true;
      }
      setTimeout(() => {
        me.registry.resetPagesActive(me.startPagesCategory, workflow);
        me.resetPageInstances(me.startPagesCategory, workflow);
        me.createPages(me.startPagesCategory, workflow);
      }, 20);
    }
  }

  ngOnDestroy(): void {
    let me = this;
    if (me.model)
      me.model.cleanUpSubjects();

    if (me.subRef) {
      me.subRef.next();
      me.subRef.complete();
      me.subRef.unsubscribe();
    }
    if (me.maximize)
      SharedService.maximizeContent(true, false, me.isContentMaximized);
  }

  isPageContainersReady(): boolean {
    let me = this, pcs = me.pageContainers,
      pages = me.pages || [];
    return (pcs && pcs.length > 0 && pcs.length === pages.length);
  }

  protected resetPageInstances(category: WizardCategory, workflow?: boolean): void {
    (category.pages || []).forEach(function (item, idx) {
      if (!workflow || !item.workflow)
        item.instance = null;
    });
    if (category.preview)
      category.preview.instance = null;
  }

  protected getPreviewPageComponentFactory(): ComponentFactory<WizardPreviewPageComponent> {
    return this.resolver.resolveComponentFactory<WizardPreviewPageComponent>(
      WizardPreviewPageComponent);
  }

  protected getReviewPageComponentFactory(): ComponentFactory<WizardReviewPageComponent> {
    return this.resolver.resolveComponentFactory<WizardReviewPageComponent>(
      WizardReviewPageComponent);
  }

  protected getDefaultReviewJustForEditPageComponentFactory():
    ComponentFactory<WizardSummaryPageComponent> {
    return this.resolver.resolveComponentFactory<WizardSummaryPageComponent>(
      WizardSummaryPageComponent);
  }

  protected getWorkflowSelectorComponentFactory(): ComponentFactory<WorkflowSelectorComponent> {
    return this.resolver.resolveComponentFactory<WorkflowSelectorComponent>(
      WorkflowSelectorComponent);
  }

  protected createPage(category: WizardCategory,
                       container: WizardPageContainerComponent, pages: WizardPageEntry[], idx: number): void {
    let me = this,
      pageInstance: WizardPage<WizardModel> = null,
      review = !!pages[idx].review,
      justForEdit = !!pages[idx].justForEdit,
      workflow = !!pages[idx].workflow,
      factory = review && !justForEdit ? me.getReviewPageComponentFactory() :
        workflow ? me.getWorkflowSelectorComponentFactory() :
          me.registry.getPageComponentFactory(category, idx, pages[idx].key) ||
            (justForEdit ? me.getDefaultReviewJustForEditPageComponentFactory() : null);

    if (factory)
      pageInstance = container.createComponent(me.model, factory);

    if (pageInstance) {
      if (review) {
        pageInstance.review = true;
        pageInstance.justForEdit = justForEdit;
        if (justForEdit) {
          // Do nothing
        } else {
          pageInstance.summaryEntries = me.summaryEntries;
        }
      }

      pages[idx].instance = pageInstance;
      container.pageAddedEvent.emit({page: pageInstance, wizard: me, index: idx});
    }
  }

  protected createPages(category: WizardCategory, workflow?: boolean): void {
    let me = this, target, pcs = me.pageContainers,
      pages = me.pages || [],
      delayLoad = me.delayLoad,
      activePageIdx = me.getActivePageIndex() || 0;

    if (me.isPageContainersReady()) {
      pcs.forEach(function (item, idx) {
        if ((!workflow || !pages[idx].workflow) &&
          (delayLoad && idx <= activePageIdx || !delayLoad)) {
          me.createPage(category, item, pages, idx);
        }
      });
      if (!workflow) {
        me.addListener(me.activatePageEvent, me.onPageActive, false);
        me.addListener(me.deactivatePageEvent, me.onPageDeactive, false);
      }
      target = me.getActivePage();
      if (target) {

        me.activatePageEvent.emit(me.createPageEventParam());

        me.topbar.setMessage(category.title, target.title);

        if (target.workflow && me.nextOnceWorkflowSelected) {
          if (!workflow)
            me.alwaysHideNext = false;
          else {
            me.alwaysHideNext = false;
            me.nextPage();
          }
        } else {
          me.alwaysHideNext = false;
        }
      }
    }
  }

  protected delayCreatePage(): void {
    let me = this, pcs = me.pageContainers,
      pages = me.pages || [],
      activePageIdx = me.getActivePageIndex() || 0;

    if (me.isPageContainersReady()) {
      pcs.forEach(function (item, idx) {
        if (idx <= activePageIdx && !item.target) {
          me.createPage(me.category, item, pages, idx);
        }
      });
    }
  }

  protected getAllowedWorkflows(type: string): Workflow[] {
    let result: Workflow[] = [];
    (this.allowedCategories || []).forEach(function (item) {
      if (item.type === type && result.indexOf(item.subType) === -1)
        result.push(item.subType);
    });
    return result;
  }

  getPrev(): WizardPageEntry {
    let idx = this.getActivePageIndex();
    return idx > 0 ? this.pages[idx - 1] : null;
  }

  getNext(): WizardPageEntry {
    let idx = this.getActivePageIndex();
    return idx < this.pages.length - 1 ? this.pages[idx + 1] : null;
  }

  hasPrev(): boolean {
    return this.getActivePageIndex() > 0;
  }

  hasNext(): boolean {
    return this.getActivePageIndex() < this.pages.length - 1;
  }

  onPageActive(param: WizardPageEventParam): void {
    let me = this,
      page = param.page,
      wizard = param.wizard;

    if (page.review && !page.justForEdit)
      page.summaryEntries = me.summaryEntries;

    page.activate(param);
    wizard.clearMessage();
    wizard.refreshToolbarButtons(page);
    if (!param.activateNext)
      me.navigateSidebar(page);
  }

  onPageDeactive(param: WizardPageEventParam): void {
    let page = param.page;
    page.onDeactive(param);
  }

  /**
   * Makes the given page active.
   *
   * @method setActivePage
   * @param page {WizardPageEntry} The page to activate
   * @return {WizardPageEntry}
   */
  setActivePage(page: WizardPageEntry): WizardPageEntry {
    let me = this, payload: WizardPageEventParam,
      oldActivePage: WizardPage<WizardModel>,
      oldActivePageIdx: number,
      newActivePageIdx: number,
      delayLoad = me.delayLoad,
      target = me.pages.find(function (item) {
        return item.key === page.key;
      }),
      targetOmitted: boolean = false;
    if (target) {
      oldActivePage = me.getActivePageComponent();
      oldActivePageIdx = me.getActivePageIndex();

      me.pages.forEach(function (item) {
        if (item.key !== target.key) {
          item.active = false;
        }
      });
      target.active = true;

      newActivePageIdx = me.getActivePageIndex();

      if (oldActivePage) {
        payload = {
          wizard: me,
          page: oldActivePage,
          index: oldActivePageIdx,
          back: newActivePageIdx < oldActivePageIdx
        };
        me.deactivatePageEvent.emit(payload);
      }

      if (delayLoad)
        me.delayCreatePage();

      targetOmitted = me.skipOptionalNeeded(target) || me.skipAdvancedNeeded(target);
      payload = {
        wizard: me,
        page: me.getActivePageComponent(),
        index: me.getActivePageIndex(),
        back: newActivePageIdx < oldActivePageIdx,
        activateNext: targetOmitted
      };

      if (payload.page)
        me.activatePageEvent.emit(payload);
      if (!targetOmitted)
        me.topbar.description = target.title;
    }
    return target;
  }

  /**
   * Returns the active (visible) page in the wizard.
   *
   * @method getActivePage
   * @return {WizardPageEntry} The page that is currently active.
   */
  getActivePage(): WizardPageEntry {
    let me = this, target = me.pages.find(function (item) {
      return item.active === true;
    });
    return target;
  }

  /**
   * Returns the active (visible) page component in the wizard.
   *
   * @method getActivePageComponent
   * @return {WizardPage<WizardModel>} The page that is currently active.
   */
  getActivePageComponent(): WizardPage<WizardModel> {
    let me = this, page = me.getActivePage(), pcComp: WizardPageContainerComponent;
    pcComp = page ? me.pageContainers.find((item) => {
      return item.key === page.key;
    }) : null;
    return pcComp ? pcComp.target : null;
  }

  /**
   * Returns the index of the active (visible) page in the wizard.
   *
   * @method getActivePageIndex
   * @return {number} The index of the page that is currently active.
   */
  getActivePageIndex(): number {
    let page = this.getActivePage();
    if (!page)
      return -1;

    return this.getPageIndex(page);
  }

  /**
   * Returns the index of the given page/key in the wizard.
   *
   * @method getPageIndex
   * @param page {string | WizardPageEntry} The page's key or entry
   * @return {number} The index of the page that is given.
   */
  getPageIndex(page: string | WizardPageEntry): number {
    let me = this, index = me.pages.findIndex(function (item) {
      return isString(page) ? page === item.key : item === page;
    });
    return index;
  }

  /**
   * Sets the active (visible) page in the wizard to the previous page.
   *
   * @method previousPage
   * @return {WizardPageEntry | false} The activated page or false when nothing activated.
   */
  previousPage(): WizardPageEntry | false {
    let idx = this.getActivePageIndex();
    return idx > 0 ? this.setActivePage(this.pages[idx - 1]) : false;
  }

  /**
   * Sets the active (visible) page in the wizard to the next page.
   *
   * @method nextPage
   * @return {WizardPageEntry | false} The activated page or false when nothing activated.
   */
  nextPage(): WizardPageEntry | false {
    let idx = this.getActivePageIndex();
    return idx < this.pages.length - 1 ? this.setActivePage(this.pages[idx + 1]) : false;
  }

  /**
   * Sets the active (visible) page in the wizard to the given page.
   *
   * @method gotoPage
   * @param key {string} The page's key
   * @return {WizardPageEntry | false} The activated page or false when nothing activated.
   */
  gotoPage(key: string): WizardPageEntry | false {
    let me = this, target = me.pages.find(function (item) {
      return item.key === key;
    });
    return target ? me.setActivePage(target) : false;
  }

  /**
   * Backs to the given page.
   * @param key {string} The page's key
   * @return {boolean} A boolean indicates success or failure.
   */
  backToPage(key: string): boolean {
    let me = this, activePageIdx = me.getActivePageIndex(), backToIdx = me.getPageIndex(key);
    if (backToIdx < activePageIdx)
      return !!me.gotoPage(key);
    return false;
  }

  protected getRemovingPages(startKey: string, deleteCount?: number): WizardPageEntry[] {
    let me = this, startIdx = me.getPageIndex(startKey), result: WizardPageEntry[] = [];
    deleteCount = deleteCount === undefined ? 1 : deleteCount;
    if (startIdx !== -1 && deleteCount > 0) {
      result = (me.pages || []).filter(function (item, idx) {
        return (startIdx <= idx && idx < startIdx + deleteCount);
      });
    }
    return result;
  }

  protected getTemplatePages(): WizardPageEntry[] {
    let me = this, target: WizardCategory,
      category = me.category;
    if (category) {
      target = (me.categories || []).find(function (item) {
        return category.type === item.type && category.subType === item.subType;
      });
    }
    return target ? target.pages : [];
  }

  protected getInsertingPages(...items: string[]): WizardPageEntry[] {
    let me = this, newItemsLen = items.length, result: WizardPageEntry[] = [];

    if (newItemsLen > 0) {
      result = (me.getTemplatePages() || []).filter(function (item) {
        return items.indexOf(item.key) !== -1 && me.getPageIndex(item.key) === -1;
      });

      result.sort((a, b) => {
        return items.indexOf(a.key) - items.indexOf(b.key);
      });
    }
    return result;
  }


  protected getPrevNextPages(removingPages: WizardPageEntry[]): { prev: WizardPageEntry, next: WizardPageEntry } {
    let me = this, first: WizardPageEntry, last: WizardPageEntry,
      prevPage: WizardPageEntry, nextPage: WizardPageEntry,
      firstIdx = -1, lastIdx = -1,
      removingCount = removingPages ? removingPages.length : 0;

    if (removingCount) {
      first = removingPages[0];
      last = removingPages[removingCount - 1];
      firstIdx = me.getPageIndex(first.key);
      lastIdx = me.getPageIndex(last.key);

      if (firstIdx > 0)
        prevPage = me.pages[firstIdx - 1];

      if (lastIdx < me.pages.length - 1)
        nextPage = me.pages[lastIdx + 1];
    }
    return {prev: prevPage, next: nextPage};
  }

  /**
   * Removes pages from the pages array of current category instance and, if necessary,
   * inserts new pages in their place, returning an array of key indicates the deleted pages.
   *
   * @method splicePages
   * @param {string} startKey The page's key in the pages array of wizard category
   *              from which to start removing pages.
   * @param {number} deleteCount The number of pages to remove.
   * @param {string} items Page keys indicate which pages need to insert into
   *              the pages array in place of the deleted pages.
   * @return {string[]} Returns an array of key indicates the deleted pages.
   */
  splicePages(startKey: string, deleteCount?: number, ...items: string[]): string[] {
    let me = this,
      couple: { prev: WizardPageEntry, next: WizardPageEntry },
      removingTarget: WizardPageEntry,
      activateTarget: WizardPageEntry,
      activePage = me.getActivePage(),
      removingPages = me.getRemovingPages(startKey, deleteCount),
      insertingPages = me.getInsertingPages(...items),
      startIdx = me.getPageIndex(startKey),
      insertingCount = insertingPages.length,
      deletedPages: WizardPageEntry[] = [],
      deletedKeys: string[] = [];

    if (activePage) {
      removingTarget = removingPages.find(function (item) {
        return item.key === activePage.key;
      });
      if (removingTarget) {
        if (insertingCount > 0) {
          activateTarget = insertingPages[0];
        } else {
          couple = me.getPrevNextPages(removingPages);
          if (couple.prev || couple.next) {
            activateTarget = couple.prev || couple.next;
          }
        }
      }
    }
    if (startIdx !== -1 && (removingPages.length > 0 || insertingCount > 0)) {

      // Activate page if necessary.
      if (activateTarget)
        me.setActivePage(activateTarget);

      deletedPages = me.pages.splice(startIdx, removingPages.length, ...insertingPages);

      me.sidebarItemsInit();

      if (deletedPages && deletedPages.length > 0) {
        deletedPages.forEach(function (item) {
          deletedKeys.push(item.key);
        });
      }

      me.navigateSidebar(me.getActivePageComponent());
    }
    return deletedKeys;
  }

  /**
   * Is the given page omitted or not.
   *
   * @method isOmitted
   * @param {string} pageKey The page's key.
   * @return {boolean}
   */
  isOmitted(pageKey: string): boolean {
    let me = this,
      omitted = true,
      target: WizardPageEntry,
      idx = me.getPageIndex(pageKey);
    if (idx !== -1) {
      target = me.pages[idx];
      omitted = me.skipOptionalNeeded(target) || me.skipAdvancedNeeded(target);
    }
    return omitted;
  }

  onStartPages(payload: WizardStartEventParam): void {
    this.startPages(payload.category);
  }

  /**
   * Sets the message in the bar.
   *
   * @method setMessage
   * @param msg {String} The message to display
   */
  setMessage(msg: string): void {
    this.toolbar.setMessage(msg);
  }

  /**
   * Removes any message from the toolbar.
   *
   * @method clearMessage
   */
  clearMessage(): void {
    this.toolbar.clearMessage();
  }

  /**
   * Disables the back button.
   *
   * @method disableBackButton
   */
  disableBackButton() {
    this.toolbar.disableBackButton();
  }

  /**
   * Enables the back button.
   *
   * @method enableBackButton
   */
  enableBackButton() {
    this.toolbar.enableBackButton();
  }

  /**
   * Disables the next button.
   *
   * @method disableNextButton
   */
  disableNextButton() {
    this.toolbar.disableNextButton();
  }

  /**
   * Enables the next button.
   *
   * @method enableNextButton
   */
  enableNextButton() {
    this.toolbar.enableNextButton();
  }

  /**
   * Disables the submit button.
   *
   * @method disableSubmitButton
   */
  disableSubmitButton() {
    this.toolbar.disableSubmitButton();
  }

  /**
   * Enables the submit button.
   *
   * @method enableSubmitButton
   */
  enableSubmitButton() {
    this.toolbar.enableSubmitButton();
  }

  /**
   * Disables the cancel button.
   *
   * @method disableCancelButton
   */
  disableCancelButton() {
    this.toolbar.disableCancelButton();
  }

  /**
   * Enables the cancel button.
   *
   * @method enableCancelButton
   */
  enableCancelButton() {
    this.toolbar.enableCancelButton();
  }

  /**
   * Enables/disables the given button.
   *
   * @method setButtonDisabled
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param disabled {Boolean} True to disable, False to enable
   */
  setButtonDisabled(btn: string, disabled: boolean) {
    this.toolbar.setButtonDisabled(btn, disabled);
  }

  /**
   * Shows/Hides the given button.
   *
   * @method setButtonVisible
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param visible {Boolean} True to show, False to hide
   */
  setButtonVisible(btn: string, visible: boolean) {
    this.toolbar.setButtonVisible(btn, visible);
  }

  /**
   * Sets the text of given button.
   *
   * @method setButtonText
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @param text {String} The button text
   */
  setButtonText(btn: string, text: string) {
    this.toolbar.setButtonText(btn, text);
  }

  /**
   * Gets the text of given button.
   *
   * @method setButtonText
   * @param btn {String} 'back', 'next', 'submit', 'cancel'
   * @return {String} The button text
   */
  getButtonText(btn: string) {
    return this.toolbar.getButtonText(btn);
  }

  /**
   * Hides the sidebar.
   *
   * @method hideSidebar
   */
  hideSidebar() {
    this.sidebarVisible = false;
  }

  /**
   * Shows the sidebar.
   *
   * @method showSidebar
   */
  showSidebar() {
    this.sidebarVisible = true;
  }

  /**
   * Submits the wizard.
   *
   * @method submit
   */
  submit() {
    this.submitEvent.emit(this.model);
  }

  /**
   * Cancels the wizard.
   *
   * @method cancel
   */
  cancel() {
    this.cancelEvent.emit();
  }

  /**
   * Refreshes the text & state of toolbar buttons.
   *
   * @method refreshToolbarButtons
   * @param {WizardPage<WizardModel>} page The current page.
   */
  refreshToolbarButtons(page: WizardPage<WizardModel>): void {
    let me = this, pageCount: number, // prev, next, prevText, nextText,
      backNotApplicable, nextNotApplicable, submitNotApplicable,
      pages = me.pages;

    if (pages) {
      pageCount = pages.length;

      // Uncomment the following code if need refresh the text of toolbar buttons.
      //
      // prev = me.getPrev();
      // next = me.getNext();
      // if (prev && prev.title && me.backTextTpl)
      //   prevText = me.backTextTpl.apply({
      //     title: prev.title
      //   });
      // else
      //   prevText = me.backText;
      //
      // if (next && next.title && me.nextTextTpl)
      //   nextText = me.nextTextTpl.apply({
      //     title: next.title
      //   });
      // else
      //   nextText = me.nextText;
      //
      // if (next && me.isValidSubsequentPages()) {
      //   nextText += ' ' + me.optionalText;
      // }
      //
      // me.setButtonText('back', prevText);
      // me.setButtonText('next', nextText);

      backNotApplicable = me.hasPrev() === false;
      nextNotApplicable = me.hasNext() === false || !page.viewReady ||
        !page.isOmitted() && page.validate(true) !== true;
      submitNotApplicable = me.isValid() === false;

      me.setButtonDisabled('back', backNotApplicable);
      me.setButtonDisabled('next', nextNotApplicable);
      me.setButtonDisabled('submit', submitNotApplicable);


      if (me.hideBackSubmitButtonMode) {
        // Hide the back/submit button once it is not applicable.
        // Also, hide the back & next buttons if the wizard has just one page or less.
        me.setButtonVisible('back', !backNotApplicable && pageCount > 1);
        me.setButtonVisible('next', pageCount > 1);
        me.setButtonVisible('submit', !me.hasPrev() && !submitNotApplicable);
      } else {
        // Hide the back & next buttons if the wizard has just one page or less.
        me.setButtonVisible('back', pageCount > 1);
        me.setButtonVisible('next', pageCount > 1);
      }
    }
  }

  /**
   * Checks the validity of subsequent pages of current page in the wizard
   * and return true, if and only if, all pages are valid.
   *
   * @method isValidSubsequentPages
   * @return {Boolean} True if ALL subsequent pages are valid
   */
  isValidSubsequentPages() {
    let me = this,
      valid = false,
      activePageIndex = me.getActivePageIndex(),
      pages = me.pages;

    if (activePageIndex !== -1 && activePageIndex < pages.length - 1) {

      valid = pages.findIndex(function (page, idx) {
        return idx > activePageIndex &&
          (!page.instance || !page.instance.viewReady ||
            !page.instance.isOmitted() && page.instance.validate(true) !== true);
      }) === -1;
    }
    return valid;
  }

  /**
   * Refreshes the state of the next & submit buttons.
   *
   * @method refreshNextSubmitState
   */
  refreshNextSubmitState(): void {
    let me = this, nextNotApplicable, submitNotApplicable,
      page = me.getActivePageComponent();

    if (page) {
      nextNotApplicable = me.hasNext() === false || !page.viewReady ||
        !page.isOmitted() && page.validate(true) !== true;
      submitNotApplicable = me.isValid() === false;

      me.setButtonDisabled('next', nextNotApplicable);
      me.setButtonDisabled('submit', submitNotApplicable);

      // If hideBackSubmitButtonMode is true, hide the submit button once it is not applicable..
      if (me.hideBackSubmitButtonMode) {
        me.setButtonVisible('submit', !me.hasNext() && !submitNotApplicable);
      }
      me.setButtonVisible('next', me.hasNext());
    }
  }

  /**
   * Checks the validity of all pages in the wizard
   * and return true, if and only if, all pages are
   * valid.
   *
   * @method isValid
   * @return {Boolean} True if ALL pages are valid
   */
  isValid(): boolean {
    let me = this, pages = me.pages;

    return pages.findIndex(function (page) {
      return !page.instance || !page.instance.viewReady ||
        !page.instance.isOmitted() && page.instance.validate(true) !== true;
    }, me) === -1;
  }

  addListener(event: EventEmitter<any>, fn: Function, single: boolean, scope?: any): Subscription {
    let me = this, observable = event.takeUntil(me.subRef).subscribe((params) => {
      fn.call(scope || me, params);
      if (single)
        observable.unsubscribe();
    });
    return observable;
  }

  onSkipOptional(value: boolean): void {
    this.skipOptionalPages = value;
  }

  onPrevious(activateNext?: boolean): void {
    let me = this, payload: WizardPageEventParam = me.createPageEventParam(activateNext);

    me.beforePrevEvent.emit(payload);

    if (!payload.preventNextEvent)
      me.previousPage();
  }

  onNext(activateNext?: boolean): void {
    let me = this, payload: WizardPageEventParam = me.createPageEventParam(activateNext);

    me.beforeNextEvent.emit(payload);

    if (!payload.preventNextEvent)
      me.nextPage();
  }

  onSubmit(): void {
    let me = this, payload: WizardPageEventParam = me.createPageEventParam();

    me.beforeSubmitEvent.emit(payload);

    if (!payload.preventNextEvent)
      me.submit();
  }

  onCancel(): void {
    let me = this, payload: WizardPageEventParam = me.createPageEventParam();

    me.beforeCancelEvent.emit(payload);

    if (!payload.preventNextEvent)
      me.cancel();
  }

  onClosePreview(): void {
    let me = this,
      target: WizardPreview<WizardModel>,
      payload: WizardPageEventParam,
      activePage: WizardPageEntry,
      container = me.previewContainer;
    if (container) {
      target = me.preview ? me.preview.instance : null;
      if (target) {
        payload = {
          wizard: me,
          page: target,
          index: WIZARD_PREVIEW_PAGE_IDX,
          back: false
        };
        target.onDeactive(payload);
        activePage = me.getActivePage();
        me.clearPreviewPage(me.category, container);
        me.inPreview = false;
        me.previewEvent.emit({
          activePage: activePage ? activePage.key : undefined,
          inPreview: me.inPreview
        });
      }
    }
  }

  onToggleView(advanced: boolean): void {
    let me = this;
    me.isAdvancedView = advanced;
    me.sidebarItemsInit();
    me.navigateSidebar(me.getActivePageComponent());
  }

  onSidebarItemSelect(sbItem: WizardSidebarItem): void {
    if (sbItem.page)
      this.gotoPage(sbItem.page.key);
  }

  protected instancePreviewEntry(base: WizardPreviewEntry,
                                 pageInstance: WizardPreview<WizardModel>): WizardPreviewEntry {
    let entry = {
      title: base ? base.title : this.textPreview || 'wizard.textPreview',
      description: base ? base.description : 'wizard.textPreviewDesc',
      instance: pageInstance
    };
    pageInstance.entry = entry;
    if (base)
      base.instance = pageInstance;
    return entry;
  }

  protected createPreviewPage(category: WizardCategory,
                              container: WizardPageContainerComponent): WizardPreview<WizardModel> {
    let me = this,
      pageInstance: WizardPreview<WizardModel> = null,
      page: WizardPreviewEntry = category.preview,
      defaultPreview = !page,
      factory = defaultPreview ? me.getPreviewPageComponentFactory() :
        me.registry.getPageComponentFactory(category, WIZARD_PREVIEW_PAGE_IDX, WIZARD_PREVIEW_PAGE_KEY);

    if (factory)
      pageInstance = container.createComponent<WizardModel, WizardPreview<WizardModel>>(me.model,
        factory as ComponentFactory<WizardPreview<WizardModel>>);

    if (pageInstance) {
      pageInstance.summaryEntries = me.summaryEntries;
      me.preview = me.instancePreviewEntry(page, pageInstance);
    }
    return pageInstance;
  }

  protected clearPreviewPage(category: WizardCategory,
                             container: WizardPageContainerComponent): void {
    let me = this,
      page: WizardPreviewEntry = category.preview;
    if (page)
      page.instance = null;
    if (me.preview)
      me.preview.instance = null;
    container.clearComponent();
  }

  onPreview(): void {
    let me = this,
      payload: WizardPageEventParam,
      target: WizardPreview<WizardModel>,
      activePage: WizardPageEntry,
      container = me.previewContainer;
    if (container) {
      activePage = me.getActivePage();
      target = me.createPreviewPage(me.category, container);
      if (target) {
        payload = {
          wizard: me,
          page: target,
          index: WIZARD_PREVIEW_PAGE_IDX,
          back: false,
          activateNext: false
        };
        target.activate(payload);
        me.inPreview = true;
        me.previewEvent.emit({
          activePage: activePage ? activePage.key : undefined,
          inPreview: me.inPreview
        });
      }
    }
  }

  setWorkflow(workflow: Workflow): void {
    let me = this, targetCategory, currentType = me.category.type,
      currentSubType = me.category.subType;
    if (currentSubType !== workflow) {
      targetCategory = me.categories.find(function (category) {
        return currentType === category.type && workflow === category.subType;
      });
      me.resetAdvancedView();
      me.startWorkflow(targetCategory);
    } else if (me.nextOnceWorkflowSelected) {
      me.nextPage();
    }
  }

  protected resetAdvancedView(): void {
    let me = this, view = me.view;
    me.isAdvancedView = false;
    if (view)
      view.toggle(me.isAdvancedView, true);
  }

  protected copyPage(source: WizardPageEntry, target: WizardPageEntry): void {
    Object.assign(target, source);
  }

  protected takePages(pages: WizardPageEntry[], type?: string): void {
    let me = this, oldPages = me.pages,
      wfPage = oldPages.find(function (item) {
        return !!item.workflow;
      }), newWfPage = pages.find(function (item) {
        return !!item.workflow;
      }), newPages = pages.filter(function (item) {
        return item !== newWfPage;
      });

    oldPages.splice(0, oldPages.length);
    if (newWfPage && wfPage) {
      if (me.editMode || me.onlyOneAllowedCategory) {
        oldPages.push(...newPages);
      } else {
        me.copyPage(newWfPage, wfPage);
        oldPages.push(wfPage, ...newPages);
      }
    } else if (newWfPage) {
      if (me.editMode || me.onlyOneAllowedCategory ||
        type && me.onlyOneAllowedWorkflow(type)) {
        oldPages.push(...newPages);
      } else {
        oldPages.push(newWfPage, ...newPages);
      }
    } else {
      oldPages.push(...newPages);
    }
    me.handleReviewJustForEditPage();
  }

  protected onlyOneAllowedWorkflow(type: string): boolean {
    let me = this, count = 0;
    if (me.hasAllowedCategory) {
      me.allowedCategories.forEach(function (item) {
        if (item.type === type)
          count++;
      });
    }
    return count === 1;
  }

  protected handleReviewJustForEditPage(): void {
    let me = this, oldPages = me.pages,
      rjePage = oldPages.find(function (item) {
        return !!item.review && !!item.justForEdit;
      }),
      keepPages = oldPages.filter(function (item) {
        return item !== rjePage;
      });

    if (rjePage) {
      oldPages.splice(0, oldPages.length);
      if (me.editMode) {
        oldPages.push(rjePage, ...keepPages);
      } else {
        oldPages.push(...keepPages);
      }
    }
  }

  protected createStartCategoryInstance(template: WizardCategory): WizardCategory {
    return {
      type: template.type,
      subType: template.subType,
      title: template.title,
      subtitle: template.subtitle,
      description: template.description,
      icon: template.icon,
      selected: template.selected,
      pages: this.pages,
      preview: template.preview
    };
  }

  protected startWorkflow(category: WizardCategory): void {
    let me = this;
    me.takePages(category.pages || []);
    me.sidebarItemsInit();
    me.started = true;
    if (me.model)
      me.model.cleanUpSubjects();
    me.model = new (me.registry.getModelClazz(category))();
    me.model.workflow = category.subType;
    me.resetModels();
    me.startPagesCategory = me.createStartCategoryInstance(category);
    me.startWorkflowPending = true;

    me.startPagesEvent.emit({category: me.startPagesCategory, model: me.model, workflow: true});
  }

  protected resetModels(): void {
    let me = this, pcs = me.pageContainers;
    pcs.forEach(function (item) {
      if (item.target) {
        item.target.model = me.model;
      }
    });
    if (me.previewContainer && me.previewContainer.target)
      me.previewContainer.target.model = me.model;
  }

  protected startPages(category: WizardCategory, model?: WizardModel): void {
    let me = this;
    me.takePages(category.pages || [], category.type);
    me.sidebarItemsInit();
    me.started = true;
    if (!model && me.model)
      me.model.cleanUpSubjects();
    me.model = model || new (me.registry.getModelClazz(category))();
    if (!model)
      me.model.workflow = category.subType;
    me.startPagesCategory = me.createStartCategoryInstance(category);
    me.startPagesPending = true;

    me.startPagesEvent.emit({category: me.startPagesCategory, model: me.model});
  }

  protected createPageEventParam(activateNext?: boolean): WizardPageEventParam {
    let me = this;
    return {
      wizard: me,
      page: me.getActivePageComponent(),
      index: me.getActivePageIndex(),
      activateNext: activateNext
    };
  }

  protected createSidebarItemsByGroups(groups: SortableGroup[]): WizardSidebarItem[] {
    let result: WizardSidebarItem[] = [];
    groups.forEach(function (group) {
      result.push({
        title: group.title,
        page: null,
        done: false,
        disabled: true,
        sortableKey: group.sortableKey,
        summaryTitle: group.summaryTitle
      });
    });
    return result;
  }

  protected createSidebarItemsByPages(pages: WizardPageEntry[]): WizardSidebarItem[] {
    let result: WizardSidebarItem[] = [];
    pages.forEach(function (page, idx) {
      result.push({
        title: page.title,
        page: page,
        done: false,
        disabled: true,
        sortableKey: idx
      });
    });
    return result;
  }

  protected extractGroups(): SortableGroup[] {
    let me = this, target, groups: SortableGroup[] = [],
      pages = me.pages || [];

    pages.forEach(function (item, index) {
      let idx: number;
      if (item.group) {
        idx = groups.findIndex(function (group) {
          return group.title === item.group;
        });
        if (idx === -1) {
          groups.push({title: item.group, sortableKey: index, summaryTitle: item.groupSummaryTitle});
        }
      }
    });
    return groups;
  }

  protected doublyLink(items: WizardSidebarItem[]): void {
    items.forEach(function (item, idx, allItems) {
      item.prev = idx > 0 ? allItems[idx - 1] : null;
      item.next = idx + 1 < allItems.length ? allItems[idx + 1] : null;
    });
  }

  protected allMembersAdvanced(items: WizardSidebarItem[], grpIdx: number): boolean {
    let result = true;
    for (let idx = grpIdx + 1; idx < items.length - 1; idx++) {
      let item = items[idx], isGroup = !item.page;
      if (isGroup)
        break;
      else if (!item.page.advanced) {
        result = false;
        break;
      }
    }
    return result;
  }

  protected setSidebarItemsHiddenByAdvanced(items: WizardSidebarItem[]): void {
    let me = this, advancedView = me.isAdvancedView;
    items.forEach(function (item, idx, allItems) {
      let isGroup = !item.page;
      if (isGroup) {
        item.hidden = !advancedView && me.allMembersAdvanced(allItems, idx);
      } else {
        item.hidden = !advancedView && !!item.page.advanced;
      }
    });
  }

  protected skipAdvancedNeeded(page: WizardPageEntry): boolean {
    return !this.isAdvancedView && !!page.advanced;
  }

  protected skipOptionalNeeded(page: WizardPageEntry): boolean {
    return this.skipOptionalPages && !!page.optional;
  }

  protected sidebarItemsInit(): void {
    let me = this,
      sbItems: WizardSidebarItem[], groupItems: WizardSidebarItem[], standaloneItems: WizardSidebarItem[],
      groups = me.extractGroups(),
      pages = me.pages || [];

    groupItems = me.createSidebarItemsByGroups(groups);
    standaloneItems = me.createSidebarItemsByPages(pages);
    sbItems = groupItems.concat(standaloneItems);

    sbItems.sort(function (a, b) {
      return a.sortableKey > b.sortableKey ? 1 : (a.sortableKey === b.sortableKey ? 0 : -1);
    });
    me.doublyLink(sbItems);
    me.setSidebarItemsHiddenByAdvanced(sbItems);

    me.sidebarItems = sbItems;
  }

  protected findSidebarItemByPage(page: WizardPage<WizardModel>): WizardSidebarItem {
    return (this.sidebarItems || []).find(function (item) {
      return item.page && item.page.instance === page;
    });
  }

  protected findSidebarItemByGroup(group: string): WizardSidebarItem {
    return (this.sidebarItems || []).find(function (item) {
      return !item.page && item.title === group;
    });
  }

  protected indexOfSidebarItem(sbItem: WizardSidebarItem): number {
    return (this.sidebarItems || []).indexOf(sbItem);
  }

  protected getPrevSidebarItemWithPage(sbItem: WizardSidebarItem): WizardSidebarItem {
    let me = this, target: WizardSidebarItem, idx = me.indexOfSidebarItem(sbItem);
    if (idx > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (me.sidebarItems[i].page) {
          target = me.sidebarItems[i];
          break;
        }
      }
    }
    return target;
  }

  protected getNextSidebarItemWithPage(sbItem: WizardSidebarItem): WizardSidebarItem {
    let me = this, target: WizardSidebarItem, idx = me.indexOfSidebarItem(sbItem);
    if (idx >= 0) {
      for (let i = idx + 1; i <= me.sidebarItems.length - 1; i++) {
        if (me.sidebarItems[i].page) {
          target = me.sidebarItems[i];
          break;
        }
      }
    }
    return target;
  }

  protected setPrevSidebarItemsDone(sbItem: WizardSidebarItem): void {
    let me = this, prev: WizardSidebarItem, prevParent: WizardSidebarItem,
      target: WizardSidebarItem = sbItem;

    prev = me.getPrevSidebarItemWithPage(target);
    if (prev) {
      me.setSidebarItemStatus(prev, true, true);
      if (prev.page.group && prev.page.group !== target.page.group) {
        prevParent = me.findSidebarItemByGroup(prev.page.group);
        if (prevParent)
          me.setSidebarItemStatus(prevParent, true, true);
      }
      me.setPrevSidebarItemsDone(prev);
    }
  }

  protected setNextSidebarItemsNotDone(sbItem: WizardSidebarItem): void {
    let me = this, next: WizardSidebarItem, nextParent: WizardSidebarItem,
      target: WizardSidebarItem = sbItem;

    next = me.getNextSidebarItemWithPage(target);
    if (next) {
      me.setSidebarItemStatus(next, false, false);
      if (next.page.group && next.page.group !== target.page.group) {
        nextParent = me.findSidebarItemByGroup(next.page.group);
        if (nextParent)
          me.setSidebarItemStatus(nextParent, false, false);
      }
      me.setNextSidebarItemsNotDone(next);
    }
  }

  protected setSidebarItemActive(sbItem: WizardSidebarItem): void {
    let me = this, parent: WizardSidebarItem, target: WizardSidebarItem = sbItem;

    me.setSidebarItemStatus(target, true, false);
    if (target.page.group) {
      parent = me.findSidebarItemByGroup(target.page.group);
      if (parent)
        me.setSidebarItemStatus(parent, true, false);
    }
  }

  protected setSidebarItemStatus(sbItem: WizardSidebarItem, enable: boolean, done?: boolean): void {
    sbItem.disabled = !enable;
    if (done !== undefined)
      sbItem.done = done;
  }

  protected navigateSidebar(page: WizardPage<WizardModel>): void {
    let me = this, target: WizardSidebarItem = me.findSidebarItemByPage(page);
    if (target) {
      me.setSidebarItemActive(target);
      me.setPrevSidebarItemsDone(target);
      me.setNextSidebarItemsNotDone(target);
    }
  }
}
