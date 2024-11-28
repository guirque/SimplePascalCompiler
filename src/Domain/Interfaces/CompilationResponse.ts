import token from "../Entities/token";
import tree from "../Entities/tree";

export default interface compilationResponse
{
    lexical: token[],
    syntactic?: tree,
    semantic?: any,
    errors?: string[],
    warnings?: string[]
}