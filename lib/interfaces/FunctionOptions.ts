export interface FunctionOptions {
  kmsEnabled?: boolean;
  kmsClient?: any;
  locationId?: string;
  keyRingId?: string;
  cryptoKeyId?: string;

  functionIdentifier?: string;
  errorCode?: string;
  projectId?: string;

  pubSubClient?: any;
  errorTopic?: string;

  correlationId?: string;
  apifsSecretHeader?: string;
  apifsSecretValue?: string;

  bigQueryClient?: any;
  bqDatasetId?: string;
  bqTableId?: string;

  sqlPool?: any;
  sqlConnectionName?: string;
  sqlDatabaseName?: string;
  sqlPassword?: string;
  sqlUsername?: string;
  sqlMaxConnections?: number;
}
