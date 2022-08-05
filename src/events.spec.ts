import { createEvent, mapEvent, oneOf, subscribe } from "./events";

describe("mapEvent", () => {
  test("maps the value", () => {
    const results: number[] = [];
    const { event, pusher } = createEvent<number>();
    const mapped = mapEvent((x: number) => x + 1)(event);

    subscribe(mapped)((value) => () => {
      results.push(value);
    })();

    [1, 2, 3].forEach((x) => pusher(x)());
    expect(results).toEqual([2, 3, 4]);
  });
});

describe("oneOf", () => {
  test("applies oneOf correctly", () => {
    const results: number[] = [];
    const e1 = createEvent<number>();
    const e2 = createEvent<number>();
    const e3 = createEvent<number>();

    subscribe(oneOf([e1.event, e2.event, e3.event]))((value) => () => {
      results.push(value);
    })();

    e1.pusher(1)();
    e1.pusher(3)();
    e2.pusher(5)();
    e3.pusher(7)();
    e1.pusher(9)();
    expect(results).toEqual([1, 3, 5, 7, 9]);
  });
});
