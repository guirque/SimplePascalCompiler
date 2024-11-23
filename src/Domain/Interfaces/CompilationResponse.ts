import token from "../Entities/token";

export default interface compilationResponse
{
    lexical: token[],
    syntatic: any,
    semantic: any,
    errors?: string[],
    warnings?: string[]
}