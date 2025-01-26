import { IInputStream } from "./InputStream.ts";

export const keywords = new Set([
  "if",
  "then",
  "else",
  "lambda",
  "true",
  "false",
]);

export const ETokenType = {
  NUM: "num",
  STR: "str",
  KW: "kw",
  VAR: "var",
  PUNC: "punc",
  OP: "op",
} as const;

type ETokenTypeKey = keyof typeof ETokenType;
type ETokenTypeValue = typeof ETokenType[ETokenTypeKey];

type TokenValueType<T extends ETokenTypeValue> = T extends typeof ETokenType.NUM
  ? number
  : T extends typeof ETokenType.STR ? string
  : T extends typeof ETokenType.OP ? string
  : T extends typeof ETokenType.KW ? string
  : T extends typeof ETokenType.PUNC ? string
  : T extends typeof ETokenType.VAR ? string
  : never;

type Token<T extends ETokenTypeValue> = {
  type: T;
  value: TokenValueType<T>;
};
const createToken = <T extends ETokenTypeValue>(
  type: T,
  value: TokenValueType<T>,
): Token<T> => ({ type, value });

export interface ITokenStream {
  isKeyword(x: string): boolean;
  isDigit(char: string): boolean;
  isIdStarting(char: string): boolean;
  isId(char: string): boolean;
  isOpChar(char: string): boolean;
  isPunc(char: string): boolean;
  isWhitespace(char: string): boolean;
  readWhile(x: () => void): void;
  readNumber(): Token<typeof ETokenType.NUM>;
  readIdent(): Token<typeof ETokenType.KW> | Token<typeof ETokenType.VAR>;
  readEscaped(str: string): string;
  readString(): Token<typeof ETokenType.STR>;
  skipComment(): void;
  readNext(): ReadNextReturn;
  peek(): ReadNextReturn;
  next(): ReadNextReturn;
  eof(): boolean;
  error(msg: string): void;
}

type ReadReturn =
  | Token<typeof ETokenType.KW>
  | Token<typeof ETokenType.NUM>
  | Token<typeof ETokenType.OP>
  | Token<typeof ETokenType.PUNC>
  | Token<typeof ETokenType.STR>
  | Token<typeof ETokenType.VAR>;

type ReadNextReturn =
  | ReadReturn
  | undefined;

export class TokenStream implements ITokenStream {
  #current: ReadNextReturn;
  #input: IInputStream;

  constructor(stream: IInputStream) {
    this.#input = stream;
    this.isId = this.isId.bind(this);
  }

  isKeyword(x: string) {
    return keywords.has(x);
  }

  isDigit(char: string) {
    return /[0-9]/i.test(char);
  }

  isIdStarting(char: string) {
    return /[a-z]/i.test(char);
  }

  isId(char: string) {
    return this.isIdStarting(char) || "?!-0<1>2=3456789_".indexOf(char) >= 0;
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

  readWhile(predicate: CallableFunction) {
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
    return createToken(ETokenType.NUM, parseFloat(number));
  }

  readIdent() {
    const id = this.readWhile(this.isId);
    return createToken(this.isKeyword(id) ? ETokenType.KW : ETokenType.VAR, id);
  }

  readEscaped(end: string) {
    let escaped = false;
    let str = "";
    this.#input.next();
    while (!this.#input.eof()) {
      const char = this.#input.next();
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
    return createToken(ETokenType.STR, this.readEscaped('"'));
  }

  skipComment() {
    this.readWhile((ch: string) => ch != "\n");
    this.#input.next();
  }

  readNext(): ReadNextReturn {
    this.readWhile(this.isWhitespace);
    if (this.#input.eof()) return;

    const char = this.#input.peek();
    if (char === "#") {
      this.skipComment();
      return this.readNext();
    }
    if (char === '"') return this.readString();
    if (this.isDigit(char)) return this.readNumber();
    if (this.isIdStarting(char)) return this.readIdent();
    if (this.isPunc(char)) {
      return createToken(ETokenType.PUNC, this.#input.next());
    }
    if (this.isOpChar(char)) {
      return createToken(ETokenType.OP, this.readWhile(this.isOpChar));
    }
    this.#input.error(
      `Can't handle character: (${char}) @ line: ${this.#input.line}:${this.#input.column}`,
    );
  }

  peek() {
    if (!this.#current) this.#current = this.readNext();
    return this.#current;
  }

  next() {
    const token = this.#current;
    this.#current = undefined;
    return token ? token : this.readNext();
  }

  eof() {
    const peek = this.peek();
    return peek == null || peek == undefined;
  }

  error(msg: string) {
    return this.#input.error(msg);
  }
}
