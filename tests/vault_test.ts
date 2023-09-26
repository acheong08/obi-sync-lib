import { ObiSync } from "../src/";
import { MakeKeyHash } from "../src/crypt";
import { FileWithData } from "../src/types";

// Create and run async block
(async () => {
  console.log(await MakeKeyHash("password", "salt"));

  const endpoint = process.env.OBI_ENDPOINT || "http://localhost:3000";

  const sync = new ObiSync(endpoint);
  console.log(
    "Signed in:",
    await sync.signIn(process.env.OBI_EMAIL!, process.env.OBI_PASSWORD!)
  );
  console.log("Listing vaults...");
  const vaults = await sync.getVaultList();
  console.log("Vaults:", vaults);
  const vaultInfo = vaults.vaults[0];
  // Try to access the vault
  console.log("Accessing vault...");
  console.log(
    await sync.accessVault(vaultInfo.id, vaultInfo.password, vaultInfo.salt)
  );
  const vault = await sync.getVault(vaultInfo);
  const pullQueue: number[] = [];
  let ready = false;
  vault.onPush(async (file) => {
    console.log("Pushed file:", file);
    if (!ready) {
      pullQueue.push(file.uid!);
    } else {
      console.log(await vault.pull(file.uid!));
    }
  });
  console.log("Connected:", await vault.Connect(true));
  ready = true;
  for (const uid of pullQueue) {
    console.log(uid);
    console.log(await vault.pull(uid));
  }
  // Push example data
  let f: FileWithData = {
    vault_id: vaultInfo.id,
    path: "test.txt",
    extension: "txt",
    size: 11,
    created: new Date().getUTCMilliseconds(),
    modified: new Date().getUTCMilliseconds(),
    folder: false,
    deleted: false,
    data: Buffer.from("Hello World", "utf-8"),
    hash: "hash",
  };
  console.log(await vault.push(f));
})();
