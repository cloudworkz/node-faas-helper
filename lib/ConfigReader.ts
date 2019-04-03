import { FunctionOptions } from "./interfaces/FunctionOptions";

const DEFAULT_ERROR_CODE = "GCFError";
const DEFAULT_CORRELATION_ID_HEADER = "correlation-id";
const DEFAULT_SECRET_HEADER = "apifs-secret";
const DEFAULT_KMS_ENABLED = false;
const DEFAULT_SQL_MAX_CONNECTIONS = 1;

export default class ConfigReader {
  private static getEnvVar(key: string): string | undefined {
    return typeof process.env[key] !== "undefined"
      ? (process.env[key] as string)
      : undefined;
  }

  private static loadKmsClient(
    functionOptions: FunctionOptions,
  ): Promise<boolean> {
    // check if we can cover the kms client instance automatically
    if (
      functionOptions.kmsEnabled &&
      !functionOptions.kmsClient &&
      functionOptions.projectId &&
      functionOptions.locationId &&
      functionOptions.keyRingId &&
      functionOptions.cryptoKeyId
    ) {
      return import("@google-cloud/kms")
        .then((packageImport) => {
          const { KeyManagementServiceClient } = packageImport;
          functionOptions.kmsClient = new KeyManagementServiceClient();
          return true;
        })
        .catch((_) => false);
    }

    if (functionOptions.kmsClient) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  private static async decrypt(
    functionOptions: FunctionOptions,
    ciphertext?: string,
  ): Promise<string | undefined> {
    if (
      !ciphertext ||
      !functionOptions.kmsEnabled ||
      !functionOptions.kmsClient ||
      !functionOptions.projectId ||
      !functionOptions.locationId ||
      !functionOptions.keyRingId ||
      !functionOptions.cryptoKeyId
    ) {
      return ciphertext;
    }
    const name = functionOptions.kmsClient.cryptoKeyPath(
      functionOptions.projectId,
      functionOptions.locationId,
      functionOptions.keyRingId,
      functionOptions.cryptoKeyId,
    );
    const [result] = await functionOptions.kmsClient.decrypt({
      name,
      ciphertext,
    });

    return result.plaintext.toString();
  }

  public static async adaptConfig(
    functionOptions: FunctionOptions,
  ): Promise<FunctionOptions> {
    if (!functionOptions.errorCode) {
      functionOptions.errorCode = DEFAULT_ERROR_CODE;
    }

    if (!functionOptions.correlationId) {
      functionOptions.correlationId = DEFAULT_CORRELATION_ID_HEADER;
    }

    if (!functionOptions.projectId) {
      functionOptions.projectId = ConfigReader.getEnvVar("PROJECT_ID");
    }

    if (!functionOptions.locationId) {
      functionOptions.locationId = ConfigReader.getEnvVar("LOCATION_ID");
    }

    if (!functionOptions.keyRingId) {
      functionOptions.keyRingId = ConfigReader.getEnvVar("KEYRING_ID");
    }

    if (!functionOptions.cryptoKeyId) {
      functionOptions.cryptoKeyId = ConfigReader.getEnvVar("CRYPTOKEY_ID");
    }

    if (!functionOptions.kmsEnabled) {
      functionOptions.kmsEnabled =
        ConfigReader.getEnvVar("KMS_ENABLED") === "true" || DEFAULT_KMS_ENABLED;
    }
    await this.loadKmsClient(functionOptions);

    if (!functionOptions.apifsSecretHeader) {
      functionOptions.apifsSecretHeader =
        ConfigReader.getEnvVar("APIFS_SECRET_HEADER") || DEFAULT_SECRET_HEADER;
    }

    if (!functionOptions.apifsSecretValue) {
      functionOptions.apifsSecretValue = await this.decrypt(
        functionOptions,
        ConfigReader.getEnvVar("APIFS_SECRET"),
      );
    }

    if (!functionOptions.functionIdentifier) {
      functionOptions.functionIdentifier = ConfigReader.getEnvVar(
        "FUNCTION_ID",
      );
    }

    if (!functionOptions.errorTopic) {
      functionOptions.errorTopic = ConfigReader.getEnvVar("ERROR_TOPIC");
    }

    if (!functionOptions.bqDatasetId) {
      functionOptions.bqDatasetId = ConfigReader.getEnvVar("DATASET_ID");
    }

    if (!functionOptions.bqTableId) {
      functionOptions.bqTableId = ConfigReader.getEnvVar("TABLE_ID");
    }

    if (!functionOptions.sqlConnectionName) {
      functionOptions.sqlConnectionName = ConfigReader.getEnvVar(
        "SQL_CONNECTION_NAME",
      );
    }

    if (!functionOptions.sqlDatabaseName) {
      functionOptions.sqlDatabaseName = ConfigReader.getEnvVar(
        "SQL_DATABASE_NAME",
      );
    }

    if (!functionOptions.sqlUsername) {
      functionOptions.sqlUsername = ConfigReader.getEnvVar("SQL_USERNAME");
    }

    if (!functionOptions.sqlPassword) {
      functionOptions.sqlPassword = await this.decrypt(
        functionOptions,
        ConfigReader.getEnvVar("SQL_PASSWORD"),
      );
    }

    if (!functionOptions.sqlMaxConnections) {
      const maxConnections = ConfigReader.getEnvVar("SQL_MAX_CONNECTIONS");
      if (maxConnections && !isNaN(parseInt(maxConnections, 10))) {
        functionOptions.sqlMaxConnections =
          parseInt(maxConnections, 10) || DEFAULT_SQL_MAX_CONNECTIONS;
      } else {
        functionOptions.sqlMaxConnections = DEFAULT_SQL_MAX_CONNECTIONS;
      }
    }

    return functionOptions;
  }
}
