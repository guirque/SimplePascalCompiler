// Holds a Regex for each element identifiable. It also sets priorities (what's above is the priority)
const simplePascalSymbols =
{
    BLOCK_BEGIN : /begin/,
    BLOCK_END : /end/,
    DECLARATION_CONST : /const/,
    DECLARATION_TYPE : /type/,
    TYPE : /integer|real|char|boolean|array|record/,
    COMMA : /\,/,
    VARIABLE : /var/,
    SEMICOLON : /\;/,
    FUNCTION: /function/,
    PROCEDURE: /procedure/,
    PARAMETER: /\(|\)/,
    WHILE: /while/,
    WHILE_DO: /do/,
    IF: /if/,
    IF_THEN: /then/,
    ELSE: /else/,
    FOR: /for/,
    TO: /to/,
    WRITE: /write/,
    READ: /read/,
    ASSIGNMENT: /:=/,
    COLON: /:/,
    EQUAL_SIGN: /=/,
    LOGIC_OPERATOR: /and|or/,
    COMP_OPERATOR: />|<|==|!=|>=|<=/,
    MAT_OPERATOR: /\*|\/|\+|\-/,
    ACCESS: /\.|\[|\]|\(|\//,
    IDENTIFIER: /([a-z]|[A-Z])+/,
    BOOLEAN: /true|false/,
    NUMBER : /\d+/,
    ERROR: /\S+/
}

export default simplePascalSymbols;