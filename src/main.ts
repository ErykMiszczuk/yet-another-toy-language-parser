import { InputStream } from "./InputStream.ts";
import { Parser } from "./Parser.ts";
import { TokenStream } from "./TokenStream.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  let code = `print_range = lambda(a, b) if a <= b {
                        print(a);
                        if a + 1 <= b {
                          print(", ");
                          print_range(a + 1, b);
                        } else println("");
                      };
  print_range(1, 10);`;
  code = "print(10);";
  const inputStream = new InputStream(code);
  const tokenStream = new TokenStream(inputStream);
  const parser = new Parser(tokenStream);
  console.log(JSON.stringify(parser.parseToplevel()));
}
