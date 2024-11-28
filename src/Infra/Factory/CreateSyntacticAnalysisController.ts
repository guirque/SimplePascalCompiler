import simplePascalSymbols from "../../Domain/Entities/Symbols";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import SyntacticAnalysisService from "../../Domain/Services/syntacticAnalysisService";
import SyntacticAnalysisController from "../../Presentation/Controllers/SyntacticAnalysisController";

export default async function CreateSyntacticAnalysisController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    const SyntacticService: ISyntacticAnalysis = new SyntacticAnalysisService();
    return new SyntacticAnalysisController(simplePascalSymbols, lexicalService, SyntacticService);
}