import * as dotenv from "dotenv";
import path from "path";

let env = "local";
if (process.env.NODE_ENV === "production") {
  env = "production";
}

const envFile = `.env.${env}`;
const envPath = path.resolve(__dirname, envFile);

// Load the environment variables
dotenv.config({ path: envPath });

// Export environment variabless
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export { apiUrl };
