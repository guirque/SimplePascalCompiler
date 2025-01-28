import { Router } from "express";

import CreateIntermediaryCodeController from "./Infra/Factory/CreateIntermediaryCodeController";
import CreateLexicalAnalysisController from "./Infra/Factory/CreateLexicalAnalysisController";
import CreateSemanticAnalysisController from "./Infra/Factory/CreateSemanticAnalysisController";
import CreateSyntacticAnalysisController from "./Infra/Factory/CreateSyntacticAnalysisController";

const router = Router();

router.get('/', (req, res) => {
    res.send("<h1>Testing</h1>");
});

router.post('/LexicalAnalysis', async (req, res) => {(await CreateLexicalAnalysisController()).execute(req, res);});

router.post('/SyntacticAnalysis', async (req, res) => {(await CreateSyntacticAnalysisController()).execute(req, res);})

router.post('/SemanticAnalysis', async (req, res) => {(await CreateSemanticAnalysisController()).execute(req, res);});

router.post('/IntermediaryCode', async (req, res) => {(await CreateIntermediaryCodeController()).execute(req, res);});

export default router;