import { PubSub } from "@google-cloud/pubsub";
import { BigQuery } from "@google-cloud/bigquery";
export interface FunctionOptions {

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
}
