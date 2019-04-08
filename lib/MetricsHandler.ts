import GCFHelper from "./GCFHelper";
import { Metric } from "./interfaces/Metric";

export default class MetricsHandler {

    private readonly gcfHelper: GCFHelper;
    private buffer: Metric[];
    private timeout: any;

    constructor(gcfHelper: GCFHelper) {
        this.gcfHelper = gcfHelper;
        this.buffer = [];
        this.timeout = null;
    }

    public increment(metricName: string, value: number = 1, labels: { [labelName: string]: string } = {}) {

        const metric: Metric = {
            type: "counter",
            metric: metricName,
            value,
            labels,
        };

        this.buffer.push(metric);
        this.flushOrSpawn();
    }

    public set(metricName: string, value: number = 0, labels: { [labelName: string]: string } = {}) {

        const metric: Metric = {
            type: "gauge",
            metric: metricName,
            value,
            labels,
        };

        this.buffer.push(metric);
        this.flushOrSpawn();
    }

    public kill() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    private flushOrSpawn() {

        const ftms = this.gcfHelper.functionOptions.metricsFlushTimeoutMs;
        if (!ftms || ftms < 0) {
            this.flush(); // promise ignored
            return;
        }

        // timeout already running
        if (this.timeout !== null) {
            return;
        }

        this.timeout = setTimeout(() => {
            this.flush(); // promise ignored
            this.timeout = null;
        }, ftms);
    }

    private async flush() {

        // expects await this.gcfHelper.ensureMetricsReady() to be called first

        try {
            if (!this.buffer.length) {
                return;
            }

            const readBuffer = Buffer.from(JSON.stringify(this.buffer));
            this.buffer = [];

            await this.gcfHelper.functionOptions
                .pubSubClient!.topic(this.gcfHelper.functionOptions.metricsTopic!)
                .publish(readBuffer);

        } catch (error) {
            console.log(`Failed to publish metrics to pubsub topic: ${error.message}.`);
        }
    }
}
