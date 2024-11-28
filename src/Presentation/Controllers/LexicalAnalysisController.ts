import { Request, Response } from "express";

import compilationResponse from "../../Domain/Interfaces/CompilationResponse";
import Controller from "../../Domain/Interfaces/Controller";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import log from "../../Domain/Interfaces/Log";

export default class LexicalAnalysisController implements Controller
{
    constructor(private symbols: Object, private lexicalService: ILexicalAnalysis){};

    async execute(req: Request, res: Response): Promise<any> {

        let code:string = req?.body?.code;
        let answer: compilationResponse;

       if(code) code = JSON.parse(code);

       let logObj: log = {errors: [], warnings: []};
       const tokenList = code ? await this.lexicalService.generateTokenList(this.symbols, code, logObj) : [];

       answer = 
       {
            lexical: tokenList,
            errors: logObj.errors,
            warnings: logObj.warnings
       }
       return res.status(200).send(answer);
    }   
}