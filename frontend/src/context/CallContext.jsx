import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import supabase from '../services/supabase';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const CallProvider = ({ children }) => {
  const { profile } = useAuth();
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [callType, setCallType] = useState(null); // audio, video
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const channelRef = useRef(null);
  const isCaller = useRef(false);
  const callStartTime = useRef(null);
  const callActiveRef = useRef(false);
  const remoteUserRef = useRef(null);

  const endCall = useCallback(async (fromRemote = false) => {
    // If it's a remote end signal and the call never went active, it might be a cancelled incoming call
    if (!callActiveRef.current && fromRemote) {
      setIncomingCall(null);
      setCallState('idle');
      return;
    }
    
    callActiveRef.current = false;
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    let duration = 0;
    if (callStartTime.current) {
      duration = Math.floor((Date.now() - callStartTime.current) / 1000);
    }

    const currentRemoteUser = remoteUserRef.current || remoteUser;
    const currentCallType = callType;
    const wasCaller = isCaller.current;
    const currentProfileId = profile?.id;

    // Instantly reset UI
    setCallState('idle');
    setCallType(null);
    setRemoteUser(null);
    remoteUserRef.current = null;
    setIsMuted(false);
    setIsCameraOff(false);
    setIncomingCall(null);
    callStartTime.current = null;
    isCaller.current = false;

    // Process network requests in the background (non-blocking)
    if (currentRemoteUser && currentProfileId) {
      // Always send end signal if not from remote (i.e., user initiated the end)
      if (!fromRemote) {
        try {
          await supabase.from('call_signals').insert({
            caller_id: currentProfileId,
            callee_id: currentRemoteUser.id,
            call_type: currentCallType,
            signal_type: 'end',
            signal_data: { reason: 'ended', timestamp: Date.now() }
          });
        } catch (err) {
          console.error('Failed to send end signal:', err);
        }
      }

      // Log call for both caller and callee
      // Use endpoint that handles logging from either side
      try {
        const response = await api.post('/calls/end', {
          remote_user_id: currentRemoteUser.id,
          call_type: currentCallType,
          duration,
          initiated_by_caller: wasCaller
        });
        console.log('Call logged:', response.data);
      } catch (err) {
        console.error('Failed to log call:', err);
      }
    }
  }, [remoteUser, profile?.id, callType]);

  // Listen for incoming calls via Supabase Realtime
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`calls:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `callee_id=eq.${profile.id}`
      }, (payload) => {
        const signal = payload.new;
        if (signal.signal_type === 'offer') {
          setIncomingCall({
            callerId: signal.caller_id,
            callType: signal.call_type,
            signalData: signal.signal_data,
            signalId: signal.id
          });
          setCallState('ringing');
        } else if (signal.signal_type === 'ice-candidate' && peerConnection.current) {
          try {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.signal_data));
          } catch (err) {
            console.error('Failed to add ICE candidate:', err);
          }
        } else if (signal.signal_type === 'end') {
          console.log('Received end signal from remote user');
          endCall(true);
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', status);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Also listen for answers and end signals when we are the caller
  useEffect(() => {
    if (!profile?.id || callState === 'idle') return;

    const channel = supabase
      .channel(`calls-answer:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `callee_id=eq.${profile.id}`
      }, async (payload) => {
        const signal = payload.new;
        if (signal.signal_type === 'answer' && peerConnection.current) {
          try {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signal.signal_data)
            );
            setCallState('connected');
            callStartTime.current = Date.now();
          } catch (err) {
            console.error('Failed to set remote description:', err);
          }
        } else if (signal.signal_type === 'ice-candidate' && peerConnection.current) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.signal_data));
          } catch (err) {
            console.error('Failed to add ICE candidate:', err);
          }
        } else if (signal.signal_type === 'end') {
          console.log('Received end signal from remote user');
          endCall(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, callState]);

  const getMediaStream = async (type) => {
    const constraints = {
      audio: true,
      video: type === 'video'
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  };

  const initiateCall = useCallback(async (targetUser, type = 'audio') => {
    try {
      setCallType(type);
      setRemoteUser(targetUser);
      remoteUserRef.current = targetUser;
      setCallState('calling');
      isCaller.current = true;
      callActiveRef.current = true;

      const stream = await getMediaStream(type);
      if (!callActiveRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      localStream.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onerror = (event) => {
        console.error('PeerConnection error:', event);
        endCall();
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate && callActiveRef.current) {
          try {
            await supabase.from('call_signals').insert({
              caller_id: profile.id,
              callee_id: targetUser.id,
              call_type: type,
              signal_type: 'ice-candidate',
              signal_data: event.candidate.toJSON()
            });
          } catch (err) {
            console.error('Failed to send ICE candidate:', err);
          }
        }
      };

      const offer = await pc.createOffer();
      if (!callActiveRef.current) return;
      await pc.setLocalDescription(offer);
      if (!callActiveRef.current) return;

      const { error } = await supabase.from('call_signals').insert({
        caller_id: profile.id,
        callee_id: targetUser.id,
        call_type: type,
        signal_type: 'offer',
        signal_data: offer
      });

      if (error) throw error;
    } catch (err) {
      console.error('Call initiation error:', err);
      callActiveRef.current = false;
      endCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setCallState('connected');
      setCallType(incomingCall.callType);
      isCaller.current = false;
      callActiveRef.current = true;
      callStartTime.current = Date.now();
      
      const targetUser = { id: incomingCall.callerId };
      setRemoteUser(targetUser);
      remoteUserRef.current = targetUser;

      const stream = await getMediaStream(incomingCall.callType);
      if (!callActiveRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      localStream.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onerror = (event) => {
        console.error('PeerConnection error:', event);
        endCall();
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate && callActiveRef.current) {
          try {
            await supabase.from('call_signals').insert({
              caller_id: profile.id,
              callee_id: incomingCall.callerId,
              call_type: incomingCall.callType,
              signal_type: 'ice-candidate',
              signal_data: event.candidate.toJSON()
            });
          } catch (err) {
            console.error('Failed to send ICE candidate:', err);
          }
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signalData));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer — note: caller_id/callee_id from perspective of original caller
      const { error } = await supabase.from('call_signals').insert({
        caller_id: profile.id,
        callee_id: incomingCall.callerId,
        call_type: incomingCall.callType,
        signal_type: 'answer',
        signal_data: answer
      });

      if (error) throw error;

      setIncomingCall(null);
    } catch (err) {
      console.error('Accept call error:', err);
      endCall();
    }
  }, [incomingCall, profile?.id, endCall]);

  const rejectCall = useCallback(async () => {
    if (incomingCall) {
      try {
        // Send rejection signal
        await supabase.from('call_signals').insert({
          caller_id: profile.id,
          callee_id: incomingCall.callerId,
          call_type: incomingCall.callType,
          signal_type: 'end',
          signal_data: { reason: 'rejected', timestamp: Date.now() }
        });

        // Log the rejected call
        try {
          await api.post('/calls', {
            callee_id: incomingCall.callerId,
            call_type: incomingCall.callType,
            status: 'rejected',
            duration: 0
          });
        } catch (err) {
          console.error('Failed to log rejected call:', err);
        }
      } catch (err) {
        console.error('Failed to send rejection signal:', err);
      }
    }
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, profile]);

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  const value = {
    callState,
    callType,
    remoteUser,
    isMuted,
    isCameraOff,
    incomingCall,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { useCall, CallProvider };
export default CallProvider;
