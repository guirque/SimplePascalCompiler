import { IntermediaryCode } from "../Entities/IntermediaryCode";
import simplePascalSymbols from "../Entities/Symbols";
import IRunningSimulation from "../Interfaces/IRunningSimulation";
import log from "../Interfaces/Log";

class Memory {
    private maxMemory:number = 10000;
    private maxLoops:number = 1000;
    private numOfLoops:number = 0;
    private registers: any = {};
    private labels: any = {};
    private stack: string[] = [];

    constructor(private logObj:log){}

    isOutOfMemory():boolean
    {
        return Object.keys(this.registers).length + Object.keys(this.labels).length + this.stack.length > this.maxMemory;
    }

    pushToStack(value: string)
    {
        if(!this.isOutOfMemory())
            this.stack.push(value);
        else this.logObj.errors.push(`<Simulation> Memory full. Can't set new label.`);
    }

    popStack():any
    {
        return this.stack.pop();
    }

    setLabel(name:string, line:number)
    {
        if(!this.isOutOfMemory())
            this.labels[name]=line;
        else this.logObj.errors.push(`<Simulation> Memory full. Can't set new label.`);
    }

    getLabelAddress(name:string)
    {
        // Try finding a label with that name. If not present, try checking for a register to extract the value from.
        // Subtract two from the address, so the line itself will be executed.
        if(this.numOfLoops > this.maxLoops)
        {
            this.logObj.errors.push(`<Simulation> Max number of iterations exceeded.`);
        }
        else if(this.labels.hasOwnProperty(name))
        {
            this.numOfLoops++;
            return this.labels[name]-1;

        }
        else if(this.registers.hasOwnProperty(name))
        {
            this.numOfLoops++;
            return this.getRegister(name)-1;
        }
        else this.logObj.errors.push(`<Simulation> Can't get ${name}, as it is not a valid label or register name.`);
    }

    addRegister(name:string, value:number|boolean|string)
    {
        if(!this.isOutOfMemory())
            this.registers[name] = value;
        else this.logObj.errors.push(`<Simulation> Memory full. Can't set new register.`);
    }

    getRegister(name:string)
    {
        if(this.registers.hasOwnProperty(name))
            return this.registers[name];
        else 
        {
            //If none was found, create one and set it = 0. (default behaviour)
            this.addRegister(name, 0);
            return this.registers[name];
            //this.logObj.errors.push(`<Simulation> Can't get ${name}, as it is not a valid register name.`);
        }
    }
}

// If it's a value, it simply returns it. Otherwise, it returns the value fetched from memory.
function getValue(valueOrId:string, mem: Memory, logObj: log):any
{
    // Check if it's defined first
    if(valueOrId == undefined)
    {
        return 0;
    }
    // If it's a number
    else if(valueOrId.match(/^\d+$/))
    {
        return Number(valueOrId);
    }
    //If it's a string
    else if(valueOrId.match(/^".+"$/))
    {
        return valueOrId.match(/[^\"]+/);
    }
    else
    {
        return mem.getRegister(valueOrId);
    }
}

export default class RunningSimulationService implements IRunningSimulation
{
    constructor(){}
    run(intermediaryCode: IntermediaryCode, logObj: log): void {

        logObj.warnings.push(`<Simulation> Warning: console outputs are a test feature, and do not necessarily support all analysed operations.`);

        let memoryObj = new Memory(logObj);
        

        let currentLine = intermediaryCode.indexOf('# Main'); // start from main
        if(currentLine == -1) currentLine = intermediaryCode.length;

        let commandInfo: string[], op: string;

        // Set labels
        intermediaryCode.forEach((cmd:string, lineNum)=>
        {
            // Labels
            if(cmd.match(/^.+:$/))
            {
                memoryObj.setLabel(cmd.substring(0, cmd.length-1), lineNum);
            }
        });

        // Run code
        while(currentLine < intermediaryCode.length)
        {
            commandInfo = intermediaryCode[currentLine].split(' ');
            op = commandInfo[0];
            let value1, value2;

            // General Operations
            switch(op)
            {
                case "ADD":
                    value1 = getValue(commandInfo[2], memoryObj, logObj), value2 = getValue(commandInfo[3], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1 + value2);
                    break;
                case "MUL":
                    value1 = getValue(commandInfo[2], memoryObj, logObj), value2 = getValue(commandInfo[3], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1 * value2);
                    break;
                case "DIV":
                    value1 = getValue(commandInfo[2], memoryObj, logObj), value2 = getValue(commandInfo[3], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1 / value2);
                    break;
                case "LES":
                    value1 = getValue(commandInfo[2], memoryObj, logObj), value2 = getValue(commandInfo[3], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1 < value2 ? 1 : 0);
                    break;
                case "INV":
                    value1 = getValue(commandInfo[1], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], -value1);
                    break;
                case "MOV":
                    value1 = getValue(commandInfo[2], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1);
                    break;
                case "JMP":
                    currentLine = memoryObj.getLabelAddress(commandInfo[1]) ?? intermediaryCode.length;
                    break;
                case "JNZ":
                    value1 = commandInfo[1]; //label
                    value2 = getValue(commandInfo[2], memoryObj, logObj); //value
                    if(value2 != 0) currentLine = memoryObj.getLabelAddress(value1) ?? intermediaryCode.length;
                    break;
                case "EQL":
                    value1 = getValue(commandInfo[2], memoryObj, logObj), value2 = getValue(commandInfo[3], memoryObj, logObj);
                    memoryObj.addRegister(commandInfo[1], value1 == value2 ? 1 : 0);
                    break;
                case "WTR":
                    const isString = commandInfo[1].startsWith('"');
                    if(isString) commandInfo[1] = intermediaryCode[currentLine].slice(4); //getting string

                    value1 = getValue(commandInfo[1], memoryObj, logObj);
                    logObj.console?.push(value1);
                    break;
                case "PSH":
                    value1 = getValue(commandInfo[1], memoryObj, logObj);
                    memoryObj.pushToStack(value1);
                    break;
                case "POP":
                    value1 = commandInfo[1];
                    const stackValue = memoryObj.popStack();
                    memoryObj.addRegister(value1,stackValue);
                    break;
            }
            currentLine++;
        }
    }
        
}