import Dexie, { type Table } from "dexie";

type User = {
  id?: number;
  email: string;
  encryptedMasterKey: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
};

class DexieDB extends Dexie {
  user!: Table<User>;

  constructor() {
    super("DexieDB");
    this.version(1).stores({
      user: "++id, email, encryptedMasterKey, salt, iv",
    });
  }
}

export const db = new DexieDB();
