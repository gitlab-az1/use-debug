declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      type?: string;
    }
  }
}


export function isBrowser(): boolean {
  // Check if the current environment is Node.js
  if(typeof process !== 'undefined' && process?.versions?.node) return false;

  // Check if the current environment is a browser
  if(typeof window !== 'undefined'
    && typeof window === 'object' &&
    !!window.document) return true;

  // Check for other browser-like environments (e.g., Electron renderer process)
  if(typeof process !== 'undefined' && typeof process?.type === 'string' && process?.type === 'renderer') return true;

  // Add additional checks for specific browser-like environments if needed

  // Assume Node.js environment if not running in a browser-like environment
  return false;
}


const kindOf = (cache => (thing: any) => {
  const str = Object.prototype.toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));


export function isPlainObject(val: any): boolean {
  if(Array.isArray(val)) return false;
  if(kindOf(val) !== 'object' || typeof val !== 'object') return false;
  
  const prototype = Object.getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}


export function removeAsciCharacters(message: string): string {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\u001b\[\d+m/g, '');
}
