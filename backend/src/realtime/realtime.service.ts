import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  emit(event: string, payload: unknown): void {
    this.server?.emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }
}
