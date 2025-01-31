import { Request, Response } from "express";

import { IntermediaryCode } from "../../Domain/Entities/IntermediaryCode";
import tree from "../../Domain/Entities/tree";
import compilationResponse from "../../Domain/Interfaces/CompilationResponse";
import Controller from "../../Domain/Interfaces/Controller";
import IIntermediaryCode from "../../Domain/Interfaces/IIntermediaryCode";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import IRunningSimulation from "../../Domain/Interfaces/IRunningSimulation";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import log from "../../Domain/Interfaces/Log";

export default class IntermediaryCodeController implements Controller
{
    constructor(private symbols: Object, private lexicalService: ILexicalAnalysis, private SyntacticService: ISyntacticAnalysis, private SemanticService: ISemanticAnalysis, private IntermediaryCodeService: IIntermediaryCode, private runningSimulationService: IRunningSimulation){};

    async execute(req: Request, res: Response): Promise<any> {
       let code:string = req?.body?.code;
       if(code) code = JSON.parse(code);
       let logObj: log = {errors: [], warnings: []};
       let answer: compilationResponse;
       const tokenList = code ? await this.lexicalService.generateTokenList(this.symbols, code, logObj) : [];

       try
       {
 
       if(code) {
            const symbolTree: tree = await this.SyntacticService.generateSymbolTree(this.symbols, tokenList, logObj);

            const table = await this.SemanticService.generateTable(symbolTree, logObj);
            let intermediaryCode: IntermediaryCode = ['ERROR'];
            if(logObj.errors.length == 0)
            {
                intermediaryCode = logObj.errors.length == 0 ? await this.IntermediaryCodeService.generateIntermediaryCode(symbolTree, table, logObj) : ['ERROR'];
    
                if(!logObj.console) logObj.console = [];
                if(intermediaryCode.length != 0) this.runningSimulationService.run(intermediaryCode, logObj);
    
            }
            answer = {
                lexical: tokenList,
                syntactic: symbolTree,
                semantic: table,
                intermediaryCode: intermediaryCode,
                errors: logObj.errors,
                warnings: logObj.warnings,
                console: logObj.console
            }
        }
        else
        {
            answer = {
                lexical: tokenList,
                errors: logObj.errors,
                warnings: logObj.warnings
            }
            
            return res.status(200).send(answer);
        }
        }
        catch(error)
        {
            console.log(error);
            answer = {
                lexical: tokenList,
                errors: [...logObj.errors, `<Server> There was an internal server error.`]
            }
        }
        return res.status(500).send(answer);
    }   
}