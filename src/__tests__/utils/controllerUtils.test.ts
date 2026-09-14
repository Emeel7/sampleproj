import { unknown } from "zod";
import {
  BadRequestError,
  ValidationError,
} from "../../models/errors/Errors.js";
import {
  stripUndefinedFields,
  throwNonObjects,
  parseNoteId,
  parseNoteData,
  parseNoteDataPartial,
  parseFindAllNotesQuery,
} from "../../controllers/parsers/noteRequestParsers.js";

describe("Utils: stripUndefinedFields and throwNonObjects", () => {
  // -- stripUndefinedFields
  describe("stripUndefinedFields", () => {
    it("removes keys with undefined values", () => {
      const input = { a: 1, b: undefined, c: "hello", d: undefined };
      const expected = { a: 1, c: "hello" };
      expect(stripUndefinedFields(input)).toEqual(expected);
    });

    it("leaves object unchanged if no undefined values", () => {
      const input = { a: 1, b: 2 };
      expect(stripUndefinedFields(input)).toEqual(input);
    });

    it("returns empty object if all values undefined", () => {
      const input = { a: undefined, b: undefined };
      expect(stripUndefinedFields(input)).toEqual({});
    });

    it("handles empty object", () => {
      const input = {};
      expect(stripUndefinedFields(input)).toEqual({});
    });
  });

  // -- throwNonObjects
  describe("throwNonObjects", () => {
    const invalidInputs = [null, undefined, 123, "string", true, [], () => {}];

    invalidInputs.forEach((input) => {
      it(`throws BadRequestError for non objects (${JSON.stringify(input)})`, () => {
        expect(() => throwNonObjects(input)).toThrow(BadRequestError);
      });
    });

    it("returns the object if valid", () => {
      const obj = { title: "Valid", content: "Valid" };
      expect(throwNonObjects(obj)).toEqual(obj);
    });
  });
});

describe("parseId", () => {
  const invalidValues = [undefined, "", ["123"], "     "]; // covers empty, empty, and array

  // Test invalid IDs
  it.each(invalidValues)(
    "throws BadRequestError if id is invalid (%p)",
    (val) => {
      expect(() => parseNoteId(val as any)).toThrow(BadRequestError);
    },
  );

  // Test valid IDs
  const validValues = ["note-id"];
  it.each(validValues)("returns string if id is valid (%p)", (val) => {
    expect(parseNoteId(val)).toBe(val);
  });
});

describe("parseNoteData", () => {
  it("rejects non-object input", () => {
    expect(() => parseNoteData(null)).toThrow(BadRequestError);
  });

  it("rejects invalid schema input", () => {
    expect(() => parseNoteData({})).toThrow(ValidationError);
    expect(() => parseNoteData({ title: "Valid", content: null })).toThrow(
      ValidationError,
    );
    expect(() => parseNoteData({ title: " ", content: "Valid" })).toThrow(
      ValidationError,
    );
  });

  it("returns valid parsed data", () => {
    const input = { title: "Valid", content: "Valid" };
    expect(parseNoteData(input)).toEqual(input);
  });
});

describe("parseNoteDataPartial", () => {
  it("rejects non-object input", () => {
    expect(() => parseNoteDataPartial(null)).toThrow(BadRequestError);
  });

  it("strips undefined fields", () => {
    expect(
      parseNoteDataPartial({ title: "Valid", content: undefined }),
    ).toEqual({ title: "Valid" });
  });

  it("requires atleast one field", () => {
    expect(() => parseNoteDataPartial({})).toThrow(ValidationError);
  });

  it("rejects invalid schema input", () => {
    expect(() => parseNoteDataPartial({ title: 123 })).toThrow(ValidationError);
  });

  it("returns valid parsed data", () => {
    expect(parseNoteDataPartial({ title: "Valid" })).toEqual({
      title: "Valid",
    });

    expect(parseNoteDataPartial({ content: "Valid" })).toEqual({
      content: "Valid",
    });

    expect(parseNoteDataPartial({ title: "Valid", content: "Valid" })).toEqual({
      title: "Valid",
      content: "Valid",
    });

    expect(parseNoteDataPartial({ title: "Valid", extra: null })).toEqual({
      title: "Valid",
    });
  });
});

describe("parseQuery", () => {
  it("rejects invalid schema input", () => {
    expect(() => parseFindAllNotesQuery({ startDocId: [] })).toThrow(
      BadRequestError,
    );
    expect(() => parseFindAllNotesQuery({ order: "invalid" })).toThrow(
      BadRequestError,
    );
    expect(() => parseFindAllNotesQuery({ limit: "invalid" })).toThrow(
      BadRequestError,
    );
  });

  it("returns valid parsed data", () => {
    expect(parseFindAllNotesQuery({ startDocId: "Valid" })).toEqual({
      startDocId: "Valid",
    });

    expect(parseFindAllNotesQuery({ order: "asc", limit: "12" })).toEqual({
      order: "asc",
      limit: 12,
    });

    expect(
      parseFindAllNotesQuery({ startDocId: "Valid", extra: "extra" }),
    ).toEqual({ startDocId: "Valid" });

    expect(parseFindAllNotesQuery({})).toEqual({});
  });

  // it('rejects unknown fields', () => {
  //     expect(() => parseQuery({ unknown: 'any' })).toThrow(BadRequestError)
  // })
});
