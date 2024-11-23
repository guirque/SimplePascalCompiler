import token from "../Entities/token";
import ILexicalAnalysis from "../Interfaces/ILexicalAnalysis";
import log from "../Interfaces/Log";

//With line identification
export default class LexicalAnalysisService implements ILexicalAnalysis
{
    constructor(){}

    async generateTokenList(symbols: Object, code: string, logObj: log): Promise<token[]> {

        console.log("<Lexical> Running...");

        //Creating Regular Expression from Symbols object
        const listOfRegex = Object.values(symbols).map((regex:RegExp)=>regex.source);
        const languageRegex = new RegExp(`${listOfRegex.join('|')}`, 'ig');
        //console.log(languageRegex);

        //Separating Code into Lines
        let lines = code.split('\n');

        //Matching Lines Against Regular Expression
        const separatedElements = lines?.map((lineOfCode) => lineOfCode.match(languageRegex)); //lines with separated elements

        let answer: token[] = [];

        //For each element, classify it and insert it in token list
        const symbolsList = Object.entries(symbols);
        separatedElements?.forEach((line, lineIndex) => 
        {
            line?.forEach((separatedElement) =>
            {
                let classification = 'ERROR';
                //Find classification
                symbolsList.find((pair:[string, RegExp])=>{
                    if(pair[1].test(separatedElement))
                        {
                            classification = pair[0];
                            return true;
                        }
                });

                //console.log(`tried ${separatedElement} and got ${classification}`);
    
                //Insert token
                const newToken: token = 
                {
                    lexema: separatedElement,
                    classification,
                    line: lineIndex+1
                }
                if(newToken.classification == 'ERROR')
                    logObj.errors.push(`<Lexical> Unknown token '${newToken.lexema}', at line ${newToken.line}`);

                answer.push(newToken);
            });

        });

        return answer;
    }
    
}