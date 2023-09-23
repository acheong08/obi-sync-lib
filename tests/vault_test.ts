import { ObiSync } from "../src/";
import { MakeKeyHash } from "../src/crypt";
import { BaseFile } from "../src/types";

// Create and run async block
(async () => {
  console.log(await MakeKeyHash("password", "salt"));

  const endpoint = process.env.OBI_ENDPOINT || "http://localhost:3000";

  const sync = new ObiSync(endpoint);
  console.log(
    "Signed in:",
    await sync.signin(process.env.OBI_EMAIL!, process.env.OBI_PASSWORD!)
  );
  console.log("Listing vaults...");
  const vaults = await sync.list_vaults();
  console.log("Vaults:", vaults);
  const vaultInfo = vaults.vaults[0];
  // Try to access the vault
  console.log("Accessing vault...");
  console.log(
    await sync.access_vault(vaultInfo.id, vaultInfo.password, vaultInfo.salt)
  );
  const vault = await sync.getVault(vaultInfo);
  vault.onpush(async (file) => {
    console.log("Pushed file:", file);
  });
  console.log("Connected:", await vault.Connect(true));
  console.log(await vault.pull(1));
})();
