import token from "../Entities/token";
import log from "./Log";

export default interface ILexicalAnalysis
{
    generateTokenList(symbols: Object, code:string, msgObj: log) : Promise<token[]> 
}