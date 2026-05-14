import { create } from "zustand";
import type { Socket } from "socket.io-client";

type CallStateType =
  | "idle"
  | "ringing"
  | "connecting"
  | "active"
  | "ended"
  | "missed";

type IncomingCall = {
  callId: string;
  callerId: string;
  offer: RTCSessionDescriptionInit;
};

type CallState = {
  callState: CallStateType;
  callId: string | null;
  callerId: string | null;
  incomingOffer: RTCSessionDescriptionInit | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  initiateCall: (
    receiverId: string,
    conversationId: string,
    socket: Socket,
  ) => Promise<void>;
  receiveIncomingCall: (payload: IncomingCall) => void;
  acceptCall: (socket: Socket) => Promise<void>;
  rejectCall: (socket: Socket) => void;
  endCall: (socket: Socket) => void;
  setCallId: (callId: string, socket: Socket) => void;
  handleCallAccepted: (answer: RTCSessionDescriptionInit) => Promise<void>;
  handleCallEnded: () => void;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  toggleMute: () => void;
};

let peerConnection: RTCPeerConnection | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];

const createPeerConnection = (
  socket: Socket,
  getCallId: () => string | null,
  setState: (state: Partial<CallState>) => void,
) => {
  const connection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      const callId = getCallId();
      if (callId) {
        socket.emit("call:iceCandidate", {
          callId,
          candidate: event.candidate,
        });
      } else {
        pendingCandidates.push(event.candidate);
      }
    }
  };

  connection.ontrack = (event) => {
    setState({ remoteStream: event.streams[0] });
  };

  return connection;
};

const cleanupCall = (setState: (state: Partial<CallState>) => void) => {
  peerConnection?.close();
  peerConnection = null;
  pendingCandidates = [];
  setState({
    callState: "ended",
    callId: null,
    callerId: null,
    incomingOffer: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
  });
};

export const useCallStore = create<CallState>((set, get) => ({
  callState: "idle",
  callId: null,
  callerId: null,
  incomingOffer: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  initiateCall: async (receiverId, conversationId, socket) => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    peerConnection = createPeerConnection(socket, () => get().callId, set);
    localStream.getTracks().forEach((track) => {
      peerConnection?.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    set({
      callState: "connecting",
      localStream,
      remoteStream: null,
      callerId: receiverId,
    });

    socket.emit("call:initiate", { receiverId, conversationId, offer });
  },
  receiveIncomingCall: ({ callId, callerId, offer }) => {
    set({
      callState: "ringing",
      callId,
      callerId,
      incomingOffer: offer,
    });
  },
  acceptCall: async (socket) => {
    const { incomingOffer, callId } = get();
    if (!incomingOffer || !callId) return;

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    peerConnection = createPeerConnection(socket, () => get().callId, set);
    localStream.getTracks().forEach((track) => {
      peerConnection?.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(incomingOffer),
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    set({ callState: "active", localStream, incomingOffer: null });
    socket.emit("call:accept", { callId, answer });
  },
  rejectCall: (socket) => {
    const callId = get().callId;
    if (callId) {
      socket.emit("call:reject", { callId });
    }
    cleanupCall(set);
  },
  endCall: (socket) => {
    const callId = get().callId;
    if (callId) {
      socket.emit("call:end", { callId });
    }
    cleanupCall(set);
  },
  setCallId: (callId, socket) => {
    set({ callId });
    pendingCandidates.forEach((candidate) => {
      socket.emit("call:iceCandidate", { callId, candidate });
    });
    pendingCandidates = [];
  },
  handleCallAccepted: async (answer) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    );
    set({ callState: "active" });
  },
  handleCallEnded: () => {
    cleanupCall(set);
  },
  handleIceCandidate: async (candidate) => {
    if (!peerConnection) return;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  },
  toggleMute: () => {
    const stream = get().localStream;
    if (!stream) return;
    const nextMuted = !get().isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    set({ isMuted: nextMuted });
  },
}));
