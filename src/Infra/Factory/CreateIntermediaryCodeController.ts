import simplePascalSymbols from "../../Domain/Entities/Symbols";
import IIntermediaryCode from "../../Domain/Interfaces/IIntermediaryCode";
import ILexicalAnalysis from "../../Domain/Interfaces/ILexicalAnalysis";
import IRunningSimulation from "../../Domain/Interfaces/IRunningSimulation";
import ISemanticAnalysis from "../../Domain/Interfaces/ISemanticAnalysis";
import ISyntacticAnalysis from "../../Domain/Interfaces/ISyntacticAnalysis";
import IntermediaryCodeService from "../../Domain/Services/intermediaryCodeService";
import LexicalAnalysisService from "../../Domain/Services/lexicalAnalysisService";
import RunningSimulationService from "../../Domain/Services/runningSimulation";
import SemanticAnalysisService from "../../Domain/Services/semanticAnalysisService";
import SyntacticAnalysisService from "../../Domain/Services/syntacticAnalysisService";
import IntermediaryCodeController from "../../Presentation/Controllers/IntermediaryCodeController";

export default async function CreateIntermediaryCodeController()
{
    const lexicalService: ILexicalAnalysis = new LexicalAnalysisService();
    const syntacticService: ISyntacticAnalysis = new SyntacticAnalysisService();
    const semanticService: ISemanticAnalysis = new SemanticAnalysisService();
    const intermediaryCodeService: IIntermediaryCode = new IntermediaryCodeService();
    const runningSimulationService: IRunningSimulation = new RunningSimulationService();
    return new IntermediaryCodeController(simplePascalSymbols, lexicalService, syntacticService, semanticService, intermediaryCodeService, runningSimulationService);
}