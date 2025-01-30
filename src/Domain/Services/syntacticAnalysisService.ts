import token from "../Entities/token";
import tree from "../Entities/tree";
import ISyntacticAnalysis from "../Interfaces/ISyntacticAnalysis";
import log from "../Interfaces/Log";

class first 
{
    constructor() {}
    BLOCO = ['BLOCK_BEGIN'];
    PARAMETRO = ['IDENTIFIER', 'NUMBER', 'BOOLEAN'];
    OP_MAT = ['MAT_OPERATOR'];
    OP_LOGICO  = ['LOGIC_OPERATOR']; 
    OP_COMP = ['COMP_OPERATOR'];
    NOME = ['DOT', 'OPEN_B', 'OPEN_P'];
    PARAM_LOGICO = this.OP_COMP;
    CONSTANTE = ['DECLARATION_CONST'];
    DEF_CONST = this.CONSTANTE;
    DECLARACOES = this.DEF_CONST;
    PROGRAMA = this.DECLARACOES;
    TIPO = ['DECLARATION_TYPE'];
    DEF_TIPOS = this.TIPO;
    VARIAVEL = ['VARIABLE'];
    DEF_VAR = this.VARIAVEL;
    ROTINA = ['FUNCTION', 'PROCEDURE'];
    DEF_ROTINA = this.ROTINA;
    LISTA_ID = ['SEMICOLON'];
    CAMPO = ['IDENTIFIER'];
    CAMPOS = this.CAMPO;
    LISTA_CAMPOS = ['SEMICOLON'];
    TIPO_DADO = ['TYPE', 'TYPE_ARRAY', 'TYPE_RECORD', 'IDENTIFIER'];
    PARAM_ROTINA = ['OPEN_P']; 
    BLOCO_ROTINA = this.DEF_VAR; 
    LISTA_COM = ['SEMICOLON']; 
    COMANDO = ['IDENTIFIER', 'WHILE', 'IF', 'FOR', 'WRITE', 'READ']; 
    FOR = ['IDENTIFIER']; 
    ELSE = ['ELSE']; 
    ATRIBUICAO = ['ASSIGNMENT']; 
    LISTA_PARAM = this.PARAMETRO;
    EXP_L1 = this.OP_MAT.concat(this.PARAM_LOGICO); 
    EXP_LOGICO = this.OP_LOGICO; 
    EXP_L2 = this.OP_MAT.concat(this.PARAM_LOGICO); 
    BLOCO_COM = this.BLOCO.concat(this.COMANDO); 
    EXP_CONST = ['OPEN_B'].concat(this.PARAMETRO); 
    CONST_VALOR = ['STRING'].concat(this.EXP_CONST); 
}

class syntacticRules
{
    private currentTokenIndex = 0; //current token
    private currentToken: token;
    private firstSet: first = new first();

    constructor(private tokenList: token[], private logObj: log)
    {
        this.currentToken = tokenList[0];
    }

    //treat error
    // emits error messages for terminals.
    treatError(expectedClassification: string)
    {
        this.logObj.errors.push(`<Syntactic> Expected token of type ${expectedClassification}, but got '${this.currentToken.lexema}' of type ${this.currentToken.classification}, at line ${this.currentToken.line}.`);
        throw new Error('SyntacticError');
    }

    //treat error
    // emits error messages for non-terminals.
    treatErrorFirstSet(expectedFirstSet: string[])
    {
        let expectedTypes = expectedFirstSet.join(' or ');   
        this.logObj.errors.push(`<Syntactic> Expected token of type ${expectedTypes}, but got '${this.currentToken.lexema}' of type ${this.currentToken.classification}, at line ${this.currentToken.line}.`);
    }


    //treat terminal 
    // analyses if the token has a classification that fits the rule.
    // If it does, move on to the next token.
    // Otherwise, run error.
    treatTerminal(classification: string)
    {
        let newNode = new tree({value: this.currentToken.lexema, type: "TERMINAL"});

        //console.log(`Terminal ${this.currentToken.lexema} compared to ${classification}`);
        if(this.currentToken && this.currentToken.classification == classification)
        {
            this.currentTokenIndex++;
            if(this.currentTokenIndex < this.tokenList.length) 
                this.currentToken = this.tokenList[this.currentTokenIndex];
        }       
        else 
            this.treatError(classification);

        return newNode;
    }

    // Returns whether or not the current token's classification matches the classification provided.
    currentTokenIs(classification: string) {if(this.currentToken) return this.currentToken.classification == classification; else return false;}

    // Returns whether or not the current token's classification matches what's specified in a first set of a rule.
    currentTokenIsInFirst(firstSet: string[]) {if(this.currentToken) return firstSet.includes(this.currentToken.classification); else return false;}

    // ACTUAL RULES OF SIMPLE PASCAL //////////////////////////////////////////

    IDENTIFIER()
    {
        let newNode = new tree({value: "IDENTIFIER", type: "NON-TERMINAL"});

        if(this.currentTokenIs('IDENTIFIER'))
            newNode.addChild(this.treatTerminal('IDENTIFIER'));
        else this.treatError('IDENTIFIER');

        return newNode;
    }

    NUMERO()
    {
        let newNode = new tree({value: "NUMERO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('NUMBER'))
            newNode.addChild(this.treatTerminal('NUMBER'));
        else this.treatError('NUMBER');

        return newNode;
    }

    NOME()
    {
        let newNode = new tree({value: "NOME", type: "NON-TERMINAL"});

        if(this.currentTokenIs('DOT'))
        {
            newNode.addChild(this.treatTerminal('DOT'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.NOME());
        }
        else if(this.currentTokenIs('OPEN_B'))
        {
            newNode.addChild(this.treatTerminal('OPEN_B'));
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.treatTerminal('CLOSE_B'));
        }
        else if(this.currentTokenIs('OPEN_P'))
        {
            newNode.addChild(this.treatTerminal('OPEN_P'));
            newNode.addChild(this.LISTA_PARAM());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }

        return newNode;
    }

    PARAMETRO()
    {
        let newNode = new tree({value: "PARAMETRO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('IDENTIFIER'))
        {  
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.NOME());
        }
        else if(this.currentTokenIs('NUMBER')) {
            newNode.addChild(this.NUMERO());
        }
        else if(this.currentTokenIs('BOOLEAN'))
            newNode.addChild(this.treatTerminal('BOOLEAN'));
        else this.treatError('IDENTIFIER');

        return newNode;
    }

    OP_COMP()
    {
        let newNode = new tree({value: "OP_COMP", type: "NON-TERMINAL"});

        if(this.currentTokenIs('COMP_OPERATOR'))
        {
            newNode.addChild(this.treatTerminal('COMP_OPERATOR'));
        }
        else this.treatError('COMP_OPERATOR');

        return newNode;
    }

    PARAM_LOGICO()
    {
        let newNode = new tree({value: "PARAM_LOGICO", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_COMP))
        {
            newNode.addChild(this.OP_COMP());
            newNode.addChild(this.PARAMETRO());
        }

        return newNode;
    }

    EXP_L1()
    {
        let newNode = new tree({value: "EXP_L1", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_MAT))
        {
            newNode.addChild(this.OP_MAT());
            newNode.addChild(this.EXP());
        }
        else if(this.currentTokenIsInFirst(this.firstSet.PARAM_LOGICO))
        {
            newNode.addChild(this.PARAM_LOGICO());
            newNode.addChild(this.EXP_LOGICO());
        }

        return newNode;
    }

    EXP_L2()
    {
        let newNode = new tree({value: "EXP_L2", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_MAT))
        {
            newNode.addChild(this.OP_MAT());
            newNode.addChild(this.EXP());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }
        else if(this.currentTokenIsInFirst(this.firstSet.PARAM_LOGICO))
        {
            newNode.addChild(this.PARAM_LOGICO());
            newNode.addChild(this.OP_LOGICO());
            newNode.addChild(this.EXP());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }

        return newNode;
    }

    EXP()
    {
        let newNode = new tree({value: "EXP", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.PARAMETRO))
        {
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.EXP_L1());
        }
        else if(this.currentTokenIs('OPEN_P'))
        {
            newNode.addChild(this.treatTerminal('OPEN_P'));
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.EXP_L2());
        }

        return newNode;
    }

    BLOCO()
    {
        let newNode = new tree({value: "BLOCO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('BLOCK_BEGIN'))
        {
            newNode.addChild(this.treatTerminal('BLOCK_BEGIN'));
            if(this.currentTokenIsInFirst(this.firstSet.COMANDO))
            {
                newNode.addChild(this.COMANDO());
                newNode.addChild(this.LISTA_COM());
            }
            newNode.addChild(this.treatTerminal('BLOCK_END'));
        }
        else this.treatError('BLOCK_BEGIN');

        return newNode;
    }

    DEF_VAR()
    {
        let newNode = new tree({value: "DEF_VAR", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.VARIAVEL))
        {
            newNode.addChild(this.VARIAVEL());
            newNode.addChild(this.DEF_VAR());
        }

        return newNode;
    }

    DEF_TIPOS()
    {
        let newNode = new tree({value: "DEF_TIPOS", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.TIPO))
        {
            newNode.addChild(this.TIPO());
            newNode.addChild(this.DEF_TIPOS());
        }

        return newNode;
    }

    DEF_ROTINA()
    {
        let newNode = new tree({value: "DEF_ROTINA", type: "NON-TERMINAL"});
        if(this.currentTokenIsInFirst(this.firstSet.ROTINA))
        {
            newNode.addChild(this.ROTINA());
            newNode.addChild(this.DEF_ROTINA());
        }
        return newNode;
    }

    DEF_CONST()
    {
        let newNode = new tree({value: "DEF_CONST", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.CONSTANTE))
        {
            newNode.addChild(this.CONSTANTE());
            newNode.addChild(this.DEF_CONST());
        }

        return newNode;
    }

    BLOCO_ROTINA()
    {
        let newNode = new tree({value: "BLOCO_ROTINA", type: "NON-TERMINAL"});

        newNode.addChild(this.DEF_VAR());
        newNode.addChild(this.BLOCO());

        return newNode;
    }

    LISTA_PARAM()
    {
        let newNode = new tree({value: "LISTA_PARAM", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.PARAMETRO))
        {
            newNode.addChild(this.PARAMETRO());
            if(this.currentTokenIs('COMMA'))
            {
                newNode.addChild(this.treatTerminal('COMMA'));
                newNode.addChild(this.LISTA_PARAM());
            }
        }

        return newNode;
    }

    TIPO_DADO()
    {
        let newNode = new tree({value: "TIPO_DADO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('TYPE'))
        {
            newNode.addChild(this.treatTerminal('TYPE'));
        }
        else if(this.currentTokenIs('TYPE_ARRAY'))
        {
            newNode.addChild(this.treatTerminal('TYPE_ARRAY'));
            newNode.addChild(this.treatTerminal('OPEN_B'));
            newNode.addChild(this.NUMERO());
            newNode.addChild(this.treatTerminal('CLOSE_B'));
            newNode.addChild(this.treatTerminal('OF'));
            newNode.addChild(this.TIPO_DADO());
        }
        else if(this.currentTokenIs('TYPE_RECORD'))
        {
            newNode.addChild(this.treatTerminal('TYPE_RECORD'));
            newNode.addChild(this.CAMPOS());
            newNode.addChild(this.treatTerminal('BLOCK_END'));
        }
        else if(this.currentTokenIs('IDENTIFIER'))
        {
            newNode.addChild(this.IDENTIFIER());
        }
        else this.treatError('TYPE');

        return newNode;
    }

    ROTINA()
    {
        let newNode = new tree({value: "ROTINA", type: "NON-TERMINAL"});

        if(this.currentTokenIs('FUNCTION'))
        {
            newNode.addChild(this.treatTerminal('FUNCTION'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.PARAM_ROTINA());
            newNode.addChild( this.treatTerminal('COLON'));
            newNode.addChild(this.TIPO_DADO());
            newNode.addChild(this.BLOCO_ROTINA());
        }
        else if(this.currentTokenIs('PROCEDURE'))
        {
            newNode.addChild(this.treatTerminal('PROCEDURE'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.PARAM_ROTINA());
            newNode.addChild(this.BLOCO_ROTINA());
        }
        else this.treatError('FUNCTION');

        return newNode;
    }

    PARAM_ROTINA()
    {
        let newNode = new tree({value: "PARAM_ROTINA", type: "NON-TERMINAL"});

        if(this.currentTokenIs('OPEN_P'))
        {
            newNode.addChild(this.treatTerminal('OPEN_P'));
            newNode.addChild(this.CAMPOS());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }

        return newNode;
    }

    CONSTANTE()
    {
        let newNode = new tree({value: "CONSTANTE", type: "NON-TERMINAL"});

        if(this.currentTokenIs('DECLARATION_CONST'))
        {
            newNode.addChild(this.treatTerminal('DECLARATION_CONST'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.treatTerminal('EQUAL_SIGN'));
            newNode.addChild(this.CONST_VALOR());
            newNode.addChild(this.treatTerminal('SEMICOLON'));
        }
        else this.treatError('DECLARATION_CONST');

        return newNode;
    }

    EXP_CONST_LINHA()
    {
        let newNode = new tree({value: "EXP_CONST_LINHA", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_MAT))
        {
            newNode.addChild(this.OP_MAT());
            newNode.addChild(this.EXP_CONST());
        }

        return newNode;
    }

    EXP_CONST()
    {
        let newNode = new tree({value: "EXP_CONST", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.PARAMETRO))
        {
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.EXP_CONST_LINHA());
        }
        else if(this.currentTokenIs('OPEN_P'))
        {
            newNode.addChild(this.treatTerminal('OPEN_P'));
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.OP_MAT());
            newNode.addChild(this.EXP_CONST());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }

        return newNode;
    }

    CONST_VALOR()
    {
        let newNode = new tree({value: "CONST_VALOR", type: "NON-TERMINAL"});

        if(this.currentTokenIs('STRING'))
        {
            newNode.addChild(this.treatTerminal('STRING'));
        } 
        else if(this.currentTokenIsInFirst(this.firstSet.EXP_CONST))
        {
            newNode.addChild(this.EXP_CONST());
        }
        else this.treatError('STRING');

        return newNode;
    }

    TIPO()
    {
        let newNode = new tree({value: "TIPO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('DECLARATION_TYPE'))
        {
            newNode.addChild(this.treatTerminal('DECLARATION_TYPE'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.treatTerminal('EQUAL_SIGN'));
            newNode.addChild(this.TIPO_DADO());
            newNode.addChild(this.treatTerminal('SEMICOLON'));
        }
        else this.treatError('DECLARATION_TYPE');

        return newNode;
    }

    VARIAVEL()
    {
        let newNode = new tree({value: "VARIAVEL", type: "NON-TERMINAL"});

        if(this.currentTokenIs('VARIABLE'))
        {
            newNode.addChild(this.treatTerminal('VARIABLE'));
            newNode.addChild(this.CAMPO());
            newNode.addChild(this.treatTerminal('SEMICOLON'));
        }
        else this.treatError('VARIABLE');

        return newNode;
    }

    LISTA_ID()
    {
        let newNode = new tree({value: "LISTA_ID", type: "NON-TERMINAL"});

        if(this.currentTokenIs('COMMA'))
        {
            newNode.addChild(this.treatTerminal('COMMA'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.LISTA_ID());
        }

        return newNode;
    }

    CAMPOS()
    {
        let newNode = new tree({value: "CAMPOS", type: "NON-TERMINAL"});
        newNode.addChild(this.CAMPO());
        newNode.addChild(this.LISTA_CAMPOS());
        return newNode;
    }

    CAMPO()
    {
        let newNode = new tree({value: "CAMPO", type: "NON-TERMINAL"});
        newNode.addChild(this.IDENTIFIER());
        newNode.addChild(this.LISTA_ID());
        newNode.addChild(this.treatTerminal('COLON'));
        newNode.addChild(this.TIPO_DADO());

        return newNode;
    }

    LISTA_CAMPOS()
    {
        let newNode = new tree({value: "LISTA_CAMPOS", type: "NON-TERMINAL"});

        if(this.currentTokenIs('SEMICOLON'))
        {
            newNode.addChild(this.treatTerminal('SEMICOLON'));
            newNode.addChild(this.CAMPO());
            newNode.addChild(this.LISTA_CAMPOS());
        }
        
        return newNode;
    }

    LISTA_COM()
    {
        let newNode = new tree({value: "LISTA_COM", type: "NON-TERMINAL"});

        if(this.currentTokenIs('SEMICOLON'))
        {
            newNode.addChild(this.treatTerminal('SEMICOLON'));
            newNode.addChild(this.COMANDO());
            newNode.addChild(this.LISTA_COM());
        }

        return newNode;
    }

    BLOCO_COM()
    {
        let newNode = new tree({value: "BLOCO_COM", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.BLOCO))
        {
            newNode.addChild(this.BLOCO());
        }
        else if(this.currentTokenIsInFirst(this.firstSet.COMANDO))
        {
            newNode.addChild(this.COMANDO());
        }
        else this.treatErrorFirstSet(this.firstSet.BLOCO);

        return newNode;
    }

    EXP_LOGICO()
    {
        let newNode = new tree({value: "EXP_LOGICO", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_LOGICO))
        {
            newNode.addChild(this.OP_LOGICO());
            newNode.addChild(this.EXP());
        }

        return newNode;
    }

    EXP_COM_LINHA()
    {
        let newNode = new tree({value: "EXP_COM_LINHA", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.OP_LOGICO))
        {
            newNode.addChild(this.OP_LOGICO());
            newNode.addChild(this.EXP_COM());
        }

        return newNode;
    }

    EXP_COM()
    {
        let newNode = new tree({value: "EXP_COM", type: "NON-TERMINAL"});

        if(this.currentTokenIsInFirst(this.firstSet.PARAMETRO))
        {
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.PARAM_LOGICO());
            newNode.addChild(this.EXP_COM_LINHA());
        }
        else if(this.currentTokenIs('OPEN_P'))
        {
            newNode.addChild(this.treatTerminal('OPEN_P'));
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.PARAM_LOGICO());
            newNode.addChild(this.OP_LOGICO());
            newNode.addChild(this.EXP_COM());
            newNode.addChild(this.treatTerminal('CLOSE_P'));
        }
        else this.treatErrorFirstSet(this.firstSet.PARAM_LOGICO);

        return newNode;
    }

    COMANDO()
    {
        let newNode = new tree({value: "COMANDO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('IDENTIFIER'))
        {
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.NOME());
            newNode.addChild(this.ATRIBUICAO());
        }
        else if(this.currentTokenIs('WHILE'))
        {
            newNode.addChild(this.treatTerminal('WHILE'));
            newNode.addChild(this.EXP_COM());
            newNode.addChild(this.treatTerminal('DO'));
            newNode.addChild(this.BLOCO_COM());   
        }
        else if(this.currentTokenIs('IF'))
        {
            newNode.addChild(this.treatTerminal('IF'));
            newNode.addChild(this.EXP_COM());
            newNode.addChild(this.treatTerminal('IF_THEN'));
            newNode.addChild(this.BLOCO_COM());
            newNode.addChild(this.ELSE());
        }
        else if(this.currentTokenIs('FOR'))
        {
            newNode.addChild(this.treatTerminal('FOR'));
            newNode.addChild(this.FOR());
            newNode.addChild(this.treatTerminal('DO'));
            newNode.addChild(this.BLOCO_COM());
        }
        else if(this.currentTokenIs('WRITE'))
        {
            newNode.addChild(this.treatTerminal('WRITE'));
            newNode.addChild(this.CONST_VALOR());
        }
        else if(this.currentTokenIs('READ'))
        {
            newNode.addChild(this.treatTerminal('READ'));
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.NOME());
        }
        else this.treatErrorFirstSet(this.firstSet.COMANDO);

        return newNode;
    }

    FOR()
    {
        let newNode = new tree({value: "FOR", type: "NON-TERMINAL"});

        if(this.currentTokenIs('IDENTIFIER')) {
            newNode.addChild(this.IDENTIFIER());
            newNode.addChild(this.treatTerminal('ASSIGNMENT'));
            newNode.addChild(this.PARAMETRO());
            newNode.addChild(this.treatTerminal('TO'));
            newNode.addChild(this.PARAMETRO());
        }
        else this.treatError('IDENTIFIER');

        return newNode;
    }

    ELSE()
    {
        let newNode = new tree({value: "ELSE", type: "NON-TERMINAL"});

        if(this.currentTokenIs('ELSE')){
            newNode.addChild(this.treatTerminal('ELSE'));
            newNode.addChild(this.BLOCO_COM());
        }

        return newNode;
    }

    ATRIBUICAO()
    {
        let newNode = new tree({value: "ATRIBUICAO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('ASSIGNMENT'))
        {
            newNode.addChild(this.treatTerminal('ASSIGNMENT'));
            newNode.addChild(this.EXP());
        }

        return newNode;
    }

    OP_LOGICO()
    {
        let newNode = new tree({value: "OP_LOGICO", type: "NON-TERMINAL"});

        if(this.currentTokenIs('LOGIC_OPERATOR'))
        {
            newNode.addChild(this.treatTerminal('LOGIC_OPERATOR'));
        }
        else this.treatError('LOGIC_OPERATOR');
        
        return newNode;
    }

    OP_MAT()
    {
        let newNode = new tree({value: "OP_MAT", type: "NON-TERMINAL"});

        if(this.currentTokenIs('MAT_OPERATOR'))
        {
            newNode.addChild(this.treatTerminal('MAT_OPERATOR'));
        }
        else this.treatError('MAT_OPERATOR');

        return newNode;
    }

    DECLARACOES()
    {
        let newNode = new tree({value: "DECLARACOES", type: "NON-TERMINAL"});

        newNode.addChild(this.DEF_CONST());
        newNode.addChild(this.DEF_TIPOS());
        newNode.addChild(this.DEF_VAR());
        newNode.addChild(this.DEF_ROTINA());

        return newNode;
    }

    // Always start here
    PROGRAMA()
    {
        let newNode = new tree({value: "PROGRAMA", type: "NON-TERMINAL"});
        newNode.addChild(this.DECLARACOES());
        newNode.addChild(this.BLOCO());
        return newNode;
    }
}

export default class SyntacticAnalysisService implements ISyntacticAnalysis
{
    constructor(){}

    async generateSymbolTree(symbols: Object, tokenList: token[], logObj: log): Promise<tree> {
        let result: tree;

        const rules = new syntacticRules(tokenList, logObj);
        try
        {
            result = rules.PROGRAMA();
        }
        catch(error)
        {
            if(error == 'tokenListOver') console.log('<!> fim de lista');

            result = new tree({value: "ERROR", type: "NON-TERMINAL"});
        }

        return result;
    }

}