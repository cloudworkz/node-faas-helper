import * as uuid from "uuid";
import GCFHelper from "./GCFHelper";
import { ErrorPayload } from "./interfaces/ErrorPayload";

const NO_ERROR_PROVIDED = "No error provided.";
const NO_ERROR_MESSAGE = "No error message provided.";
const NO_ERROR_STACK = "No error stack provided.";

export default class ErrorHandler {

    private readonly gcfHelper: GCFHelper;

    constructor(gcfHelper: GCFHelper) {
        this.gcfHelper = gcfHelper;
    }

    public generateErrorPayload(error: Error, eventPayload: any): ErrorPayload {

        if (!error || typeof error !== "object") {
            error = {
                name: "Missing",
                message: NO_ERROR_PROVIDED,
            };
        }

        return {
            error_id: uuid.v4(),
            function_id: this.gcfHelper.functionOptions.functionIdentifier,
            error_message: JSON.stringify({
                name: error.name,
                message: error.message || NO_ERROR_MESSAGE,
                stack: error.stack || NO_ERROR_STACK,
            }),
            payload: typeof eventPayload !== "string" ?
                JSON.stringify(eventPayload) :
                eventPayload,
            error_occured_at: Date.now(),
          };
    }

    public generateErrorFromErrorPayload(errorPayload: ErrorPayload): Error {

        const error = new Error(`${this.gcfHelper.functionOptions.errorCode} error occured`
            + `, check error stream for details: ${errorPayload.error_id}.`);

        return error;
    }
}
