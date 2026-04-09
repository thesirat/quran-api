import { isRemoteData } from "../data-io.js";
import { createRemoteReader } from "./client.js";
import { createLocalReader } from "./local.js";
import type { DataReader } from "./client.js";

export type { DataReader } from "./client.js";

let _reader: DataReader | undefined;

/** Return the appropriate DataReader (remote or local) based on DATA_BASE_URL. */
export function getDataReader(): DataReader {
  if (!_reader) {
    _reader = isRemoteData() ? createRemoteReader() : createLocalReader();
  }
  return _reader;
}
