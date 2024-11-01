import token from "../Entities/token";
import ILexicalAnalysis from "../Interfaces/ILexicalAnalysis";

//With line identification
export default class LexicalAnalysisService implements ILexicalAnalysis
{
    constructor(){}

    async generateTokenList(symbols: Object, code: string): Promise<token[]> {

        //Creating Regular Expression from Symbols object
        const listOfRegex = Object.values(symbols).map((regex:RegExp)=>regex.source);
        const languageRegex = new RegExp(`${listOfRegex.join('|')}`, 'ig');
        console.log(languageRegex);

        //Separating Code into Lines
        const lines = code.match(/[^\n]+/ig); 
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
    
                //Insert token
                const newToken: token = 
                {
                    lexema: separatedElement,
                    classification,
                    line: lineIndex+1
                }
                answer.push(newToken);
            });

        });

        return answer;
    }
    
}