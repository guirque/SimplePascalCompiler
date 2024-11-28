import token from "../Entities/token";
import tree from "../Entities/tree";
import log from "./Log";

export default interface ISyntacticAnalysis
{
    generateSymbolTree(symbols: Object, tokenList: token[], msgObj: log) : Promise<tree>
}