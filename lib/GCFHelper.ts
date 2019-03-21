import * as express from "express";

import { FunctionOptions } from "./interfaces/FunctionOptions";
import ErrorHandler from "./ErrorHandler";
import ConfigReader from "./ConfigReader";

export default class GCFHelper {

    public readonly functionOptions: FunctionOptions;
    private readonly errorHandler: ErrorHandler;

    constructor(functionOptions: FunctionOptions | undefined | null) {
        this.functionOptions = ConfigReader.adaptConfig(functionOptions || {});
        this.errorHandler = new ErrorHandler(this);
    }

    public async handleError(error: Error, eventPayload?: any) {

        // prevent people from putting thrown errors back into this lib
        // because that will end in endless error handling loops and pubsub messages
        if (this.errorHandler.isGCFHelperError(error)) {
            return;
        }

        const errorPayload = this.errorHandler.generateErrorPayload(error, eventPayload);
        const gcfError = this.errorHandler.generateErrorFromErrorPayload(errorPayload);

        if (await this.hasPubSubClient() && this.canPublish()) {

            // throw clean
            await this.functionOptions.pubSubClient!
                .topic(this.functionOptions.errorTopic!)
                .publish(Buffer.from(JSON.stringify(errorPayload)));

            throw gcfError;
        } else {
            // we cannot handle the shortened version of our gcf error logic
            // because we cannot publish it, thats why we have to throw the original one
            throw error;
        }
    }

    public async validateAPIFSRequest(request: express.Request, eventPayload?: any): Promise<void> {

        const resultCode = this.isRequestAuthorizationValid(request);
        if (resultCode !== 0) {
            await this.handleError(new Error("Invalid apifs authentication secret."), eventPayload);
        }

        // secret okay, continue
    }

    public async writeBigQueryRows(rows: any[],
                                   etl?: (row: any) => {[key: string]: any}, eventPayload?: any): Promise<void> {

        if (!rows || !rows.length) {
            return;
        }

        if (await this.hasBigQueryClient() && this.canWriteToBigQuery()) {
            try {
                await this.functionOptions.bigQueryClient!
                    .dataset(this.functionOptions.bqDatasetId!)
                    .table(this.functionOptions.bqTableId!)
                    .insert(etl ? rows.map(etl) : rows);
            } catch (error) {
                await this.handleError(error, eventPayload ? eventPayload : rows);
            }
        } else {
            // throw clean
            throw new Error("Cannot write to big query, because preconditions are missing to setup the client.");
        }
    }

    public getPubSubDataFromEvent(event: any): any {

        if (!event || !event.data) {
            return null;
        }

        let asString = "";
        try {
            asString = Buffer
                .from(event.data, "base64")
                .toString();
        } catch (_) {
            return asString;
        }

        try {
            return JSON.parse(asString);
        } catch (_) {
            return asString;
        }
    }

    public getConfig() {
        return this.functionOptions;
    }

    private hasPubSubClient(): Promise<boolean> {

        // check if we can cover the pubsub client instance automatically
        if (this.functionOptions.errorTopic &&
            !this.functionOptions.pubSubClient &&
            this.functionOptions.projectId) {
                return import("@google-cloud/pubsub").then((packageImport) => {
                    const { PubSub } = packageImport;
                    this.functionOptions.pubSubClient = new PubSub({
                        projectId: this.functionOptions.projectId,
                    });
                    return true;
                }).catch((_) => false);
        }

        if (this.functionOptions.pubSubClient) {
            return Promise.resolve(true);
        } else {
            return Promise.resolve(false);
        }
    }

    private hasBigQueryClient(): Promise<boolean> {

        // check if we can cover the bigquery client instance automatically
        if (!this.functionOptions.bigQueryClient &&
            this.functionOptions.projectId) {
                return import("@google-cloud/bigquery").then((packageImport) => {
                    const { BigQuery } = packageImport;
                    this.functionOptions.bigQueryClient = new BigQuery({
                        projectId: this.functionOptions.projectId,
                    });
                    return true;
                }).catch((_) => false);
        }

        if (this.functionOptions.bigQueryClient) {
            return Promise.resolve(true);
        } else {
            return Promise.resolve(false);
        }
    }

    private isRequestAuthorizationValid(request: express.Request): number {

        if (!this.functionOptions.apifsSecretHeader || !this.functionOptions.apifsSecretValue) {
            // throw clean
            throw new Error("You have not configured an apifs secret value.");
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

    private canWriteToBigQuery() {
        return this.functionOptions.bigQueryClient &&
            this.functionOptions.bqDatasetId &&
            this.functionOptions.bqTableId;
    }
}
