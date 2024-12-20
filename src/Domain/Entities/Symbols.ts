// Holds a Regex for each element identifiable. It also sets priorities (what's above is the priority)
const simplePascalSymbols =
{
    STRING: /\".*?\"/,
    ASSIGNMENT: /:=/,
    VARIABLE : /var/,
    SEMICOLON : /\;/,
    COLON: /:/,
    NUMBER : /(\d+\.\d*)|\d+/,
    COMP_OPERATOR: />=|<=|>|<|==|!=/,
    MAT_OPERATOR: /\*|\/|\+|\-/,
    DOT: /\./,
    OPEN_P: /\(/,
    CLOSE_P: /\)/,
    OPEN_B: /\[/,
    CLOSE_B: /\]/,
    COMMA : /\,/,
    EQUAL_SIGN: /=/,
    LOGIC_OPERATOR: /and|or/,
    BLOCK_BEGIN : /begin/,
    BLOCK_END : /end/,
    DECLARATION_CONST : /const/,
    DECLARATION_TYPE : /type/,
    TYPE : /integer|real|char|boolean/,
    TYPE_ARRAY: /array/,
    TYPE_RECORD: /record/,
    FUNCTION: /function/,
    PROCEDURE: /procedure/,
    WHILE: /while/,
    DO: /do/,
    IF: /if/,
    IF_THEN: /then/,
    ELSE: /else/,
    FOR: /for/,
    TO: /to/,
    OF: /of/,
    WRITE: /write/,
    READ: /read/,
    BOOLEAN: /true|false/,
    IDENTIFIER: /[a-zA-Z]([a-zA-Z0-9])*/,
    ERROR: /\S+/
}

export default simplePascalSymbols;