import { Request, Response } from "express";

import tree from "../../Domain/Entities/tree";
import Controller from "../../Domain/Interfaces/Controller";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import log from "../../Domain/Interfaces/Log";
import compilationResponse from "../../Domain/Interfaces/CompilationResponse";

export default class SyntacticAnalysisController implements Controller
{
    constructor(private symbols: Object, private lexicalService: ILexicalAnalysis, private SyntacticService: ISyntacticAnalysis){};

    async execute(req: Request, res: Response): Promise<any> {

       let code:string = req?.body?.code;
       if(code) code = JSON.parse(code);
       let logObj: log = {errors: [], warnings: []};
       let answer: compilationResponse;

       const tokenList = code ? await this.lexicalService.generateTokenList(this.symbols, code, logObj) : [];
       const symbolTree: tree|[] = tokenList ? await this.SyntacticService.generateSymbolTree(this.symbols, tokenList, logObj): [];


       answer = {
        lexical: tokenList,
        syntatic: symbolTree,
        semantic: undefined,
        errors: logObj.errors,
        warnings: logObj.warnings
       }

       return res.status(200).send(answer);
    }   
}