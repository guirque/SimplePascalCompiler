import token from "../Entities/token";
import tree from "../Entities/tree";
import ISemanticAnalysis from "../Interfaces/ISemanticAnalysis";
import log from "../Interfaces/Log";

type tableData = 
{
    Name: string;
    Classification: string;
    Type: string;
    Block: string;
    ArraySize: number;
    ArrayType: string;
    SpecialType: "array" | "record" | "standard";
}

class table
{
    constructor(){}

    data: tableData[] = [];

    addValue(newData: tableData)
    {
        this.data.push(newData);
    }

    getArray()
    {
        return this.data;
    }
}


function addError(msg: string, msgLog: log)
{
    msgLog.errors.push(`<Semantic> ${msg}`);
    throw new Error("Semantic");
}

// Compares element to ID to other ID's and their scopes.
function assureUnique(name: string, scope: string, tableObj: table): boolean
{
    return tableObj.getArray().every(
        (register: tableData)=>
        {
            return (name != register.Name) || (scope != register.Block)
        });
}

function getVariables(symbolTree: tree, tableObj: table, scope: string, type: string, msgLog: log): void
{
    //Go over each child node. If you find an identifier, that's a variable. Add it.
    if(symbolTree.value.value == 'IDENTIFIER'){

        let name = symbolTree.children[0].value.value;
        const specialType =  getFromTable(tableObj, type, scope)?.SpecialType ?? "standard";
        if(assureUnique(name, scope, tableObj))
            tableObj.addValue(
            {
                Name: name,
                Classification: "VARIABLE",
                Block: scope,
                Type: type,
                ArraySize: 0,
                ArrayType: '-',
                SpecialType: specialType

            });
        else addError(`Repeated occurence of "${name}" in scope "${scope}". Variable has been ignored.`, msgLog);
    }
    
    if(symbolTree.value.value == 'CAMPO')
    {
        // CAMPO -> [ID] [LISTA_ID] (:) [TIPO_DADO] (;)
        const tipo_dado = symbolTree.children[3];

        if(tipo_dado.children[0].value.value == 'IDENTIFIER') type = tipo_dado.children[0].children[0].value.value;
        else type = tipo_dado.children[0].value.value;

    }

    for(let i = 0; i < symbolTree.children.length; i++)
        if(symbolTree.value.value != 'TIPO_DADO') getVariables(symbolTree.children[i], tableObj, scope, type, msgLog);
}

function getNumParams(symbolTree:tree): number
{
    let counter = 0;

    if(symbolTree.value.value ==  "IDENTIFIER") counter++;

    for(let i = 0; i < symbolTree.children.length; i++)
        counter += getNumParams(symbolTree.children[i]);

    return counter;
}

function getParametersDeclaration(symbolTree: tree, scope:string, tableObj: table, msgLog: log, type:string)
{
    // If the node is classified as CAMPO, all its children of type IDENTIFIER are parameters of type [TIPO_DADO]
    if(symbolTree.value.value == "CAMPO")
    {
        // CAMPO -> [IDENTIFIER] [LISTA_ID] (:) [TIPO_DADO]
        let tipo_dado = symbolTree.children[3];
        type = tipo_dado.children[0].value.value == "IDENTIFIER" ?  tipo_dado.children[0].children[0].value.value :  tipo_dado.children[0].value.value;
    
        const identifier = symbolTree.children[0];
        // Add variable
        let name = identifier.children[0].value.value;
        const specialType =  getFromTable(tableObj, type, scope)?.SpecialType ?? "standard";

        if(assureUnique(name, scope, tableObj))
            tableObj.addValue(
            {
                Name: name,
                Classification: "PARAMETER",
                Block: scope,
                Type: type,
                ArraySize: 0,
                ArrayType: '-',
                SpecialType: specialType
            });
        else addError(`Repeated occurence of "${name}". Parameter has been ignored.`, msgLog);

    }
    
    if(symbolTree.value.value != "IDENTIFIER")
    {
        for(let i = 0; i < symbolTree.children.length; i++)
            getParametersDeclaration(symbolTree.children[i], scope, tableObj, msgLog, type);
    }
}

function declareRotina(symbolTree: tree, tableObj: table, msgLog: log)
{
    // ROTINA -> (function) [ID] [PARAM_ROTINA] (:) [TIPO_DADO] [BLOCO_ROTINA] |
    //           (procedure) [ID] [PARAM_ROTINA] [BLOCO_ROTINA]

    const name = symbolTree.children[1].children[0].value.value;
    const isFunction = symbolTree.children[0].value.value == 'function';
    let type = "-";
    if(isFunction)
    {
        let tipo_dado = symbolTree.children[4]
        type = tipo_dado.children[0].value.value == "IDENTIFIER" ? symbolTree.children[4].children[0].children[0].value.value : symbolTree.children[4].children[0].value.value;
    }

    const specialType =  getFromTable(tableObj, type, "GLOBAL")?.SpecialType ?? "standard";
    if(assureUnique(name, "GLOBAL", tableObj))
        tableObj.addValue(
        {
            Name: name,
            Classification: "ROTINA",
            Block: "GLOBAL",
            Type: type,
            ArraySize: 0,
            ArrayType: '-',
            SpecialType: specialType
    
        });
    else addError(`Repeated occurence of "${name}". Function or procedure has been ignored.`, msgLog);

    //Adding result variable
    if(isFunction)
    {
        tableObj.addValue(
            {
                Name: "result",
                Classification: "VARIABLE",
                Block: name,
                Type: type,
                ArraySize: 0,
                ArrayType: '-',
                SpecialType: 'standard'
            });
    }

    // Parameter declaration (call for [PARAM_ROTINA])
    getParametersDeclaration(symbolTree.children[2], name, tableObj, msgLog, "-");
}

// Receives node [PARAMETRO] and returns the final record type. It's also supposed to evaluate if records exist within one another.
function getRecordType(symbolTree: tree, tableObj: table, msgLog: log, baseID: string, recordNodeType: string):string
{

    //Base id is the id of the record that's being accessed.
    if(symbolTree.value.value == 'PARAMETRO' && symbolTree.children[0].value.value == 'IDENTIFIER')
    {
        const nome = symbolTree.children[1];
        const id = symbolTree.children[0].children[0].value.value; //F name
        const recordNode = tableObj.getArray().find((register)=>register.Name == id); //F
        return getRecordType(nome, tableObj, msgLog, id, recordNode?.Type ?? '-');

        //PS: to verify if field exists within element:
        // e.g.: x := F.nota1 
        // Verify that there is a RECORD_FIELD of name nota1 that has BLOCK = (Type of F).
    }
    else if(symbolTree.value.value == 'NOME' && symbolTree.children[0].value.value == '.')
    {
        //[NOME] -> (.) [IDENTIFIER] [NOME] | ([) [PARAMETRO] (]) | (() [LISTA_PARAM] ()) | e

        // Check if field exists within the given IDENTIFIER
        const fieldId = symbolTree.children[1].children[0].value.value;
        const baseIDNode = getFromTable(tableObj, baseID, recordNodeType);

        if(!tableObj.getArray().find((register)=> register.Classification == 'RECORD_FIELD' && register.Name == fieldId && register.Block == baseIDNode?.Type ))
            addError(`'${fieldId}' does not exist in '${baseID}'.`, msgLog);

        // Keep going
        const otherNome = symbolTree.children.find((node)=>node.value.value=='NOME' && node.children.length > 0);
        if(otherNome)
        {
            return getRecordType(otherNome, tableObj, msgLog, fieldId, recordNodeType);
        }
        const id = symbolTree.children[1].children[0].value.value;
        return tableObj.getArray().find((register)=> register.Classification == 'RECORD_FIELD' && register.Name == id)?.Type ?? '-';
    }
    else if(symbolTree.value.value == 'NOME' && symbolTree.children[0].value.value == '[')
    {
        return inferTypeFromValue(symbolTree, tableObj, msgLog, baseID);
    }

    return '-';

}

// Receives node and looks for the first type it can infer from value. This includes variables
function inferTypeFromValue(symbolTree:tree, tableObj: table, msgLog: log, scope: string): string
{
    // Type may come from [CONST_VALOR] or from [PARAMETRO]
    if(symbolTree.value.value == "CONST_VALOR" && symbolTree.children[0].value.value.startsWith('"')) return "string"
    else if(symbolTree.value.value == "PARAMETRO")
    {
        const firstChild = symbolTree.children[0];
        switch(firstChild.value.value)
        {
            case "IDENTIFIER":
                // [PARAMETRO] -> [IDENTIFIER] [NOME]
                // [NOME] -> (.) [IDENTIFIER] [NOME] | ([) [PARAMETRO] (]) | (() [LISTA_PARAM] ()) | e
                const nome = symbolTree.children[1];
                //const idNode = tableObj.getArray().find((register) => firstChild.children[0].value.value == register.Name);
                const idNode = getFromTable(tableObj, firstChild.children[0].value.value, scope);

                // if [NOME] is empty, it's a declaration based only on the type.
                // if [NOME] -> (.) [IDENTIFIER] [NOME], we'll have to search recursively.
                // if [NOME] -> ([) [PARAMETRO] (]), we'll have to check for array type.

                if(idNode) {
                    
                    if(idNode.Classification == 'ROTINA' && nome.children.length == 0)
                    {
                        return 'ROTINA';
                    }
                    // if [NOME] is empty or it's a function call, it's a declaration based only on the type.
                    else if(nome.children.length == 0 || nome.children[0].value.value == '(')
                    {
                        return idNode.Type;
                    }
                    // if [NOME] -> (.) [IDENTIFIER] [NOME], we'll have to search recursively to get a record type.
                    else if(nome.children[0].value.value == '.')
                    {
                        return getRecordType(symbolTree, tableObj, msgLog, nome.children[1].value.value, nome.children[1].value.value);
                    }
                    // if [NOME] -> ([) [PARAMETRO] (]), we'll have to check for array type.
                    else if(nome.children[0].value.value == '[')
                    {
                        const arrayDeclarationNode = tableObj.getArray().find((register) => idNode.Type == register.Name); 
                        if(arrayDeclarationNode) return arrayDeclarationNode.ArrayType;
                    }
                }
                break;
            case "NUMERO":
                return firstChild.children[0].value.value.includes('.') ? "real" : "integer";
            case "false":
                return "boolean";
            case "true":
                return "boolean";
            default:
                return "-";
        }
    }

    let answer = "";
    for(let i = 0; i < symbolTree.children.length; i++)
    {
        answer = inferTypeFromValue(symbolTree.children[i], tableObj, msgLog, scope);
        if(answer != '-') return answer;
    }

    return "-";
}

// Receives node of [TIPO_DADO] and returns the associated type.
function getTypeFromTipoDado(symbolTree: tree): string
{
    return symbolTree.children[0].value.value == "IDENTIFIER" ?  symbolTree.children[0].children[0].value.value :  symbolTree.children[0].value.value;
}

function getConstant(symbolTree: tree, tableObj: table, scope: string, msgLog: log)
{
    // CONSTANTE -> (const) [ID] (=) [CONST_VALOR] (;)
    const name = symbolTree.children[1].children[0].value.value;

    if(assureUnique(name, scope, tableObj))
        tableObj.addValue(
        {
            Name: name,
            Classification: "CONSTANTE",
            Block: scope,
            Type: inferTypeFromValue(symbolTree.children[3], tableObj, msgLog, scope),
            ArraySize: 0,
            ArrayType: '-',
            SpecialType: 'standard'
    
        });
    else addError(`Repeated occurence of "${name}". Constant has been ignored.`, msgLog);
}

function declareRecordFields(symbolTree: tree, scope: string, tableObj: table, msgLog: log, type: string)
{
    if(symbolTree.value.value == "CAMPO")    
    {
        // CAMPO -> [IDENTIFIER] [LISTA_ID] (:) [TIPO_DADO]
        let tipo_dado = symbolTree.children[3];
        type = tipo_dado.children[0].value.value == "IDENTIFIER" ?  tipo_dado.children[0].children[0].value.value :  tipo_dado.children[0].value.value;
    
        const identifier = symbolTree.children[0];
        let name = identifier.children[0].value.value;

        const specialType =  getFromTable(tableObj, type, scope)?.SpecialType ?? "standard";

        if(assureUnique(name, scope, tableObj))
            tableObj.addValue(
            {
                Name: name,
                Classification: "RECORD_FIELD",
                Block: scope,
                Type: type,
                ArraySize: 0,
                ArrayType: '-',
                SpecialType: specialType
        
            });
        else addError(`Repeated occurence of "${name}". Record field has been ignored.`, msgLog);
    }

    for(let i = 0; i < symbolTree.children.length; i++)
        declareRecordFields(symbolTree.children[i], scope, tableObj, msgLog, type);
}

function declareTipos(symbolTree: tree, scope: string, tableObj: table, msgLog: log)
{
    // TIPO -> (type) [ID] (=) [TIPO_DADO] (;)
    
    if(symbolTree.value.value == "TIPO")
    {
        let name = symbolTree.children[1].children[0].value.value;
        let tipo_dado = symbolTree.children[3];
        let type = tipo_dado.children[0].value.value == "IDENTIFIER" ?  tipo_dado.children[0].children[0].value.value :  tipo_dado.children[0].value.value;
        

        let arraySize = 0, arrayType = '-';
        if(type == 'array')
        {
            // TIPO -> (type) [ID] (=) [TIPO_DADO] (;)
            // TIPO_DADO -> (array) ([) [NUMERO] (]) of [TIPO_DADO]
            arrayType = getTypeFromTipoDado(tipo_dado.children[5]);
            arraySize = parseInt(tipo_dado.children[2].children[0].value.value);

        }
        if(assureUnique(name, scope, tableObj))
            tableObj.addValue(
            {
                Name: name,
                Classification: "TIPO",
                Block: scope,
                Type: type,
                ArraySize: arraySize,
                ArrayType: arrayType,
                SpecialType: type == "array" ? "array" : "record"
        
            });
        else addError(`Repeated occurence of "${name}". Type has been ignored.`, msgLog);
        
        scope = name;

        if(type == "record")
        {
            declareRecordFields(symbolTree.children[3], scope, tableObj, msgLog, "-");
        }
    }

    for(let i = 0; i < symbolTree.children.length; i++)
        declareTipos(symbolTree.children[i], scope, tableObj, msgLog);

}

function getFromTable(tableObj: table, name: string, scope: string): tableData | undefined
{
    return tableObj.getArray().find((register)=>register.Name==name && register.Block == scope) ?? tableObj.getArray().find((register)=>register.Name==name && register.Block == "GLOBAL");
}

// --------------------

//Checks if IDENTIFIER has been called without a definition. Does not check for field existence.
function assureAssigned(symbolTree:tree, tableObj: table, scope: string, msgLog: log)
{

    if(symbolTree.value.value == 'IDENTIFIER')
    {
        const name = symbolTree.children[0].value.value;
        if (!tableObj.getArray().find((register:tableData)=> register.Name == name && (register.Block == scope || register.Block == "GLOBAL"))) 
            addError(`${name} was not defined at ${scope}.`, msgLog);
    }

    if(symbolTree.value.value != 'NOME') 
        for(let i = 0; i < symbolTree.children.length; i++)
            assureAssigned(symbolTree.children[i], tableObj, scope, msgLog);
}

// Emits an error if two values in an expression are of different types.
function assureOperationsOfSameType(symbolTree: tree, tableObj:table, scope: string, msgLog: log, type: string):string
{

    if((symbolTree.value.value == 'PARAMETRO' && symbolTree.children[0].value.value != 'IDENTIFIER') || symbolTree.value.value == 'IDENTIFIER')
    {
        const localType = inferTypeFromValue(symbolTree, tableObj, msgLog, scope);
        type = localType;
    }

    for(let i = 0; i < symbolTree.children.length; i++)
    {
        const receivedType:string = assureOperationsOfSameType(symbolTree.children[i], tableObj, scope, msgLog, type);
        if(type == '-') type = receivedType;
        else if(type != '-' && receivedType != type) 
            addError(`Values of types ${receivedType} and ${type} can't be in an operation together, as they're incompatible.`, msgLog);
    }
    return type;
}

function assureCompatibleAssignment(symbolTree: tree, tableObj: table, scope: string, msgLog: log)
{
    const id = symbolTree.children[0].children[0].value.value;
        
    // Local definitions are prioritized
    const receivingEnd = tableObj.getArray().find((register)=>register.Name==id && register.Block == scope) ?? tableObj.getArray().find((register)=>register.Name==id && register.Block == "GLOBAL");

    const atribuicaoNode = symbolTree.children[2];
    const valueType = inferTypeFromValue(atribuicaoNode, tableObj, msgLog, scope);

    if(receivingEnd && valueType == 'ROTINA')
        addError(`'${receivingEnd.Name}' is being assigned a procedure or function. Did you mean to call the routine?`, msgLog);

    if(receivingEnd && receivingEnd.Classification != 'VARIABLE')
        addError(`'${receivingEnd.Name}' is not a variable, and cannot be assigned a value.`, msgLog);

    if(receivingEnd && (!(receivingEnd.Type == valueType) && !(receivingEnd.Type == 'real' && valueType == 'integer')))
        addError(`Variable '${receivingEnd.Name}', of type ${receivingEnd.Type}, can't be assigned value of type ${valueType}.`, msgLog);
}

// Pushes all arguments passed to a routine to a given list. Receives [NOME] as an input.
function assureArguments(symbolTree: tree, tableObj: table, scope: string, msgLog: log, list: string[])
{
    if(symbolTree.value.value == 'ROTINA')
    {
        scope = symbolTree.children[1].children[0].value.value;
    }

    if(symbolTree.value.value == 'PARAMETRO')
    {
        const type = inferTypeFromValue(symbolTree, tableObj, msgLog, scope);
        if(type) list.push(type);       
    }

    for(let i = 0; i < symbolTree.children.length; i++)
    {
        assureArguments(symbolTree.children[i], tableObj, scope, msgLog, list);
    }
}

// --------------------

function buildTable(symbolTree: tree, tableObj: table, scope: string, msgLog: log): tree
{

    /*
        We can read the grammar to find out the format we'll analyse.
        Since it's past that phase, we are sure that the tree is properly formed.
        Therefore, we know what we can expect of the child nodes and their order.
    */
   // Defining Scope & Rotina -------------

    if(symbolTree.value.value == 'ROTINA')
    {
        scope = symbolTree.children[1].children[0].value.value;
        declareRotina(symbolTree, tableObj, msgLog);
    }
    // Defining Variables -----------------
    if(symbolTree.value.value == 'VARIAVEL')
    {
        //Every child with category "IDENTIFIER" is a new variable under this scope
        getVariables(symbolTree, tableObj, scope, "", msgLog);
    }
    if(symbolTree.value.value == 'CONSTANTE')
    {
        getConstant(symbolTree, tableObj, scope, msgLog);
    }
    if(symbolTree.value.value == 'TIPO')
    {
        declareTipos(symbolTree, scope, tableObj, msgLog);
    }

    // Assuring Semantic Rules ------------

    // Assure only previously assigned Identifiers are referenced
    if(symbolTree.value.value == 'PARAMETRO' || symbolTree.value.value == 'COMANDO') //when in [NOME], [PARAMETRO], [COMANDO] 
    {
        assureAssigned(symbolTree, tableObj, scope, msgLog);
    }

    // Assure operations are compatible in type
    if(symbolTree.value.value == 'EXP')
    {
        // All IDENTIFIERs in [PARAMETRO]s should be of the same type
        assureOperationsOfSameType(symbolTree, tableObj, scope, msgLog, "-");
    }

    // Assure assignment rules
    if(symbolTree.value.value == 'COMANDO' && symbolTree.children[0].value.value == 'IDENTIFIER' && symbolTree.children[2].children.length > 0)
    {
        assureCompatibleAssignment(symbolTree, tableObj, scope, msgLog);
    }

    if(symbolTree.value.value == 'PARAMETRO' || (symbolTree.value.value == 'COMANDO' && symbolTree.children[0].value.value == 'IDENTIFIER'))
    {
        // [PARAMETRO] -> [IDENTIFIER] [NOME]
        // [NOME] -> (.) [IDENTIFIER] [NOME] | ([) [PARAMETRO] (]) | (() [LISTA_PARAM] ()) | e

        // identifier node (the one that's being accessed)
        const node = getFromTable(tableObj, symbolTree.children[0].children[0].value.value, scope);
        const nome = symbolTree.children[1];     

        // Assure routine calls are being done with all required parameters
        if(node && node.Classification == 'ROTINA')
        {
            const listOfParameters = tableObj.getArray().filter((register:tableData)=> 
                {
                    return register.Classification == 'PARAMETER' && register.Block == node.Name
                });
            
            // We'll look to check if the identifiers in LISTA_PARAM match exactly the ones retrived at listOfParameters in type.
            let listOfArgumentsTypes:string[] = [];
            assureArguments(nome, tableObj, scope, msgLog, listOfArgumentsTypes);

            if(listOfParameters.length != listOfArgumentsTypes.length) addError(`Incorrect number of arguments passed to routine call '${node.Name}'. Expected ${listOfParameters.length}, but got ${listOfArgumentsTypes.length}.`, msgLog);
            else listOfParameters.forEach((arg, i)=>
            {
                if(arg.Type != listOfArgumentsTypes[i]) addError(`At '${node.Name}' call: expected argument of type ${arg.Type}, but got ${listOfArgumentsTypes[i]} instead.`, msgLog);
            });
        }


        // Assure '.' is only used with records and '[]' is only used with arrays.
        if(nome && nome.children.length > 0){

            if(nome.children[0].value.value == '.' && node?.SpecialType != 'record')
                addError(`Can't access field from '${node?.Name}', as it is not a record.`, msgLog);
            if(nome.children[0].value.value == '[' && node?.SpecialType != 'array')
                addError(`Can't access position from '${node?.Name}', as it is not an array.`, msgLog);
        }
    }

    // Other Cases ------------------------

    //For Each Child Node
    for(let i = 0; i < symbolTree.children.length; i++)
    {
        buildTable(symbolTree.children[i], tableObj, scope, msgLog);
    }

    return symbolTree;
}

export default class SemanticAnalysisService implements ISemanticAnalysis
{
    constructor(){}

    async generateTable(symbolTree: tree, msgObj: log): Promise<any> {

        let answer = new table();
        try
        {
            buildTable(symbolTree, answer, 'GLOBAL', msgObj);
        }
        catch(error)
        {

        }

        return answer.getArray();
    }

}