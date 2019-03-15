import {PubSub} from "@google-cloud/pubsub";
export interface FunctionOptions {
    functionIdentifier: string;
    errorCode?: string;
    pubSubClient?: PubSub;
    errorTopic?: string;
}
