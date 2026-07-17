export interface CodeSystem {
  id: string;
  fullUrl: string;
  title?: string;
  name: string;
  version: Version;
  versionId?: string;
  oid: string;
  lastUpdated?: string;
  lastUpdatedUpstream?: string;
  isLatestVersion: boolean;
}

export interface Version {
  fhirVersion: string;
  vsacVersion?: string;
}
