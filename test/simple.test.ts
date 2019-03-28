import * as chai from "chai";
import GCFHelper, { setup } from "..";
import * as chaiAsPromised from "chai-as-promised";
import ConfigReader from "../lib/ConfigReader";
chai.use(chaiAsPromised);
const { expect } = chai;

const publishedMessages = [];
const fakePubSubClient: any = {
  topic: (topic: string) => {
    return {
      publish: (message: string) => {
        publishedMessages.push({ topic, message });
      },
    };
  },
};

const writtenRows = [];
const fakeBigQueryClient: any = {
  dataset: (dataset: string) => {
    return {
      table: (table: string) => {
        return {
          insert: (rows: any) => {
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

const fakeExpressRequest: any = {
  headers: {
    "apifs-secret": "123123123",
  },
};

const fakeBadExpressRequest: any = {
  headers: {
    "apifs-secret": "badsecret",
  },
};

describe("Unit Test", () => {
  let gcfHelperNoConfig: GCFHelper | null = null;
  let gcfHelper: GCFHelper | null = null;

  before(async () => {
    process.env.PROJECT_ID = "test_project";
    process.env.APIFS_SECRET = "123123123";
    gcfHelperNoConfig = setup();
    gcfHelper = setup({
      pubSubClient: fakePubSubClient,
      bigQueryClient: fakeBigQueryClient,
      errorTopic: "errors",
      bqDatasetId: "dataset",
      bqTableId: "table",
    });
  });

  it("should be able to see loaded env variables", async () => {
    const config = await ConfigReader.adaptConfig({});
    expect(config.projectId).to.be.equal("test_project");
    expect(config.apifsSecretValue).to.be.equal("123123123");
  });

  it("should be able to handle errors", async () => {
    expect(publishedMessages.length).to.be.equal(0);
    expect(gcfHelperNoConfig!.handleError(new Error("some error lol")))
      .to.eventually.be.rejectedWith(
        new RegExp("^Error: GCFError error occured"),
        "some error lol",
      )
      .and.be.an.instanceOf(Error)
      .and.have.property("message")
      .then(() => expect(publishedMessages.length).to.be.equal(1));
  });

  it("should not throw on parse", async () => {
    expect(gcfHelper!.getPubSubDataFromEvent({ data: null })).to.be.equal(null);
  });

  it("should be able to write bq rows", async () => {
    expect(writtenRows.length).to.be.equal(0);
    expect(gcfHelper!.writeBigQueryRows([{ column1: "value1" }]))
      .eventually.to.be.not.throw()
      .then(() => expect(writtenRows.length).to.be.equal(1));
  });

  it("should see valid apifs request", async () => {
    expect(
      gcfHelper!.validateAPIFSRequest(fakeExpressRequest),
    ).eventually.to.be.not.throw();
  });

  it("should see invalid apifs request", async () => {
    expect(gcfHelper!.validateAPIFSRequest(fakeBadExpressRequest))
      .to.eventually.be.rejectedWith(
        new RegExp("^Error: GCFError error occured"),
      )
      .and.be.an.instanceOf(Error)
      .then(() => expect(publishedMessages.length).to.be.equal(2));
  });
});
