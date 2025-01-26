import { InputStream } from "./InputStream.ts";
import { Parser } from "./Parser.ts";
import { TokenStream } from "./TokenStream.ts";

const code = `fib = lambda (n) if n < 2 then n else fib(n - 1) + fib(n - 2)
  println(fib(15));`;
// const code = `println(10)`;
const inputStream = new InputStream(code);
const tokenStream = new TokenStream(inputStream);
const parser = new Parser(tokenStream);
console.log(JSON.stringify(parser.parseToplevel()));
