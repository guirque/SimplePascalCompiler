type treeValue = {value: string, type: "TERMINAL" | "NON-TERMINAL"};

class tree 
{
    public children: tree[] = [];
    constructor(public value: treeValue){}

    addChild(node: tree)
    {
        this.children.push(node);
    }
}

export default tree;