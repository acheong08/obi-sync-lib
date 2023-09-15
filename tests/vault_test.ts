import { ObiSync } from "../src/";
import { MakeKeyHash } from "../src/crypt";

MakeKeyHash("password", "salt").then((hash) => {
  console.log("Hash:", hash);
});

const endpoint = process.env.OBI_ENDPOINT || "http://localhost:3000";

const sync = new ObiSync(endpoint);
sync
  .signin(process.env.OBI_EMAIL!, process.env.OBI_PASSWORD!)
  .then((signedIn: boolean) => {
    console.log("Signed in:", signedIn);
  });

console.log("DONE");
