import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  getTeamById,
  getUser
} from "./chunk-AY4LBM3J.js";
import {
  TeamDeleted
} from "./chunk-N7ABINT7.js";

// src/util/get-scope.ts
async function getScope(client, opts = {}) {
  const user = await getUser(client);
  let contextName = user.username || user.email;
  let team = null;
  const defaultTeamId = user.version === "northstar" ? user.defaultTeamId : void 0;
  const currentTeamOrDefaultTeamId = client.config.currentTeam || defaultTeamId;
  if (currentTeamOrDefaultTeamId && opts.getTeam !== false) {
    team = await getTeamById(client, currentTeamOrDefaultTeamId);
    if (!team) {
      throw new TeamDeleted();
    }
    contextName = team.slug;
  }
  return { contextName, team, user };
}

export {
  getScope
};
