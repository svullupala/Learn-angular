import {Injectable} from "@angular/core";
import {RegistrationFormQuestion} from "shared/form-question/form-question";
import {FormTextQuestion} from "shared/form-question/form-text-question";
import {SubnetItem} from "./subnet-item.model";

@Injectable()
export class SubnetService {

  constructor() {}

  public getSubnetPayload(systemDefined: string, subnetArr: Array<SubnetItem>) {
    let subnetList: Array<SubnetItem>,
      subnetPayload = {};
    if (systemDefined === 'mapping') {
      subnetList = subnetArr || [];
      if (subnetList.length > 0) {
        for (let i = 0; i < subnetList.length; i++) {
          let ip = subnetList[i].metadata.ip || '',
            dnsList;
          subnetPayload[ip] = subnetList[i];
          dnsList = subnetList[i].dnslist;
          subnetPayload[ip] = subnetList[i];
          subnetPayload[ip].dnslist = this.setDnsList(dnsList);
        }
      }
      return subnetPayload;
    } else if (systemDefined === 'system') {
      return {systemDefined: true};
    } else if (systemDefined === 'original'){
      return {systemDefined: false};
    }
  }

  setDnsList(dns: string): Array<string> {
    let dnsList: Array<string>,
      trimDnsList: Array<string> = [];
    if (typeof dns !== 'string') {
      return [];
    }
    dnsList = dns.trim().split(',');
    if (dnsList.length > 0) {
      for (let i = 0; i < dnsList.length; i++) {
        trimDnsList.push(dnsList[i].trim());
      }
    }
    return trimDnsList;
  }

  public getSubnetForm() {
    let formQuestions: RegistrationFormQuestion[];

    formQuestions = [
      new FormTextQuestion({
        value: '',
        key: 'subnet',
        label: 'hypervisor.subnetOrIPText',
        isFormGroup: false,
        placeholder: 'hypervisor.subnetOrIpPlaceholderText',
        type: 'text'
      }),

      new FormTextQuestion({
        value: '',
        key: 'subnetmask',
        label: 'hypervisor.subnetMaskText',
        isFormGroup: false,
        placeholder: 'hypervisor.subnetMaskPlaceholderText',
        type: 'text'
      }),

      new FormTextQuestion({
        value: '',
        key: 'gateway',
        label: 'hypervisor.gatewayText',
        isFormGroup: false,
        placeholder: 'hypervisor.gatewayPlaceholderText',
        type: 'text'
      }),

      new FormTextQuestion({
        value: '',
        key: 'dnslist',
        label: 'hypervisor.dnsText',
        isFormGroup: false,
        placeholder: 'hypervisor.dnsPlaceholderText',
        type: 'text'
      })
    ];
    return formQuestions;
  }

}
