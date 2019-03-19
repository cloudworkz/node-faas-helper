import { PubSub } from "@google-cloud/pubsub";
export interface FunctionOptions {
    functionIdentifier?: string;
    errorCode?: string;
    pubSubClient?: PubSub;
    errorTopic?: string;
    correlationId?: string;
    projectId?: string;
    apifsSecretHeader?: string;
    apifsSecretValue?: string;
}
