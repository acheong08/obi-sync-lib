export class Vault {
  id: string;
  user_email: string;
  created: number;
  host: string;
  name: string;
  password: string;
  salt: string;
  size: number;
  version: number;
  keyhash: string;

  websocket: WebSocket;

  async Connect() {
  }
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
  deleted: boolean;
  newest?: boolean;
  is_snapshot?: boolean;
  data?: Uint8Array;
}
