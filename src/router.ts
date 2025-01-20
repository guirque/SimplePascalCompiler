import { Router } from "express";

import CreateLexicalAnalysisController from "./Infra/Factory/CreateLexicalAnalysisController";
import CreateSyntacticAnalysisController from "./Infra/Factory/CreateSyntacticAnalysisController";
import CreateSemanticAnalysisController from "./Infra/Factory/CreateSemanticAnalysisController";

const router = Router();

router.get('/', (req, res) => {
    res.send("<h1>Testing</h1>");
});

router.post('/LexicalAnalysis', async (req, res) => {(await CreateLexicalAnalysisController()).execute(req, res);});

router.post('/SyntacticAnalysis', async (req, res) => {(await CreateSyntacticAnalysisController()).execute(req, res);})

router.post('/SemanticAnalysis', async (req, res) => {(await CreateSemanticAnalysisController()).execute(req, res);});

export default router;