import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { receiveCall, acceptCall, rejectCall, endCall, toggleMute, startReconnecting, stopReconnecting } from '../store/callSlice';

const useWebRTC = () => {
  const dispatch = useDispatch();
  const { socket, authUser } = useSelector((state) => state.auth);
  const { isCalling, isReceivingCall, isConnected, caller, receiver, isMuted, callId, signal } = useSelector((state) => state.call);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const iceCandidatesRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Attempt to reconnect socket
  const attemptReconnect = useCallback(() => {
    // Clear any existing reconnection timeout to prevent multiple concurrent attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current += 1;
    dispatch(startReconnecting());
    console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);

    // Set a timeout. If the socket doesn't reconnect within this time, end the call.
    // The actual socket reconnection is handled by the socket.io client itself.
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Socket failed to reconnect within timeout, ending call');
      dispatch(stopReconnecting());
      // End call directly without dependency
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      if (socket && ((isCalling && receiver) || (!isCalling && caller))) {
        socket.emit('call-ended', {
          to: isCalling ? receiver._id : caller._id,
          callId,
        });
      }
      dispatch(endCall());
    }, 5000); // Give 5 seconds for the socket to reconnect
  }, [socket, dispatch, isCalling, receiver, caller, callId]);

  // End call
  const handleEndCall = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (socket && ((isCalling && receiver) || (!isCalling && caller))) {
      socket.emit('call-ended', {
        to: isCalling ? receiver._id : caller._id,
        callId,
      });
    }

    dispatch(endCall());
  }, [socket, isCalling, receiver, caller, callId, dispatch]);

  // Initialize peer connection
  const initPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && ((isCalling && receiver) || (!isCalling && caller))) {
        socket.emit('ice-candidate', {
          to: isCalling ? receiver._id : caller._id,
          callId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        dispatch(acceptCall());
      } else if (pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    return pc;
  }, [socket, isCalling, receiver, caller, callId, dispatch, handleEndCall]);

  // Get user media
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, []);

  // Start call
  const startCall = useCallback(async (receiverUser) => {
    if (!socket || !socket.connected) {
      console.log('Socket not connected, cannot start call');
      return;
    }
    try {
      const stream = await getUserMedia();
      peerConnectionRef.current = initPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      if (socket && receiverUser && authUser) {
        socket.emit('call-user', {
          to: receiverUser._id,
          from: authUser._id,
          callId: callId,
          signal: offer,
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      dispatch(endCall());
    }
  }, [getUserMedia, initPeerConnection, socket, authUser, callId, dispatch]);

  // Accept call
  const acceptIncomingCall = useCallback(async () => {
    try {
      const stream = await getUserMedia();
      peerConnectionRef.current = initPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (socket && caller) {
        socket.emit('call-accepted', {
          to: caller._id,
          callId,
          signal: answer,
        });
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      dispatch(rejectCall());
    }
  }, [getUserMedia, initPeerConnection, socket, caller, callId, dispatch, signal]);

  // Reject call
  const rejectIncomingCall = useCallback(() => {
    if (socket && caller) {
      socket.emit('call-rejected', {
        to: caller._id,
        callId,
      });
    }
    dispatch(rejectCall());
  }, [socket, caller, callId, dispatch]);

  // Toggle mute
  const toggleMuteCall = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
    dispatch(toggleMute());
  }, [isMuted, dispatch]);

  // Start call when isCalling becomes true
  useEffect(() => {
    if (isCalling && receiver && !peerConnectionRef.current) {
      startCall(receiver);
    }
  }, [isCalling, receiver, startCall]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('Incoming call received from:', data.from.fullName, 'callId:', data.callId);
      console.log('Socket connected:', socket.connected, 'userId:', authUser?._id);
      dispatch(receiveCall({
        caller: data.from,
        callId: data.callId,
        signal: data.signal,
      }));
    };

    const handleCallAccepted = async (data) => {
      console.log('Call accepted, setting remote description');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));

        // Process any buffered ICE candidates
        while (iceCandidatesRef.current.length > 0) {
          const candidate = iceCandidatesRef.current.shift();
          try {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } catch (error) {
            console.error('Error adding buffered ICE candidate:', error);
          }
        }
      }
    };

    const handleCallRejected = () => {
      console.log('Call rejected');
      dispatch(endCall());
    };

    const handleCallEnded = () => {
      console.log('Call ended');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      dispatch(endCall());
    };

    const handleIceCandidate = async (data) => {
      if (data.candidate) {
        const candidate = new RTCIceCandidate(data.candidate);
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        } else {
          // Buffer ICE candidates until remote description is set
          iceCandidatesRef.current.push(candidate);
        }
      }
    };

    const handleConnect = () => {
      console.log('Socket reconnected successfully');
      // If a reconnection timeout was active, clear it as the socket reconnected
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptsRef.current = 0; // Reset attempts on successful reconnect
      dispatch(stopReconnecting()); // Stop showing reconnecting status
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      // Only attempt to reconnect if a call is actually in progress
      if (isCalling || isReceivingCall || isConnected) {
        console.log('Call in progress and socket disconnected, attempting to reconnect...');
        attemptReconnect();
      } else {
        console.log('Socket disconnected but no call in progress, not attempting to reconnect.');
      }
    };

    socket.on('call-user', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('connect', handleConnect); // Add connect listener
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('call-user', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('connect', handleConnect); // Cleanup connect listener
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, dispatch, handleEndCall, isCalling, isReceivingCall, isConnected, authUser?._id, attemptReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    startCall,
    acceptIncomingCall,
    rejectIncomingCall,
    handleEndCall,
    toggleMuteCall,
    remoteAudioRef,
  };
};

export default useWebRTC;
