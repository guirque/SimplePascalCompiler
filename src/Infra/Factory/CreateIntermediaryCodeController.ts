import simplePascalSymbols from "../../Domain/Entities/Symbols";
import IIntermediaryCode from "../../Domain/Interfaces/IIntermediaryCode";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import IntermediaryCodeService from "../../Domain/Services/intermediaryCodeService";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import SemanticAnalysisService from "../../Domain/Services/semanticAnalysisService";
import SyntacticAnalysisService from "../../Domain/Services/syntacticAnalysisService";
import IntermediaryCodeController from "../../Presentation/Controllers/IntermediaryCodeController";

export default async function CreateIntermediaryCodeController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    const syntacticService: ISyntacticAnalysis = new SyntacticAnalysisService();
    const semanticService: ISemanticAnalysis = new SemanticAnalysisService();
    const intermediaryCodeService: IIntermediaryCode = new IntermediaryCodeService();
    return new IntermediaryCodeController(simplePascalSymbols, lexicalService, syntacticService, semanticService, intermediaryCodeService);
}