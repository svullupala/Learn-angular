import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {isFunction} from 'rxjs/util/isFunction';
import {isObject} from 'rxjs/util/isObject';

export type Workflow = 'vmware' | 'hyperv' | 'awsec2' | 'db2' | 'sql' | 'oracle' | 'mongo' | 'exch' | 'office365' | 'k8s' ;

/**
 * Defines the wizard subject which is a derived class of BehaviorSubject.
 */
export class WizardSubject<T> extends BehaviorSubject<T> {
}

export type WizardSubjectSubFn<T> = (value: T) => void;
export type WizardSubjectSubFnWithScope<T> = { fn: WizardSubjectSubFn<T>, scope?: any };
export type WizardSubjectSubCallback<T> = WizardSubjectSubFn<T> | WizardSubjectSubFnWithScope<T>;

export type WizardSubjectSubEntry<T> = {
  [key: string]: WizardSubjectSubCallback<T>
};
export type WizardSubjectPubEntry<T> = {
  [key: string]: { initValue: T, subCallback?: WizardSubjectSubCallback<T> }
};

type WizardSubjectMapping = { [key: string]: { subject: WizardSubject<any>, subscriptions: Subscription[] } };

export abstract class WizardModel {
  category: string;
  workflow: Workflow;
  editMode: boolean = false;

  private subjectMapping: WizardSubjectMapping = {};

  /**
   * Abstract method requires derived class to implement and return the json object indicates the policy of workflow.
   * @return {object}
   */
  abstract json(): object;

  /**
   * Publishes one or multiple subjects, can subscribe the subjects immediately if necessary.
   * Note: because of the limit of generic type parameter, when publish multiple subjects, these subjects'
   * values must have the same type, otherwise please make separate call for each type.
   *
   * @method publish<T>
   * @param {WizardSubjectPubEntry<T>} entry The publish entry. e.g.
   *        {
   *           runType: { initValue: 'test', subCallback: { fn: (value: string) => {}, scope: this } }
   *        }
   *        or
   *        {
   *           view: { initValue: null, subCallback: { fn: (value: NvPairModel) => {}, scope: this } }
   *        }
   *        or
   *        {
   *           subject1: { initValue: null },
   *           subject2: { initValue: null, subCallback: (value: T) => {} },
   *           subject3: { initValue: null, subCallback: { fn: (value: T) => {}, scope: this } }
   *        }
   * @return {boolean | Subscription[]} Returns a boolean if don't subscribe the subjects immediately,
   *    otherwise returns an array of Subscription.
   */
  publish<T>(entry: WizardSubjectPubEntry<T>): boolean | Subscription[] {
    let me = this, subEntry: WizardSubjectSubEntry<T>,
      subscriptions: Subscription[], subs: Subscription[],
      conflict = false;
    for (let property in entry) {
      if (entry.hasOwnProperty(property) && !!me.subjectMapping[property]) {
        conflict = true;
        break;
      }
    }
    if (conflict)
      return false;

    subscriptions = [];
    for (let property in entry) {
      if (entry.hasOwnProperty(property)) {
        me.subjectMapping[property] = {
          subject: new WizardSubject<T>(entry[property].initValue),
          subscriptions: []
        };
        if (entry[property].subCallback) {
          subEntry = {};
          subEntry[property] = entry[property].subCallback;
          subs = me.subscribe<T>(subEntry);
          if (subs && subs.length > 0)
            subscriptions.push(...subs);
        }
      }
    }
    return subscriptions.length > 0 ? subscriptions : true;
  }

  /**
   * Subscribes the subjects which have been published.
   * Note: because of the limit of generic type parameter, when subscribe multiple subjects, these subjects'
   * values must have the same type, otherwise please make separate call for each type.
   *
   * @method subscribe<T>
   * @param {WizardSubjectSubEntry<T>} entry The subscribe entry. e.g.
   *        {
   *           runType: { fn: (value: string) => {}, scope: this }
   *        }
   *        or
   *        {
   *           view: { fn: (value: NvPairModel) => {}, scope: this }
   *        }
   *        or
   *        {
   *           subject1: { fn: (value: T) => {}, scope: this },
   *           subject2: { fn: (value: T) => {}, scope: this },
   *           subject3: { fn: (value: T) => {}, scope: this }
   *        }
   * @return {Subscription[]} Returns an array of Subscription.
   */
  subscribe<T>(entry: WizardSubjectSubEntry<T>): Subscription[] {
    let me = this, fn: WizardSubjectSubFn<T>,
      fnWithScope: WizardSubjectSubFnWithScope<T>,
      subscriptions: Subscription[], sub: Subscription,
      noFound = false;
    for (let property in entry) {
      if (entry.hasOwnProperty(property) && !me.subjectMapping[property]) {
        noFound = true;
        break;
      }
    }
    if (noFound)
      return [];

    subscriptions = [];
    for (let property in entry) {
      if (entry.hasOwnProperty(property)) {
        sub = me.subjectMapping[property].subject.subscribe((value: T) => {
          if (entry[property] && isFunction(entry[property])) {
            fn = entry[property] as WizardSubjectSubFn<T>;
            return fn.call(fn, value);
          } else if (entry[property] && isObject(entry[property])) {
            fnWithScope = entry[property] as WizardSubjectSubFnWithScope<T>;
            return fnWithScope.fn.call(fnWithScope.scope || fnWithScope.fn, value);
          }
        });
        me.subjectMapping[property].subscriptions.push(sub);
        subscriptions.push(sub);
      }
    }
    return subscriptions;
  }

  /**
   * Unsubscribes the subscriptions.
   *
   * @method unsubscribe
   * @param {Subscription[]} subscriptions An array of subscription.
   */
  unsubscribe(subscriptions: Subscription[]): void {
    let me = this;
    (subscriptions || []).forEach((item: Subscription) => {
      item.unsubscribe();

      for (let property in me.subjectMapping) {
        if (me.subjectMapping.hasOwnProperty(property) && me.subjectMapping[property] &&
          me.subjectMapping[property].subscriptions) {
          let targetIdx = me.subjectMapping[property].subscriptions.indexOf(item);
          if (targetIdx !== -1)
            me.subjectMapping[property].subscriptions.splice(targetIdx, 1);
        }
      }
    });
  }

  /**
   * Notifies the subject value has changed.
   *
   * @param {string} subject The subject key.
   * @param {T} value The subject value.
   * @return {boolean} Returns true to indicate success, false to indicate failure.
   */
  notify<T>(subject: string, value: T): boolean {
    let me = this, noFound = !me.subjectMapping[subject];
    if (noFound)
      return false;
    me.subjectMapping[subject].subject.next(value);
    return true;
  }

  /**
   * Cleans up all subjects and the related subscriptions.
   *
   * @method cleanUpSubjects
   */
  cleanUpSubjects(): void {
    let me = this;
    for (let property in me.subjectMapping) {
      if (me.subjectMapping.hasOwnProperty(property) && me.subjectMapping[property] &&
        me.subjectMapping[property].subscriptions) {
        me.subjectMapping[property].subscriptions.forEach((item: Subscription) => {
          item.unsubscribe();
        });
        me.subjectMapping[property].subject.next(me.subjectMapping[property].subject.getValue());
        me.subjectMapping[property].subject.complete();
        me.subjectMapping[property].subject.unsubscribe();
      }
    }
    me.subjectMapping = {};
  }
}
