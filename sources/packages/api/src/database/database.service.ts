import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";

@Injectable()
export class DatabaseService {
  constructor(public connection: Connection) {}
}
