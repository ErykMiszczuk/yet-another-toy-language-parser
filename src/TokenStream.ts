import { IInputStream } from "./InputStream.ts";

export const keywords = new Set([
  "if",
  "then",
  "else",
  "lambda",
  "true",
  "false",
]);
export const EToken = {
  NUM: "num",
  STR: "str",
  KW: "kw",
  VAR: "var",
  PUNC: "punc",
  OP: "op",
} as const;
type ETokenType = typeof EToken[keyof typeof EToken];

// deno-lint-ignore no-explicit-any
const createToken = (type: ETokenType, value: any) => ({ type, value });

export class TokenStream {
  #current = null;
  #input: IInputStream;

  constructor(stream: IInputStream) {
    this.#input = stream;
  }

  isKeyword(x: string) {
    return keywords.has(x);
  }

  isDigit(char: string) {
    return /[0-9]/i.test(char);
  }

  isIdStart(char: string) {
    return /[a-z]/i.test(char);
  }

  isId(char: string) {
    return this.isIdStart(char) || "?!-0<1>2=3456789".indexOf(char) >= 0;
  }

  isOpChar(char: string) {
    return "<+-*%=&>|!".indexOf(char) >= 0;
  }

  isPunc(char: string) {
    return ",;(){}[]".indexOf(char) >= 0;
  }

  isWhitespace(char: string) {
    return " \t\n".indexOf(char) >= 0;
  }

  // deno-lint-ignore no-explicit-any
  readWhile(predicate: (x: any) => void) {
    let str = "";
    while (!this.#input.eof() && predicate(this.#input.peek())) {
      str += this.#input.next();
    }
    return str;
  }

  readNumber() {
    let hasDot = false;
    const number = this.readWhile((char: string) => {
      if (char === ".") {
        if (hasDot) return false;
        hasDot = true;
        return true;
      }
      return this.isDigit(char);
    });
    return createToken(EToken.NUM, parseFloat(number));
  }

  readIdent() {
    const id = this.readWhile(this.isId);
    return createToken(this.isKeyword(id) ? EToken.KW : EToken.VAR, id);
  }

  readEscaped(end: string) {
    let escaped = false;
    let str = "";
    this.#input.next();
    while (!this.#input.eof()) {
      let char = this.#input.next();
      if (escaped) {
        str += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === end) {
        break;
      } else {
        str += char;
      }
    }
    return str;
  }

  readString() {
    return createToken(EToken.STR, this.readEscaped('"'));
  }

  skipComment() {
    this.readWhile((ch) => ch != "\n");
    this.#input.next();
  }

  // deno-lint-ignore no-explicit-any
  readNext(): any {
    this.readWhile(this.isWhitespace);
    if (this.#input.eof()) return;

    const char = this.#input.peek();
    if (char === "#") {
      this.skipComment();
      return this.readNext();
    }
    if (char === '"') return this.readString();
    if (this.isDigit(char)) return this.readNumber();
    if (this.isIdStart(char)) return this.readIdent();
    if (this.isPunc(char)) return createToken(EToken.PUNC, this.#input.next());
    if (this.isOpChar(char)) {
      return createToken(EToken.OP, this.readWhile(this.isOpChar));
    }
    this.#input.error(
      `Can't handle character: (${char}) @ line: ${this.#input.line}:${this.#input.column}`,
    );
  }

  peek() {
    return this.#current || (this.#current = this.readNext());
  }

  next() {
    let token = this.#current;
    this.#current = null;
    return token || this.readNext();
  }

  eof() {
    return this.peek() == null;
  }
}
