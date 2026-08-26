import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { digitsOnly } from "../common/utils/phone";

type PresenceEntry = {
  userId: string;
  phoneDigits: string;
};

@Injectable()
export class RealtimeService {
  private server?: Server;
  private readonly sockets = new Map<string, PresenceEntry>();
  private readonly socketsByUser = new Map<string, Set<string>>();
  private readonly socketsByPhone = new Map<string, Set<string>>();

  setServer(server: Server): void {
    this.server = server;
  }

  emit(event: string, payload: unknown): void {
    this.server?.emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }

  markOnline(socketId: string, userId: string, phone: string): void {
    this.markOffline(socketId);
    const phoneDigits = digitsOnly(phone);
    const entry = { userId, phoneDigits };
    this.sockets.set(socketId, entry);
    this.addIndex(this.socketsByUser, userId, socketId);
    if (phoneDigits) {
      this.addIndex(this.socketsByPhone, phoneDigits, socketId);
    }
    this.emitPresence(entry, true);
  }

  markOffline(socketId: string): void {
    const entry = this.sockets.get(socketId);
    if (!entry) {
      return;
    }
    this.sockets.delete(socketId);
    this.removeIndex(this.socketsByUser, entry.userId, socketId);
    if (entry.phoneDigits) {
      this.removeIndex(this.socketsByPhone, entry.phoneDigits, socketId);
    }
    const stillOnline =
      this.isUserOnline(entry.userId) || this.isPhoneOnline(entry.phoneDigits);
    if (!stillOnline) {
      this.emitPresence(entry, false);
    }
  }

  isUserOnline(userId: string): boolean {
    return (this.socketsByUser.get(userId)?.size ?? 0) > 0;
  }

  isPhoneOnline(phoneDigits: string): boolean {
    if (!phoneDigits) {
      return false;
    }
    return (this.socketsByPhone.get(phoneDigits)?.size ?? 0) > 0;
  }

  private emitPresence(entry: PresenceEntry, online: boolean): void {
    this.emitToRoom("presence", "presence:changed", {
      userId: entry.userId,
      phoneDigits: entry.phoneDigits,
      online,
    });
  }

  private addIndex(index: Map<string, Set<string>>, key: string, socketId: string): void {
    const set = index.get(key) ?? new Set<string>();
    set.add(socketId);
    index.set(key, set);
  }

  private removeIndex(index: Map<string, Set<string>>, key: string, socketId: string): void {
    const set = index.get(key);
    if (!set) {
      return;
    }
    set.delete(socketId);
    if (!set.size) {
      index.delete(key);
    }
  }
}
