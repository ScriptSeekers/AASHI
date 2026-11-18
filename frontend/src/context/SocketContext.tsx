import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { RoomInvitationDTO, SOCKET_EVENTS, CoupleRoomDTO } from '@duvora/shared';
import { invitationApi } from '../api/endpoints.js';
import { BACKEND_URL } from '../api/client.js';
import { soundManager } from '../utils/sound.js';
import { useNavigate } from 'react-router-dom';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeInvitation: RoomInvitationDTO | null;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  closeInvitationPopup: () => void;
  senderNotification: string | null;
  clearSenderNotification: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeInvitation, setActiveInvitation] = useState<RoomInvitationDTO | null>(null);
  const [senderNotification, setSenderNotification] = useState<string | null>(null);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // Check pending offline invitations when user logs in
  const checkPendingInvitations = async () => {
    if (!user) return;
    try {
      const res = await invitationApi.getPending();
      if (res.invitations && res.invitations.length > 0) {
        // Show newest pending invitation
        setActiveInvitation(res.invitations[0]);
        soundManager.playInviteChime();
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket with token from localStorage
    const token = localStorage.getItem('duvora_token');
    const newSocket = io(BACKEND_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      checkPendingInvitations();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 1. RECIPIENT: Immediate invitation popup received in real time
    newSocket.on(SOCKET_EVENTS.PARTNER_INVITATION_RECEIVED, (invitation: RoomInvitationDTO) => {
      setActiveInvitation(invitation);
      soundManager.playInviteChime();
    });

    // 2. SENDER: Immediate notification that partner accepted!
    newSocket.on(SOCKET_EVENTS.PARTNER_ACCEPTED, (data: { recipientName: string; roomId: string }) => {
      soundManager.playVictory();
      setSenderNotification(`💗 ${data.recipientName} accepted your invitation!`);
      // Redirect sender to the room if not already there
      navigate(`/room/${data.roomId}`);
    });

    // 3. SENDER: Notification that partner declined
    newSocket.on(SOCKET_EVENTS.PARTNER_DECLINED, (data: { recipientName: string }) => {
      soundManager.playPop();
      setSenderNotification(`${data.recipientName} declined the invitation.`);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const acceptInvitation = async (invitationId: string) => {
    try {
      const res = await invitationApi.accept(invitationId);
      setActiveInvitation(null);
      soundManager.playVictory();
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
      setActiveInvitation(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      await invitationApi.decline(invitationId);
      setActiveInvitation(null);
      soundManager.playPop();
    } catch {
      setActiveInvitation(null);
    }
  };

  const closeInvitationPopup = () => {
    setActiveInvitation(null);
  };

  const clearSenderNotification = () => {
    setSenderNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeInvitation,
        acceptInvitation,
        declineInvitation,
        closeInvitationPopup,
        senderNotification,
        clearSenderNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
