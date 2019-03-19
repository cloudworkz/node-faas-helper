import { FunctionOptions } from "./interfaces/FunctionOptions";

const DEFAULT_ERROR_CODE = "GCFError";
const DEFAULT_CORRELATION_ID_HEADER = "correlation-id";
const DEFAULT_SECRET_HEADER = "apifs-secret";

export default class ConfigReader {

    private static getEnvVar(key: string): string | undefined {
        return typeof process.env[key] !== "undefined" ? process.env[key] as string : undefined;
    }

    public static adaptConfig(functionOptions: FunctionOptions): FunctionOptions {

        if (!functionOptions.errorCode) {
            functionOptions.errorCode = DEFAULT_ERROR_CODE;
        }

        if (!functionOptions.correlationId) {
            functionOptions.correlationId = DEFAULT_CORRELATION_ID_HEADER;
        }

        if (!functionOptions.apifsSecretHeader) {
            functionOptions.apifsSecretHeader = ConfigReader.getEnvVar("APIFS_SECRET_HEADER") || DEFAULT_SECRET_HEADER;
        }

        if (!functionOptions.apifsSecretValue) {
            functionOptions.apifsSecretValue = ConfigReader.getEnvVar("APIFS_SECRET");
        }

        if (!functionOptions.functionIdentifier) {
            functionOptions.functionIdentifier = ConfigReader.getEnvVar("FUNCTION_ID");
        }

        if (!functionOptions.projectId) {
            functionOptions.projectId = ConfigReader.getEnvVar("PROJECT_ID");
        }

        if (!functionOptions.errorTopic) {
            functionOptions.errorTopic = ConfigReader.getEnvVar("ERROR_TOPIC");
        }

        return functionOptions;
    }
}
