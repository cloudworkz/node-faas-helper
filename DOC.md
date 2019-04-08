# Documentation

## Environment Variables

These "auto-fill" the `functionOptions` that have to be passed to `GCFHelper`.

| Environment Variable | Default        | Description                             | Auto-decrypt |
| -------------------- | -------------- | --------------------------------------- | ------------ |
| APIFS_SECRET_HEADER  | `apifs-secret` | Auth header                             | ❌           |
| APIFS_SECRET         | `undefined`    | Auth Secret                             | ✅           |
| FUNCTION_ID          | `undefined`    | Cloud Function ID                       | ❌           |
| PROJECT_ID           | `undefined`    | Google Project ID                       | ❌           |
| ERROR_TOPIC          | `undefined`    | PubSub Error Topic                      | ❌           |
| DATASET_ID           | `undefined`    | BigQuery Dataset                        | ❌           |
| TABLE_ID             | `undefined`    | BigQuery Table                          | ❌           |
| KMS_ENABLED          | `false`        | Use Google Cloud KMS to decrypt secrets | ❌           |
| LOCATION_ID          | `undefined`    | Google Cloud KMS location               | ❌           |
| KEYRING_ID           | `undefined`    | Google Cloud KMS Keyring ID             | ❌           |
| CRYPTOKEY_ID         | `undefined`    | Google Cloud KMS Cryptokey ID           | ❌           |
| SQL_CONNECTION_NAME  | `undefined`    | Cloud SQL Instance Connection Name      | ❌           |
| SQL_DATABASE_NAME    | `undefined`    | Cloud SQL Database Name                 | ❌           |
| SQL_USERNAME         | `undefined`    | Cloud SQL Database Username             | ❌           |
| SQL_PASSWORD         | `undefined`    | Cloud SQL Database Password             | ✅           |
| METRICS_TOPIC         | `undefined`    | PubSub Metrics Topic                   | ❌           |
| DISABLE_METRICS       | `undefined`    | If metric calls should be ignored      | ❌           |
| METRICS_FLUSH_TIMEOUT | `100`          | ms of time to batch before publishing  | ❌           |

## Using the lib to improve your cloud functions

### 1. Setup

```javascript
const { GCFHelper } = require("gcf-helper");
const gcfHelper = new GCFHelper({});

// alt
const { setup } = require("gcf-helper");
const gcfHelper = setup({});
```

### 2. Handling errors

Make sure to set the following env variables in your function `PROJECT_ID` and `ERROR_TOPIC`.

```javascript
exports.store = async (event, _) => {
  try {
    // stuff you do in your function
  } catch (error) {
    await gcfHelper.handleError(
      error,
      event.data /* you can pass any kind of additional payload here, optional */
    );
  }
};
```

**Note:** The lib will throw again, which is why you should make sure to not handle that error afterwards.
But it will only throw a small error message with a small footprint and an identifier that can be
used to identify the error at a later time. The actual error is then produced to the passed errorTopic
on pubsub. Our best practice approach is to store these errors in a BigQuery table.

The error payload looks like this:

```javascript
export interface ErrorPayload {
  error_id: string;
  function_id: string;
  error_message: string;
  payload: string;
  error_occured_at: number;
}
```

### 3. Validating HTTP requests

This works best if you are using [apifs-gateway](https://github.com/google-cloud-tools/node-faas-gateway)
to actually trigger your functions.

Make sure to set the following env variables in your function `APIFS_SECRET` and `PROJECT_ID` and `ERROR_TOPIC`.
**Also note:** That you should not try to handle any errors from the functions of this lib, they are handeled internally.
Especially do not catch an exception from a function of this lib and pass it to `gcfHelper.handleError()` this will
result in a throw loop.

```javascript
exports.retrieve = async (req, res) => {
  await gcfHelper.validateAPIFSRequest(
    req,
    null /* you can pass any kind of additional payload here, optional */
  );
  try {
    // do your stuff here
  } catch (error) {
    await gcfHelper.handleError(error);
  }
};
```

The call above will throw an exception and end your function if the secret is not provided or not correct.
However you might want to handle the response yourself or you might simply do not want to throw errors
when secrets are wrong. There is an alternative call for that:

```javascript
exports.retrieve = async (req, res) => {
  if (!gcfHelper.validateAPIFSRequestNoError(req, res)) {
    return;
  }

  try {
    // do your stuff here
  } catch (error) {
    await gcfHelper.handleError(error);
  }
};
```

If you pass a response to `validateAPIFSRequestNoError` it will be used to send back status 403 with a JSON error
message, this parameter is optional. This function will return false if the secret is missing or invalid, please
also note that it is not async.

### 4. Storing rows in BigQuery

Make sure to set the following env variables in your function `DATASET_ID` and `TABLE_ID` and `PROJECT_ID` and `ERROR_TOPIC`.
You do not have to handle the errors. We are using the streaming API of BigQuery and will fail on partial insert errors
or bad row schemas.

```javascript
exports.store = async (event, _) => {
  const rows = event.data; // turn data into rows..

  // some optional etl magic that is applied to every row before insert
  const etl = row => {
    return { ...row, additional_column: Date.now() };
  };

  await gcfHelper.writeBigQueryRows(
    rows,
    etl,
    null, /* you can pass any kind of additional payload here, optional */
    undefined, /* you can pass an optional dataset name here, else DATASET_ID will be used */
    undefined, /* you can pass an optional table name here, else TABLE_ID will be used */
  );
};
```

### 5. Parse pubsub events

Requires no env variables.
**Note:** However requires your event data to contain serialised JSON data.

```javascript
exports.store = async (event, _) => {
  const parsed = gcfHelper.getPubSubDataFromEvent(event);
  // do something
};
```

### 6. Using cloud sql

Make sure to set the following env variables in your function `SQL_CONNECTION_NAME` and `SQL_DATABASE_NAME` and `SQL_USERNAME` and `SQL_PASSWORD`.

```javascript
exports.store = async (event, _) => {
  await gcfHelper.sqlQuery("SELECT $1::text as message", ["Hello world!"]);
  // do something
};
```

### 7. Using KMS

Make sure to set the following env variables in your function `PROJECT_ID` and `KMS_ENABLED` and `LOCATION_ID` and `KEYRING_ID` and `CRYPTOKEY_ID`.
If you enable KMS certain environment variables will automatically be decrypted, check the table at the top of this file.

### 8. Creating custom metrics (Google Cloud Functions to Prometheus/Grafana)

Make sure to set the following env variables in your function `PROJECT_ID` and `METRICS_TOPIC`.

When using [RoachStorm](https://github.com/nodefluent/roach-storm) to handle Prometheus metrics from pubsub subscriptions,
you can use the following helper methods to create custom metrics (counters, gauges) in your functions.

Metrics are batched internally by default, to decrease the amount of pubsub events as well as traffic that is required.
You can controll the buffer flush timeout via `METRICS_FLUSH_TIMEOUT`. If you set it to null, 0 or -1 every metric
is immediately published to the pubsub topic.

```javascript
exports.store = async (event, _) => {
  // do something
  await gcfHelper.metricsIncCounter("my_counter", 1, { someLabel: "labelValue" });
  await gcfHelper.metricsSetGauge("my_gauge", 55, { someLabel: "labelValue" });
  // do something
};
```

### 9. Kill any running (currently awaited) operation to end function

In case you should need this, which you should not.
You can use this method to end any running operation.

```javascript
exports.store = async (event, _) => {
  // do something
  gcfHelper.kill();
};
```