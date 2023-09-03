export class User {
  Token: string;
  Name: string;
  Email: string;
  constructor(token: string, name: string, email: string) {
    this.Token = token;
    this.Name = name;
    this.Email = email;
  }
}

// Create an ObiVault class
export class ObiVault {
  User: User;
  Endpoint: string;
  constructor(private endpoint: string) {
    this.Endpoint = endpoint;
  }
  // Login to the ObiVault
  async Login(email: string, password: string): Promise<boolean> {
    const response = await fetch(`${this.Endpoint}/user/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });
    const data = await response.json();
    // Check if error in response
    if (data.error) {
      throw new Error(data.error);
    }
    // Create a new user object
    this.User = new User(data.token, data.name, data.email);
    return true;
  }

  async GetVaults(): Promise<{ shared: Vault[]; vaults: Vault[] }> {
    const response = await fetch(`${this.Endpoint}/vault/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.User.Token,
      }),
    });
    const data = await response.json();
    // Check if error in response
    if (data.error) {
      throw new Error(data.error);
    }
    return {
      shared: data.shared as Vault[],
      vaults: data.vaults as Vault[],
    };
  }
  // If salt is empty, the server will generate a random salt and password.
  async CreateVault(
    name: string,
    salt: string,
    keyhash: string
  ): Promise<Vault> {
    if (salt !== "" && keyhash === "") {
        throw new Error("Keyhash must be provided if salt is provided");
    }
    const response = await fetch(`${this.Endpoint}/vault/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.User.Token,
        name: name,
        salt: salt,
        keyhash: keyhash,
      }),
    });
    const data = await response.json();
    // Check if error in response
    if (data.error) {
      throw new Error(data.error);
    }
    return data as Vault;
  }
  async DeleteVault(id: string): Promise<boolean> {
    const response = await fetch(`${this.Endpoint}/vault/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.User.Token,
        vault_uid: id,
      }),
    });
    const data = await response.json();
    // Check if error in response
    if (data.error) {
      throw new Error(data.error);
    }
    return true;
  }

  async AccessVault(host: string, keyhash: string, vault_uid:string): Promise<boolean> {
    const response = await fetch(`${this.Endpoint}/vault/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: this.User.Token,
        host: host,
        keyhash: keyhash,
        vault_uid: vault_uid
      }),
    });
    const data = await response.json();
    // Check if error in response
    if (data.error) {
      throw new Error(data.error);
    }
    return true;
  }
}

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
  keyhash: string;
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
  