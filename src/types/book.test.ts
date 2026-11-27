import assert from "node:assert/strict";
import test from "node:test";
import { isBookRating } from "./book";

test("book ratings are whole numbers from 1 through 5", () => {
  assert.equal(isBookRating(1), true);
  assert.equal(isBookRating(5), true);
  assert.equal(isBookRating(0), false);
  assert.equal(isBookRating(6), false);
  assert.equal(isBookRating(2.5), false);
  assert.equal(isBookRating("5"), false);
});