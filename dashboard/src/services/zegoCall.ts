import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

export type ZegoCallSessionConfig = {
  appId: number;
  token: string;
  roomId: string;
  userId: string;
  userName: string;
  server?: string | null;
};

export type RemoteStreamInfo = {
  streamID: string;
  userID?: string;
  userName?: string;
};

type LocalStreamHandle = {
  playVideo: (view: HTMLElement, config?: { mirror?: boolean; objectFit?: 'cover' | 'contain' | 'fill' }) => void;
};

type CallCallbacks = {
  onRemoteStreamsChange?: (streams: RemoteStreamInfo[]) => void;
  onRoomUsersChange?: (users: { userID: string; userName: string }[]) => void;
  onError?: (message: string) => void;
  onConnectionChange?: (connected: boolean) => void;
};

function resolveServer(appId: number, server?: string | null): string {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? String((import.meta as { env?: { VITE_ZEGO_SERVER?: string } }).env?.VITE_ZEGO_SERVER || '')
      : '';
  if (server && server.trim()) return server.trim();
  if (fromEnv.trim()) return fromEnv.trim();
  return `wss://webliveroom${appId}-api.cool.zego.im/ws`;
}

function toStreamId(roomId: string, userId: string): string {
  const raw = `${roomId}_${userId}`.replace(/[^a-zA-Z0-9_~!@#$%^&*()+=\-`;',.<>/\\]/g, '_');
  return raw.slice(0, 200);
}

/**
 * Thin wrapper around ZegoExpressEngine for SafeAlert emergency group calls.
 * One instance per call session; destroy on leave.
 */
export class ZegoCallSession {
  private engine: ZegoExpressEngine | null = null;
  private localStream: LocalStreamHandle | null = null;
  private localStreamId: string | null = null;
  private roomId: string | null = null;
  private remoteStreams = new Map<string, MediaStream>();
  private remoteMeta = new Map<string, RemoteStreamInfo>();
  private attachedRemoteViews = new Set<string>();
  private roomUsers = new Map<string, { userID: string; userName: string }>();
  private callbacks: CallCallbacks;
  private micMuted = false;
  private cameraMuted = false;
  private destroyed = false;

  constructor(callbacks: CallCallbacks = {}) {
    this.callbacks = callbacks;
  }

  get isMicMuted() {
    return this.micMuted;
  }

  get isCameraMuted() {
    return this.cameraMuted;
  }

  async join(config: ZegoCallSessionConfig, localVideoContainer: HTMLElement): Promise<void> {
    if (this.destroyed) {
      throw new Error('Call session was already destroyed.');
    }
    if (!config.appId || !config.token || !config.roomId || !config.userId) {
      throw new Error('Missing Zego call credentials (appId, token, roomId, or userId).');
    }

    const server = resolveServer(config.appId, config.server);
    const engine = new ZegoExpressEngine(config.appId, server);
    this.engine = engine;
    this.roomId = config.roomId;

    const capabilities = await engine.checkSystemRequirements();
    if (!capabilities.webRTC) {
      throw new Error('This browser does not support WebRTC video calls.');
    }
    if (capabilities.camera === false && capabilities.microphone === false) {
      throw new Error('Camera and microphone are required for the emergency call.');
    }

    engine.on('roomStateChanged', (_roomID, reason) => {
      if (reason === 'LOGINED' || reason === 'RECONNECTED') {
        this.callbacks.onConnectionChange?.(true);
      }
      if (reason === 'LOGIN_FAILED' || reason === 'RECONNECT_FAILED' || reason === 'KICKOUT' || reason === 'LOGOUT') {
        this.callbacks.onConnectionChange?.(false);
      }
      if (reason === 'LOGIN_FAILED') {
        this.callbacks.onError?.('Failed to join the ZegoCloud room.');
      }
    });

    engine.on('roomUserUpdate', (_roomID, updateType, userList) => {
      if (updateType === 'ADD') {
        for (const user of userList) {
          this.roomUsers.set(user.userID, { userID: user.userID, userName: user.userName || user.userID });
        }
      } else if (updateType === 'DELETE') {
        for (const user of userList) {
          this.roomUsers.delete(user.userID);
        }
      }
      this.callbacks.onRoomUsersChange?.(Array.from(this.roomUsers.values()));
    });

    engine.on('roomStreamUpdate', async (_roomID, updateType, streamList) => {
      try {
        if (updateType === 'ADD') {
          for (const item of streamList) {
            if (this.remoteStreams.has(item.streamID)) continue;
            const remoteStream = await engine.startPlayingStream(item.streamID);
            this.remoteStreams.set(item.streamID, remoteStream);
            this.remoteMeta.set(item.streamID, {
              streamID: item.streamID,
              userID: item.user?.userID,
              userName: item.user?.userName,
            });
          }
        } else if (updateType === 'DELETE') {
          for (const item of streamList) {
            try {
              engine.stopPlayingStream(item.streamID);
            } catch {
              // ignore stop errors for already-removed streams
            }
            this.remoteStreams.delete(item.streamID);
            this.remoteMeta.delete(item.streamID);
            this.attachedRemoteViews.delete(item.streamID);
          }
        }
        this.callbacks.onRemoteStreamsChange?.(Array.from(this.remoteMeta.values()));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update remote streams.';
        this.callbacks.onError?.(message);
      }
    });

    const loggedIn = await engine.loginRoom(
      config.roomId,
      config.token,
      { userID: config.userId, userName: config.userName || config.userId },
      { userUpdate: true },
    );

    if (!loggedIn) {
      throw new Error('ZegoCloud room login failed.');
    }

    const localStream = (await engine.createZegoStream({
      camera: {
        video: true,
        audio: true,
      },
    })) as LocalStreamHandle;
    this.localStream = localStream;
    localStream.playVideo(localVideoContainer, { mirror: true, objectFit: 'cover' });

    const streamId = toStreamId(config.roomId, config.userId);
    this.localStreamId = streamId;
    const published = engine.startPublishingStream(streamId, localStream as never);
    if (!published) {
      throw new Error('Failed to publish local audio/video stream.');
    }
  }

  attachRemoteStream(streamID: string, container: HTMLElement): void {
    if (!this.engine) return;
    if (this.attachedRemoteViews.has(streamID)) return;
    const remoteStream = this.remoteStreams.get(streamID);
    if (!remoteStream) return;
    container.replaceChildren();
    const view = this.engine.createRemoteStreamView(remoteStream);
    view.play(container, { enableAutoplayDialog: true, objectFit: 'cover' });
    this.attachedRemoteViews.add(streamID);
  }

  setMicMuted(muted: boolean): void {
    if (!this.engine || !this.localStream) return;
    this.engine.mutePublishStreamAudio(this.localStream as never, muted);
    this.engine.muteMicrophone(muted);
    this.micMuted = muted;
  }

  setCameraMuted(muted: boolean): void {
    if (!this.engine || !this.localStream) return;
    this.engine.mutePublishStreamVideo(this.localStream as never, muted);
    this.cameraMuted = muted;
  }

  async leave(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;

    const engine = this.engine;
    const roomId = this.roomId;
    const localStream = this.localStream;
    const localStreamId = this.localStreamId;

    try {
      if (engine && localStreamId) {
        engine.stopPublishingStream(localStreamId);
      }
    } catch {
      // ignore
    }

    for (const streamID of this.remoteStreams.keys()) {
      try {
        engine?.stopPlayingStream(streamID);
      } catch {
        // ignore
      }
    }
    this.remoteStreams.clear();
    this.remoteMeta.clear();
    this.attachedRemoteViews.clear();
    this.roomUsers.clear();

    try {
      if (engine && localStream) {
        engine.destroyStream(localStream as never);
      }
    } catch {
      // ignore
    }

    try {
      if (engine && roomId) {
        engine.logoutRoom(roomId);
      }
    } catch {
      // ignore
    }

    try {
      engine?.destroyEngine();
    } catch {
      // ignore
    }

    this.engine = null;
    this.localStream = null;
    this.localStreamId = null;
    this.roomId = null;
  }
}
