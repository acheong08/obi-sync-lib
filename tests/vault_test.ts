import { ObiSync } from "../src/";

const endpoint = process.env.OBI_ENDPOINT || "http://localhost:3000";

const sync = new ObiSync(endpoint);
sync
  .signin(process.env.OBI_EMAIL!, process.env.OBI_PASSWORD!)
  .then((signedIn: boolean) => {
    console.log("Signed in:", signedIn);
  });

console.log("DONE");
