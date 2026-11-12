/// <reference types="astro/client" />

declare module 'virtual:lb-content' {
  const content: import('./content/schema').Content;
  export default content;
}

interface ImportMetaEnv {
  /** Base URL of the public media bucket, without trailing slash. */
  readonly PUBLIC_MEDIA_URL: string;
}

declare namespace App {
  interface Locals {
    admin?: import('./server/auth').Admin;
  }
}
