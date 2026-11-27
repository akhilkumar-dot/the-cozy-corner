import assert from "node:assert/strict";
import test from "node:test";
import { isBookRating, normalizeBookRating } from "./book";

test("book ratings accept numbers from 0 through 5 including points/decimals", () => {
  assert.equal(isBookRating(0), true);
  assert.equal(isBookRating(1), true);
  assert.equal(isBookRating(2.5), true);
  assert.equal(isBookRating(4.3), true);
  assert.equal(isBookRating(5), true);
  assert.equal(isBookRating(-0.1), false);
  assert.equal(isBookRating(5.1), false);
  assert.equal(isBookRating(Number.NaN), false);
  assert.equal(isBookRating("5"), false);
});

test("normalizeBookRating clamps to 0..5 and rounds to one decimal place", () => {
  assert.equal(normalizeBookRating(4.34), 4.3);
  assert.equal(normalizeBookRating(4.36), 4.4);
  assert.equal(normalizeBookRating(-1), 0);
  assert.equal(normalizeBookRating(6), 5);
});
