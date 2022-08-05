// Maybe to make things explicit? Nice! Let's keep it.
// We can remove it later... let's
export type Cleanup = () => void;
export type Start = () => Cleanup;

export type Listener<T> = (t: T) => () => void;
export type Pusher<T> = (t: T) => () => void;

export type Event<T> = (pusher: Pusher<T>) => Start;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_EVENT: Event<any> = () => () => () => undefined;

// Or with types

export type MapEvent = <A, B>(
  fab: (a: A) => B
) => (event: Event<A>) => Event<B>;

export const mapEvent: MapEvent =
  <A, B>(callback: (a: A) => B) =>
  (event: Event<A>) =>
  (pusher: Pusher<B>) =>
    event((v: A) => pusher(callback(v)));

/**
 * A no-op function.
 * The reason I recommend using it is that it's easier on the eyes as we see that a subscription is happening.
 */
export function subscribe<T>(event: Event<T>): Event<T> {
  return event;
}

/**
 * Let's create the following:
- map
- apply
- pure
- filter
- sampleOn
- keepLatest
- fold
 */

export function createEvent<A>(): { event: Event<A>; pusher: Pusher<A> } {
  const subscribers: Listener<A>[] = [];
  return {
    event: (pusher) => () => {
      subscribers.push(pusher);
      return () => {
        subscribers.splice(subscribers.indexOf(pusher), 1);
      };
    },
    pusher: (value: A) => () => {
      subscribers.forEach((listener) => listener(value)());
    },
  };
}

/**
 * bang issues an instruction now. So when we create a gain node,
 * the first thing we'll do is call ctx.createGainNode() (or whatever the function is)
 * right away before we start sending any events that modulate the volume.
 */
export function bang<A>(a: A): Event<A> {
  return (pusher) => () => {
    pusher(a)();
    return () => {
      /* nothing to cleanup */
    };
  };
}

/**
 * altEvent combines together several events.
 * It will combine the initial "create" instruction with the
 * "change gain" and ultimately the "delete gain" instruction
 */
export function alt<A>(a: Event<A>): (b: Event<A>) => Event<A> {
  return (b) => {
    return (pusher) => () => {
      const cleanupA = a(pusher)();
      const cleanupB = b(pusher)();
      return () => {
        cleanupA();
        cleanupB();
      };
    };
  };
}

export function oneOf<A>(events: Array<Event<A>>): Event<A> {
  let out = EMPTY_EVENT;
  events.forEach((event) => {
    out = alt(out)(event);
  });
  return out;
}
