import { bang, Event, mapEvent, oneOf } from "./event";

export type AudioUnit<Payload> = (info: {
  raiseId: (id: string) => () => void;
  parent: string | null;
  scope: string | null;
}) => (
  payload: AudioInterpret<Payload>
) => Event<(payload: Payload) => () => void>;

export interface AudioInterpret<Payload> {
  createGain: (nodeInfo: {
    id: string;
    parent: string | null;
    scope: string | null;
  }) => (payload: Payload) => () => void;
  createSineOscillator: (nodeInfo: {
    id: string;
    parent: string | null;
    scope: string | null;
  }) => (payload: Payload) => () => void;
  setFrequency: (frequencyInfo: {
    id: string;
    frequency: number;
  }) => (payload: Payload) => () => void;
  setGain: (gainInfo: {
    id: string;
    gain: number;
  }) => (payload: Payload) => () => void;
  setOnOff: (onOffInfo: {
    id: string;
    onOff: boolean; // on = true, off = false
  }) => (payload: Payload) => () => void;
  disconnectElement: (disconnectInfo: {
    id: string;
  }) => (payload: Payload) => () => void;
}

export function gain<Payload>(params: {
  volume: Event<number>;
}): (units: Array<AudioUnit<Payload>>) => AudioUnit<Payload> {
  return (units) => (info) => (payload) => (pusher) => () => {
    const { createGain, setGain, disconnectElement } = payload;
    const { parent, scope, raiseId } = info;
    const id = `gain-${scope}-${parent}-${Math.random()}`;
    raiseId(id)();
    const gainNode = createGain({ id, parent, scope });
    const unsubscribe = oneOf([
      bang(gainNode),
      mapEvent((gain: number) => setGain({ id, gain }))(params.volume),
      ...units.map((unit) =>
        unit({
          parent: id,
          raiseId: () => () => undefined,
          scope,
        })(payload)
      ),
    ])(pusher)();
    return () => {
      unsubscribe();
      pusher(disconnectElement({ id }))();
    };
  };
}

export function sineOsc<Payload>(params: {
  frequency: Event<number>;
  onOff: Event<boolean>;
}): AudioUnit<Payload> {
  return (info) => (payload) => (pusher) => () => {
    const { createSineOscillator, setFrequency, setOnOff, disconnectElement } =
      payload;
    const { parent, scope, raiseId } = info;
    const id = `gain-${scope}-${parent}-${Math.random()}`;
    raiseId(id)();
    const oscillatorNode = createSineOscillator({ id, parent, scope });
    const unsubscribe: () => void = oneOf([
      bang(oscillatorNode),
      mapEvent((frequency: number) => setFrequency({ id, frequency }))(
        params.frequency
      ),
      mapEvent((onOff: boolean) => setOnOff({ id, onOff }))(params.onOff),
    ])(pusher)();

    return () => {
      unsubscribe();
      pusher(disconnectElement({ id }))();
    };
  };
}
