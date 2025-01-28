import { Request, Response } from "express";

import { ObjectCode } from "../../Domain/Entities/ObjectCode";
import tree from "../../Domain/Entities/tree";
import compilationResponse from "../../Domain/Interfaces/CompilationResponse";
import Controller from "../../Domain/Interfaces/Controller";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import IObjectCode from "../../Domain/Interfaces/IObjectCode";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import log from "../../Domain/Interfaces/Log";

export default class ObjectCodeController implements Controller
{
    constructor(private symbols: Object, private lexicalService: ILexicalAnalysis, private SyntacticService: ISyntacticAnalysis, private SemanticService: ISemanticAnalysis, private ObjectCodeService: IObjectCode){};

    async execute(req: Request, res: Response): Promise<any> {

       let code:string = req?.body?.code;
       if(code) code = JSON.parse(code);
       let logObj: log = {errors: [], warnings: []};
       let answer: compilationResponse;

       const tokenList = code ? await this.lexicalService.generateTokenList(this.symbols, code, logObj) : [];
       
       if(code) {
            const symbolTree: tree = await this.SyntacticService.generateSymbolTree(this.symbols, tokenList, logObj);

            const table = await this.SemanticService.generateTable(symbolTree, logObj);

            const objectCode: ObjectCode = logObj.errors.length == 0 ? await this.ObjectCodeService.generateObjectCode(symbolTree, table, logObj) : ['ERROR'];

            answer = {
                lexical: tokenList,
                syntactic: symbolTree,
                semantic: table,
                objectCode: objectCode,
                errors: logObj.errors,
                warnings: logObj.warnings
            }
        }
        else
        {
            answer = {
                lexical: tokenList,
                errors: logObj.errors,
                warnings: logObj.warnings
            }
        }

       return res.status(200).send(answer);
    }   
}