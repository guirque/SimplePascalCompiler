import simplePascalSymbols from "../../Domain/Entities/Symbols";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import SemanticAnalysisService from "../../Domain/Services/semanticAnalysisService";
import SyntacticAnalysisService from "../../Domain/Services/syntacticAnalysisService";
import SemanticAnalysisController from "../../Presentation/Controllers/SemanticAnalysisController";

export default async function CreateSemanticAnalysisController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    const syntacticService: ISyntacticAnalysis = new SyntacticAnalysisService();
    const semanticService: ISemanticAnalysis = new SemanticAnalysisService();
    return new SemanticAnalysisController(simplePascalSymbols, lexicalService, syntacticService, semanticService);
}