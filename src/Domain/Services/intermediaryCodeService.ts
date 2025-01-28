import { IntermediaryCode } from "../Entities/IntermediaryCode";
import table, { tableData } from "../Entities/Table";
import tree from "../Entities/tree";
import { getFromNode } from "../Helpers/getFromNode";
import IIntermediaryCode from "../Interfaces/IIntermediaryCode";
import log from "../Interfaces/Log";

// There are 3 types of object code generations (commands):
// Declarations: set up storage space (variables)
// Commands: use labels to change the position of executing code
// Expressions: create temporary variables

// Each instruction's got space for a name and up to 3 addresses

// How is this going to work?
// Every expression type, according to the tree, will call a set of expressions and insert instructions.
// We will move along the tree, evaluation the expressions.
// Sometimes, we will have to check the table.

// Not all expressions generate code (or even have to be called).
// Simple list of expressions that generate code:

/* 
-> Declarations
- VARIAVEL: (var) [CAMPO] (;)
- CONSTANTE: (const) [ID] (=) [CONST_VALOR] (;)
- ROTINA (label creation): ...

-> Commands
- COMANDO: [ID] [NOME] [ATRIBUICAO] | (while) [EXP_COM] (do) [BLOCO_COM] | (if) [EXP_LOGICA] (then) [BLOCO_COM] [ELSE] | ...

-> Expressions
- EXP: [PARAMETRO] [EXP_L1] | (() [PARAMETRO] [EXP_L2]

*/

// Counter used to create different labels as necessary
type counter = 
{
    for: number,
    while: number,
    if: number,
    else: number,
    exit: number,
    temp: number,
    elseStack: number[],
    exitStack: number[]
}


// Repeated Functions --------------------------

function getFromTable(tableValues: tableData[], name: string, scope: string): tableData | undefined
{
    return tableValues.find((register)=>register.Name==name && register.Block == scope) ?? tableValues.find((register)=>register.Name==name && register.Block == "GLOBAL");
}

function getVariables(symbolTree: tree, scope: string, msgLog: log, answer: IntermediaryCode): void
{
    //Go over each child node. If you find an identifier, that's a variable. Add it.
    if(symbolTree.value.value == 'IDENTIFIER'){

        let id = symbolTree.children[0].value.value;
        answer.push(`DCL ${id}-${scope}`);
    }

    for(let i = 0; i < symbolTree.children.length; i++)
        if(symbolTree.value.value != 'TIPO_DADO') getVariables(symbolTree.children[i], scope, msgLog, answer);
}

function getConstant(symbolTree: tree, tableValyes: tableData[], scope: string, msgLog: log, answer: IntermediaryCode)
{
    // CONSTANTE -> (const) [ID] (=) [CONST_VALOR] (;)
    const id = symbolTree.children[1].children[0].value.value;
    answer.push(`DCL ${id}-${scope}`);
}

function addError(msg: string, msgLog: log)
{
    msgLog.errors.push(`<Semantic> ${msg}`);
    throw new Error("Semantic");
}

// Receives node [PARAMETRO] and returns the final record type. It's also supposed to evaluate if records exist within one another.
function getRecordType(symbolTree: tree, tableValues: tableData[], msgLog: log, baseID: string, recordNodeType: string):string
{

    //Base id is the id of the record that's being accessed.
    if(symbolTree.value.value == 'PARAMETRO' && symbolTree.children[0].value.value == 'IDENTIFIER')
    {
        const nome = symbolTree.children[1];
        const id = symbolTree.children[0].children[0].value.value; //F name
        const recordNode = tableValues.find((register)=>register.Name == id); //F
        return getRecordType(nome, tableValues, msgLog, id, recordNode?.Type ?? '-');

        //PS: to verify if field exists within element:
        // e.g.: x := F.nota1 
        // Verify that there is a RECORD_FIELD of name nota1 that has BLOCK = (Type of F).
    }
    else if(symbolTree.value.value == 'NOME' && symbolTree.children[0].value.value == '.')
    {
        //[NOME] -> (.) [IDENTIFIER] [NOME] | ([) [PARAMETRO] (]) | (() [LISTA_PARAM] ()) | e

        // Check if field exists within the given IDENTIFIER
        const fieldId = symbolTree.children[1].children[0].value.value;
        const baseIDNode = getFromTable(tableValues, baseID, recordNodeType);

        if(!tableValues.find((register)=> register.Classification == 'RECORD_FIELD' && register.Name == fieldId && register.Block == baseIDNode?.Type ))
            addError(`'${fieldId}' does not exist in '${baseID}'.`, msgLog);

        // Keep going
        const otherNome = symbolTree.children.find((node)=>node.value.value=='NOME' && node.children.length > 0);
        if(otherNome)
        {
            return getRecordType(otherNome, tableValues, msgLog, fieldId, recordNodeType);
        }
        const id = symbolTree.children[1].children[0].value.value;
        return tableValues.find((register)=> register.Classification == 'RECORD_FIELD' && register.Name == id)?.Type ?? '-';
    }
    else if(symbolTree.value.value == 'NOME' && symbolTree.children[0].value.value == '[')
    {
        return inferTypeFromValue(symbolTree, tableValues, msgLog, baseID);
    }

    return '-';

}

// Receives node and looks for the first type it can infer from value. This includes variables
function inferTypeFromValue(symbolTree:tree, tableValues: tableData[], msgLog: log, scope: string): string
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
                const idNode = getFromTable(tableValues, firstChild.children[0].value.value, scope);

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
                        return getRecordType(symbolTree, tableValues, msgLog, nome.children[1].value.value, nome.children[1].value.value);
                    }
                    // if [NOME] -> ([) [PARAMETRO] (]), we'll have to check for array type.
                    else if(nome.children[0].value.value == '[')
                    {
                        const arrayDeclarationNode = tableValues.find((register) => idNode.Type == register.Name); 
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
        answer = inferTypeFromValue(symbolTree.children[i], tableValues, msgLog, scope);
        if(answer != '-') return answer;
    }

    return "-";
}

// Loops -----------------------------------

// Execute browse for all commands inside this.
function whileCmds(symbolTree: tree, tableObj: table, scope: string, msgLog: log, answer: IntermediaryCode, counterObj: counter)
{

}

// Expressions -----------------------------

// Returns true if an operator was found
type expVars = {
    /**Holds the value to store the result in. */
    firstValue:string[];
    opFound:boolean[];
    op:string[];
    finalTemp?: string;

    /** Holds the last id or value found.*/
    lastValue: string[];
    varScope: string[];
}
const EXP_NODE_NAMES = ['EXP', 'PARAM_LOGICO', 'EXP_CONST'];
function registerEXP(symbolTree: tree, tableValues: tableData[], msgLog: log, answer: IntermediaryCode, scope: string, counterObj: counter, vars:expVars, i:number)
{
    // EXP always works by starting with a PARAMETER, followed by an operator of some sort, and then another EXP
    // It's better to evaluate expressions on the way back from the recursion (right to left)
    // The function will always return the temporary variable it assigned the operations to.

    //Step-by-step: 
    // find PARAMETRO.
    // find operator of some sort.
    // find next EXP and get its temporary variable name.
    // push command to answer.

    //lastValue supposed to hold the last id or value found.
    // firstValue holds the value to store the result in

    if(symbolTree.value.value == 'PARAMETRO')
    {
        // Get its value (ID, number, boolean)
        // Do recall there are records and arrays, which need extra care.
        const elementInfo = getFromNode(symbolTree, tableValues, scope, msgLog);

        // Routine Calls
        if(elementInfo?.classification == 'ROTINA')
        {
            // ROUTINE CALL
            // answer.push(`PSH [thisLine+2]`);
            // answer.push(`JMP [functionName]`)
            // answer.push(`[thisLine+2:]`);

            //BEFORE JUMPING, ASSIGN ALL ARGUMENTS TO CORRESPONDING PARAMETERS
            const declarationParameters = tableValues.filter((tableValue: tableData)=>
                {
                    return tableValue.Block == elementInfo?.id && tableValue.Classification == 'PARAMETER';
                });

            elementInfo?.arguments?.forEach((argumentInfo, i)=>
                {
                    const argumentPassed = argumentInfo?.id ? `${argumentInfo.id}-${argumentInfo.scope}` : argumentInfo?.value;
                    answer.push(`MOV ${declarationParameters[i].Name}-${declarationParameters[i].Block} ${argumentPassed}`);
                })

            answer.push(`PSH ${answer.length+3}`);
            answer.push(`JMP ${elementInfo?.id}`);

            //Result
            vars.firstValue[i] = `res`;
            vars.varScope[i] = '';
        }
        // Average Scenario (variables, constants and values)
        else
        {
            vars.firstValue[i] = elementInfo?.id ? `${elementInfo.id}-${elementInfo.scope}` : elementInfo?.value;
            vars.varScope[i] = elementInfo?.scope ?? '';
        }

    }
    else if(['OP_MAT', 'OP_LOGICO', 'OP_COMP'].includes(symbolTree.value.value ) )
    {
        vars.opFound[i]= true;
        vars.op[i] = symbolTree.children[0].value.value;
        //console.log(`${vars.op[i]}, com i = ${i}`);
    }
    
    if(EXP_NODE_NAMES.includes(symbolTree.value.value))
    {
        vars.lastValue[i+1] = vars.firstValue[i];
        i++; //if another EXP was found, change memory index (i)
    }

    // Keep going
    for(const node of symbolTree.children)
    {
        let temp: string | undefined;

        if(node.value.value != 'NOME') //Don't go inside NOME: records and arrays will be evaluated by getFromNode, which will return necessary data to work with. 
            temp = registerEXP(node, tableValues, msgLog, answer, scope, counterObj, vars, i);

        if(temp) vars.lastValue[i] = temp;
    }

    if(EXP_NODE_NAMES.includes(symbolTree.value.value))
    {
        // Create command here. Use the assigned vars of index i.
        
        let temporaryVar = `temp${counterObj.temp}`;
        const value1 = vars.firstValue[i], value2 = vars.lastValue[i];
        if(vars.opFound[i]) 
            {
                // If more temporary variables are needed, temporaryVar can be updated.
                switch(vars.op[i])
                {
                    case "+":
                        answer.push(`ADD ${temporaryVar} ${value1} ${value2}`);
                        break;
                    case "-":
                        answer.push(`# Running '-'`);
                        answer.push(`MOV ${temporaryVar} ${value2}`);
                        answer.push(`INV ${temporaryVar}`);
                        answer.push(`ADD ${temporaryVar} ${value1} ${temporaryVar}`);
                        answer.push(`# End of '-'`);
                        break;
                    case "*":
                        answer.push(`MUL ${temporaryVar} ${value1} ${value2}`);
                        break;
                    case "/":
                        answer.push(`DIV ${temporaryVar} ${value1} ${value2}`);
                        break;
                    case "==":
                        answer.push(`EQL ${temporaryVar} ${value2} ${value1}`);
                        break;
                    case "<":
                        answer.push(`LES ${temporaryVar} ${value2} ${value1}`);
                        break;
                    case "<=":
                        /*
                            LES temp0 var1 var2
                            EQL temp1 var1 var2
                            ADD temp3 var1 var2 #somando os dois
                            LES temp4 0 temp3 #if true, it's because one of them is true (thus, temp3 is not 0).
                            return temp4
                        */
                        answer.push(`# Running '<='`);
                        const lessResult = `temp${++counterObj.temp}`, eqlResult = `temp${++counterObj.temp}`;
                        answer.push(`LES ${lessResult} ${value2} ${value1}`);
                        answer.push(`EQL ${eqlResult} ${value2} ${value1}`);

                        temporaryVar = `temp${++counterObj.temp}`; //final result will be stored here
                        answer.push(`ADD ${temporaryVar} ${lessResult} ${eqlResult}`);
                        answer.push(`LES ${temporaryVar} 0 temp${counterObj.temp}`);
                        answer.push(`# End of '<='`);

                        break;
                    case ">":
                        answer.push(`LES ${value1} ${value2}`); //just invert the order of elements.
                        break;
                    case ">=":
                        // Just like <=, but inverting the LES command.
                        answer.push(`# Running '>='`);
                        const lessResult1 = `temp${++counterObj.temp}`, eqlResult1 = `temp${++counterObj.temp}`;
                        answer.push(`LES ${lessResult1} ${value1} ${value2}`);
                        answer.push(`EQL ${eqlResult1} ${value2} ${value1}`);

                        temporaryVar = `temp${++counterObj.temp}`; //final result will be stored here
                        answer.push(`ADD ${temporaryVar} ${lessResult1} ${eqlResult1}`);
                        answer.push(`LES ${temporaryVar} 0 temp${counterObj.temp}`);
                        answer.push(`# End of '>='`);
                        break;
                    case "!=":
                        //Verify if they're equal and invert the result.
                        answer.push(`EQL ${temporaryVar} ${value2} ${value1}`);
                        answer.push(`LES ${temporaryVar} ${temporaryVar} 1`); //inverts result
                        break;
                    case "and":
                        answer.push(`# and vai aqui! Valores recebidos: ${temporaryVar} ${value2} ${value1}`);
                        break;
                }
                
                // Adding to counterObj.temp for next run.
                counterObj.temp++;

                vars.finalTemp = temporaryVar;
                return temporaryVar;
            }
        else if(vars.firstValue[i])
        {
            return vars.firstValue[i];
        }
    }
}

// Evaluates EXP, inserts corresponding code and returns a string with the name of the variable in which the result was stored.
// In case of non-temporary variables, their names come with -<scope>
function runEXP(symbolTree: tree, tableValues: tableData[], msgLog: log, answer: IntermediaryCode, scope: string, counterObj: counter): string | undefined
{
    const vars:expVars = {firstValue: [], opFound: [], op: [], lastValue: [], varScope: []}
    const result = registerEXP(symbolTree, tableValues, msgLog, answer, scope, counterObj, vars, 0);
    return vars.finalTemp ?? result;
}

function browseTree(symbolTree: tree, tableValues: tableData[], msgLog: log, answer: IntermediaryCode, scope: string, counterObj: counter, mainBlockNode: tree)
{
    const endOfNode: IntermediaryCode = []; //list of commands to be inserted after this node and its children are done being executed.
    let iterate = true; //when true, allows exploration of subnodes of the current node.

    if(symbolTree == mainBlockNode)
    {
        answer.push(`# Main`);
    }
    
    // Every time you get into a function, that's a different scope
    if(symbolTree.value.value == 'ROTINA')
    {
        const id = symbolTree.children[1].children[0].value.value;
        scope = id;
        answer.push(`${id}:`);

        //Stack all arguments
        const node_info = getFromTable(tableValues, id, scope);
        const scopeVariables = tableValues.filter(
            (tableValue: tableData)=>
            {
                return tableValue.Block == node_info?.Name;
            });

        for(const scopeVar of scopeVariables)
        {
            //Stacking
            answer.push(`PSH ${scopeVar.Name}-${scopeVar.Block}`);
        }
        for(const scopeVar of scopeVariables.reverse())
        {
            //Scheduling unstacking
            endOfNode.push(`POP ${scopeVar.Name}-${scopeVar.Block}`);
        }
    
        // A routine could receive arguments.
        // For each argument, store data in a stack (important in case of recursion)
        // Also, first of all, store in stack the last address to return to.
        // There will be another if statement in the browseTree function to handle routine calls. This is just for declarations.

        if(symbolTree.children[0].value.value == 'function') endOfNode.push(`MOV res result-${scope}`); //Save result in result register, if it's a function.
        endOfNode.push(`POP temp${counterObj.temp}`); //Get address to return to from stack (and unstack it)
        endOfNode.push(`JMP temp${counterObj.temp}`); //Jump to last address
        counterObj.temp++;
    }

    // Commands -------------------------------
    if(symbolTree.value.value == 'COMANDO')
    {
        
        // PS: sometimes, we will have to execute expression evaluation commands before running commands.
        // Sometimes, we will have to execute code afterwards
        const firstSymbolValue = symbolTree?.children[0]?.value.value;
        switch(firstSymbolValue)
        {
            case 'IDENTIFIER':
                // [ID] [NOME] [ATRIBUICAO]
                // ATRIBUICAO: (:=) [EXP] | e

                // Elements
                const elementInfo = getFromNode(symbolTree, tableValues, scope, msgLog);
                const ATRIBUICAO = symbolTree.children[2];

                // Running EXP and getting variable with result
                const temp = runEXP(ATRIBUICAO.children[1], tableValues, msgLog, answer, scope, counterObj);

                // Result
                answer.push(`MOV ${elementInfo?.id}-${elementInfo?.scope} ${temp}`);

                break;
            case 'while':
                // While loop
                /*
                    while:
                    evaluate expression
                    if false, go to exit
                    ---commands---
                    go to while
                    exit:
                */
                // (while)  [EXP_COM]  (do) [BLOCO_COM]
                answer.push(`\n# WHILE COMMAND`);

                // Running EXP_COM
                const temp1 = runEXP(symbolTree.children[1], tableValues, msgLog, answer, scope, counterObj);
                answer.push(`while${counterObj.while}:`);
                
                answer.push(`LES ${temp1} ${temp1} 1`); //invert boolean result
                answer.push(`JNZ exit${counterObj.exit} ${temp1}`);

                endOfNode.push(`JMP while${counterObj.while}`);
                endOfNode.push(`exit${counterObj.exit++}:`);

                counterObj.while++;
                break;
            case 'if':
                // (if) [EXP_COM] (then) [BLOCO_COM] [ELSE]
                // UNFINISHED

                const expResult = runEXP(symbolTree.children[1], tableValues, msgLog, answer, scope, counterObj);
                answer.push(`# if COMMAND`);
                answer.push(`LES ${expResult} ${expResult} 1`);
                counterObj.exitStack.push(counterObj.exit);
                counterObj.exit++;

                // Is there an else?
                if(symbolTree.children[4].children.length != 0) 
                {
                    // if so, jump to it if the condition isn't met.
                    answer.push(`JNZ else${counterObj.else} ${expResult}`);
                    counterObj.elseStack.push(counterObj.else);
                    counterObj.else++;
                }
                else 
                {
                    // if not, just jump to the exit.
                    answer.push(`JNZ exit${counterObj.else} ${expResult}`);
                    endOfNode.push(`exit${counterObj.exitStack.pop()}:`);
                }
                /*
                    exp-res
                    //if the condition is false, jump to else. Otherwise, continue.
                    LES expResult expResult 1 //invert value so JNZ will trigger if false
                    JNZ else expResult
                    --- commands ----
                    JMP exit
                    else:
                    --- commands ----
                    exit:
                
                */


                break;
            case 'for':
                // (for) [FOR]  (do)  [BLOCO_COM]
                // FOR -> [IDENTIFIER] := [PARAMETRO] to [PARAMETRO]

                const FOR_node = symbolTree.children[1];
                const idValue = FOR_node.children[0].children[0].value.value;
                const id_info = getFromTable(tableValues, idValue, scope);

                const temporaryVar = `temp${++counterObj.temp}`;
                const mainVar = `${id_info?.Name}-${id_info?.Block}`;

                const assignmentValue = getFromNode(FOR_node.children[2], tableValues, scope, msgLog);
                const limit = getFromNode(FOR_node.children[4], tableValues, scope, msgLog);

                answer.push(`\n# FOR COMMAND`);

                const limitString = limit?.id ? `${limit?.id}-${limit?.scope}` : limit?.value;
                const assignmentString = assignmentValue?.id ? `${assignmentValue?.id}-${assignmentValue?.scope}` : assignmentValue?.value;

                answer.push(`MOV ${mainVar} ${assignmentString}`);
                answer.push(`for${counterObj.for}:`);
                answer.push(`LES ${temporaryVar} ${mainVar} ${limitString}`);
                answer.push(`LES ${temporaryVar} ${temporaryVar} 1`) //invert result
                answer.push(`JNZ exit${counterObj.exit} ${temporaryVar}`);

                answer.push(`# commands...`)

                // FOR LOOP
                /*
                    for:
                    assign var
                    if var is smaller than limit, go to exit
                    --commands--
                    JMP for
                    exit:
                */
                endOfNode.push(`ADD ${mainVar} ${mainVar} 1`);
                endOfNode.push(`JMP for${counterObj.for}`);
                endOfNode.push(`exit${counterObj.exit}:`);
                endOfNode.push(`# end of for`);

                counterObj.exit++;
                counterObj.for++;
                break;
            case 'write':
                // (write)  [CONST_VALOR]
                // CONST_VALOR -> string | EXP_COM
                const CONST_VALOR_node = symbolTree.children[1];
                let value;

                // if the value is a string
                if(CONST_VALOR_node.children[0].value.value.startsWith('"'))
                    value = CONST_VALOR_node.children[0].value.value;
                else
                {
                    value = runEXP(CONST_VALOR_node.children[0], tableValues, msgLog, answer, scope, counterObj);

                    //if(node_info?.id) value = `${node_info?.id}-${node_info?.scope}`;
                    //else value = node_info?.value;
                }
                answer.push(`WTR ${value}`);
                break;
            case 'read':
                // (read) [ID] [NOME]
                const node_info = getFromNode(symbolTree, tableValues, scope, msgLog);
                answer.push(`RED ${node_info?.id}-${node_info?.scope}`);
                break;
        }

    }
    else if(symbolTree.value.value == 'ELSE' && symbolTree.children.length != 0)
    {
        const exitLabel = counterObj.exitStack.pop();
        answer.push(`JMP exit${exitLabel}`);
        answer.push(`else${counterObj.elseStack.pop()}:`);
        endOfNode.push(`exit${exitLabel}:`);
    }

    // Iterating (if allowed) ----------
    if(iterate) for(const node of symbolTree.children)
    {
        browseTree(node, tableValues, msgLog, answer, scope, counterObj, mainBlockNode);
    }

    // Adding End Commands
    endOfNode.forEach((command: string)=> answer.push(command));
}

export default class IntermediaryCodeService implements IIntermediaryCode
{
    constructor(){}
    async generateIntermediaryCode(symbolTree: tree, tableValues: tableData[], msgObj: log): Promise<IntermediaryCode> {
        
        const answer: IntermediaryCode = [];
        const counterObj: counter = {for: 0, while: 0, if: 0, else: 0, exit: 0, temp: 0, elseStack: [], exitStack: []};
        const mainBlockNode = symbolTree.children[1];
        browseTree(symbolTree, tableValues, msgObj, answer, "GLOBAL", counterObj, mainBlockNode);
        return answer;
    }

}