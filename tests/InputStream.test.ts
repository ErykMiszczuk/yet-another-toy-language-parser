import {
  assertEquals,
  assertNotEquals,
  assertNotStrictEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import { InputStream } from "../src/InputStream.ts";

const TEST_STRING = "Hello there!\nGeneral Kenobi!";
const TEST_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

Deno.test("Should peek input", () => {
  const stream = new InputStream(TEST_STRING);
  assertStrictEquals(stream.peek(), "H");
});

Deno.test("Should discard character from input", () => {
  const stream = new InputStream(TEST_ALPHABET);
  stream.next();
  const firstChar = stream.peek();
  const firstPos = stream.pos;
  stream.next();
  const secondChar = stream.peek();
  const secondPos = stream.pos;
  assertNotStrictEquals(firstChar, secondChar);
  assertNotEquals(firstPos, secondPos);
});

Deno.test("Should move to new line", () => {
  const stream = new InputStream(TEST_STRING);
  for (let i = 0; i < 14; i++) {
    stream.next();
  }
  assertEquals(stream.line, 2);
});

Deno.test("Should throw error", () => {
  const stream = new InputStream(TEST_STRING);
  assertThrows(() => stream.error("TEST ERROR"));
});
