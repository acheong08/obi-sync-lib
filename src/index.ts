import { MakeKeyHash } from "./crypt";
import { User, Vault } from "./types";

export class ObiSync {
  private endpoint: string;
  private user?: User;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  public async signin(email: string, password: string): Promise<boolean> {
    const response = await fetch(this.endpoint + "/signin", {
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

  public async list_vaults(): Promise<Vault[]> {
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
    return data as Vault[];
  }

  public async create_vault(name: string, password?: string): Promise<Vault> {
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

  public async delete_vault(id: string): Promise<void> {
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
  public async access_vault(
    password: string,
    salt: string,
    vault_uid: string
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
}

export class ObiVault {
  private vault: Vault;
  private endpoint: string;
  private token: string;
  constructor(vault: Vault, endpoint: string, token: string) {
    if (!vault.password && !vault.keyhash) {
      throw new Error("Vault is not unlocked");
    }
    this.vault = vault;
    this.endpoint = endpoint;
    this.token = token;
  }
  // TODO: Implement websocket
}
