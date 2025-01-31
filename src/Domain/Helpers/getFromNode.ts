import table, { tableData } from "../Entities/Table";
import tree from "../Entities/tree";
import log from "../Interfaces/Log";

type recordScopeType = {id: string; scope: string; type: string}[]; 

export type info = 
{
    classification?: "ROTINA" | "CONSTANTE" | "TIPO" | "RECORD_FIELD" | "VARIABLE" | "ROTINA" | "PARAMETER" | string; 
    id?: string;
    scope?: string;
    arraySize?: number;
    arrayType?: string;
    arrayIndex?: string
    specialType?: "record" | "array" | "standard" | string;
    type?: string;
    value?: any;
    arguments?: info[];
    record_scopes?: recordScopeType;
}

function getFromTable(tableValues: tableData[], name: string, scope: string): tableData | undefined
{
    return tableValues.find((register)=>register.Name==name && register.Block == scope) ?? tableValues.find((register)=>register.Name==name && register.Block == "GLOBAL");
}

// Receives a node and returns an object containing relevant info regarding the value, variable or routine it finds.
// Makes use of the table.
export function getFromNode(symbolTree: tree, tableValues: tableData[], scope: string, msgLog: log, last_type:string="-", last_id:string="GLOBAL", record_scopes:recordScopeType=[]): info | undefined
{
    if(!symbolTree) return undefined;
    const firstChild = symbolTree.children[0];

    if(symbolTree.value.value == "PARAMETRO") 
        switch(firstChild.value.value)
        {
            case "IDENTIFIER":

                // If NOME has any children, keep going further (next call will trigger NOME)
                const NOME =  symbolTree.children[1];
                const ID_value = firstChild.children[0].value.value;
                const tableData = getFromTable(tableValues, firstChild.children[0].value.value, scope);
                scope = ID_value;
                if(NOME.children.length != 0)
                {
                    return getFromNode(NOME, tableValues, scope, msgLog, tableData?.Type, ID_value);
                }
                // Otherwise, return ID name.
                else
                {
                    if(tableData)
                        return {
                            classification: tableData.Classification,
                            id: tableData.Name,
                            scope: tableData.Block,
                            type: tableData.Type,
                            specialType: tableData.SpecialType
                        }
                }

                break;
            case "NUMERO":
                return {
                    classification: "NUMERO",
                    value: firstChild.children[0].value.value,
                    type: firstChild.children[0].value.value.includes('.') ? "real" : "integer"
                }
            break;
            case "true":
                return {
                    classification: "BOOLEAN",
                    type: "boolean",
                    value: 1
                };
            break;
            case "false":
                return {
                    classification: "BOOLEAN",
                    type: "boolean",
                    value: 0
                };
        }
    else if(symbolTree.value.value == "NOME" && symbolTree.children.length != 0)
        switch(firstChild.value.value)
        {
            // NOME -> (.) [IDENTIFIER] [NOME] |
            // ([) [PARAMETRO] (])
            // (() [LISTA_PARAM] ())
            case ".":
                // If there are still NOMEs that have children, keep going.
                const ID_VALUE = symbolTree.children[1].children[0].value.value;
                //console.log(`Seen value of ${ID_VALUE} after '.'\nscope=${scope}, of type ${last_type}`);
                record_scopes.push({id: ID_VALUE, scope: scope, type: last_type});
                scope = ID_VALUE;
                const OTHER_NOME = symbolTree.children[2];
                const tableData = getFromTable(tableValues, ID_VALUE, last_type);
                if(OTHER_NOME.children.length != 0)
                {
                    return getFromNode(OTHER_NOME, tableValues, scope, msgLog, tableData?.Type, ID_VALUE, record_scopes);
                }
                // Otherwise, return ID
                else
                {
                    if(tableData)
                        return {
                            classification: tableData.Classification,
                            id: tableData.Name,
                            scope: tableData.Block,
                            type: tableData.Type,
                            specialType: tableData.SpecialType,
                            record_scopes: record_scopes
                        }
                }
                break;
            case "[":
                // NOME -> ([) PARAMETRO (])
                const tableData1 = getFromTable(tableValues, last_id, scope);
                const arrayTypeData = getFromTable(tableValues, tableData1?.Type ?? "-", scope);
                const parametro_info = getFromNode(symbolTree.children[1], tableValues, scope, msgLog);
                if(tableData1)
                    return {
                        classification: tableData1.Classification,
                        id: tableData1.Name,
                        scope: tableData1.Block,
                        type: arrayTypeData?.ArrayType,
                        arraySize: arrayTypeData?.ArraySize,
                        arrayType: arrayTypeData?.ArrayType,
                        arrayIndex: parametro_info?.classification == "NUMERO" ? parametro_info?.value : parametro_info?.id,
                        specialType: tableData1.SpecialType
                    }

                break;
            case "(":
                const tableData2 = getFromTable(tableValues, last_id, scope);

                // Get arguments
                // NOME -> (  LISTA_PARAM  )
                // LISTA_PARAM -> PARAMETRO , LISTA_PARAM | PARAMETRO
                let argumentsArray: info[] = [];

                let listaPARAM = symbolTree.children[1];
                let continueLoop: boolean = true;
                while(continueLoop)
                {
                    // Evaluate this parameter
                    const parametro_node = listaPARAM.children[0];
                    const node_info = getFromNode(parametro_node, tableValues, scope, msgLog); 
                    if(node_info) argumentsArray.push(node_info);
                    
                    // If there's more to look for
                    if(listaPARAM.children.length > 1)
                    {
                        // Continue searching for arguments
                        listaPARAM = listaPARAM.children[2];
                    }
                    else continueLoop = false;
                }

                if(tableData2)
                    return {
                        classification: tableData2.Classification,
                        id: tableData2.Name,
                        scope: tableData2.Block,
                        type: tableData2.Type,
                        specialType: tableData2.SpecialType,
                        arguments: argumentsArray
                    }
                break;
    }
    else if(symbolTree.value.value == 'COMANDO' && symbolTree.children.length != 0)
    {
        const firstChild = symbolTree.children[0];
        const firstChildValue = firstChild.value.value;
        if(firstChildValue == 'IDENTIFIER' || firstChildValue == 'read'){
            // COMANDO -> [IDENTIFIER] [NOME] [ATRIBUICAO]
            // | read [IDENTIFIER] [NOME]
            const ID_value = firstChildValue == 'IDENTIFIER' ? firstChild.children[0].value.value : symbolTree.children[1].children[0].value.value;
            const NOME = firstChildValue == 'IDENTIFIER' ? symbolTree.children[1] : symbolTree.children[2];
            const tableData = getFromTable(tableValues, ID_value, scope);
            if(NOME.children.length != 0)
                return getFromNode(NOME, tableValues, scope, msgLog, tableData?.Type, ID_value);
            else
            {
                    //console.log(`Command element found with id = ${ID_value}, on scope ${scope}`)
                if(tableData)
                    return {
                        classification: tableData.Classification,
                        id: tableData.Name,
                        scope: tableData.Block,
                        type: tableData.Type,
                        arraySize: tableData.ArraySize,
                        arrayType: tableData.ArrayType,
                        specialType: tableData.SpecialType
                    }
            }
        }
    }
    else for(const node of symbolTree.children)
            getFromNode(node, tableValues, scope, msgLog)
}