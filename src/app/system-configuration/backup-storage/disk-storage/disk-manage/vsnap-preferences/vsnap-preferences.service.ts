import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { StorageModel } from 'diskstorage/shared/storage.model';
import { RestService } from 'core';
import { Observable } from 'rxjs';

@Injectable()
export class vSnapPreferencesService {

    private static coreAPI = 'api/storage';
    private storageItemID = new BehaviorSubject<object>(null);
    cast = this.storageItemID.asObservable();

    constructor(private core: RestService) {
    }

    getVsnapPreferences(storage: StorageModel) {
        return this.core.getByUrl(storage.getUrl('managementPreference'));
    }

    resetData(storage: StorageModel, url: string) { 
        return this.core.postByUrl(storage.getUrl('managementPreference') + url + '?action=reset', {});
    }

    public putData(storage: StorageModel, value: any, typeKey: string, path: string): Observable<any> {
        if (typeKey === 'pref.type.integer')
            value = Number(value);
        else if (typeKey === 'pref.type.string')
            value = String(value);

        let payload = { value: value }        
        return this.core.putByUrl(storage.getUrl('managementPreference') + path, payload);
    }

}