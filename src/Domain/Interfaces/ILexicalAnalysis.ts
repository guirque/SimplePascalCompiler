import token from "../Entities/token";

export default interface ILexicalAnalysis
{
    generateTokenList(symbols: Object, code:string) : Promise<token[]> 
}