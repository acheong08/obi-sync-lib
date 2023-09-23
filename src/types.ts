export interface Vault {
  id: string;
  user_email: string;
  created: number;
  host: string;
  name: string;
  password: string;
  salt: string;
  size: number;
  version: number;
  keyhash?: string;
}
export interface User {
  name: string;
  email: string;
  password: string;
  license: string;
  token: string;
}

export interface BaseFile {
  uid?: number;
  vault_id: string;
  hash: string;
  path: string;
  extension: string;
  size: number;
  created: number;
  modified: number;
  folder: boolean;
  deleted: boolean;
}
export interface FileWithData extends BaseFile {
  data?: Uint8Array; // Use Uint8Array to represent byte data
}

export interface FileSend extends BaseFile {
  pieces: number;
}