// Test lib/index.ts
import { ObiVault } from "./lib";
import { configDotenv } from "dotenv";
configDotenv();

const vault = new ObiVault("https://obsidian.duti.me");
// Get email and password from .env file
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
// Login to the ObiVault
try {
  vault.Login(email, password).then(async (success) => {
    if (success) {
      console.log("Logged in successfully");
      // Create vault
      const newVault = await vault.CreateVault("Test Vault", "", "");
      console.log(newVault);

      // Get vaults
      const vaults = await vault.GetVaults();
      console.log(vaults);

      // Loop through vaults
      for (const vault_instance of vaults.vaults) {
        if (vault_instance.name === "Test Vault") {
          // Delete vault
          await vault.DeleteVault(vault_instance.id);
          console.log("Deleted vault");
        }
      }
      console.log(await vault.GetVaults());
    } else {
      console.log("Failed to login");
    }
  });
} catch (error) {
  console.log(error);
}
