interface Writer { // TODO: can't get it from Deno's lib.deno.ts ? https://github.com/denoland/deno/releases/latest/download/lib.deno.d.ts
  write (p: Uint8Array): Promise<number>
}

export default function log (stream: Writer, message: string) {
  return stream.write(new TextEncoder().encode(message));
}
