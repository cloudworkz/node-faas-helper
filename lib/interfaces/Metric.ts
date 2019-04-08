export interface Metric {
    metric: string;
    type: "counter" | "gauge";
    value: number;
    labels: { [labelName: string]: string };
}
