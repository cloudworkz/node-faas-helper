import { FunctionOptions } from "./interfaces/FunctionOptions";
import ErrorHandler from "./ErrorHandler";

const DEFAULT_ERROR_CODE = "GCFError";

export default class GCFHelper {

    public readonly functionOptions: FunctionOptions;
    public readonly errorHandler: ErrorHandler;

    constructor(functionOptions: FunctionOptions) {

        if(!functionOptions.errorCode) {
            functionOptions.errorCode = DEFAULT_ERROR_CODE;
        }

        this.functionOptions = functionOptions;
        this.errorHandler = new ErrorHandler(this);
    }

    public async handleError(error: Error, eventPayload: any) {

        const errorPayload = this.errorHandler.generateErrorPayload(error, eventPayload);
        const gcfError = this.errorHandler.generateErrorFromErrorPayload(errorPayload);

        if(this.canPublish()) {
            await this.functionOptions.pubSubClient!
            .topic(this.functionOptions.errorTopic!)
            .publish(Buffer.from(JSON.stringify(errorPayload)));
        }

        throw gcfError;
    }

    private canPublish(){
        return this.functionOptions.pubSubClient && this.functionOptions.errorTopic;
    }
}