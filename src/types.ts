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
export interface File {
    uid: number;
    vault_id: string;
    hash: string;
    path: string;
    extension: string;
    size: number;
    created: number;
    modified: number;
    folder: boolean;
    data?: Uint8Array; // Use Uint8Array to represent byte data
  }
  