import simplePascalSymbols from "../../Domain/Entities/Symbols";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import LexicalAnalysisController from "../../Presentation/Controllers/LexicalAnalysisController";

export default async function CreateLexicalAnalysisController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    return new LexicalAnalysisController(simplePascalSymbols, lexicalService);
}