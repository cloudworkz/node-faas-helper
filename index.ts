import GCFHelper from "./lib/GCFHelper";
import { FunctionOptions } from "./lib/interfaces/FunctionOptions";
export default GCFHelper;
export { GCFHelper }; // faked object export
export const setup = ((options: FunctionOptions) => new GCFHelper(options));
