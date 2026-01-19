import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isCalling: false,
  isReceivingCall: false,
  isConnected: false,
  isReconnecting: false,
  caller: null,
  receiver: null,
  isMuted: false,
  callId: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.isCalling = true;
      state.receiver = action.payload.receiver;
      state.callId = action.payload.callId;
    },
    receiveCall: (state, action) => {
      state.isReceivingCall = true;
      state.caller = action.payload.caller;
      state.callId = action.payload.callId;
      state.signal = action.payload.signal; // Store the signal for later use
    },
    acceptCall: (state) => {
      state.isReceivingCall = false;
      state.isConnected = true;
    },
    rejectCall: (state) => {
      state.isReceivingCall = false;
      state.caller = null;
      state.callId = null;
    },
    endCall: (state) => {
      state.isCalling = false;
      state.isReceivingCall = false;
      state.isConnected = false;
      state.caller = null;
      state.receiver = null;
      state.isMuted = false;
      state.callId = null;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    startReconnecting: (state) => {
      state.isReconnecting = true;
    },
    stopReconnecting: (state) => {
      state.isReconnecting = false;
    },
  },
});

export const { startCall, receiveCall, acceptCall, rejectCall, endCall, toggleMute, startReconnecting, stopReconnecting } = callSlice.actions;
export default callSlice.reducer;
