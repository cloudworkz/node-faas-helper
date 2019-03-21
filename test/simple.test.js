"use strict";

const assert = require("assert");
const { setup } = require("./../dist/index.js");

const publishedMessages = [];
const fakePubSubClient = {
    topic: (topic) => {
        return {
            publish: (message) => {
                publishedMessages.push({ topic, message });
            },
        };
    },
};

const writtenRows = [];
const fakeBigQueryClient = {
    dataset: (dataset) => {
        return {
            table: (table) => {
                return {
                    insert: (rows) => {
                        writtenRows.push({
                            dataset,
                            table,
                            rows,
                        });
                    },
                };
            },
        };
    },
};

const fakeExpressRequest = {
    headers: {
        "apifs-secret": "123123123",
    },
};

const fakeBadExpressRequest = {
    headers: {
        "apifs-secret": "badsecret",
    },
};

describe("Unit Test", () => {

    let gcfHelperNoConfig = null;
    let gcfHelper = null;

    before(async () => {

        gcfHelperNoConfig = setup();
        gcfHelper = setup({
            pubSubClient: fakePubSubClient,
            bigQueryClient: fakeBigQueryClient,
            errorTopic: "errors",
            bqDatasetId: "dataset",
            bqTableId: "table",
        });
    });

    after(async () => {});

    it("should be able to see loaded env variables", async () => {
        assert.equal(gcfHelper.getConfig().projectId, "test_project");
        assert.equal(gcfHelperNoConfig.getConfig().projectId, "test_project");
    });

    it("should be able to handle errors", async () => {

        await assert.rejects(async () => 
            gcfHelperNoConfig.handleError(new Error("some error lol"))
        , {
            message: "some error lol",
        });

        assert.equal(publishedMessages.length, 0);

        await assert.rejects(async () => 
            gcfHelper.handleError(new Error("some error lol"))
        , new RegExp("^Error: GCFError error occured"));

        assert.equal(publishedMessages.length, 1);
    });

    it("should not throw on parse", async () => {
        assert.equal(gcfHelper.getPubSubDataFromEvent({data: null}), null);
    });

    it("should be able to write bq rows", async () => {
        
        assert.equal(writtenRows.length, 0);

        await assert.doesNotReject(async () => 
            gcfHelper.writeBigQueryRows([{column1: "value1"}])
        );

        assert.equal(writtenRows.length, 1);
    });

    it("should see valid apifs request", async() => {

        await assert.doesNotReject(async () => 
            gcfHelper.validateAPIFSRequest(fakeExpressRequest)
        );
    });

    it("should see invalid apifs request", async() => {
        
        await assert.rejects(async () => 
            gcfHelper.validateAPIFSRequest(fakeBadExpressRequest),
            new RegExp("^Error: GCFError error occured")
        );

        assert.equal(publishedMessages.length, 2);
    });
});
