import { Request, Response } from "express";

import Controller from "../../Domain/Interfaces/Controller";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";

export default class LexicalAnalysisController implements Controller
{
    constructor(private symbols: Object, private lexicalService: ILexicalAnalysis){};

    async execute(req: Request, res: Response): Promise<any> {

        const code:string = req?.body?.code;
       console.log("<!> Lexical Analysis Running");
       const tokenList = code ? await this.lexicalService.generateTokenList(this.symbols, code) : [];
       return res.status(200).send(tokenList);
    }   
}