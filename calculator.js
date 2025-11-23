/**
 * Scientific Calculator Core Logic
 * Handles expression parsing, evaluation, and history.
 */

class Calculator {
    constructor() {
        this.history = [];
        this.memory = 0;
        this.angleMode = 'deg'; // 'deg' or 'rad'
        this.constants = {
            PI: Math.PI,
            E: Math.E,
        };
    }

    /**
     * Tokenizes the input string into numbers, operators, and functions.
     */
    tokenize(expression) {
        const tokens = [];
        let current = '';
        const type = {
            NUMBER: 'number',
            OPERATOR: 'operator',
            FUNCTION: 'function',
            PAREN: 'paren',
            COMMA: 'comma',
            VARIABLE: 'variable'
        };

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (/\s/.test(char)) continue;

            // Helper to check if we should insert implicit multiplication
            const shouldInsertMult = () => {
                if (tokens.length === 0) return false;
                const last = tokens[tokens.length - 1];
                // Insert * if last token was: Number, Close Paren, Variable, or Constant (handled as number)
                // And current char is: Letter (Function/Variable), Open Paren
                return (last.type === type.NUMBER || last.type === type.VARIABLE || (last.type === type.PAREN && last.value === ')'));
            };

            if (/[0-9.]/.test(char)) {
                // If previous token was ) or variable, insert *
                if (tokens.length > 0) {
                    const last = tokens[tokens.length - 1];
                    if (last.type === type.VARIABLE || (last.type === type.PAREN && last.value === ')')) {
                        tokens.push({ type: type.OPERATOR, value: '*' });
                    }
                }

                current += char;
                if (i + 1 >= expression.length || !/[0-9.]/.test(expression[i + 1])) {
                    tokens.push({ type: type.NUMBER, value: parseFloat(current) });
                    current = '';
                }
            } else if (/[a-zA-Z]/.test(char)) {
                if (shouldInsertMult()) {
                    tokens.push({ type: type.OPERATOR, value: '*' });
                }

                current += char;
                if (i + 1 >= expression.length || !/[a-zA-Z]/.test(expression[i + 1])) {
                    const upper = current.toUpperCase();
                    if (this.constants[upper]) {
                        tokens.push({ type: type.NUMBER, value: this.constants[upper] });
                    } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs'].includes(current.toLowerCase())) {
                        tokens.push({ type: type.FUNCTION, value: current.toLowerCase() });
                    } else {
                        // Assume variable
                        tokens.push({ type: type.VARIABLE, value: current });
                    }
                    current = '';
                }
            } else if (['+', '-', '*', '/', '^', '%'].includes(char)) {
                // Handle unary minus
                if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === type.OPERATOR || (tokens[tokens.length - 1].type === type.PAREN && tokens[tokens.length - 1].value === '('))) {
                    tokens.push({ type: type.OPERATOR, value: 'u-' });
                } else {
                    tokens.push({ type: type.OPERATOR, value: char });
                }
            } else if (['(', ')'].includes(char)) {
                if (char === '(' && shouldInsertMult()) {
                    tokens.push({ type: type.OPERATOR, value: '*' });
                }
                tokens.push({ type: type.PAREN, value: char });
            } else if (char === ',') {
                tokens.push({ type: type.COMMA, value: char });
            }
        }
        return tokens;
    }

    /**
     * Shunting Yard Algorithm
     */
    shuntingYard(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        const precedence = {
            '+': 1, '-': 1,
            '*': 2, '/': 2, '%': 2,
            'u-': 3,
            '^': 4
        };
        const associativity = {
            '+': 'Left', '-': 'Left',
            '*': 'Left', '/': 'Left', '%': 'Left',
            'u-': 'Right',
            '^': 'Right'
        };

        tokens.forEach(token => {
            if (token.type === 'number' || token.type === 'variable') {
                outputQueue.push(token);
            } else if (token.type === 'function') {
                operatorStack.push(token);
            } else if (token.type === 'operator') {
                while (operatorStack.length > 0) {
                    const top = operatorStack[operatorStack.length - 1];
                    if (top.type === 'operator' && (
                        (associativity[token.value] === 'Left' && precedence[token.value] <= precedence[top.value]) ||
                        (associativity[token.value] === 'Right' && precedence[token.value] < precedence[top.value])
                    )) {
                        outputQueue.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            } else if (token.value === '(') {
                operatorStack.push(token);
            } else if (token.value === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value === '(') {
                    operatorStack.pop();
                    if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'function') {
                        outputQueue.push(operatorStack.pop());
                    }
                }
            }
        });

        while (operatorStack.length > 0) {
            outputQueue.push(operatorStack.pop());
        }

        return outputQueue;
    }

    /**
     * Evaluates the RPN queue
     */
    evaluateRPN(rpnQueue, scope = {}) {
        const stack = [];

        for (const token of rpnQueue) {
            if (token.type === 'number') {
                stack.push(token.value);
            } else if (token.type === 'variable') {
                if (scope.hasOwnProperty(token.value)) {
                    stack.push(scope[token.value]);
                } else {
                    throw new Error(`Unknown variable: ${token.value}`);
                }
            } else if (token.type === 'operator') {
                if (token.value === 'u-') {
                    const a = stack.pop();
                    stack.push(-a);
                } else {
                    const b = stack.pop();
                    const a = stack.pop();
                    switch (token.value) {
                        case '+': stack.push(a + b); break;
                        case '-': stack.push(a - b); break;
                        case '*': stack.push(a * b); break;
                        case '/': stack.push(a / b); break;
                        case '%': stack.push(a % b); break;
                        case '^': stack.push(Math.pow(a, b)); break;
                    }
                }
            } else if (token.type === 'function') {
                const arg = stack.pop();
                let val = 0;
                const toRad = (x) => this.angleMode === 'deg' ? x * (Math.PI / 180) : x;

                switch (token.value) {
                    case 'sin': val = Math.sin(toRad(arg)); break;
                    case 'cos': val = Math.cos(toRad(arg)); break;
                    case 'tan': val = Math.tan(toRad(arg)); break;
                    case 'asin': val = Math.asin(arg); if (this.angleMode === 'deg') val *= (180 / Math.PI); break;
                    case 'acos': val = Math.acos(arg); if (this.angleMode === 'deg') val *= (180 / Math.PI); break;
                    case 'atan': val = Math.atan(arg); if (this.angleMode === 'deg') val *= (180 / Math.PI); break;
                    case 'sqrt': val = Math.sqrt(arg); break;
                    case 'log': val = Math.log10(arg); break;
                    case 'ln': val = Math.log(arg); break;
                    case 'abs': val = Math.abs(arg); break;
                    default: throw new Error(`Unknown function: ${token.value}`);
                }
                stack.push(val);
            }
        }

        if (stack.length !== 1) throw new Error('Invalid expression');
        return stack[0];
    }

    evaluate(expression, scope = {}) {
        try {
            const tokens = this.tokenize(expression);
            const rpn = this.shuntingYard(tokens);
            const result = this.evaluateRPN(rpn, scope);
            if (!scope || Object.keys(scope).length === 0) {
                this.history.push({ expression, result });
            }
            return result;
        } catch (e) {
            console.error(e);
            return 'Error';
        }
    }

    // Compile for faster repeated evaluation (e.g. graphing)
    compile(expression) {
        try {
            const tokens = this.tokenize(expression);
            const rpn = this.shuntingYard(tokens);
            return (scope) => this.evaluateRPN(rpn, scope);
        } catch (e) {
            return null;
        }
    }

    clearHistory() {
        this.history = [];
    }
}

// Export for use in other files (ES6 module style or global if simple script)
// window.Calculator = Calculator; 
