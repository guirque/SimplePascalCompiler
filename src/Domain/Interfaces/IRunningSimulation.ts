import { IntermediaryCode } from "../Entities/IntermediaryCode";
import log from "./Log";

export default interface IRunningSimulation
{
    run(intermediaryCode: IntermediaryCode, logObj:log):void
}