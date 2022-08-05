/* eslint-disable @typescript-eslint/no-explicit-any */
import { AudioInterpret, gain, sineOsc } from "./audio-unit";
import { createEvent, Event, subscribe } from "./event";

describe("a gain node", () => {
  test("simple gain", () => {
    const volume = createEvent<number>();
    const onOff = createEvent<boolean>();
    const frequency = createEvent<number>();
    const graph = gain<Array<any>>({ volume: volume.event })([
      sineOsc({ frequency: frequency.event, onOff: onOff.event }),
    ]);
    const payload: AudioInterpret<Array<any>> = {
      createGain: (i) => (hack) => () => {
        hack.push(["createGain", i]);
      },
      createSineOscillator: (i) => (hack) => () => {
        hack.push(["createSineOscillator", i]);
      },
      setFrequency: (i) => (hack) => () => {
        hack.push(["setFrequency", i]);
      },
      setGain: (i) => (hack) => () => {
        hack.push(["setGain", i]);
      },
      setOnOff: (i) => (hack) => () => {
        hack.push(["setOnOff", i]);
      },
      disconnectElement: (i) => (hack) => () => {
        hack.push(["disconnectElement", i]);
      },
    };
    // :-D
    const pleaseForgiveMe: Array<any> = [];
    const actualized: Event<(p: Array<any>) => () => void> = graph({
      parent: "foo",
      scope: "bar",
      raiseId: () => () => undefined,
    })(payload);

    subscribe<(arr: Array<any>) => () => void>(actualized)(
      (toExecute: (hack: Array<any>) => () => void) => () => {
        toExecute(pleaseForgiveMe)();
      }
    )();

    expect(pleaseForgiveMe).toEqual([
      [
        "createGain",
        {
          id: expect.any(String),
          parent: "foo",
          scope: "bar",
        },
      ],
      [
        "createSineOscillator",
        {
          id: expect.any(String),
          parent: expect.stringMatching(/gain-bar-foo/),
          scope: "bar",
        },
      ],
    ]);

    volume.pusher(0.5)();
    expect(pleaseForgiveMe[2]).toEqual([
      "setGain",
      {
        id: pleaseForgiveMe[0][1].id,
        gain: 0.5,
      },
    ]);
  });
});
