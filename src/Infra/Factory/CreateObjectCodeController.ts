import simplePascalSymbols from "../../Domain/Entities/Symbols";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import IObjectCode from "../../Domain/Interfaces/IObjectCode";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import ObjectCodeService from "../../Domain/Services/objectCodeService";
import SemanticAnalysisService from "../../Domain/Services/semanticAnalysisService";
import SyntacticAnalysisService from "../../Domain/Services/syntacticAnalysisService";
import ObjectCodeController from "../../Presentation/Controllers/ObjectCodeController";

export default async function CreateObjectCodeController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    const syntacticService: ISyntacticAnalysis = new SyntacticAnalysisService();
    const semanticService: ISemanticAnalysis = new SemanticAnalysisService();
    const objectCodeService: IObjectCode = new ObjectCodeService();
    return new ObjectCodeController(simplePascalSymbols, lexicalService, syntacticService, semanticService, objectCodeService);
}