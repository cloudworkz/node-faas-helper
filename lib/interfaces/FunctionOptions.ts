import { PubSub } from "@google-cloud/pubsub";
import { BigQuery } from "@google-cloud/bigquery";
import { KeyManagementServiceClient } from "@google-cloud/kms";
import { Pool } from "pg";

export interface FunctionOptions {
  kmsEnabled?: boolean;
  kmsClient?: KeyManagementServiceClient;
  locationId?: string;
  keyRingId?: string;
  cryptoKeyId?: string;

  functionIdentifier?: string;
  errorCode?: string;
  projectId?: string;

  pubSubClient?: PubSub;
  errorTopic?: string;

  correlationId?: string;
  apifsSecretHeader?: string;
  apifsSecretValue?: string;

  bigQueryClient?: BigQuery;
  bqDatasetId?: string;
  bqTableId?: string;

  sqlPool?: Pool;
  sqlConnectionName?: string;
  sqlDatabaseName?: string;
  sqlPassword?: string;
  sqlUsername?: string;
  sqlMaxConnections?: number;
}
