const EMPTY_STRING = "";
const NEW_LINE = "\n";

export interface IInputStream {
  get pos(): number;
  get line(): number;
  get column(): number;
  peek(): string;
  eof(): boolean;
  next(): string;
  error(msg: string): void;
}

export class InputStream implements IInputStream {
  #input;
  #pos = 0;
  #line = 1;
  #col = 0;

  constructor(input: string) {
    this.#input = input;
  }

  get pos() {
    return this.#pos;
  }

  get line() {
    return this.#line;
  }

  get column() {
    return this.#col;
  }

  peek() {
    return this.#input.charAt(this.#pos);
  }

  eof() {
    return this.peek() == EMPTY_STRING;
  }

  next() {
    const char = this.#input.charAt(this.#pos++);
    if (char === NEW_LINE) {
      this.#line++;
      this.#col = 0;
    } else {
      this.#col++;
    }
    return char;
  }

  error(msg: string) {
    throw new Error(msg + ` (${this.#line}:${this.#col})`);
  }
}
