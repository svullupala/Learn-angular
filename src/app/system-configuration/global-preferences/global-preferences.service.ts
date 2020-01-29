import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { RestService } from 'core';

@Injectable()
export class GlobalPreferencesService {

    private static coreAPI = 'api/endeavour/preference';

    constructor(private core: RestService) { }

    /**
     * Method called on ngOnInit
     */
    public getGlobalPreferenceData(): Observable<any> {
        return this.core.getByUrl(this.core.getBaseUrl() + GlobalPreferencesService.coreAPI);
    }

    public putData(value: any, typeKey: string, path: string): Observable<any> {
        if (typeKey === 'pref.type.integer')
            value = Number(value);
        else if (typeKey === 'pref.type.string')
            value = String(value);

        let payload = { value: value }        
        return this.core.putByUrl(this.core.getBaseUrl() + GlobalPreferencesService.coreAPI + path, payload);
    }

    /**
     * reset data => send an empty object as the payload.
     * @param index 
     * @param url 
     */
    public resetData(index: number, url: string): Observable<any> {
        return this.core.postByUrl(this.core.getBaseUrl() + GlobalPreferencesService.coreAPI + url + '?action=reset', {})
    }
}