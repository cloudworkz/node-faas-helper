# gcf-helper CHANGELOG

## 2019-04-08, Version 0.9.0

* added optional parameter to define table in bigquery write method
* added metrics functionality in roach-storm formatting

## 2019-03-21, Version 0.4.0-0.8.0

* added lazy loading of pubsub client
* added lazy loading of bigquery client
* added `writeBigQueryRows` method
* added `getPubSubDataFromEvent` method
* added `setup` export for ease of use
* added unit test
* added documentation to describe helping options
* skipping empty rows for bq
* fixed missing return statements
* added `validateAPIFSRequestNoError` to respond without exception

## 2019-03-19, Version 0.2.0-0.3.0

* reading default FunctionOptions from environment variables (see DOC.md)
* auto handling of pubsub instance if possible
* added `validateRequestAuthorization` method for http functions

## 2019-03-15, Version 0.1.0

* Initial release with changelog