import {JsonObject, JsonProperty, JsonConvert} from 'json2typescript';
import {LinkModel} from './link.model';

@JsonObject
export abstract class HateoasModel {

  @JsonProperty('links', Object)
  public links: Object = null;

  private _linksModel: { [key: string]: LinkModel[] } = {};

  /**
   * Iterates through an object and invokes the given callback function for each iteration.
   * The iteration can be stopped by returning `false` in the callback function. For example:
   *
   *     var person = {
   *         name: 'Jacky'
   *         hairColor: 'black'
   *         loves: ['food', 'sleeping', 'wife']
   *     };
   *
   *     HateoasModel.each(person, function(key, value, myself) {
   *         console.log(key + ":" + value);
   *
   *         if (key === 'hairColor') {
   *             return false; // stop the iteration
   *         }
   *     });
   *
   * @param {Object} object The object to iterate
   * @param {Function} fn The callback function.
   * @param {String} fn.key
   * @param {Object} fn.value
   * @param {Object} fn.object The object itself
   * @param {Object} [scope] The execution scope (`this`) of the callback function
   */
  public static each(object: Object, fn: Function, scope: Object) {
    for (let property in object) {
      if (object.hasOwnProperty(property)) {
        if (fn.call(scope || object, property, object[property], object) === false) {
          return;
        }
      }
    }
  }

  public getId(): string {
    return this.url;
  }

  public get url(): string {
    return this.links['self'] ? this.links['self'].href : null;
  }

  /**
   * Returns true if the object has the given link.
   *
   * @method hasLink
   * @param name {String} The link name
   * @return {Boolean}
   */
  public hasLink(name: string): boolean {
    return this.getLink(name) !== undefined;
  }

  /**
   * Returns the url for the given link.
   * If the links is not found, returns undefined.
   *
   * @method getUrl
   * @param linkName {String} The link name
   * @return {String} The url
   */
  public getUrl(linkName: string): string {
    let me = this,
      url;

    try {
      url = me.getLink(linkName).href;
    }
    catch (e) {
      url = undefined;
    }

    return url;
  }

  /**
   * Returns the link with the given name. The
   * link object contains rel, href, and title(optional).
   * If the link is not found, returns undefined.
   *
   * @method getLink
   * @param name {String} The link name
   * @return {LinkModel} The link model
   */
  public getLink(name: string): LinkModel {
    let me = this,
      link: LinkModel;
    try {
      link = JsonConvert.deserializeObject(me.links[name], LinkModel);
      link.name = name;
    }
    catch (e) {
      link = undefined;
    }
    return link;
  }

  /**
   * Returns true if links with the given relationship exists.
   *
   * @method hasLinks
   * @param rel {String} The relationship
   * @return {Boolean}
   */
  public hasLinks(rel: string): boolean {
    let me = this,
      all = me.links || {},
      exists = false;

    HateoasModel.each(all, function (key, link) {
      if (link.rel === rel) {
        exists = true;
        return false;
      }
    }, me);

    return exists;
  }

  /**
   * Returns links with the given relationship.
   *
   * @method getLinks
   * @param rel {String} The relationship
   * @return {LinkModel[]} Links array with action links only
   */
  public getLinks(rel: string): LinkModel[] {
    let me = this,
      all = me.links || {},
      links: LinkModel[] = [];

    HateoasModel.each(all, function (key, value) {
      let link: LinkModel;
      if (value.rel === rel) {
        link = me.getLink(key);
        if (link)
         links.push(link);
      }
    }, me);

    return me.applyLinksModel(rel, links);
  }

  /**
   * Returns true if the object has action links.
   *
   * @method hasActionLinks
   * @return {Boolean}
   */
  public hasActionLinks(): Boolean {
    return this.hasLinks('action');
  }

  /**
   * Returns all action links.
   *
   * @method getActionLinks
   * @return {LinkModel[]} Links array with action links only
   */
  public getActionLinks(excludes?: string[]): LinkModel[] {
    if (excludes != null) {
      return this.getLinks('action').filter(link => {
        return excludes.indexOf(link.name) === -1;
      });
    }

    return this.getLinks('action');
  }

  /**
   * Returns all download links.
   *
   * @method getDownloadLinks
   * @return {LinkModel[]} Links array with download links only
   */
  public getDownloadLinks(): LinkModel[] {
    return this.getLinks('download');
  }

  /**
   * Returns all view links.
   *
   * @method getViewLinks
   * @return {LinkModel[]} Links array with view links only
   */
  public getViewLinks(): LinkModel[] {
    return this.getLinks('view');
  }

  /**
   * Returns true if this model instance can be edited.
   *
   * @method isUpdateAllowed
   * @return {Boolean} True if edit allowed
   */
  public isUpdateAllowed(): boolean {
    return !!this.getLink('edit');
  }

  /**
   * Returns true if this model instance can be edited.
   *
   * @method isUpdateAllowed
   * @return {Boolean} True if edit allowed
   */
  public isCreateAllowed(): boolean {
    return !!this.getLink('create');
  }

  /**
   * Returns true if this model instance can be deleted.
   *
   * @method isDeleteAllowed
   * @return {Boolean} True if delete allowed
   */
  public isDeleteAllowed(): boolean {
    return !!this.getLink('delete');
  }

  /**
   * Returns true if this model instance supports the view Relationship operation.
   *
   * @method isUsedByAllowed
   * @return {Boolean} True if view Relationship is allowed
   */
  public isUsedByAllowed(): boolean {
    return !!this.getLink('usedby');
  }

  /**
   * Returns true if the action is allowed.
   *
   * @method isActionAllowed
   * @param name {String} The action name (i.e., link name)
   * @return {Boolean} True if allowed
   */
  public isActionAllowed(name: string): boolean {
    let me = this,
      link = me.getLink(name);

    if (!link)
      return false;

    return link.rel === 'action';
  }

  /**
   * Returns true if the given action has an associated schema.
   *
   * @method hasActionSchema
   * @param name {String} The action name (i.e., link name)
   * @return {Boolean}
   */
  public hasActionSchema(name: string): boolean {
    let me = this,
      link = me.getLink(name);

    if (link && link.rel === 'action')
      return !!link.schema;

    return false;
  }

  /**
   * Applies the links model, if the given links are different with the caching models then apply them.
   * @param {string} rel The relationship
   * @param {LinkModel[]} links The given links
   * @returns {LinkModel[]} The latest links
   */
  private applyLinksModel(rel: string, links: LinkModel[]): LinkModel[] {
    let me = this, origLen = me._linksModel[rel] ? me._linksModel[rel].length : 0, newLen = links.length;
    if (origLen !== newLen)
      me._linksModel[rel] = links;
    else {
      for (let i = 0; i < origLen; i++) {
        let _link = me._linksModel[rel][i], link = links[i];
        if (!_link.equals(link)) {
          me._linksModel[rel][i] = link;
        }
      }
    }
    return me._linksModel[rel] ? me._linksModel[rel] : [];
  }
}
