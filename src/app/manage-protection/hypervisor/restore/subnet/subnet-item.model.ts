export class SubnetItem {

  public dhcp: boolean = true;
  public subnet: string;
  public subnetmask: string;
  public gateway: string;
  public dnslist: Array<string>;
  public metadata: {ip: string};

  constructor(dhcp: boolean, ip: string, subnet?: string, subnetmask?: string, gateway?: string,
              dnslist?: Array<string>) {
    this.dhcp =  dhcp;
    this.subnet = subnet;
    this.subnetmask = subnetmask;
    this.gateway = gateway;
    this.dnslist = dnslist;
    this.metadata = {ip: ip || ''};
  }
}
