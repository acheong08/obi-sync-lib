interface label {
  op: string;
  metadata: any;
}
export class Vault {
  id: string;
  user_email: string;
  created: number;
  host: string;
  name: string;
  password: string;
  salt: string;
  size: number;
  version: number = 0;
  keyhash: string;
  initial: boolean;
  files_index: Map<string, File>; // Map of file path to file
  labels_queue: label[];
  version_updated: boolean = false;

  websocket: WebSocket;

  async Connect(token: string) {
    if (
      this.host.startsWith("localhost") ||
      this.host.startsWith("127.0.0.1")
    ) {
      this.websocket = new WebSocket(`ws://${this.host}`);
    } else {
      this.websocket = new WebSocket(`wss://${this.host}`);
    }
    // Send initialization request
    this.websocket.onopen = () => {
      this.websocket.send(
        JSON.stringify({
          op: "init",
          token: token,
          id: this.id,
          keyhash: this.keyhash,
          version: this.version,
          initial: this.initial,
          device: "web",
        })
      );
      // Send ping every 10 seconds
      setInterval(() => {
        this.websocket.send(JSON.stringify({ op: "ping" }));
      }, 10000);
    };
    let ready = false;
    // Handle incoming messages
    this.websocket.onmessage = (event) => {
      // Parse message
      const message = JSON.parse(event.data);
      // Wait for ready message
      if (!ready) {
        if (message.op === "ready") {
          ready = true;
          if (message.version < this.version) {
            // Send local files if we have a newer version
            for (const file of this.files_index.values()) {
              this.websocket.send(
                JSON.stringify({
                  op: "push",
                  pieces: file.size > 0 ? 1 : 0,
                  file,
                })
              );
              if (file.size > 0) {
                this.websocket.send(file.data);
              }
            }
          }
        }
        return;
      }
      let op = message.op;
      if (op) {
        switch (op) {
          case "push": {
            // Check path and hash
            const file = message as File;
            if (
              !this.files_index.has(file.path) ||
              this.files_index.get(file.path).hash !== file.hash
            ) {
              // Pull file
              this.websocket.send(
                JSON.stringify({
                  op: "pull",
                  uid: file.uid,
                })
              );
              // Add new label to wait for binary data
              this.labels_queue.push({
                op: "pull",
                metadata: file,
              });
            }
          }
        }
      } else {
        // Get first label in labels queue
        const label = this.labels_queue.shift();
        switch (label.op) {
          case "pull": {
            // Get hash, size, and pieces from message
            const { hash, _, pieces } = message;
            // Get file from index
            const file = this.files_index.get(label.metadata.path);
            if (
              (!file || file.hash !== hash) &&
              !(file.deleted && !file.deleted) &&
              pieces > 0
            ) {
              // Add new label to wait for binary data
              this.labels_queue.push({
                op: "pull_binary",
                metadata: label.metadata,
              });
            }
          }
          case "pull_binary": {
            // Get file metadata
            const file = label.metadata as File;
            // Get file data
            file.data = message as Blob;
            // Add file to index
            this.files_index.set(file.path, file);
            if (!this.version_updated) {
              this.version_updated = true;
              this.version = file.modified;
            }
          }
        }
      }
    };
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
  data?: Blob;
}
