# yet-another-toy-language-parser
(WIP) Learning how to implement parser for toy language according to https://lisperator.net/pltut/parser/

## Valuable conclusions
1. Use typescript in your js project. It helps you to find some bugs before you even try to run your manual tests. For exmaple in this project it helped finding empty function calls where in function definition arguments were expected. The other is helping covering exhaustive type handling - it is harder to use undefined value where object is expected (the project is not fully type safe, some `any` and `!` typescript trust me bro it should exist operator is used; I might revisit this project later to fix those issues for now it just works)
2. Deno is greate tool - no more complicated configuration of your project. It just works!
3. Writing parser by hand is not hard just a little time consuming to get it right.
4. Classes arent the best in JS, problematic `this` keyword loosing context out of blue in one method where in other methods with similar nesting and "call stack" everything seems to execute perfectly fine, they just work.
