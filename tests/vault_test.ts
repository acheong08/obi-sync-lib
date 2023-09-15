import { ObiSync } from "../src";

const endpoint = "https://obsidian.duti.me";

const sync = new ObiSync(endpoint);
sync
  .signin(process.env.OBI_EMAIL!, process.env.OBI_PASSWORD!)
  .then((signedIn) => {
    console.log("Signed in:", signedIn);
  });

console.log("DONE");
