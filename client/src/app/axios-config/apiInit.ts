import axios from "axios";

import { createClient } from "@app/client/client";

export const client = createClient({
  // set default base url for requests (empty string for relative URLs)
  baseURL: "",
  axios: axios,
  throwOnError: true,
});
