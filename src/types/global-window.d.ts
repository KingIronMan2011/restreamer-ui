declare module 'global/window' {
  const browserWindow: Window & typeof globalThis;
  export default browserWindow;
}
