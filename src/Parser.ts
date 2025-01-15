import { ETokenType, ITokenStream } from "./TokenStream.ts";

export class Parser {
  #input: ITokenStream;

  constructor(tokenStream: ITokenStream) {
    this.#input = tokenStream;
  }

  isPunc(char: string) {
    const tok = this.#input.peek();
    return tok && tok.type === ETokenType.PUNC &&
      (!char || tok.value == char) && tok;
  }
}
