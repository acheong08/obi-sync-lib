import { ObiSync } from "../src/";
import { MakeKeyHash } from "../src/crypt";

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
})();
