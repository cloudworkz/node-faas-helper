import { PubSub } from "@google-cloud/pubsub";
import * as express from "express";

import { FunctionOptions } from "./interfaces/FunctionOptions";
import ErrorHandler from "./ErrorHandler";
import ConfigReader from "./ConfigReader";

export default class GCFHelper {

    public readonly functionOptions: FunctionOptions;
    public readonly errorHandler: ErrorHandler;

    constructor(functionOptions: FunctionOptions | undefined | null) {
        this.functionOptions = ConfigReader.adaptConfig(functionOptions || {});
        this.errorHandler = new ErrorHandler(this);
        this.postInitialisation();
    }

    private postInitialisation() {

        // check if we can cover the pubsub client instance automatically
        if (this.functionOptions.errorTopic &&
            !this.functionOptions.pubSubClient &&
            this.functionOptions.projectId) {
            this.functionOptions.pubSubClient = new PubSub({
                projectId: this.functionOptions.projectId,
            });
        }
    }

    public async handleError(error: Error, eventPayload: any) {

        const errorPayload = this.errorHandler.generateErrorPayload(error, eventPayload);
        const gcfError = this.errorHandler.generateErrorFromErrorPayload(errorPayload);

        if (this.canPublish()) {
            await this.functionOptions.pubSubClient!
            .topic(this.functionOptions.errorTopic!)
            .publish(Buffer.from(JSON.stringify(errorPayload)));
        }

        throw gcfError;
    }

    public async validateRequestAuthorization(request: express.Request): Promise<> {
        
    }

    private isRequestAuthorizationValid(request: express.Request): number {

        if (!this.functionOptions.apifsSecretHeader || !this.functionOptions.apifsSecretValue) {
            return 0;
        }

        if (!request || !request.headers) {
            return 1;
        }

        const header = request.headers[this.functionOptions.apifsSecretHeader];
        if (!header) {
            return 2;
        }

        if (header !== this.functionOptions.apifsSecretValue) {
            return 3;
        }

        return 0;
    }

    private canPublish() {
        return this.functionOptions.pubSubClient && this.functionOptions.errorTopic;
    }
}
