import token from "../Entities/token";
import tree from "../Entities/tree";
import log from "./Log";

export default interface ISemanticAnalysis
{
    generateTable(symbolTree: tree, msgObj: log) : Promise<any>
}