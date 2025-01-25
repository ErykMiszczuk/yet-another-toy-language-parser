import { ETokenType, ITokenStream } from "./TokenStream.ts";

const PRECEDENCE = new Map([
  ["=", 1],
  ["||", 2],
  ["&&", 3],
  ["<", 7],
  [">", 7],
  ["<=", 7],
  [">=", 7],
  ["==", 7],
  ["!=", 7],
  ["+", 10],
  ["-", 10],
  ["*", 20],
  ["/", 20],
  ["%", 20],
]);

export class Parser {
  #input: ITokenStream;

  constructor(tokenStream: ITokenStream) {
    this.#input = tokenStream;
  }

  isPunc(char: string) {
    const tok = this.#input.peek();
    if (!tok) return false;
    return tok.type === ETokenType.PUNC &&
      tok.value === char;
  }

  isKw(kw: string) {
    const tok = this.#input.peek();
    if (!tok) return false;
    return tok.type === ETokenType.KW && tok.value === kw;
  }

  isOp(op: string) {
    const tok = this.#input.peek();
    if (!tok) return false;
    return tok.type === ETokenType.KW && tok.value === op;
  }

  skipPunc(char: string) {
    if (this.isPunc(char)) this.#input.next();
    else this.#input.error(String.raw`Expecting punctation: ${char}`);
  }

  skipKw(kw: string) {
    if (this.isKw(kw)) this.#input.next();
    else this.#input.error(String.raw`Expecting keyword: ${kw}`);
  }

  skipOp(op: string) {
    if (this.isOp(op)) this.#input.next();
    else this.#input.error(String.raw`Expecting operator: ${op}`);
  }

  unexpected() {
    this.#input.error(
      String.raw`Unexpected token: ${JSON.stringify(this.#input.peek())}`,
    );
  }

  // deno-lint-ignore no-explicit-any
  maybeBinary(left: any, myPrec: any): any {
    const tok = this.#input.peek();
    if (!tok) return this.#input.error("Unexpected token");
    if (
      tok.type === ETokenType.NUM || tok.type === ETokenType.ERR ||
      tok.type === ETokenType.INIT || tok.type === ETokenType.EOF
    ) {
      return this.#input.error(`Received unexpected token of type ${tok.type}`);
    }
    if (this.isOp(tok.value)) {
      const hisPrec = PRECEDENCE.get(tok.value) ?? 0;
      if (hisPrec > myPrec) {
        this.#input.next();

        return this.maybeBinary({
          type: tok.value === "=" ? "assign" : "binary",
          operator: tok.value,
          right: this.maybeBinary(this.parseAtom(), hisPrec),
          left,
        }, myPrec);
      }
    }

    return left;
  }

  delimited(
    start: string,
    stop: string,
    separator: string,
    parser: CallableFunction,
  ) {
    const a = [];
    let first = true;
    this.skipPunc(start);
    while (!this.#input.eof()) {
      if (this.isPunc(stop)) break;
      if (first) first = false;
      else this.skipPunc(separator);
      if (this.isPunc(stop)) break;
      a.push(parser());
    }
    this.skipPunc(stop);
    return a;
  }

  parseCall(func: string) {
    return {
      type: "call",
      args: this.delimited("(", ")", ",", this.parseExpression),
      func,
    };
  }

  parseVarname() {
    const name = this.#input.next();
    if (name.type != ETokenType.VAR) {
      this.#input.error("Expecting variable name");
    }
    return name.value;
  }

  parseIf() {
    this.skipKw("if");
    const cond = this.parseExpression();
    if (!this.isPunc("{")) this.skipKw("then");
    const then = this.parseExpression();
    // deno-lint-ignore no-explicit-any
    const ret: Record<string, any> = {
      type: "if",
      cond,
      then,
    };
    if (this.isKw("else")) {
      this.#input.next();
      ret.else = this.parseExpression();
    }
    return ret;
  }

  parseLambda() {
    return {
      type: "lambda",
      vars: this.delimited("(", ")", ",", this.parseVarname),
      body: this.parseExpression(),
    };
  }

  parseBool() {
    return {
      type: "bool",
      value: this.#input.next().value == "true",
    };
  }

  maybeCall(expr: CallableFunction) {
    expr = expr();
    return this.isPunc("(") ? this.parseCall : expr;
  }

  parseAtom() {
    return this.maybeCall(() => {
      if (this.isPunc("(")) {
        this.#input.next();
        const exp = this.parseExpression();
        this.skipPunc(")");
        return exp;
      }
      if (this.isPunc("{")) return this.parseProg();
      if (this.isKw("if")) return this.parseIf();
      if (this.isKw("true") || this.isKw("false")) return this.parseBool();
      if (this.isKw("lambda")) {
        this.#input.next();
        return this.parseLambda();
      }
      const tok = this.#input.next();
      if (
        tok.type === ETokenType.VAR || tok.type === ETokenType.NUM ||
        tok.type === ETokenType.STR
      ) return tok;
      this.unexpected();
    });
  }

  parseToplevel() {
    const prog = [];
    while (!this.#input.eof()) {
      prog.push(this.parseExpression());
      if (!this.#input.eof()) this.skipPunc(";");
    }
    return { type: "prog", prog };
  }

  parseProg() {
    const prog = this.delimited("{", "}", ";", this.parseExpression);
    if (prog.length == 0) return false;
    if (prog.length == 1) return prog[0];
    return { type: "prog", prog };
  }

  parseExpression() {
    return this.maybeCall(() => this.maybeBinary(this.parseAtom(), 0));
  }
}
