import { MakeKeyHash } from "./crypt";
import { User, Vault, FileWithData, FileSend, BaseFile } from "./types";
import { EventEmitter } from "events";
import { pEvent } from "p-event";
import WebSocket from "ws";
export class ObiSync {
  private endpoint: string;
  private user?: User;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  public async signIn(email: string, password: string): Promise<boolean> {
    const response = await fetch(this.endpoint + "/user/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const data = await response.json();
    if (data.error) {
      return false;
    }
    this.user = data as User;
    return true;
  }

  public getUser(): User | undefined {
    return this.user;
  }

  public async getVaultList() {
    if (!this.user) {
      throw new Error("Not logged in");
    }
    const response = await fetch(this.endpoint + "/vault/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.user.token,
      }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data as {
      vaults: Vault[];
      shared: Vault[];
    };
  }

  public async createVault(name: string, password?: string): Promise<Vault> {
    if (!this.user) {
      throw new Error("Not logged in");
    }

    interface CreateVaultRequest {
      name: string;
      token: string;
      salt?: string;
      keyhash?: string;
    }
    let request: CreateVaultRequest = {
      name,
      token: this.user.token,
    };

    if (password) {
      // Generate random salt
      request.salt = String.fromCharCode(
        ...crypto.getRandomValues(new Uint8Array(16))
      );
      request.keyhash = await MakeKeyHash(password, request.salt);
    }
    const response = await fetch(this.endpoint + "/vault/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data as Vault;
  }

  public async deleteVault(id: string): Promise<void> {
    const response = await fetch(this.endpoint + "/vault/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.user?.token,
        vault_uid: id,
      }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return;
  }
  // Only call if password and salt weren't defined
  public async accessVault(
    vault_uid: string,
    password: string,
    salt: string
  ): Promise<boolean> {
    const keyhash = await MakeKeyHash(password, salt);
    const response = await fetch(this.endpoint + "/vault/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.user?.token,
        host: "placeholder",
        keyhash,
        vault_uid,
      }),
    });
    const data = await response.json();
    if (data.error) {
      return false;
    }
    return true;
  }

  public async getVault(vault: Vault): Promise<ObiVault> {
    return new ObiVault(vault, this.endpoint, this.user?.token!);
  }
}

export class ObiVault {
  private vault: Vault;
  private endpoint: string;
  private token: string;
  private websocket?: WebSocket;
  private emmiter: EventEmitter;
  private next_label?: string;
  private next_data?: Buffer;
  private pushCallback: ((file: BaseFile) => void) | undefined;
  constructor(vault: Vault, endpoint: string, token: string) {
    if (!vault.password && !vault.keyhash) {
      throw new Error("Vault is not unlocked");
    }

    this.vault = vault;
    this.endpoint = endpoint;
    this.token = token;
    this.emmiter = new EventEmitter();
  }
  // TODO: Implement websocket
  public async Connect(isInitialConnection: boolean): Promise<boolean> {
    if (!this.vault.keyhash) {
      this.vault.keyhash = await MakeKeyHash(
        this.vault.password!,
        this.vault.salt!
      );
    }
    this.websocket = new WebSocket(this.endpoint + "/");

    this.websocket.onopen = () => {
      this.websocket?.send(
        JSON.stringify({
          op: "init",
          token: this.token,
          id: this.vault.id,
          keyhash: this.vault.keyhash,
          version: this.vault.version || 0,
          initial: isInitialConnection,
          device: "obi-sync-lib",
        })
      );
    };

    this.websocket.onmessage = (event) => {
      if (typeof event.data === "string") {
        let data = JSON.parse(event.data);
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.op) {
          // Handle operations
          switch (data.op) {
            case "push": {
              if (this.pushCallback) {
                this.pushCallback(data);
              }
            }
            case "ready": {
              this.vault.version = data.version;
              // Resolve promise
              this.emmiter.emit("ready");
            }
          }
        } else {
          if (data.res === "next") {
            this.emmiter.emit("next");
          }
          switch (this.next_label) {
            case "pull.metadata": {
              // Emit event with metadata
              this.emmiter.emit("pull.metadata", data);
              this.next_label = "pull.data";
            }
          }
        }
      } else {
        if (this.next_label !== "pull.data") {
          throw new Error("Unexpected binary data");
        }
        this.next_data = Buffer.from(event.data as ArrayBuffer);
        // Note: setTimeout is being used because event listener must be defined before emmiting event
        setTimeout(() => this.emmiter.emit("pull.data"), 0);
        this.next_label = undefined;
      }
    };

    await pEvent(this.emmiter, "ready");
    return true;
  }

  public getVersion(): number {
    return this.vault.version;
  }

  public onPush(callback: (file: BaseFile) => void) {
    this.pushCallback = callback;
  }
  public async pull(uid: number) {
    // Send pull request
    this.next_label = "pull.metadata"; // Set before sending request to prevent race condition
    this.websocket?.send(
      JSON.stringify({
        op: "pull",
        uid,
      })
    );
    // Wait for metadata
    let f = await pEvent(this.emmiter, "pull.metadata");
    if (f.pieces !== 0) {
      await pEvent(this.emmiter, "pull.data");
      f.data = this.next_data;
    }
    return {
      hash: f.hash,
      size: f.size,
      pieces: f.pieces,
      data: f.data,
    };
  }
  public async push(file: FileWithData) {
    let data = file.data;
    let fileSend: FileSend = {
      op: "push",
      uid: file.uid,
      vault_id: file.vault_id,
      hash: file.hash,
      path: file.path,
      extension: file.extension,
      size: file.size,
      created: file.created,
      modified: file.modified,
      folder: file.folder,
      deleted: file.deleted,
      pieces: 0,
    };
    if (data) {
      fileSend.pieces = 1;
    }
    // Send push request
    this.websocket?.send(JSON.stringify(fileSend));
    if (data) {
      await pEvent(this.emmiter, "next");
      // Send binary data
      this.websocket?.send(data);
    }
    // Don't need to wait for anything else
  }
}
