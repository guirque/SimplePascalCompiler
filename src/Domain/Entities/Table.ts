export type tableData = 
{
    Name: string;
    Classification: string;
    Type: string;
    Block: string;
    ArraySize: number;
    ArrayType: string;
    SpecialType: "array" | "record" | "standard";
}

export default class table
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