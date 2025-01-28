import table, { tableData } from "../Entities/Table";
import token from "../Entities/token";
import tree from "../Entities/tree";
import log from "./Log";

export default interface IIntermediaryCode
{
    generateIntermediaryCode(symbolTree: tree, tableObj: tableData[], msgObj: log) : Promise<any>
}