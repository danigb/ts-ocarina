import { sayHello } from "./index";

describe("module", () => {
  test("sayHello", () => {
    expect(sayHello()).toEqual("hello");
  });
});
