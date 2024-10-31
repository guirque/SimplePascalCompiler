import { Router } from "express";

import CreateLexicalAnalysisController from "./Infra/Factory/CreateLexicalAnalysisController";

const router = Router();

router.get('/', (req, res) => {
    res.send("<h1>Testing</h1>");
});

router.post('/LexicalAnalysis', async (req, res) => {(await CreateLexicalAnalysisController()).execute(req, res);});

export default router;